import Box from '@massdriver/ui/Box';
import stylin from '@massdriver/ui/stylin';
import { ReactNode } from 'react';
import { MassdriverThemeScope } from '../theme/MassdriverThemeScope';
import { MassdriverHeader } from './MassdriverHeader';

/** @public */
export const MassdriverShell = ({ children }: { children: ReactNode }) => (
  <MassdriverThemeScope>
    <ShellRoot>
      <MassdriverHeader />
      <ShellContent>{children}</ShellContent>
    </ShellRoot>
  </MassdriverThemeScope>
);

const ShellRoot = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  flexDirection: 'column',
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
