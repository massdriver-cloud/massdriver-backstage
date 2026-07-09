import { useState } from 'react';
import Box from '@massdriver/ui/Box';
import Chip from '@massdriver/ui/Chip';
import Divider from '@massdriver/ui/Divider';
import Skeleton from '@massdriver/ui/Skeleton';
import Typography from '@massdriver/ui/Typography';
import IconTile from '@massdriver/ui/IconTile';
import stylin from '@massdriver/ui/stylin';
import { useLiveRelayQuery } from '../realtime/useLiveRelayQuery';
import InstanceStatusPill from '../../../components/InstanceStatusPill';
import VersionBadge from '../../../components/VersionBadge';
import ExpandableHandleWrapper from './handles/ExpandableHandleWrapper';
import NodeVersionBadges from './NodeVersionBadges';
import NodeViewersBadge from './NodeViewersBadge';
import NodeMeta from './NodeMeta';
import hasUndeployedPlan from './hasUndeployedPlan';
import { NODE_META_QUERY, type NodeMetaResult } from './queries';
import { NODE_WIDTH, NODE_HEIGHT } from './DiagramNode.constants';
import type { DiagramNodeData } from './diagramFactory';

/** React Flow node: an instance card with live per-node metadata. */
const DiagramNode = ({
  id: nodeId,
  data,
}: {
  id: string;
  data: DiagramNodeData;
}) => {
  const {
    name,
    icon,
    version,
    status,
    ociRepoName,
    isSelected,
    fullInstanceId,
    dependencyHandles = [],
    resourceHandles = [],
  } = data;

  // Live query: cost, alarm dot, and upgrade/redeploy/drift badges refresh on
  // realtime events (with the node kept rendered — no skeleton flash).
  const {
    value: meta,
    loading,
    error,
  } = useLiveRelayQuery<NodeMetaResult>(
    NODE_META_QUERY,
    fullInstanceId ? { id: fullInstanceId } : null,
  );

  const instance = meta?.instance ?? null;
  const undeployedPlan = hasUndeployedPlan({
    instanceParams: instance?.params,
    latestProvisionParams: meta?.latestProvision?.items?.[0]?.params,
  });

  const [isHovering, setIsHovering] = useState(false);
  const isOpen = isHovering || Boolean(isSelected);
  const loadingMeta = loading && !instance;
  const metaError = error && !instance ? error : null;

  return (
    <NodeContainer
      isSelected={isSelected}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <NodeViewersBadge nodeId={nodeId} />
      <NodeSection>
        <Row>
          <NameRow>
            {icon && <IconTile svg={icon} alt={name} size="small" />}
            <Name title={name}>{name}</Name>
            {version && <VersionBadge version={version} showPinnedWarning />}
          </NameRow>
          {metaError ? (
            <MetaErrorPill label="error" size="small" />
          ) : (
            status && <InstanceStatusPill status={status} size="small" />
          )}
        </Row>
        <Row>
          {ociRepoName ? (
            <Type title={ociRepoName}>{ociRepoName}</Type>
          ) : (
            <span />
          )}
          {metaError ? null : loadingMeta ? (
            <Skeleton variant="rounded" width={64} height={20} />
          ) : (
            <NodeVersionBadges
              availableUpgrade={instance?.availableUpgrade}
              deployedVersion={instance?.deployedVersion}
              resolvedVersion={instance?.resolvedVersion}
              hasUndeployedPlan={undeployedPlan}
            />
          )}
        </Row>
      </NodeSection>
      <Divider />
      {metaError ? (
        <MetaErrorWrap>
          <Typography variant="caption" color="error">
            Failed to load instance details
          </Typography>
        </MetaErrorWrap>
      ) : loadingMeta ? (
        <MetaLoading>
          <Skeleton variant="text" width="80%" />
          <Skeleton variant="text" width="60%" />
        </MetaLoading>
      ) : (
        <NodeMeta
          alarms={instance?.alarms}
          cost={instance?.cost}
          updatedAt={instance?.updatedAt}
        />
      )}
      <ExpandableHandleWrapper
        type="target"
        placement="left"
        handles={dependencyHandles}
        nodeId={nodeId}
        isOpen={isOpen}
      />
      <ExpandableHandleWrapper
        type="source"
        placement="right"
        handles={resourceHandles}
        nodeId={nodeId}
        isOpen={isOpen}
      />
    </NodeContainer>
  );
};

export default DiagramNode;

const NodeContainer = stylin(Box, ['isSelected'])(
  ({ theme, isSelected }: { theme: any; isSelected?: boolean }) => ({
    position: 'relative',
    padding: theme.spacing(2),
    border: `2px solid ${
      isSelected ? theme.palette.primary.dark : theme.palette.grey[400]
    }`,
    borderRadius: theme.custom.general.borderRadiusLg,
    backgroundColor: theme.palette.background.paper,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
    cursor: 'pointer',
  }),
);

const NodeSection = stylin(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: 0.5,
  minWidth: 0,
});

const Row = stylin(Box)({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  minWidth: 0,
});

const NameRow = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: theme.spacing(0.75),
  minWidth: 0,
  flex: 1,
}));

const Name = stylin(Typography)(({ theme }: { theme: any }) => ({
  color: theme.palette.text.primary,
  fontSize: theme.typography.pxToRem(18),
  fontWeight: 600,
  fontStyle: 'normal',
  lineHeight: 'normal',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  minWidth: 0,
}));

const Type = stylin(Typography)(({ theme }: { theme: any }) => ({
  color: theme.palette.text.secondary,
  fontSize: theme.typography.body2.fontSize,
  fontWeight: 300,
  fontStyle: 'normal',
  lineHeight: 'normal',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  minWidth: 0,
}));

const MetaErrorPill = stylin(Chip)(({ theme }: { theme: any }) => ({
  height: 'auto',
  fontSize: theme.typography.pxToRem(11),
  fontWeight: theme.typography.fontWeightMedium,
  letterSpacing: '0.3px',
  textTransform: 'lowercase',
  color: theme.palette.error.main,
  backgroundColor: `${theme.palette.error.main}1f`,
  border: `1px solid ${theme.palette.error.main}33`,
  '& .MuiChip-label': {
    textTransform: 'lowercase',
  },
}));

const MetaErrorWrap = stylin(Box)({
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 0,
});

const MetaLoading = stylin(Box)(({ theme }: { theme: any }) => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  gap: theme.spacing(0.5),
}));
