import Box from '@massdriver/ui/Box';
import Skeleton from '@massdriver/ui/Skeleton';
import stylin from '@massdriver/ui/stylin';

// Ported from the Massdriver web app
const ROW_COUNT = 4;

export const InstancesTabLoading = () => (
  <List>
    {Array.from({ length: ROW_COUNT }).map((_, index) => (
      <RowSkeleton key={index}>
        <Skeleton variant="rounded" width={72} height={20} />
        <Skeleton variant="text" width="30%" />
        <Skeleton variant="rounded" width={60} height={20} />
        <Spacer />
        <Skeleton variant="text" width={80} />
      </RowSkeleton>
    ))}
  </List>
);

export default InstancesTabLoading;

const List = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1.5),
}));

const RowSkeleton = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(1.5),
  borderRadius: 1,
  border: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
}));

const Spacer = stylin(Box)({
  flex: 1,
});
