/** @public */
export const DEFAULT_API_URL = 'https://api.massdriver.cloud';

/** @public */
export const DEFAULT_APP_URL = 'https://app.massdriver.cloud';

/** @public */
export const GRAPHQL_PATH = '/api/v2/graphql';

const trimTrailingSlash = (url: string): string => url.replace(/\/+$/, '');

/** @public */
export const SOCKET_PATH = '/api/socket';

/** @public */
export const socketUrl = (baseUrl: string = DEFAULT_API_URL): string => {
  const swapped = trimTrailingSlash(baseUrl).replace(
    /^http(s?):\/\//,
    'ws$1://',
  );
  return `${swapped}${SOCKET_PATH}`;
};

/** @public */
export const parseEnvironmentId = (
  environmentId: string,
): { projectId: string; scopedEnvironmentId: string } => {
  const [projectId, scopedEnvironmentId] = environmentId.split('-');
  return { projectId, scopedEnvironmentId };
};

/** @public */
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

/** @public */
export const parseComponentId = (
  componentId: string,
): { projectId: string; scopedComponentId: string } => {
  const [projectId, scopedComponentId] = componentId.split('-');
  return { projectId, scopedComponentId };
};

/** @public */
export const composeInstanceId = (
  projectId: string,
  scopedEnvironmentId: string,
  scopedComponentId: string,
): string => `${projectId}-${scopedEnvironmentId}-${scopedComponentId}`;

/** @public */
export const graphqlUrl = (baseUrl: string = DEFAULT_API_URL): string =>
  `${trimTrailingSlash(baseUrl)}${GRAPHQL_PATH}`;

/** @public */
export const projectsUrl = (appUrl: string, orgId: string): string =>
  `${trimTrailingSlash(appUrl)}/orgs/${orgId}/projects`;

/** @public */
export const projectUrl = (
  appUrl: string,
  orgId: string,
  projectId: string,
): string => `${trimTrailingSlash(appUrl)}/orgs/${orgId}/projects/${projectId}`;

/** @public */
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

/** @public */
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

/** @public */
export const instanceTabUrl = (
  appUrl: string,
  orgId: string,
  instanceId: string,
  tab: string,
): string => `${instanceUrl(appUrl, orgId, instanceId)}?tab=${tab}`;

/** @public */
export const instanceActionUrl = (
  appUrl: string,
  orgId: string,
  instanceId: string,
  action: 'copy' | 'decommission' | 'delete',
): string => `${instanceUrl(appUrl, orgId, instanceId)}?action=${action}`;

/** @public */
export const reposUrl = (appUrl: string, orgId: string): string =>
  `${trimTrailingSlash(appUrl)}/orgs/${orgId}/repos`;

/** @public */
export const repoUrl = (
  appUrl: string,
  orgId: string,
  repoId: string,
): string =>
  `${trimTrailingSlash(appUrl)}/orgs/${orgId}/repos/${encodeURIComponent(
    repoId,
  )}/all`;

/** @public */
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

/** @public */
export const resourcesUrl = (appUrl: string, orgId: string): string =>
  `${trimTrailingSlash(appUrl)}/orgs/${orgId}/resources`;

/** @public */
export const resourceTabUrl = (
  appUrl: string,
  orgId: string,
  resourceId: string,
  tab: string,
): string =>
  `${trimTrailingSlash(appUrl)}/orgs/${orgId}/resources/${encodeURIComponent(
    resourceId,
  )}/${tab}`;

/** @public */
export const resourceUrl = (
  appUrl: string,
  orgId: string,
  resourceId: string,
): string =>
  `${trimTrailingSlash(appUrl)}/orgs/${orgId}/resources/${encodeURIComponent(
    resourceId,
  )}/general`;

/** @public */
export const repoVersionOverviewUrl = (
  appUrl: string,
  orgId: string,
  repoName: string,
  version: string,
): string =>
  `${trimTrailingSlash(
    appUrl,
  )}/orgs/${orgId}/repos/${repoName}/${version}/overview`;
