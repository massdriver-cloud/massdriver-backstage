import { parseEnvironmentId } from '@massdriver-cloud/backstage-plugin-massdriver-common';

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
};
