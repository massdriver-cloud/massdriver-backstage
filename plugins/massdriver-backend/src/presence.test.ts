import type { AddressInfo } from 'net';
import WebSocket, { WebSocketServer } from 'ws';
import {
  PresenceChannel,
  PresenceChannelError,
  PresenceViewers,
  flattenPresence,
  openPresenceChannel,
  syncPresenceDiff,
} from './presence';

const meta = (
  ref: string,
  overrides: Record<string, unknown> = {},
): Record<string, unknown> => ({
  id: 'acct-1',
  first_name: 'Joe',
  email: 'joe@example.com',
  avatar: null,
  cursor: null,
  phx_ref: ref,
  ...overrides,
});

describe('syncPresenceDiff', () => {
  it('adds a joining key', () => {
    const next = syncPresenceDiff(
      {},
      { joins: { 'acct-1': { metas: [meta('r1')] } } },
    );
    expect(next['acct-1'].metas).toHaveLength(1);
  });

  it('removes a leaving key entirely when no metas remain', () => {
    const state = { 'acct-1': { metas: [meta('r1')] } };
    const next = syncPresenceDiff(state, {
      leaves: { 'acct-1': { metas: [meta('r1')] } },
    });
    expect(next['acct-1']).toBeUndefined();
  });

  it('keeps other metas when one of several leaves (multi-tab)', () => {
    const state = { 'acct-1': { metas: [meta('r1'), meta('r2')] } };
    const next = syncPresenceDiff(state, {
      leaves: { 'acct-1': { metas: [meta('r1')] } },
    });
    expect(next['acct-1'].metas.map(entry => entry.phx_ref)).toEqual(['r2']);
  });

  it('applies a meta update (join new ref + leave old ref in one diff)', () => {
    const state = { 'acct-1': { metas: [meta('r1')] } };
    const next = syncPresenceDiff(state, {
      joins: {
        'acct-1': { metas: [meta('r2', { cursor: { x: 10, y: 20 } })] },
      },
      leaves: { 'acct-1': { metas: [meta('r1')] } },
    });
    expect(next['acct-1'].metas).toHaveLength(1);
    expect(next['acct-1'].metas[0].cursor).toEqual({ x: 10, y: 20 });
  });

  it('does not mutate the previous state', () => {
    const state = { 'acct-1': { metas: [meta('r1')] } };
    syncPresenceDiff(state, {
      leaves: { 'acct-1': { metas: [meta('r1')] } },
    });
    expect(state['acct-1'].metas).toHaveLength(1);
  });
});

describe('flattenPresence', () => {
  it('takes the first meta and preserves the meta count', () => {
    const viewers = flattenPresence({
      'acct-1': {
        metas: [meta('r1', { first_name: 'First' }), meta('r2')],
      },
    });
    expect(viewers['acct-1'].first_name).toBe('First');
    expect(viewers['acct-1']._metasCount).toBe(2);
  });

  it('returns an empty object for empty state', () => {
    expect(flattenPresence({})).toEqual({});
  });
});

// Phoenix v2 wire tuple: [join_ref, ref, topic, event, payload].
type PhoenixFrame = [
  string | null,
  string | null,
  string,
  string,
  Record<string, unknown>,
];

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

const TOPIC = 'environment:org-1/proj-env';

/** Accepts the join and hands the test a `send` to emit presence frames. */
const acceptJoin =
  (afterJoin?: (send: (frame: PhoenixFrame) => void) => void): FrameHandler =>
  (frame, { reply, send }) => {
    if (frame[3] === 'phx_join') {
      reply({ status: 'ok', response: {} });
      afterJoin?.(send);
    }
  };

