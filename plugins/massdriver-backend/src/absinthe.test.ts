import type { AddressInfo } from 'net';
import WebSocket, { WebSocketServer } from 'ws';
import {
  AbsintheSubscription,
  AbsintheSubscriptionError,
  AbsintheSubscriptionOptions,
  buildWebsocketUrl,
  openAbsintheSubscription,
  parsePhoenixMessage,
} from './absinthe';

describe('buildWebsocketUrl', () => {
  it('appends the phoenix /websocket path with token and serializer version', () => {
    expect(
      buildWebsocketUrl('wss://api.massdriver.cloud/api/socket', 'tok-123'),
    ).toBe(
      'wss://api.massdriver.cloud/api/socket/websocket?token=tok-123&vsn=2.0.0',
    );
  });

  it('trims a trailing slash on the socket endpoint', () => {
    expect(buildWebsocketUrl('wss://host/api/socket/', 't')).toBe(
      'wss://host/api/socket/websocket?token=t&vsn=2.0.0',
    );
  });

  it('url-encodes the token', () => {
    expect(buildWebsocketUrl('wss://host/api/socket', 'a b/c+d')).toContain(
      'token=a+b%2Fc%2Bd',
    );
  });
});

describe('parsePhoenixMessage', () => {
  it('parses a well-formed v2 tuple', () => {
    const raw = JSON.stringify([
      null,
      null,
      '__absinthe__:doc:abc',
      'subscription:data',
      { result: { data: { deploymentLogs: { message: 'hi' } } } },
    ]);
    expect(parsePhoenixMessage(raw)).toEqual([
      null,
      null,
      '__absinthe__:doc:abc',
      'subscription:data',
      { result: { data: { deploymentLogs: { message: 'hi' } } } },
    ]);
  });

  it('returns null for a 4-tuple missing the payload slot', () => {
    const raw = JSON.stringify(['1', '2', '__absinthe__:control', 'phx_reply']);
    expect(parsePhoenixMessage(raw)).toBeNull();
  });

  it('parses a 5-tuple with a null payload, defaulting the payload to {}', () => {
    const raw = JSON.stringify([
      null,
      null,
      '__absinthe__:control',
      'phx_reply',
      null,
    ]);
    expect(parsePhoenixMessage(raw)).toEqual([
      null,
      null,
      '__absinthe__:control',
      'phx_reply',
      {},
    ]);
  });

  it('returns null for non-array frames', () => {
    expect(parsePhoenixMessage(JSON.stringify({ hello: 'world' }))).toBeNull();
  });

  it('returns null for malformed JSON', () => {
    expect(parsePhoenixMessage('not json')).toBeNull();
  });

  it('returns null when topic/event are not strings', () => {
    expect(
      parsePhoenixMessage(JSON.stringify([null, null, 1, 2, {}])),
    ).toBeNull();
  });
});

type PhoenixFrame = [
  string | null,
  string | null,
  string,
  string,
  Record<string, unknown>,
];

const HEARTBEAT_INTERVAL_MS = 30_000;

interface ServerFrameApi {
  reply: (payload: Record<string, unknown>) => void;
  send: (frame: PhoenixFrame) => void;
}

type FrameHandler = (frame: PhoenixFrame, api: ServerFrameApi) => void;

interface ScriptedServer {
  socketUrl: string;
  received: PhoenixFrame[];
  connection: Promise<WebSocket>;
  stop: () => Promise<void>;
}

const startScriptedServer = async (
  handler: FrameHandler,
): Promise<ScriptedServer> => {
  const server = new WebSocketServer({ port: 0 });
  await new Promise<void>(resolve => server.once('listening', () => resolve()));
  const { port } = server.address() as AddressInfo;

  const received: PhoenixFrame[] = [];
  const connection = new Promise<WebSocket>(resolve => {
    server.on('connection', socket => {
      socket.on('message', raw => {
        const frame = JSON.parse(raw.toString()) as PhoenixFrame;
        received.push(frame);
        handler(frame, {
          send: outgoing => socket.send(JSON.stringify(outgoing)),
          reply: payload =>
            socket.send(
              JSON.stringify([
                frame[0],
                frame[1],
                frame[2],
                'phx_reply',
                payload,
              ]),
            ),
        });
      });
      resolve(socket);
    });
  });

  const stop = () =>
    new Promise<void>(resolve => {
      for (const client of server.clients) client.terminate();
      server.close(() => resolve());
    });

  return {
    socketUrl: `ws://localhost:${port}/api/socket`,
    received,
    connection,
    stop,
  };
};

