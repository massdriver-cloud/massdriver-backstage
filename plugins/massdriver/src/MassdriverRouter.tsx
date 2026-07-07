import Box from '@massdriver/ui/Box';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ProjectDetailsPage } from './features/project/ProjectDetailsPage';
import { ProjectsListPage } from './features/projects/ProjectsListPage';

// Placeholder until the corresponding slice lands.
const ComingSoon = ({ label }: { label: string }) => (
  <Box sx={{ p: 3 }}>{label} — coming soon</Box>
);

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
      path="projects/:projectId/environments/:environmentId"
      element={<ComingSoon label="Environment graph" />}
    />
    <Route path="projects/:projectId/:tab" element={<ProjectDetailsPage />} />
  </Routes>
);
