import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import { DarkTheme, LightTheme } from '@massdriver/ui/theme';
import ScopedCssBaseline from '@mui/material/ScopedCssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { ReactNode, useEffect } from 'react';
import { auditMuiClassNameConsistency } from './muiClassNameAudit';
import { useThemeMode } from './ThemeModeContext';

// Dedicated Emotion cache for @massdriver/ui (MUI v5), keeping the island's
// style tags separate from Backstage's default caches. v4/v5 class-name
// collisions are prevented upstream: Backstage's UnifiedThemeProvider
// configures MUI v5's ClassNameGenerator to prefix slot classes (`v5-Mui*`),
// so Backstage's v4 rules can't match v5 DOM — which also means hardcoded
// `.Mui*` slot selectors never match; build them from theme/muiClasses.ts.
const massdriverCache = createCache({ key: 'mdui' });

// Dev-only, once per page load: surface the boot-graph freeze (see
// muiClassNameAudit.ts) instead of letting it manifest as unexplained visual
// glitches in host apps we don't control.
let classNameAuditDone = false;

/**
 * Applies the Massdriver theme (light/dark, driven by ThemeModeContext) to a
 * subtree so `@massdriver/ui` components render correctly. Uses
 * `ScopedCssBaseline` rather than the global `CssBaseline` that
 * `MassdriverThemeProvider` injects, so Backstage's chrome is left untouched.
 *
 * @public
 */
export const MassdriverThemeScope = ({ children }: { children: ReactNode }) => {
  const { mode } = useThemeMode();
  const theme = mode === 'dark' ? DarkTheme : LightTheme;

  useEffect(() => {
    if (classNameAuditDone || process.env.NODE_ENV === 'production') {
      return;
    }
    classNameAuditDone = true;
    const warning = auditMuiClassNameConsistency();
    if (warning) {
      // eslint-disable-next-line no-console
      console.warn(warning);
    }
  }, []);

  return (
    <CacheProvider value={massdriverCache}>
      <ThemeProvider theme={theme}>
        <ScopedCssBaseline>{children}</ScopedCssBaseline>
      </ThemeProvider>
    </CacheProvider>
  );
};
