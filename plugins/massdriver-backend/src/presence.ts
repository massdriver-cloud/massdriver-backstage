import WebSocket from 'ws';
import { buildWebsocketUrl, parsePhoenixMessage } from './absinthe';

/**
 * Read-only presence spectator for the Massdriver environment channel.
 *
 * The web app's collaboration channel (`environment:{orgId}/{environmentId}`)
 * tracks who is viewing an environment and streams live cursor positions as
 * Phoenix Presence metas. The plugin's service-account socket joins as a
 * **spectator** (see the platform's EnvironmentChannel): it receives
 * `presence_state`/`presence_diff` like any member but is never tracked and
 * never pushes `cursor_move` — Backstage viewers observe collaboration, they
 * don't participate in it.
 *
 * Presence sync happens here, server-side of the SSE relay: every state/diff
 * is folded into one canonical viewers map and the flattened snapshot is
 * emitted whole. The browser never sees Phoenix protocol details (phx_ref
 * bookkeeping, meta arrays) — just "who is here now".
 */

const HEARTBEAT_INTERVAL_MS = 30_000;

/** One tracked meta, as built by the platform's `build_presence_meta/1`. */
export interface PresenceMeta {
  id?: string;
  first_name?: string;
  email?: string;
  avatar?: { url?: string } | null;
  joined_at?: number;
  cursor?: {
    x: number | null;
    y: number | null;
    package_identifier?: string | null;
    updated_at?: number;
  } | null;
  phx_ref?: string;
  [key: string]: unknown;
}

type PresenceState = Record<string, { metas: PresenceMeta[] }>;

/** Flattened per-account snapshot streamed to the browser (mirrors the web
 * app's `Presence.list` flatten: first meta wins, count preserved). */
export type PresenceViewers = Record<
  string,
  PresenceMeta & { _metasCount: number }
>;

/**
 * Apply a Phoenix `presence_diff` to a state map, returning a new map. A meta
 * update (e.g. cursor_move) arrives as a leave of the old `phx_ref` plus a
 * join of the new one, so joins are applied ref-deduped and leaves remove by
 * ref only.
 */
export const syncPresenceDiff = (
  state: PresenceState,
  diff: { joins?: PresenceState; leaves?: PresenceState },
): PresenceState => {
  const next: PresenceState = Object.fromEntries(
    Object.entries(state).map(([key, presence]) => [
      key,
      { metas: [...presence.metas] },
    ]),
  );

  for (const [key, presence] of Object.entries(diff.joins ?? {})) {
    const joinRefs = new Set(presence.metas.map(meta => meta.phx_ref));
    const existing = next[key]?.metas ?? [];
    next[key] = {
      metas: [
        ...existing.filter(meta => !joinRefs.has(meta.phx_ref)),
        ...presence.metas,
      ],
    };
  }

  for (const [key, presence] of Object.entries(diff.leaves ?? {})) {
    const leaveRefs = new Set(presence.metas.map(meta => meta.phx_ref));
    const remaining = (next[key]?.metas ?? []).filter(
      meta => !leaveRefs.has(meta.phx_ref),
    );
    if (remaining.length === 0) delete next[key];
    else next[key] = { metas: remaining };
  }

  return next;
};

/** Flatten a presence state to the per-account snapshot the browser renders. */
export const flattenPresence = (state: PresenceState): PresenceViewers =>
  Object.fromEntries(
    Object.entries(state).map(([key, presence]) => [
      key,
      { ...presence.metas[0], _metasCount: presence.metas.length },
    ]),
  );

export type PresenceChannelError = Error & { fatal?: boolean };

export interface PresenceChannelOptions {
  /** Socket endpoint, e.g. `wss://api.massdriver.cloud/api/socket`. */
  socketUrl: string;
  /** Service-account bearer token (query param, backend-only). */
  token: string;
  /** Channel topic: `environment:{organizationId}/{environmentId}`. */
  topic: string;
  /** Called with the full flattened viewers snapshot on every change. */
  onViewers: (viewers: PresenceViewers) => void;
  /** Called on a transport/protocol error. */
  onError: (error: PresenceChannelError) => void;
  /** Called once the socket closes (after `onError`, if any). */
  onClose?: () => void;
  logger?: {
    error: (message: string) => void;
    debug?: (message: string) => void;
  };
  /** Socket factory — injection seam for tests. Defaults to `new WebSocket(url)`. */
  createSocket?: (url: string) => WebSocket;
}

