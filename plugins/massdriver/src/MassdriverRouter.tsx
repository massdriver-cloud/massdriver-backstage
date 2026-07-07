import Box from '@massdriver/ui/Box';
import { Route, Routes } from 'react-router-dom';
import { MassdriverPage } from './components/MassdriverPage';

// Placeholder until the corresponding slice lands.
const ComingSoon = ({ label }: { label: string }) => (
  <Box sx={{ p: 3 }}>{label} — coming soon</Box>
);

/**
 * Internal drill-down routing for the embedded Massdriver views, mounted under
 * the plugin's `/massdriver` page.
 */
export const MassdriverRouter = () => (
  <Routes>
    <Route index element={<MassdriverPage />} />
    <Route
      path="projects/:projectId/*"
      element={<ComingSoon label="Project details" />}
    />
    <Route
      path="projects/:projectId/environments/:environmentId"
      element={<ComingSoon label="Environment graph" />}
    />
  </Routes>
);