const emitData = (
  send: (frame: PhoenixFrame) => void,
  topic: string,
  data: unknown,
  subscriptionId?: string,
) =>
  send([
    null,
    null,
    topic,
    'subscription:data',
    { ...(subscriptionId ? { subscriptionId } : {}), result: { data } },
  ]);

const acceptAndEmit =
  (
    subscriptionId: string,
    afterDoc?: (send: (frame: PhoenixFrame) => void) => void,
  ): FrameHandler =>
  (frame, { reply, send }) => {
    const event = frame[3];
    if (event === 'phx_join') reply({ status: 'ok', response: {} });
    if (event === 'doc') {
      reply({ status: 'ok', response: { subscriptionId } });
      afterDoc?.(send);
    }
  };

const waitFor = async (
  predicate: () => boolean,
  { timeoutMs = 2000, label = 'condition' } = {},
) => {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start > timeoutMs) {
      throw new Error(`Timed out waiting for ${label}`);
    }
    await new Promise(resolve => setTimeout(resolve, 10));
  }
};

const hasFrame = (received: PhoenixFrame[], event: string) =>
  received.some(frame => frame[3] === event);

describe('openAbsintheSubscription', () => {
  const servers: ScriptedServer[] = [];
  const subscriptions: AbsintheSubscription[] = [];

  const open = (
    server: ScriptedServer,
    options: Partial<AbsintheSubscriptionOptions> & {
      onData: AbsintheSubscriptionOptions['onData'];
    },
  ): AbsintheSubscription => {
    const subscription = openAbsintheSubscription({
      socketUrl: server.socketUrl,
      token: 'service-token',
      query: 'subscription { deploymentLogs { message } }',
      variables: { organizationId: 'org-1' },
      onError: () => {},
      ...options,
    });
    subscriptions.push(subscription);
    return subscription;
  };

  const startServer = async (
    handler: FrameHandler,
  ): Promise<ScriptedServer> => {
    const server = await startScriptedServer(handler);
    servers.push(server);
    return server;
  };

  afterEach(async () => {
    for (const subscription of subscriptions) subscription.close();
    subscriptions.length = 0;
    await Promise.all(servers.map(server => server.stop()));
    servers.length = 0;
    jest.restoreAllMocks();
  });

  it('joins, pushes the doc, and forwards each subscription:data result', async () => {
    const topic = '__absinthe__:doc:happy';
    const server = await startServer(
      acceptAndEmit(topic, send => {
        emitData(send, topic, { deploymentLogs: { message: 'one' } }, topic);
        emitData(send, topic, { deploymentLogs: { message: 'two' } }, topic);
      }),
    );

    const results: unknown[] = [];
    open(server, { onData: data => results.push(data) });

    await waitFor(() => results.length === 2, { label: 'two data frames' });
    expect(results).toEqual([
      { deploymentLogs: { message: 'one' } },
      { deploymentLogs: { message: 'two' } },
    ]);
    await waitFor(() => hasFrame(server.received, 'doc'), {
      label: 'doc push',
    });
    expect(hasFrame(server.received, 'phx_join')).toBe(true);
  });

  it('drops subscription:data whose payload subscriptionId does not match', async () => {
    const topic = '__absinthe__:doc:mine';
    const server = await startServer(
      acceptAndEmit(topic, send => {
        emitData(send, topic, { stray: true }, '__absinthe__:doc:someone-else');
        emitData(send, topic, { mine: true }, topic);
      }),
    );

    const results: unknown[] = [];
    open(server, { onData: data => results.push(data) });

    await waitFor(() => results.length === 1, { label: 'the matching frame' });
    await new Promise(resolve => setTimeout(resolve, 30));
    expect(results).toEqual([{ mine: true }]);
  });

  it('surfaces a join error reply and closes the socket', async () => {
    const server = await startServer((frame, { reply }) => {
      if (frame[3] === 'phx_join') {
        reply({ status: 'error', response: { reason: 'unauthorized' } });
      }
    });

    const onError = jest.fn();
    const onClose = jest.fn();
    const results: unknown[] = [];
    open(server, { onData: data => results.push(data), onError, onClose });

    await waitFor(() => onError.mock.calls.length === 1, { label: 'onError' });
    const joinError = onError.mock.calls[0][0] as AbsintheSubscriptionError;
    expect(joinError).toBeInstanceOf(Error);
    expect(joinError.message).toContain('unauthorized');
    expect(joinError.fatal).toBe(true);
    await waitFor(() => onClose.mock.calls.length === 1, {
      label: 'socket close',
    });
    expect(results).toEqual([]);
  });

  it('surfaces a doc error reply', async () => {
    const server = await startServer((frame, { reply }) => {
      if (frame[3] === 'phx_join') reply({ status: 'ok', response: {} });
      if (frame[3] === 'doc') {
        reply({ status: 'error', response: { errors: ['bad document'] } });
      }
    });

    const onError = jest.fn();
    open(server, { onData: () => {}, onError });

    await waitFor(() => onError.mock.calls.length === 1, { label: 'onError' });
    const docError = onError.mock.calls[0][0] as AbsintheSubscriptionError;
    expect(docError.message).toContain('bad document');
    expect(docError.fatal).toBe(true);
  });

  it('forwards an inline data reply for a non-subscription document', async () => {
    const server = await startServer((frame, { reply }) => {
      if (frame[3] === 'phx_join') reply({ status: 'ok', response: {} });
      if (frame[3] === 'doc') {
        reply({ status: 'ok', response: { data: { me: { id: 'user-1' } } } });
      }
    });

    const results: unknown[] = [];
    open(server, { onData: data => results.push(data) });

    await waitFor(() => results.length === 1, { label: 'inline data' });
    expect(results).toEqual([{ me: { id: 'user-1' } }]);
    await new Promise(resolve => setTimeout(resolve, 30));
    expect(results).toHaveLength(1);
  });

  it('sends phx_leave and closes on close(), with no callbacks afterwards', async () => {
    const topic = '__absinthe__:doc:leave';
    const server = await startServer(
      acceptAndEmit(topic, send => {
        emitData(send, topic, { first: true }, topic);
      }),
    );

    const results: unknown[] = [];
    const onClose = jest.fn();
    const subscription = open(server, {
      onData: data => results.push(data),
      onClose,
    });

    await waitFor(() => results.length === 1, { label: 'first data frame' });
    subscription.close();

    await waitFor(() => hasFrame(server.received, 'phx_leave'), {
      label: 'phx_leave',
    });
    await waitFor(() => onClose.mock.calls.length === 1, { label: 'onClose' });

    const countAtClose = results.length;
    await new Promise(resolve => setTimeout(resolve, 30));
    expect(results).toHaveLength(countAtClose);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('fires onClose and clears the heartbeat when the server closes the socket', async () => {
    const setIntervalSpy = jest.spyOn(global, 'setInterval');
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

    const server = await startServer(acceptAndEmit('__absinthe__:doc:hb'));
    const onClose = jest.fn();
    open(server, { onData: () => {}, onClose });

    await waitFor(
      () =>
        setIntervalSpy.mock.calls.some(
          call => call[1] === HEARTBEAT_INTERVAL_MS,
        ),
      { label: 'heartbeat timer' },
    );
    const heartbeatIndex = setIntervalSpy.mock.calls.findIndex(
      call => call[1] === HEARTBEAT_INTERVAL_MS,
    );
    const heartbeatId = setIntervalSpy.mock.results[heartbeatIndex].value;

    const clientSocket = await server.connection;
    clientSocket.close();

    await waitFor(() => onClose.mock.calls.length === 1, { label: 'onClose' });
    expect(clearIntervalSpy).toHaveBeenCalledWith(heartbeatId);
  });

  it('reports a socket construction failure via onError then onClose', async () => {
    const onError = jest.fn();
    const onClose = jest.fn();
    const subscription = openAbsintheSubscription({
      socketUrl: 'wss://unused/api/socket',
      token: 'service-token',
      query: 'subscription { deploymentLogs { message } }',
      onData: () => {},
      onError,
      onClose,
      createSocket: () => {
        throw new Error('socket construction failed');
      },
    });
    subscriptions.push(subscription);

    await waitFor(() => onError.mock.calls.length === 1, { label: 'onError' });
    const creationError = onError.mock.calls[0][0] as AbsintheSubscriptionError;
    expect(creationError.message).toContain('socket construction failed');
    expect(creationError.fatal).toBeUndefined();
    await waitFor(() => onClose.mock.calls.length === 1, { label: 'onClose' });
  });
});
