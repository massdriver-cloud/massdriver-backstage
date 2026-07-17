import Box from '@massdriver/ui/Box';
import stylin from '@massdriver/ui/stylin';
import { ReactNode } from 'react';

export const RepoTabLayout = ({ children }: { children: ReactNode }) => (
  <Wrapper>{children}</Wrapper>
);

export default RepoTabLayout;

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
