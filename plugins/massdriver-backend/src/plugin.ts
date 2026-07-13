import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { createRouter } from './router';

/**
 * Massdriver backend plugin.
 *
 * Exposes an authenticated GraphQL relay at `/api/massdriver/graphql` that
 * forwards queries to the Massdriver v2 API with a service-account bearer token
 * injected server-side. The token is read from config and never reaches the
 * browser.
 *
 * @public
 */
export const massdriverPlugin = createBackendPlugin({
  pluginId: 'massdriver',
  register(env) {
    env.registerInit({
      deps: {
        logger: coreServices.logger,
        config: coreServices.rootConfig,
        httpAuth: coreServices.httpAuth,
        httpRouter: coreServices.httpRouter,
      },
      async init({ logger, config, httpAuth, httpRouter }) {
        httpRouter.use(await createRouter({ logger, config, httpAuth }));
      },
    });
  },
});
