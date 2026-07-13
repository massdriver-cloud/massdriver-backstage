import Box from '@massdriver/ui/Box';
import stylin from '@massdriver/ui/stylin';
import { ReactNode } from 'react';

// Ported from apps/web/shared/components/SettingsTabLayout.js. The plugin can't
// import the web app's shared components, so this is a local, faithful copy used
// by the resource detail tabs (Usage, Permissions).
export const SettingsTabLayout = ({ children }: { children: ReactNode }) => (
  <Wrapper>{children}</Wrapper>
);

export default SettingsTabLayout;

const Wrapper = stylin(Box)(({ theme }: { theme: any }) => ({
  padding: theme.spacing(4),
  maxWidth: theme.spacing(160),
  marginLeft: 'auto',
  marginRight: 'auto',
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(3),
}));
