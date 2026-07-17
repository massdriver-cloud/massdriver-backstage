import { parseInstanceId } from '@massdriver/backstage-plugin-common';
import Box from '@massdriver/ui/Box';
import Typography from '@massdriver/ui/Typography';
import stylin from '@massdriver/ui/stylin';
import { InstanceStatusPill } from '../../../components/InstanceStatusPill';
import { RouterLinkAdapter } from '../../../components/RouterLinkAdapter';
import VersionBadge from '../../../components/VersionBadge';
import { formatRelativeTime } from '../../../utils/formatRelativeTime';
import { internalRoutes } from '../../../internalRoutes';
import type { RepoInstance } from '../types';
import { formatCost } from './InstancesTab.helpers';

export const InstanceRow = ({ instance }: { instance: RepoInstance }) => {
  const { projectId, scopedEnvironmentId, scopedComponentId } = parseInstanceId(
    instance.id,
  );
  const href = internalRoutes.instance(
    projectId,
    scopedEnvironmentId,
    scopedComponentId,
  );
  const projectName = instance.component?.project?.name ?? '—';
  const environmentName = instance.environment?.name ?? '—';
  const displayVersion =
    instance.deployedVersion ?? instance.resolvedVersion ?? instance.version;
  const cost = formatCost(instance.cost?.lastMonth, { fallback: null });
  const updated = formatRelativeTime(instance.updatedAt);

  return (
    <Card component={RouterLinkAdapter} href={href}>
      <Header>
        <InstanceStatusPill status={instance.status} />
        <Name title={instance.id}>{instance.id}</Name>
        {displayVersion ? <VersionBadge version={displayVersion} /> : null}
      </Header>
      <Meta variant="caption">
        <Group>
          <strong>{projectName}</strong>
          <Sep>/</Sep>
          <span>{environmentName}</span>
        </Group>
        <Dot>·</Dot>
        <span>Updated {updated}</span>
        {cost ? (
          <>
            <Dot>·</Dot>
            <CostText>{cost} last month</CostText>
          </>
        ) : null}
      </Meta>
    </Card>
  );
};

export default InstanceRow;

const Card = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.5),
  padding: theme.spacing(1.25, 1.5),
  borderRadius: 1,
  border: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  color: 'inherit',
  textDecoration: 'none',
  transition: 'background-color 120ms ease, border-color 120ms ease',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
    borderColor: theme.palette.divider,
  },
  '&:focus-visible': {
    outline: `2px solid ${theme.palette.primary.main}`,
    outlineOffset: 2,
  },
}));

const Header = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  flexWrap: 'wrap',
  minWidth: 0,
}));

const Name = stylin(Typography)(({ theme }: { theme: any }) => ({
  fontSize: theme.typography.pxToRem(14),
  fontWeight: 600,
  color: theme.palette.text.primary,
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  flex: '1 1 auto',
}));

const Meta = stylin(Typography)(({ theme }: { theme: any }) => ({
  color: theme.palette.text.secondary,
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  minWidth: 0,
}));

const Group = stylin('span')(({ theme }: { theme: any }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  minWidth: 0,
  color: theme.palette.text.secondary,
  '& strong': {
    color: theme.palette.text.primary,
    fontWeight: 500,
  },
}));

const Sep = stylin('span')(({ theme }: { theme: any }) => ({
  color: theme.palette.text.disabled,
}));

const Dot = stylin('span')(({ theme }: { theme: any }) => ({
  color: theme.palette.text.disabled,
}));

const CostText = stylin('span')({
  fontVariantNumeric: 'tabular-nums',
});
