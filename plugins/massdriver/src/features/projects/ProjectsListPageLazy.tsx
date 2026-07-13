import { lazy, Suspense } from 'react';

const ProjectsListPageInner = lazy(() =>
  import('./ProjectsListPage').then(module => ({
    default: module.ProjectsListPage,
  })),
);

/**
 * Lazy wrapper for the package-root export. The plugin's root entry is
 * `require()`d eagerly at app boot by Backstage's package detection
 * (`__backstage-autodetected-plugins__`), BEFORE Backstage's
 * UnifiedThemeProvider configures MUI v5's `v5-` ClassNameGenerator prefix.
 * A static import of the real page would evaluate `@massdriver/ui` → the
 * `@mui/material` barrel at that point, freezing every slot-class constant
 * unprefixed and silently breaking cross-slot selectors plugin-wide (see
 * .claude/rules/styling-and-theme.md). Everything reaching `@massdriver/ui`
 * from the package root must stay behind a dynamic import.
 */
export const ProjectsListPage = () => (
  <Suspense fallback={null}>
    <ProjectsListPageInner />
  </Suspense>
);
