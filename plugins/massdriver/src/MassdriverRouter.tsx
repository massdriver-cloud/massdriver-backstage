import { Navigate, Route, Routes } from 'react-router-dom';
import { NotFound } from './components/NotFound';
import { EnvironmentGraphPage } from './features/environment/EnvironmentGraphPage';
import { ProjectDetailsPage } from './features/project/ProjectDetailsPage';
import { ProjectsListPage } from './features/projects/ProjectsListPage';

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
    <Route path="projects/:projectId/:tab" element={<ProjectDetailsPage />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);
