/**
 * Default Massdriver SaaS origins. Overridable (e.g. for self-hosted instances)
 * via the `massdriver.baseUrl` / `massdriver.appUrl` config keys.
 *
 * @public
 */
export const DEFAULT_API_URL = 'https://api.massdriver.cloud';

/** @public */
export const DEFAULT_APP_URL = 'https://app.massdriver.cloud';

/**
 * Path of the v2 GraphQL endpoint on the API origin.
 *
 * @public
 */
export const GRAPHQL_PATH = '/api/v2/graphql';

const trimTrailingSlash = (url: string): string => url.replace(/\/+$/, '');

/**
 * Phoenix/Absinthe socket endpoint for a given API origin, mirroring the web
 * app's `socketLink` (which connects to `${WS_URL}/api/socket`). The API origin
 * uses `https`/`http`; the socket swaps it to `wss`/`ws`. Backend-only — the
 * service-account token is appended as a query param server-side (the browser
 * never opens this socket; it consumes the backend SSE relay instead).
 *
 * @public
 */
export const SOCKET_PATH = '/api/socket';

/** @public */
export const socketUrl = (baseUrl: string = DEFAULT_API_URL): string => {
  const swapped = trimTrailingSlash(baseUrl).replace(
    /^http(s?):\/\//,
    'ws$1://',
  );
  return `${swapped}${SOCKET_PATH}`;
};

/**
 * Massdriver composite IDs join hyphen-free segments with `-`:
 * - environment id: `{projectId}-{scopedEnvironmentId}`
 * - instance id:    `{projectId}-{scopedEnvironmentId}-{scopedComponentId}`
 *
 * The web app's URLs are keyed by the scoped segments, so deep-links are built
 * by splitting the composite id.
 *
 * @public
 */
export const parseEnvironmentId = (
  environmentId: string,
): { projectId: string; scopedEnvironmentId: string } => {
  const [projectId, scopedEnvironmentId] = environmentId.split('-');
  return { projectId, scopedEnvironmentId };
};

/**
 * Compose a full environment id from its parts: `{projectId}-{scopedEnvironmentId}`.
 *
 * @public
 */
export const composeEnvironmentId = (
  projectId: string,
  scopedEnvironmentId: string,
): string => `${projectId}-${scopedEnvironmentId}`;

/** @public */
export const parseInstanceId = (
  instanceId: string,
): {
  projectId: string;
  scopedEnvironmentId: string;
  scopedComponentId: string;
} => {
  const [projectId, scopedEnvironmentId, scopedComponentId] =
    instanceId.split('-');
  return { projectId, scopedEnvironmentId, scopedComponentId };
};

/**
 * Component ids are project-scoped: `{projectId}-{scopedComponentId}`.
 *
 * @public
 */
export const parseComponentId = (
  componentId: string,
): { projectId: string; scopedComponentId: string } => {
  const [projectId, scopedComponentId] = componentId.split('-');
  return { projectId, scopedComponentId };
};

/**
 * Compose a full instance id from its parts:
 * `{projectId}-{scopedEnvironmentId}-{scopedComponentId}`.
 *
 * @public
 */
export const composeInstanceId = (
  projectId: string,
  scopedEnvironmentId: string,
  scopedComponentId: string,
): string => `${projectId}-${scopedEnvironmentId}-${scopedComponentId}`;

/**
 * Full URL of the v2 GraphQL endpoint for a given API origin.
 *
 * @public
 */
export const graphqlUrl = (baseUrl: string = DEFAULT_API_URL): string =>
  `${trimTrailingSlash(baseUrl)}${GRAPHQL_PATH}`;

/**
 * Deep-link into the Massdriver web app's projects list.
 *
 * @public
 */
export const projectsUrl = (appUrl: string, orgId: string): string =>
  `${trimTrailingSlash(appUrl)}/orgs/${orgId}/projects`;

/**
 * Deep-link into the Massdriver web app for a project.
 *
 * @public
 */
export const projectUrl = (
  appUrl: string,
  orgId: string,
  projectId: string,
): string => `${trimTrailingSlash(appUrl)}/orgs/${orgId}/projects/${projectId}`;

/**
 * Deep-link into the Massdriver web app for an environment (its graph view).
 *
 * @public
 */
export const environmentUrl = (
  appUrl: string,
  orgId: string,
  environmentId: string,
): string => {
  const { projectId, scopedEnvironmentId } = parseEnvironmentId(environmentId);
  return `${projectUrl(
    appUrl,
    orgId,
    projectId,
  )}/environments/${scopedEnvironmentId}`;
};

