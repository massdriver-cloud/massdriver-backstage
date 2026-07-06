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
 * Massdriver composite IDs join hyphen-free segments with `-`:
 * - environment id: `{projectId}-{scopedEnvironmentId}`
 * - instance id:    `{projectId}-{scopedEnvironmentId}-{scopedComponentId}`
 *
 * The web app's URLs are keyed by the scoped segments, so deep-links are built
 * by splitting the composite id. Mirrors `apps/web/shared/utils/ids.js`.
 *
 * @public
 */
export const parseEnvironmentId = (
  environmentId: string,
): { projectId: string; scopedEnvironmentId: string } => {
  const [projectId, scopedEnvironmentId] = environmentId.split('-');
  return { projectId, scopedEnvironmentId };
};

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
 * Full URL of the v2 GraphQL endpoint for a given API origin.
 *
 * @public
 */
export const graphqlUrl = (baseUrl: string = DEFAULT_API_URL): string =>
  `${trimTrailingSlash(baseUrl)}${GRAPHQL_PATH}`;

/**
 * Deep-link into the Massdriver web app for a project.
 *
 * @public
 */
export const projectUrl = (
  appUrl: string,
  orgId: string,
  projectId: string,
): string =>
  `${trimTrailingSlash(appUrl)}/orgs/${orgId}/projects/${projectId}`;

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
  return `${projectUrl(appUrl, orgId, projectId)}/environments/${scopedEnvironmentId}`;
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
  return `${trimTrailingSlash(appUrl)}/orgs/${orgId}/projects/${projectId}/environments/${scopedEnvironmentId}/instances/${scopedComponentId}`;
};
