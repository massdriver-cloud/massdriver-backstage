import Box from '@massdriver/ui/Box';
import stylin from '@massdriver/ui/stylin';
import { ReactNode } from 'react';
import { ThemeModeProvider } from '../theme/ThemeModeContext';
import { MassdriverThemeScope } from '../theme/MassdriverThemeScope';
import { MassdriverHeader } from './MassdriverHeader';

/**
 * Wraps every embedded Massdriver view: owns theme-mode state, applies the
 * Massdriver theme scope, and renders the dummy header above the routed
 * content. Fills the Backstage content area (the page uses `noHeader`).
 *
 * @public
 */
export const MassdriverShell = ({ children }: { children: ReactNode }) => (
  <ThemeModeProvider>
    <MassdriverThemeScope>
      <ShellRoot>
        <MassdriverHeader />
        <ShellContent>{children}</ShellContent>
      </ShellRoot>
    </MassdriverThemeScope>
  </ThemeModeProvider>
);

const ShellRoot = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  flexDirection: 'column',
  // The Backstage sidebar layout gives its content full viewport height with
  // no top bar, so fill the viewport and let the content region scroll.
  height: '100vh',
  minHeight: 0,
  overflow: 'hidden',
  backgroundColor: theme.palette.background.default,
  color: theme.palette.text.primary,
}));

const ShellContent = stylin(Box)({
  flex: 1,
  minHeight: 0,
  overflow: 'auto',
});