describe('openPresenceChannel', () => {
  const servers: ScriptedServer[] = [];
  const channels: PresenceChannel[] = [];

  const open = (
    server: ScriptedServer,
    handlers: {
      onViewers?: (viewers: PresenceViewers) => void;
      onError?: (error: PresenceChannelError) => void;
      onClose?: () => void;
    } = {},
  ): PresenceChannel => {
    const channel = openPresenceChannel({
      socketUrl: server.socketUrl,
      token: 'service-token',
      topic: TOPIC,
      onViewers: handlers.onViewers ?? (() => {}),
      onError: handlers.onError ?? (() => {}),
      onClose: handlers.onClose,
    });
    channels.push(channel);
    return channel;
  };

  afterEach(async () => {
    for (const channel of channels.splice(0)) channel.close();
    for (const server of servers.splice(0)) await server.stop();
  });

  const start = async (handler: FrameHandler): Promise<ScriptedServer> => {
    const server = await startScriptedServer(handler);
    servers.push(server);
    return server;
  };

  it('joins the environment topic on connect', async () => {
    const server = await start(acceptJoin());
    open(server);

    await waitFor(() => server.received.length > 0, { label: 'join frame' });
    const [joinRef, , topic, event] = server.received[0];
    expect(topic).toBe(TOPIC);
    expect(event).toBe('phx_join');
    expect(joinRef).not.toBeNull();
  });

  it('emits a flattened snapshot on presence_state', async () => {
    const server = await start(
      acceptJoin(send =>
        send([
          null,
          null,
          TOPIC,
          'presence_state',
          { 'acct-1': { metas: [meta('r1')] } },
        ]),
      ),
    );
    const snapshots: PresenceViewers[] = [];
    open(server, { onViewers: viewers => snapshots.push(viewers) });

    await waitFor(() => snapshots.length > 0, { label: 'presence snapshot' });
    expect(snapshots[0]['acct-1'].first_name).toBe('Joe');
    expect(snapshots[0]['acct-1']._metasCount).toBe(1);
  });

  it('folds presence_diff frames into subsequent snapshots', async () => {
    const server = await start(
      acceptJoin(send => {
        send([null, null, TOPIC, 'presence_state', {}]);
        send([
          null,
          null,
          TOPIC,
          'presence_diff',
          { joins: { 'acct-2': { metas: [meta('r9', { id: 'acct-2' })] } } },
        ]);
        send([
          null,
          null,
          TOPIC,
          'presence_diff',
          {
            joins: {
              'acct-2': {
                metas: [meta('r10', { id: 'acct-2', cursor: { x: 5, y: 6 } })],
              },
            },
            leaves: { 'acct-2': { metas: [meta('r9', { id: 'acct-2' })] } },
          },
        ]);
      }),
    );
    const snapshots: PresenceViewers[] = [];
    open(server, { onViewers: viewers => snapshots.push(viewers) });

    await waitFor(() => snapshots.length >= 3, { label: 'three snapshots' });
    expect(snapshots[0]).toEqual({});
    expect(snapshots[1]['acct-2']).toBeDefined();
    expect(snapshots[2]['acct-2'].cursor).toEqual({ x: 5, y: 6 });
  });

  it('marks a join rejection fatal and closes', async () => {
    const server = await start((frame, { reply }) => {
      if (frame[3] === 'phx_join') {
        reply({ status: 'error', response: { reason: 'unauthorized' } });
      }
    });
    const errors: PresenceChannelError[] = [];
    let closed = false;
    open(server, {
      onError: error => errors.push(error),
      onClose: () => {
        closed = true;
      },
    });

    await waitFor(() => errors.length > 0 && closed, {
      label: 'fatal error + close',
    });
    expect(errors[0].fatal).toBe(true);
    expect(errors[0].message).toContain('unauthorized');
  });

  it('sends phx_leave on close()', async () => {
    const server = await start(acceptJoin());
    const channel = open(server);

    await waitFor(() => server.received.length > 0, { label: 'join frame' });
    channel.close();

    await waitFor(
      () => server.received.some(frame => frame[3] === 'phx_leave'),
      { label: 'phx_leave frame' },
    );
    const leaveFrame = server.received.find(frame => frame[3] === 'phx_leave');
    expect(leaveFrame?.[2]).toBe(TOPIC);
  });

  it('reports transport errors without a fatal flag', async () => {
    const errors: PresenceChannelError[] = [];
    const channel = openPresenceChannel({
      // Nothing is listening on this port.
      socketUrl: 'ws://localhost:1/api/socket',
      token: 'service-token',
      topic: TOPIC,
      onViewers: () => {},
      onError: error => errors.push(error),
    });
    channels.push(channel);

    await waitFor(() => errors.length > 0, { label: 'transport error' });
    expect(errors[0].fatal).toBeUndefined();
  });

  it('fails asynchronously when the socket factory throws', async () => {
    const errors: Error[] = [];
    let closed = false;
    const channel = openPresenceChannel({
      socketUrl: 'ws://localhost:1/api/socket',
      token: 'service-token',
      topic: TOPIC,
      onViewers: () => {},
      onError: error => errors.push(error),
      onClose: () => {
        closed = true;
      },
      createSocket: () => {
        throw new Error('boom');
      },
    });
    channels.push(channel);

    expect(errors).toHaveLength(0); // must not fire synchronously
    await waitFor(() => errors.length > 0 && closed, {
      label: 'async factory failure',
    });
    expect(errors[0].message).toBe('boom');
  });
});