/**
 * Deep-link into the Massdriver web app for a deployed instance's detail panel.
 *
 * @public
 */
export const instanceUrl = (
  appUrl: string,
  orgId: string,
  instanceId: string,
): string => {
  const { projectId, scopedEnvironmentId, scopedComponentId } =
    parseInstanceId(instanceId);
  return `${trimTrailingSlash(
    appUrl,
  )}/orgs/${orgId}/projects/${projectId}/environments/${scopedEnvironmentId}/instances/${scopedComponentId}`;
};

/**
 * Deep-link to a specific tab of an instance's detail panel in the web app,
 * e.g. `?tab=overview` (change version) or `?tab=secrets` (set/clear secret).
 *
 * @public
 */
export const instanceTabUrl = (
  appUrl: string,
  orgId: string,
  instanceId: string,
  tab: string,
): string => `${instanceUrl(appUrl, orgId, instanceId)}?tab=${tab}`;

/**
 * Deep-link that opens one of the instance panel's action dialogs in the web
 * app (`?action=copy | decommission | delete`), mirroring the app's
 * `useDialogParam('action')`.
 *
 * @public
 */
export const instanceActionUrl = (
  appUrl: string,
  orgId: string,
  instanceId: string,
  action: 'copy' | 'decommission' | 'delete',
): string => `${instanceUrl(appUrl, orgId, instanceId)}?action=${action}`;

/**
 * Deep-link into the Massdriver web app's repositories list.
 *
 * @public
 */
export const reposUrl = (appUrl: string, orgId: string): string =>
  `${trimTrailingSlash(appUrl)}/orgs/${orgId}/repos`;

/**
 * Deep-link to a repository's default view in the web app:
 * `/orgs/{orgId}/repos/{repoId}/all` (the "all versions" view, matching the
 * app's repo list link target).
 *
 * @public
 */
export const repoUrl = (
  appUrl: string,
  orgId: string,
  repoId: string,
): string =>
  `${trimTrailingSlash(appUrl)}/orgs/${orgId}/repos/${encodeURIComponent(
    repoId,
  )}/all`;

/**
 * Deep-link to a specific tab of a repository version in the web app:
 * `/orgs/{orgId}/repos/{repoId}/{version}/{tab}`. Version is `all` for the
 * all-versions view.
 *
 * @public
 */
export const repoTabUrl = (
  appUrl: string,
  orgId: string,
  repoId: string,
  version: string,
  tab: string,
): string =>
  `${trimTrailingSlash(appUrl)}/orgs/${orgId}/repos/${encodeURIComponent(
    repoId,
  )}/${encodeURIComponent(version)}/${tab}`;

/**
 * Deep-link into the Massdriver web app's resources list.
 *
 * @public
 */
export const resourcesUrl = (appUrl: string, orgId: string): string =>
  `${trimTrailingSlash(appUrl)}/orgs/${orgId}/resources`;

/**
 * Deep-link to a specific tab of a resource's detail page in the web app:
 * `/orgs/{orgId}/resources/{resourceId}/{tab}`.
 *
 * @public
 */
export const resourceTabUrl = (
  appUrl: string,
  orgId: string,
  resourceId: string,
  tab: string,
): string =>
  `${trimTrailingSlash(appUrl)}/orgs/${orgId}/resources/${encodeURIComponent(
    resourceId,
  )}/${tab}`;

/**
 * Deep-link to a cloud resource's detail page in the web app:
 * `/orgs/{orgId}/resources/{resourceId}/general`. Used by the instance
 * Dependencies/Resources tabs' "fulfilled by" / resource-name links.
 *
 * @public
 */
export const resourceUrl = (
  appUrl: string,
  orgId: string,
  resourceId: string,
): string =>
  `${trimTrailingSlash(appUrl)}/orgs/${orgId}/resources/${encodeURIComponent(
    resourceId,
  )}/general`;

/**
 * Deep-link to a bundle/OCI-repo version's overview in the web app:
 * `/orgs/{orgId}/repos/{repoName}/{version}/overview`. Used by the instance
 * Overview tab's "view in repository" link.
 *
 * @public
 */
export const repoVersionOverviewUrl = (
  appUrl: string,
  orgId: string,
  repoName: string,
  version: string,
): string =>
  `${trimTrailingSlash(
    appUrl,
  )}/orgs/${orgId}/repos/${repoName}/${version}/overview`;
