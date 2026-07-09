import {
  HttpAuthService,
  LoggerService,
  RootConfigService,
} from '@backstage/backend-plugin-api';
import { InputError } from '@backstage/errors';
import {
  createMassdriverClient,
  MassdriverClient,
  MassdriverConfig,
  readMassdriverConfig,
  socketUrl,
} from '@massdriver-cloud/backstage-plugin-massdriver-common';
import express from 'express';
import Router from 'express-promise-router';
import { openAbsintheSubscription } from './absinthe';
import { openPresenceChannel } from './presence';

// Keep the downstream SSE connection (and any intermediary proxies) alive
// between events. The upstream Absinthe socket has its own heartbeat.
const SSE_KEEPALIVE_MS = 25_000;

/**
 * Builds the Massdriver relay router.
 *
 * The client is created lazily on first use so the backend still boots when the
 * plugin is installed but not yet configured — misconfiguration surfaces as a
 * request error rather than a startup crash.
 */
export async function createRouter({
  config,
  logger,
  httpAuth,
}: {
  config: RootConfigService;
  logger: LoggerService;
  httpAuth: HttpAuthService;
}): Promise<express.Router> {
  let settings: MassdriverConfig | undefined;
  const getConfig = (): MassdriverConfig => {
    if (!settings) {
      settings = readMassdriverConfig(config);
      logger.info(
        `Massdriver relay initialised for organization "${settings.organizationId}"`,
      );
    }
    return settings;
  };

  let client: MassdriverClient | undefined;
  const getClient = (): MassdriverClient => {
    if (!client) {
      const { organizationId, apiToken, baseUrl } = getConfig();
      client = createMassdriverClient({
        token: apiToken,
        organizationId,
        baseUrl,
      });
    }
    return client;
  };

  const router = Router();
  router.use(express.json());

  router.post('/graphql', async (req, res) => {
    // Require an authenticated Backstage user; the relay then queries with the
    // org's service-account token (org-wide read access — see plugin README).
    await httpAuth.credentials(req, { allow: ['user'] });

    const { query, variables } = (req.body ?? {}) as {
      query?: unknown;
      variables?: Record<string, unknown>;
    };

    if (typeof query !== 'string' || !query.trim()) {
      throw new InputError(
        'Request body must include a non-empty `query` string',
      );
    }

    const data = await getClient().query(query, variables);
    res.json({ data });
  });

  // Server-Sent Events relay for GraphQL subscriptions. The browser cannot open
  // the Massdriver Absinthe socket directly (it holds no token), so the backend
  // opens it with the service-account token and streams each result down as an
  // SSE `data:` frame. `organizationId` is injected server-side, mirroring the
  // `/graphql` relay, so callers only declare `$organizationId` in the document.
  router.post('/subscribe', async (req, res) => {
    await httpAuth.credentials(req, { allow: ['user'] });

    const { query, variables } = (req.body ?? {}) as {
      query?: unknown;
      variables?: Record<string, unknown>;
    };

    if (typeof query !== 'string' || !query.trim()) {
      throw new InputError(
        'Request body must include a non-empty `query` string',
      );
    }

    const { organizationId, apiToken, baseUrl } = getConfig();

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      // Disable proxy buffering (nginx) so events flush immediately.
      'X-Accel-Buffering': 'no',
    });
    res.flushHeaders?.();

    const write = (event: string | null, data: unknown) => {
      if (res.writableEnded) return;
      if (event) res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    const keepalive = setInterval(() => {
      if (!res.writableEnded) res.write(': ping\n\n');
    }, SSE_KEEPALIVE_MS);

    const subscription = openAbsintheSubscription({
      socketUrl: socketUrl(baseUrl),
      token: apiToken,
      query,
      // Server-injected org id must win over request variables.
      variables: { ...(variables ?? {}), organizationId },
      logger,
      onData: data => write(null, data),
      onError: error => {
        // `fatal` marks channel-level rejections (bad token/doc/environment)
        // that retrying cannot fix — the frontend stops reconnecting on it.
        write('error', { message: error.message, fatal: Boolean(error.fatal) });
        teardown();
      },
      onClose: () => teardown(),
    });

    let torndown = false;
    function teardown() {
      if (torndown) return;
      torndown = true;
      clearInterval(keepalive);
      subscription.close();
      if (!res.writableEnded) res.end();
    }

    // Browser navigated away / closed the EventSource-style reader. The
    // response 'close' event is the reliable disconnect signal — the request
    // readable closes as soon as the JSON body is consumed, long before the
    // client goes away.
    res.on('close', teardown);
  });

  // SSE relay for the environment presence channel (who's viewing the graph,
  // live cursors). The backend joins `environment:{orgId}/{environmentId}` as
  // a read-only spectator with the service-account token and streams the
  // flattened viewers snapshot on every presence change. Nothing is ever
  // pushed upstream — Backstage viewers are invisible to web-app users.
  router.post('/presence', async (req, res) => {
    await httpAuth.credentials(req, { allow: ['user'] });

    const { environmentId } = (req.body ?? {}) as { environmentId?: unknown };

    if (typeof environmentId !== 'string' || !environmentId.trim()) {
      throw new InputError(
        'Request body must include a non-empty `environmentId` string',
      );
    }

    const { organizationId, apiToken, baseUrl } = getConfig();

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      // Disable proxy buffering (nginx) so events flush immediately.
      'X-Accel-Buffering': 'no',
    });
    res.flushHeaders?.();

    const write = (event: string | null, data: unknown) => {
      if (res.writableEnded) return;
      if (event) res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    const keepalive = setInterval(() => {
      if (!res.writableEnded) res.write(': ping\n\n');
    }, SSE_KEEPALIVE_MS);

    const channel = openPresenceChannel({
      socketUrl: socketUrl(baseUrl),
      token: apiToken,
      topic: `environment:${organizationId}/${environmentId}`,
      logger,
      onViewers: viewers => write(null, { viewers }),
      onError: error => {
        // `fatal` marks join rejections (unauthorized / unknown environment /
        // pre-spectator server) that retrying cannot fix.
        write('error', { message: error.message, fatal: Boolean(error.fatal) });
        teardown();
      },
      onClose: () => teardown(),
    });

    let torndown = false;
    function teardown() {
      if (torndown) return;
      torndown = true;
      clearInterval(keepalive);
      channel.close();
      if (!res.writableEnded) res.end();
    }

    res.on('close', teardown);
  });

  return router;
}
