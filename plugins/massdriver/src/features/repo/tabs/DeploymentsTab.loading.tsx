import Box from '@massdriver/ui/Box';
import Skeleton from '@massdriver/ui/Skeleton';
import stylin from '@massdriver/ui/stylin';

// Ported from the Massdriver web app
const ROW_COUNT = 4;

export const DeploymentsTabLoading = () => (
  <List>
    {Array.from({ length: ROW_COUNT }).map((_, index) => (
      <RowSkeleton key={index}>
        <Skeleton variant="circular" width={18} height={18} />
        <Skeleton variant="text" width={80} />
        <Skeleton variant="rounded" width={60} height={20} />
        <Spacer />
        <Skeleton variant="text" width={80} />
        <Sub>
          <Skeleton variant="text" width="40%" />
        </Sub>
      </RowSkeleton>
    ))}
  </List>
);

export default DeploymentsTabLoading;

const List = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1.5),
}));

const RowSkeleton = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'grid',
  gridTemplateColumns: 'auto auto auto 1fr auto',
  alignItems: 'center',
  rowGap: theme.spacing(0.5),
  columnGap: theme.spacing(1),
  padding: theme.spacing(1.5),
  borderRadius: 1,
  border: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
}));

const Spacer = stylin(Box)({});

const Sub = stylin(Box)({
  gridColumn: '1 / -1',
});
