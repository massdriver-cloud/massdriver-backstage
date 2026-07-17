import WebSocket from 'ws';

// Phoenix v2 tuple: [join_ref, ref, topic, event, payload].
type PhoenixMessage = [
  string | null,
  string | null,
  string,
  string,
  Record<string, unknown>,
];

const CONTROL_TOPIC = '__absinthe__:control';
const HEARTBEAT_INTERVAL_MS = 30_000;

export const buildWebsocketUrl = (socketUrl: string, token: string): string => {
  const base = socketUrl.replace(/\/+$/, '');
  const params = new URLSearchParams({ token, vsn: '2.0.0' });
  return `${base}/websocket?${params.toString()}`;
};

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

export type AbsintheSubscriptionError = Error & { fatal?: boolean };

export interface AbsintheSubscriptionOptions {
  socketUrl: string;
  token: string;
  query: string;
  variables?: Record<string, unknown>;
  onData: (data: unknown) => void;
  onError: (error: AbsintheSubscriptionError) => void;
  onClose?: () => void;
  logger?: {
    error: (message: string) => void;
    debug?: (message: string) => void;
  };
  createSocket?: (url: string) => WebSocket;
}

export interface AbsintheSubscription {
  close: () => void;
}

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
    try {
      if (ws.readyState === WebSocket.OPEN) {
        send([joinRef, nextRef(), CONTROL_TOPIC, 'phx_leave', {}]);
      }
      ws.close();
    } catch {
      // noop
    }
  };

  ws.on('open', () => {
    joinReplyRef = nextRef();
    send([joinRef, joinReplyRef, CONTROL_TOPIC, 'phx_join', {}]);
    heartbeat = setInterval(() => {
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
    awaitingHeartbeat = false;
    const message = parsePhoenixMessage(raw.toString());
    if (!message) return;
    const [, ref, topic, event, payload] = message;

    if (event === 'phx_reply') {
      const status = payload.status as string | undefined;
      const response = (payload.response ?? {}) as Record<string, unknown>;

      if (status === 'error') {
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

      if (ref === joinReplyRef) {
        docRef = nextRef();
        send([joinRef, docRef, CONTROL_TOPIC, 'doc', { query, variables }]);
        return;
      }

      if (ref === docRef) {
        const replySubscriptionId = response.subscriptionId as
          | string
          | undefined;
        if (replySubscriptionId) {
          subscriptionId = replySubscriptionId;
        } else if ('data' in response) {
          onData(response.data);
        }
        return;
      }
      return;
    }

    if (event === 'subscription:data') {
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
