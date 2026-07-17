import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import { DarkTheme, LightTheme } from '@massdriver/ui/theme';
import ScopedCssBaseline from '@mui/material/ScopedCssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { ReactNode, useEffect } from 'react';
import { auditMuiClassNameConsistency } from './muiClassNameAudit';
import { useThemeMode } from './useThemeMode';

const massdriverCache = createCache({ key: 'mdui' });

let classNameAuditDone = false;

/** @public */
export const MassdriverThemeScope = ({ children }: { children: ReactNode }) => {
  const mode = useThemeMode();
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
