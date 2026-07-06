import {
  HttpAuthService,
  LoggerService,
  RootConfigService,
} from '@backstage/backend-plugin-api';
import { InputError } from '@backstage/errors';
import {
  createMassdriverClient,
  MassdriverClient,
  readMassdriverConfig,
} from '@massdriver-cloud/backstage-plugin-massdriver-common';
import express from 'express';
import Router from 'express-promise-router';

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
  let client: MassdriverClient | undefined;
  const getClient = (): MassdriverClient => {
    if (!client) {
      const { organizationId, apiToken, baseUrl } =
        readMassdriverConfig(config);
      client = createMassdriverClient({
        token: apiToken,
        organizationId,
        baseUrl,
      });
      logger.info(
        `Massdriver relay initialised for organization "${organizationId}"`,
      );
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
      throw new InputError('Request body must include a non-empty `query` string');
    }

    const data = await getClient().query(query, variables);
    res.json({ data });
  });

  return router;
}
