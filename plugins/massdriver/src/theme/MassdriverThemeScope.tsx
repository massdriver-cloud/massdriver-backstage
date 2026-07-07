import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import { DarkTheme, LightTheme } from '@massdriver/ui/theme';
import ScopedCssBaseline from '@mui/material/ScopedCssBaseline';
import { StyledEngineProvider, ThemeProvider } from '@mui/material/styles';
import { ReactNode } from 'react';
import { useThemeMode } from './ThemeModeContext';

// Dedicated Emotion cache so @massdriver/ui (MUI v5) styles are namespaced and
// don't collide with Backstage's own styling. `prepend` + `injectFirst` keep
// MUI's base styles low-specificity so component overrides win.
const massdriverCache = createCache({ key: 'mdui', prepend: true });

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

  return (
    <CacheProvider value={massdriverCache}>
      <StyledEngineProvider injectFirst>
        <ThemeProvider theme={theme}>
          <ScopedCssBaseline>{children}</ScopedCssBaseline>
        </ThemeProvider>
      </StyledEngineProvider>
    </CacheProvider>
  );
};
