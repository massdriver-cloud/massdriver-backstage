import { parseEnvironmentId } from '@massdriver/backstage-plugin-common';

const BASE = '/massdriver';

export const internalRoutes = {
  projects: () => `${BASE}/projects`,
  project: (projectId: string) => `${BASE}/projects/${projectId}`,
  projectTab: (projectId: string, tab: string) =>
    `${BASE}/projects/${projectId}/${tab}`,
  environment: (projectId: string, environmentId: string) => {
    const { scopedEnvironmentId } = parseEnvironmentId(environmentId);
    return `${BASE}/projects/${projectId}/environments/${scopedEnvironmentId}`;
  },
  instance: (
    projectId: string,
    scopedEnvironmentId: string,
    scopedComponentId: string,
  ) =>
    `${BASE}/projects/${projectId}/environments/${scopedEnvironmentId}/instances/${scopedComponentId}`,
  repositories: () => `${BASE}/repositories`,
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
