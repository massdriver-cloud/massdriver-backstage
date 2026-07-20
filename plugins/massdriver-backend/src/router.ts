import {
  HttpAuthService,
  LoggerService,
  RootConfigService,
} from '@backstage/backend-plugin-api';
import { InputError } from '@backstage/errors';
import {
  createMassdriverClient,
  graphqlUrl,
  MassdriverClient,
  MassdriverConfig,
  readMassdriverConfig,
  socketUrl,
} from '@massdriver/backstage-plugin-common';
import express from 'express';
import Router from 'express-promise-router';
import { openAbsintheSubscription } from './absinthe';

const SSE_KEEPALIVE_MS = 25_000;

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

  router.get('/content', async (req, res) => {
    await httpAuth.credentials(req, { allow: ['user'] });

    const { url } = req.query as { url?: unknown };
    if (typeof url !== 'string' || !url) {
      throw new InputError('A `url` query parameter is required');
    }

    const { apiToken, baseUrl } = getConfig();
    const apiOrigin = new URL(graphqlUrl(baseUrl)).origin;

    let target: URL;
    try {
      target = new URL(url);
    } catch {
      throw new InputError('`url` must be an absolute URL');
    }
    if (target.origin !== apiOrigin) {
      throw new InputError(
        `\`url\` must be on the Massdriver API origin (${apiOrigin})`,
      );
    }

    const upstream = await fetch(target, {
      headers: { Authorization: `Bearer ${apiToken}` },
    });

    res.status(upstream.status);
    const contentType = upstream.headers.get('content-type');
    if (contentType) res.setHeader('Content-Type', contentType);
    res.send(Buffer.from(await upstream.arrayBuffer()));
  });

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
      variables: { ...(variables ?? {}), organizationId },
      logger,
      onData: data => write(null, data),
      onError: error => {
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

    res.on('close', teardown);
  });

  return router;
}
