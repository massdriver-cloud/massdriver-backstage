import {
  ApiBlueprint,
  configApiRef,
  createFrontendPlugin,
  fetchApiRef,
  PageBlueprint,
} from '@backstage/frontend-plugin-api';
import {
  EntityCardBlueprint,
  EntityContentBlueprint,
} from '@backstage/plugin-catalog-react/alpha';
import { massdriverApiRef, MassdriverClientApi } from './api';
import { MassdriverIcon } from './components/MassdriverIcon';
import { isMassdriverEntity } from './entity';
import { rootRouteRef } from './routes';

const massdriverApi = ApiBlueprint.make({
  name: 'massdriver',
  params: defineParams =>
    defineParams({
      api: massdriverApiRef,
      deps: { fetchApi: fetchApiRef, configApi: configApiRef },
      factory: ({ fetchApi, configApi }) =>
        new MassdriverClientApi({ fetchApi, configApi }),
    }),
});

const page = PageBlueprint.make({
  params: {
    path: '/massdriver',
    routeRef: rootRouteRef,
    title: 'Massdriver',
    icon: <MassdriverIcon />,
    // The Massdriver shell renders its own header; fill the content area.
    noHeader: true,
    loader: () =>
      Promise.all([
        import('./shell/MassdriverShell'),
        import('./MassdriverRouter'),
      ]).then(([shell, router]) => (
        <shell.MassdriverShell>
          <router.MassdriverRouter />
        </shell.MassdriverShell>
      )),
  },
});

const entityContent = EntityContentBlueprint.make({
  name: 'entity',
  params: {
    path: '/massdriver',
    title: 'Massdriver',
    filter: isMassdriverEntity,
    loader: () =>
      import('./components/EntityMassdriverContent').then(m => (
        <m.EntityMassdriverContent />
      )),
  },
});

const entityCard = EntityCardBlueprint.make({
  name: 'overview',
  params: {
    type: 'info',
    filter: isMassdriverEntity,
    loader: () =>
      import('./components/EntityMassdriverOverviewCard').then(m => (
        <m.EntityMassdriverOverviewCard />
      )),
  },
});

/** @public */
export const massdriverPlugin = createFrontendPlugin({
  pluginId: 'massdriver',
  extensions: [massdriverApi, page, entityContent, entityCard],
  routes: {
    root: rootRouteRef,
  },
});
