import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import { DarkTheme, LightTheme } from '@massdriver/ui/theme';
import ScopedCssBaseline from '@mui/material/ScopedCssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { ReactNode } from 'react';
import { useThemeMode } from './ThemeModeContext';

// Dedicated Emotion cache for @massdriver/ui (MUI v5). It is NOT prepended:
// v5 styles inject after Backstage's MUI v4 so that, on the class names the two
// MUI versions share (.MuiSwitch-*, .MuiTooltip-*, …), the v5 rules win the
// specificity ties. v5 rules are scoped to v5's generated classes, so this does
// not affect Backstage's own v4 chrome.
const massdriverCache = createCache({ key: 'mdui' });

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
      <ThemeProvider theme={theme}>
        <ScopedCssBaseline>{children}</ScopedCssBaseline>
      </ThemeProvider>
    </CacheProvider>
  );
};
