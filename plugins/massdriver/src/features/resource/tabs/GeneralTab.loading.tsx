import Box from '@massdriver/ui/Box';
import Skeleton from '@massdriver/ui/Skeleton';
import Typography from '@massdriver/ui/Typography';
import stylin from '@massdriver/ui/stylin';

const SkeletonRow = ({ valueWidth = '60%' }: { valueWidth?: string }) => (
  <KeyValueRowBox>
    <Skeleton variant="text" width="55%" />
    <Skeleton variant="text" width={valueWidth} />
  </KeyValueRowBox>
);

export const GeneralTabLoading = () => (
  <>
    <MetaGrid>
      <Card>
        <CardTitle>Identifiers</CardTitle>
        <KeyValueList>
          <SkeletonRow valueWidth="95%" />
          <SkeletonRow valueWidth="55%" />
        </KeyValueList>
      </Card>
      <Card>
        <CardTitle>Origin</CardTitle>
        <KeyValueList>
          <SkeletonRow valueWidth="30%" />
          <SkeletonRow valueWidth="50%" />
          <SkeletonRow valueWidth="65%" />
        </KeyValueList>
      </Card>
      <Card>
        <CardTitle>Timeline</CardTitle>
        <KeyValueList>
          <SkeletonRow valueWidth="35%" />
          <SkeletonRow valueWidth="30%" />
        </KeyValueList>
      </Card>
    </MetaGrid>

    <Card>
      <CardTitle>Payload</CardTitle>
      <Skeleton variant="rounded" width="100%" height={140} />
    </Card>
  </>
);

export default GeneralTabLoading;

const MetaGrid = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: theme.spacing(2),
  alignItems: 'stretch',
}));

const Card = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1.5),
  padding: theme.spacing(2.5),
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 1,
}));

const CardTitle = stylin(Typography)(({ theme }: { theme: any }) => ({
  fontSize: '0.6875rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: theme.palette.text.secondary,
}));

const KeyValueList = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.75),
}));

const KeyValueRowBox = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'grid',
  gridTemplateColumns: `${theme.spacing(10)} 1fr`,
  gap: theme.spacing(1.5),
  alignItems: 'center',
}));
