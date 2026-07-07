// Internal (within-Backstage) routes for the embedded Massdriver views, all
// under the plugin's `/massdriver` page mount.
const BASE = '/massdriver';

export const internalRoutes = {
  projects: () => `${BASE}/projects`,
  project: (projectId: string) => `${BASE}/projects/${projectId}`,
  projectTab: (projectId: string, tab: string) =>
    `${BASE}/projects/${projectId}/${tab}`,
  environment: (projectId: string, environmentId: string) =>
    `${BASE}/projects/${projectId}/environments/${environmentId}`,
};
