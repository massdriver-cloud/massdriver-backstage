import { Navigate, Route, Routes } from 'react-router-dom';
import { NotFound } from './components/NotFound';
import { EnvironmentGraphPage } from './features/environment/EnvironmentGraphPage';
import { ProjectDetailsPage } from './features/project/ProjectDetailsPage';
import { ProjectsListPage } from './features/projects/ProjectsListPage';
import { RepoDetailsPage } from './features/repo/RepoDetailsPage';
import { ReposListPage } from './features/repos/ReposListPage';
import { ResourceDetailsPage } from './features/resource/ResourceDetailsPage';
import { ResourcesListPage } from './features/resources/ResourcesListPage';

/**
 * Internal drill-down routing for the embedded Massdriver views, mounted under
 * the plugin's `/massdriver` page. The index redirects to `/massdriver/projects`.
 */
export const MassdriverRouter = () => (
  <Routes>
    <Route index element={<Navigate to="projects" replace />} />
    <Route path="projects" element={<ProjectsListPage />} />
    <Route
      path="projects/:projectId"
      element={<Navigate to="overview" replace />}
    />
    <Route
      path="projects/:projectId/environments/:scopedEnvironmentId"
      element={<EnvironmentGraphPage />}
    />
    <Route
      path="projects/:projectId/environments/:scopedEnvironmentId/instances/:scopedComponentId"
      element={<EnvironmentGraphPage />}
    />
    <Route path="projects/:projectId/:tab" element={<ProjectDetailsPage />} />
    <Route path="repositories" element={<ReposListPage />} />
    <Route
      path="repositories/:repoId"
      element={<Navigate to="all" replace />}
    />
    <Route
      path="repositories/:repoId/:version"
      element={<Navigate to="overview" replace />}
    />
    <Route
      path="repositories/:repoId/:version/:tab"
      element={<RepoDetailsPage />}
    />
    <Route path="resources" element={<ResourcesListPage />} />
    <Route
      path="resources/:resourceId"
      element={<Navigate to="general" replace />}
    />
    <Route path="resources/:resourceId/:tab" element={<ResourceDetailsPage />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);
