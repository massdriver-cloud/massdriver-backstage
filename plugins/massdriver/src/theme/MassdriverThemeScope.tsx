import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import { DarkTheme, LightTheme } from '@massdriver/ui/theme';
import ScopedCssBaseline from '@mui/material/ScopedCssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { ReactNode, useMemo } from 'react';
import { useThemeMode } from './ThemeModeContext';

// MUI v5 Tooltip portals its popper to `document.body`, outside our
// ScopedCssBaseline. There it inherits Backstage's MUI v4 global `.MuiTooltip-*`
// rules (shared class names, different geometry), which cut off text and
// mis-position the popper. Force the v5 look with `!important` so the v4 rules
// can't win regardless of stylesheet injection order.
const tooltipOverrides = {
  components: {
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: 'rgba(66, 66, 66, 0.95) !important',
          color: '#fff !important',
          fontSize: '0.6875rem !important',
          fontWeight: '500 !important',
          lineHeight: '1.4 !important',
          padding: '4px 8px !important',
          maxWidth: '320px !important',
          minHeight: 'unset !important',
          height: 'auto !important',
          margin: '4px !important',
          borderRadius: '4px !important',
          whiteSpace: 'normal !important',
          wordBreak: 'break-word' as const,
        },
        popper: {
          zIndex: '1600 !important',
        },
        arrow: {
          color: 'rgba(66, 66, 66, 0.95) !important',
        },
      },
    },
  },
};

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
  const theme = useMemo(() => {
    const base: any = mode === 'dark' ? DarkTheme : LightTheme;
    return {
      ...base,
      components: {
        ...base.components,
        ...tooltipOverrides.components,
        MuiTooltip: {
          ...base.components?.MuiTooltip,
          styleOverrides: {
            ...base.components?.MuiTooltip?.styleOverrides,
            ...tooltipOverrides.components.MuiTooltip.styleOverrides,
          },
        },
      },
    };
  }, [mode]);

  return (
    <CacheProvider value={massdriverCache}>
      <ThemeProvider theme={theme}>
        <ScopedCssBaseline>{children}</ScopedCssBaseline>
      </ThemeProvider>
    </CacheProvider>
  );
};