/** A live presence channel handle; call `close()` to tear it down. */
export interface PresenceChannel {
  close: () => void;
}

/**
 * Join the environment presence channel as a spectator and stream flattened
 * viewer snapshots to `onViewers`. Returns a handle whose `close()` leaves the
 * channel and closes the socket.
 */
export const openPresenceChannel = (
  options: PresenceChannelOptions,
): PresenceChannel => {
  const { socketUrl, token, topic, onViewers, onError, onClose, logger } =
    options;
  const createSocket = options.createSocket ?? (url => new WebSocket(url));

  let ws: WebSocket;
  try {
    ws = createSocket(buildWebsocketUrl(socketUrl, token));
  } catch (creationError) {
    // Fail asynchronously so the caller has its handle (and, for the SSE
    // relay, its already-flushed headers) before the error lands.
    queueMicrotask(() => {
      onError(creationError as Error);
      onClose?.();
    });
    return { close: () => {} };
  }

  let refCounter = 0;
  const nextRef = () => String(++refCounter);
  const joinRef = nextRef();
  let joinReplyRef: string | null = null;
  let state: PresenceState = {};
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  let awaitingHeartbeat = false;
  let closed = false;

  const send = (message: unknown) => {
    if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(message));
  };

  const cleanup = () => {
    if (heartbeat) clearInterval(heartbeat);
    heartbeat = undefined;
  };

  const close = () => {
    if (closed) return;
    closed = true;
    cleanup();
    // Best-effort leave; ignore if the socket is already gone.
    try {
      if (ws.readyState === WebSocket.OPEN) {
        send([joinRef, nextRef(), topic, 'phx_leave', {}]);
      }
      ws.close();
    } catch {
      /* already closing */
    }
  };

  ws.on('open', () => {
    joinReplyRef = nextRef();
    send([joinRef, joinReplyRef, topic, 'phx_join', {}]);
    heartbeat = setInterval(() => {
      // A heartbeat interval elapsing with no traffic since the last one means
      // the connection is half-open — terminate so 'close' fires and the
      // frontend's reconnect loop takes over.
      if (awaitingHeartbeat) {
        logger?.debug?.('Presence socket heartbeat timed out; terminating');
        ws.terminate();
        return;
      }
      awaitingHeartbeat = true;
      send([null, nextRef(), 'phoenix', 'heartbeat', {}]);
    }, HEARTBEAT_INTERVAL_MS);
  });

  ws.on('message', (raw: WebSocket.RawData) => {
    if (closed) return;
    awaitingHeartbeat = false; // any traffic proves liveness
    const message = parsePhoenixMessage(raw.toString());
    if (!message) return;
    const [, ref, , event, payload] = message;

    if (event === 'phx_reply' && ref === joinReplyRef) {
      if ((payload.status as string) !== 'ok') {
        // A join rejection (unauthorized, unknown environment, or a server
        // that predates spectator support) won't succeed on retry.
        const joinError: PresenceChannelError = Object.assign(
          new Error(
            `Presence channel join rejected: ${
              JSON.stringify(payload.response ?? {}) || 'unknown'
            }`,
          ),
          { fatal: true },
        );
        onError(joinError);
        close();
      }
      return;
    }

    if (event === 'presence_state') {
      state = payload as unknown as PresenceState;
      onViewers(flattenPresence(state));
      return;
    }

    if (event === 'presence_diff') {
      state = syncPresenceDiff(
        state,
        payload as { joins?: PresenceState; leaves?: PresenceState },
      );
      onViewers(flattenPresence(state));
      return;
    }

    // chat_history / chat_message are collaboration features the plugin
    // doesn't surface; phx_error/phx_close fall through to the close handler.
    if (event === 'phx_error' || event === 'phx_close') {
      logger?.debug?.(`Presence channel ${event} on ${topic}`);
    }
  });

  ws.on('error', (error: Error) => {
    logger?.error(`Presence socket error: ${error.message}`);
    if (!closed) onError(error);
  });

  ws.on('close', () => {
    cleanup();
    closed = true;
    onClose?.();
  });

  return { close };
};
