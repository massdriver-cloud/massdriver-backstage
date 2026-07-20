import { lazy, Suspense } from 'react';

const ProjectsListPageInner = lazy(() =>
  import('./ProjectsListPage').then(module => ({
    default: module.ProjectsListPage,
  })),
);

export const ProjectsListPage = () => (
  <Suspense fallback={null}>
    <ProjectsListPageInner />
  </Suspense>
);
