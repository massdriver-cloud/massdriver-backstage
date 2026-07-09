import http from 'http';
import type { AddressInfo } from 'net';
import { mockServices } from '@backstage/backend-test-utils';
import { MiddlewareFactory } from '@backstage/backend-defaults/rootHttpRouter';
import {
  createMassdriverClient,
  MassdriverClient,
} from '@massdriver-cloud/backstage-plugin-massdriver-common';
import express from 'express';
import request from 'supertest';
import type {
  AbsintheSubscription,
  AbsintheSubscriptionOptions,
} from './absinthe';
import { openAbsintheSubscription } from './absinthe';
import { createRouter } from './router';

// Relay the upstream at the module boundary — never hit the real API/socket.
jest.mock('@massdriver-cloud/backstage-plugin-massdriver-common', () => ({
  ...jest.requireActual('@massdriver-cloud/backstage-plugin-massdriver-common'),
  createMassdriverClient: jest.fn(),
}));

jest.mock('./absinthe', () => ({
  openAbsintheSubscription: jest.fn(),
}));

const createMassdriverClientMock =
  createMassdriverClient as jest.MockedFunction<typeof createMassdriverClient>;
const openAbsintheSubscriptionMock =
  openAbsintheSubscription as jest.MockedFunction<
    typeof openAbsintheSubscription
  >;

const CONFIG_DATA = {
  massdriver: {
    organizationId: 'org-1',
    apiToken: 'tok',
    baseUrl: 'https://api.example.com',
  },
};

