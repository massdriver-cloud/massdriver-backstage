import { parseEnvironmentId } from '@massdriver/backstage-plugin-common';

// Internal (within-Backstage) routes for the embedded Massdriver views, all
// under the plugin's `/massdriver` page mount. Environment URLs use only the
// scoped environment segment (not the full `{projectId}-{scoped}` id), matching
// the web app.
const BASE = '/massdriver';

export const internalRoutes = {
  projects: () => `${BASE}/projects`,
  project: (projectId: string) => `${BASE}/projects/${projectId}`,
  projectTab: (projectId: string, tab: string) =>
    `${BASE}/projects/${projectId}/${tab}`,
  /** `environmentId` is the full composite id; the URL keeps only the scoped part. */
  environment: (projectId: string, environmentId: string) => {
    const { scopedEnvironmentId } = parseEnvironmentId(environmentId);
    return `${BASE}/projects/${projectId}/environments/${scopedEnvironmentId}`;
  },
  /** Instance drawer sub-route; mirrors the app's `.../instances/:scopedInstanceId`. */
  instance: (
    projectId: string,
    scopedEnvironmentId: string,
    scopedComponentId: string,
  ) =>
    `${BASE}/projects/${projectId}/environments/${scopedEnvironmentId}/instances/${scopedComponentId}`,
  repositories: () => `${BASE}/repositories`,
  /** Mirrors the app's `/repos/[repoId]/[version]/[tab]`; version defaults to `all`. */
  repository: (repoId: string, version = 'all') =>
    `${BASE}/repositories/${encodeURIComponent(repoId)}/${encodeURIComponent(
      version,
    )}`,
  repositoryTab: (repoId: string, version: string, tab: string) =>
    `${BASE}/repositories/${encodeURIComponent(repoId)}/${encodeURIComponent(
      version,
    )}/${tab}`,
  resources: () => `${BASE}/resources`,
  resource: (resourceId: string) =>
    `${BASE}/resources/${encodeURIComponent(resourceId)}`,
  resourceTab: (resourceId: string, tab: string) =>
    `${BASE}/resources/${encodeURIComponent(resourceId)}/${tab}`,
};
