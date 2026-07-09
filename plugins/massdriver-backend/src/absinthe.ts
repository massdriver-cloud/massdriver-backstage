import WebSocket from 'ws';

/**
 * Minimal headless Absinthe-over-Phoenix subscription client.
 *
 * The Massdriver web app subscribes over a Phoenix/Absinthe WebSocket using
 * `@absinthe/socket` + `phoenix` in the browser. Those libraries assume a
 * browser environment, so rather than run them in Node we speak the Phoenix v2
 * channel protocol directly over `ws` — the same wire format their stack emits.
 *
 * Each client owns exactly one subscription: it connects, joins the Absinthe
 * control channel, pushes the subscription document, and forwards every
 * `subscription:data` payload to `onData`. The backend relay opens one of these
 * per browser SSE connection and streams the results down.
 *
 * The service-account token is passed as the socket's `token` query param
 * (mirroring the web app's `params: () => ({ token })`) and never leaves the
 * backend.
 */

// Phoenix v2 serializer frames every message as a positional tuple:
// [join_ref, ref, topic, event, payload].
type PhoenixMessage = [
  string | null,
  string | null,
  string,
  string,
  Record<string, unknown>,
];

const CONTROL_TOPIC = '__absinthe__:control';
const HEARTBEAT_INTERVAL_MS = 30_000;

/**
 * Build the raw WebSocket URL from the socket endpoint. Phoenix appends
 * `/websocket` to the endpoint and takes connection params (here, the auth
 * token and the serializer version) as query string.
 */
export const buildWebsocketUrl = (socketUrl: string, token: string): string => {
  const base = socketUrl.replace(/\/+$/, '');
  const params = new URLSearchParams({ token, vsn: '2.0.0' });
  return `${base}/websocket?${params.toString()}`;
};

/**
 * Parse a raw Phoenix frame. Returns null when the payload is not a well-formed
 * v2 tuple (so a malformed/heartbeat-only frame is ignored rather than throwing).
 */
export const parsePhoenixMessage = (raw: string): PhoenixMessage | null => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!Array.isArray(parsed) || parsed.length !== 5) return null;
  const [joinRef, ref, topic, event, payload] = parsed as unknown[];
  if (typeof topic !== 'string' || typeof event !== 'string') return null;
  return [
    joinRef as string | null,
    ref as string | null,
    topic,
    event,
    (payload ?? {}) as Record<string, unknown>,
  ];
};

/**
 * Errors from a channel-level `phx_reply` with `status: 'error'` (join or doc
 * rejection — bad token, invalid document, unknown environment) carry
 * `fatal: true`: retrying with the same inputs cannot succeed, so the frontend
 * stops reconnecting. Transport errors stay retryable (no flag).
 */
export type AbsintheSubscriptionError = Error & { fatal?: boolean };

export interface AbsintheSubscriptionOptions {
  /** Socket endpoint, e.g. `wss://api.massdriver.cloud/api/socket`. */
  socketUrl: string;
  /** Service-account bearer token (query param, backend-only). */
  token: string;
  /** Subscription document. */
  query: string;
  /** Operation variables (`organizationId` is injected by the caller). */
  variables?: Record<string, unknown>;
  /** Called with `result.data` for each streamed `subscription:data`. */
  onData: (data: unknown) => void;
  /** Called on a transport/protocol error. */
  onError: (error: AbsintheSubscriptionError) => void;
  /** Called once the socket closes (after `onError`, if any). */
  onClose?: () => void;
  logger?: {
    error: (message: string) => void;
    debug?: (message: string) => void;
  };
  /** Socket factory — injection seam for tests. Defaults to `new WebSocket(url)`. */
  createSocket?: (url: string) => WebSocket;
}

/** A live subscription handle; call `close()` to tear it down. */
export interface AbsintheSubscription {
  close: () => void;
}

/**
 * Open a single Absinthe subscription and stream its results to `onData`.
 * Returns a handle whose `close()` leaves the channel and closes the socket.
 */
export const openAbsintheSubscription = (
  options: AbsintheSubscriptionOptions,
): AbsintheSubscription => {
  const {
    socketUrl,
    token,
    query,
    variables,
    onData,
    onError,
    onClose,
    logger,
  } = options;
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
  let docRef: string | null = null;
  // The `__absinthe__:doc:<hash>` subscription id from the doc reply.
  let subscriptionId: string | null = null;
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  let awaitingHeartbeat = false;
  let closed = false;

  const send = (message: PhoenixMessage) => {
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
        send([joinRef, nextRef(), CONTROL_TOPIC, 'phx_leave', {}]);
      }
      ws.close();
    } catch {
      /* already closing */
    }
  };

  ws.on('open', () => {
    joinReplyRef = nextRef();
    send([joinRef, joinReplyRef, CONTROL_TOPIC, 'phx_join', {}]);
    heartbeat = setInterval(() => {
      // A heartbeat interval elapsing with no traffic since the last one means
      // the connection is half-open — terminate so 'close' fires and the
      // frontend's reconnect loop takes over.
      if (awaitingHeartbeat) {
        logger?.debug?.('Absinthe socket heartbeat timed out; terminating');
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
    const [, ref, topic, event, payload] = message;

    if (event === 'phx_reply') {
      const status = payload.status as string | undefined;
      const response = (payload.response ?? {}) as Record<string, unknown>;

      if (status === 'error') {
        // A channel-level rejection (bad token, invalid doc, unknown
        // environment) won't succeed on retry — mark it fatal so the
        // frontend stops reconnecting.
        const channelError: AbsintheSubscriptionError = Object.assign(
          new Error(
            `Absinthe channel error: ${JSON.stringify(response) || 'unknown'}`,
          ),
          { fatal: true },
        );
        onError(channelError);
        close();
        return;
      }

      // Join succeeded → push the subscription document.
      if (ref === joinReplyRef) {
        docRef = nextRef();
        send([joinRef, docRef, CONTROL_TOPIC, 'doc', { query, variables }]);
        return;
      }

      // Document accepted → remember the subscription id.
      if (ref === docRef) {
        const replySubscriptionId = response.subscriptionId as
          | string
          | undefined;
        if (replySubscriptionId) {
          subscriptionId = replySubscriptionId;
        } else if ('data' in response) {
          // A non-subscription document (query/mutation) resolves inline.
          onData(response.data);
        }
        return;
      }
      return;
    }

    if (event === 'subscription:data') {
      // Mirror `@absinthe/socket`: match on the event alone and correlate by
      // the payload's subscriptionId when both sides carry one. Each socket
      // owns exactly one subscription, so a topic check adds only fragility
      // (a framing change upstream would silently drop every event).
      const payloadSubscriptionId = payload.subscriptionId as
        | string
        | undefined;
      if (
        payloadSubscriptionId &&
        subscriptionId &&
        payloadSubscriptionId !== subscriptionId
      ) {
        return;
      }
      const result = (payload.result ?? {}) as { data?: unknown };
      onData(result.data);
      return;
    }

    if (event === 'phx_error' || event === 'phx_close') {
      logger?.debug?.(`Absinthe channel ${event} on ${topic}`);
    }
  });

  ws.on('error', (error: Error) => {
    logger?.error(`Absinthe socket error: ${error.message}`);
    if (!closed) onError(error);
  });

  ws.on('close', () => {
    cleanup();
    closed = true;
    onClose?.();
  });

  return { close };
};
