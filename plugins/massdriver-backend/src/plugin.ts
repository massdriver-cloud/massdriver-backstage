import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { createRouter } from './router';

/** @public */
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