const buildApp = async () => {
  const config = mockServices.rootConfig({ data: CONFIG_DATA });
  const logger = mockServices.logger.mock();
  const httpAuth = mockServices.httpAuth.mock();
  const app = express();
  app.use(await createRouter({ config, logger, httpAuth }));
  // Map InputError → 400 the way the real backend does.
  app.use(MiddlewareFactory.create({ config, logger }).error());
  return { app, config, logger, httpAuth };
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

describe('createRouter POST /graphql', () => {
  const queryMock = jest.fn();

  beforeEach(() => {
    queryMock.mockReset();
    createMassdriverClientMock.mockReset();
    createMassdriverClientMock.mockReturnValue({
      organizationId: 'org-1',
      query: queryMock,
    } as unknown as MassdriverClient);
  });

  it('rejects a missing query with a 400 InputError', async () => {
    const { app } = await buildApp();
    const response = await request(app).post('/graphql').send({});
    expect(response.status).toBe(400);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('rejects a blank query with a 400 InputError', async () => {
    const { app } = await buildApp();
    const response = await request(app).post('/graphql').send({ query: '   ' });
    expect(response.status).toBe(400);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('returns the client data and forwards query + variables', async () => {
    queryMock.mockResolvedValue({ me: { id: 'user-1' } });
    const { app } = await buildApp();

    const response = await request(app)
      .post('/graphql')
      .send({ query: '{ me { id } }', variables: { first: 5 } });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: { me: { id: 'user-1' } } });
    expect(queryMock).toHaveBeenCalledWith('{ me { id } }', { first: 5 });
  });

  it('creates the Massdriver client from config values', async () => {
    queryMock.mockResolvedValue({});
    const { app } = await buildApp();

    await request(app).post('/graphql').send({ query: '{ me { id } }' });

    expect(createMassdriverClientMock).toHaveBeenCalledWith({
      token: 'tok',
      organizationId: 'org-1',
      baseUrl: 'https://api.example.com',
    });
  });

  it('requires an authenticated user credential', async () => {
    queryMock.mockResolvedValue({});
    const { app, httpAuth } = await buildApp();

    await request(app).post('/graphql').send({ query: '{ me { id } }' });

    expect(httpAuth.credentials).toHaveBeenCalledWith(expect.anything(), {
      allow: ['user'],
    });
  });
});

/** POST /subscribe against a real listening server so SSE chunks flush live. */
interface SseRequest {
  request: http.ClientRequest;
  response: Promise<http.IncomingMessage>;
  ended: Promise<void>;
  chunks: string[];
  body: () => string;
}

describe('createRouter POST /subscribe', () => {
  const servers: http.Server[] = [];
  const requests: http.ClientRequest[] = [];
  const closeMock = jest.fn();

  const listen = async (): Promise<{
    port: number;
    httpAuth: ReturnType<typeof mockServices.httpAuth.mock>;
  }> => {
    const { app, httpAuth } = await buildApp();
    const server = app.listen(0);
    servers.push(server);
    await new Promise<void>(resolve =>
      server.once('listening', () => resolve()),
    );
    const { port } = server.address() as AddressInfo;
    return { port, httpAuth };
  };

  const postSubscribe = (port: number, body: unknown): SseRequest => {
    const payload = JSON.stringify(body);
    const chunks: string[] = [];
    const clientRequest = http.request({
      host: '127.0.0.1',
      port,
      path: '/subscribe',
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(payload),
      },
    });
    requests.push(clientRequest);
    let markEnded: () => void = () => {};
    const ended = new Promise<void>(resolve => {
      markEnded = resolve;
    });
    const response = new Promise<http.IncomingMessage>((resolve, reject) => {
      clientRequest.on('response', incoming => {
        incoming.setEncoding('utf8');
        incoming.on('data', chunk => chunks.push(chunk));
        incoming.on('end', markEnded);
        incoming.on('close', markEnded);
        resolve(incoming);
      });
      clientRequest.on('error', reject);
    });
    clientRequest.write(payload);
    clientRequest.end();
    return {
      request: clientRequest,
      response,
      ended,
      chunks,
      body: () => chunks.join(''),
    };
  };

  const lastSubscriptionOptions = (): AbsintheSubscriptionOptions =>
    openAbsintheSubscriptionMock.mock.calls[
      openAbsintheSubscriptionMock.mock.calls.length - 1
    ][0];

  beforeEach(() => {
    closeMock.mockReset();
    openAbsintheSubscriptionMock.mockReset();
    openAbsintheSubscriptionMock.mockReturnValue({
      close: closeMock,
    } as AbsintheSubscription);
  });

  afterEach(async () => {
    // Belt and braces: drive `onClose` on every opened subscription so each
    // handler's keepalive interval is cleared even if a test never triggered
    // its own teardown path.
    for (const call of openAbsintheSubscriptionMock.mock.calls) {
      call[0].onClose?.();
    }
    for (const clientRequest of requests) clientRequest.destroy();
    requests.length = 0;
    await new Promise(resolve => setTimeout(resolve, 30));
    await Promise.all(
      servers.map(
        server => new Promise<void>(resolve => server.close(() => resolve())),
      ),
    );
    servers.length = 0;
  });

  it('opens an event-stream and injects the org id over request variables', async () => {
    const { port } = await listen();
    const sse = postSubscribe(port, {
      query: 'subscription { deploymentLogs { message } }',
      variables: { organizationId: 'attacker-org', extra: true },
    });

    const response = await sse.response;
    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('text/event-stream');

    await waitFor(() => openAbsintheSubscriptionMock.mock.calls.length === 1, {
      label: 'subscription open',
    });
    const options = lastSubscriptionOptions();
    expect(options.variables).toEqual({ extra: true, organizationId: 'org-1' });
    expect(options.socketUrl).toBe('wss://api.example.com/api/socket');
    expect(options.token).toBe('tok');
  });

  it('writes each onData result as an SSE data frame', async () => {
    const { port } = await listen();
    const sse = postSubscribe(port, {
      query: 'subscription { deploymentLogs { message } }',
    });
    await sse.response;
    await waitFor(() => openAbsintheSubscriptionMock.mock.calls.length === 1, {
      label: 'subscription open',
    });

    const options = lastSubscriptionOptions();
    options.onData({ deploymentLogs: { message: 'hello' } });

    await waitFor(() => sse.body().includes('data:'), { label: 'data frame' });
    expect(sse.body()).toContain(
      `data: ${JSON.stringify({ deploymentLogs: { message: 'hello' } })}\n\n`,
    );
  });

  it('writes an error event then ends the stream and closes the subscription', async () => {
    const { port } = await listen();
    const sse = postSubscribe(port, {
      query: 'subscription { deploymentLogs { message } }',
    });
    await sse.response;
    await waitFor(() => openAbsintheSubscriptionMock.mock.calls.length === 1, {
      label: 'subscription open',
    });

    const options = lastSubscriptionOptions();
    options.onError(new Error('upstream boom'));

    await waitFor(() => sse.body().includes('event: error'), {
      label: 'error frame',
    });
    expect(sse.body()).toContain(
      `event: error\ndata: ${JSON.stringify({
        message: 'upstream boom',
        fatal: false,
      })}\n\n`,
    );
    await waitFor(() => closeMock.mock.calls.length === 1, {
      label: 'subscription close',
    });
    await sse.ended;
  });

  // Teardown is wired to `res.on('close')` — the response close event is the
  // reliable client-disconnect signal (the request readable closes as soon as
  // `express.json()` consumes the POST body, long before the browser leaves).
  it('closes the subscription when the client disconnects', async () => {
    const { port } = await listen();
    const sse = postSubscribe(port, {
      query: 'subscription { deploymentLogs { message } }',
    });
    await sse.response;
    await waitFor(() => openAbsintheSubscriptionMock.mock.calls.length === 1, {
      label: 'subscription open',
    });

    sse.request.destroy();

    await waitFor(() => closeMock.mock.calls.length === 1, {
      timeoutMs: 500,
      label: 'subscription close on disconnect',
    });
    expect(closeMock).toHaveBeenCalledTimes(1);
  });

  it('requires an authenticated user credential', async () => {
    const { port, httpAuth } = await listen();
    const sse = postSubscribe(port, {
      query: 'subscription { deploymentLogs { message } }',
    });
    await sse.response;

    expect(httpAuth.credentials).toHaveBeenCalledWith(expect.anything(), {
      allow: ['user'],
    });
  });

  it('rejects a missing query before opening the stream', async () => {
    const { port } = await listen();
    const sse = postSubscribe(port, {});

    const response = await sse.response;
    expect(response.statusCode).toBe(400);
    expect(openAbsintheSubscriptionMock).not.toHaveBeenCalled();
  });
});
