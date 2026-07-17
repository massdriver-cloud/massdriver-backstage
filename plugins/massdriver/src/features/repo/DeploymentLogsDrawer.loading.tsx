import Box from '@massdriver/ui/Box';
import Skeleton from '@massdriver/ui/Skeleton';
import stylin from '@massdriver/ui/stylin';

export const DeploymentLogsDrawerLoading = () => (
  <Root>
    <Header>
      <HeaderText>
        <Skeleton variant="text" width={140} height={24} />
        <Skeleton variant="text" width={220} height={16} />
      </HeaderText>
      <Skeleton variant="circular" width={36} height={36} />
      <Skeleton variant="circular" width={36} height={36} />
    </Header>
    <Body>
      <Skeleton variant="rounded" height="100%" />
    </Body>
  </Root>
);

export default DeploymentLogsDrawerLoading;

const Root = stylin(Box)({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  width: '100%',
});

const Header = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(1.5, 2),
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const HeaderText = stylin(Box)({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
});

const Body = stylin(Box)(({ theme }: { theme: any }) => ({
  flex: 1,
  padding: theme.spacing(2),
  minHeight: 0,
}));
