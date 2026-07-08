import { useApi } from '@backstage/frontend-plugin-api';
import Box from '@massdriver/ui/Box';
import Typography from '@massdriver/ui/Typography';
import Tooltip from '@massdriver/ui/Tooltip';
import CopyButton from '@massdriver/ui/CopyButton';
import stylin from '@massdriver/ui/stylin';
import { alpha, deploymentStatusColors } from '@massdriver/ui/theme';
import useAsync from 'react-use/esm/useAsync';
import { massdriverApiRef } from '../../../../api';
import VersionBadge from '../../../../components/VersionBadge';
import { TabState } from '../TabState';
import { HISTORY_QUERY } from '../queries';
import {
  formatDeploymentStatus,
  formatElapsed,
  formatRelativeTime,
  isRollback,
  stripMessageContext,
  truncateDeploymentId,
} from '../helpers';
import type { Deployment } from '../types';

/**
 * Read-only History tab: reverse-chronological deployment list. The web app's
 * approve/reject/plan/rollback actions, compare dialog, and logs/details
 * dialogs are all dropped.
 */
export const HistoryTab = ({ instanceId }: { instanceId: string | null }) => {
  const api = useApi(massdriverApiRef);
  const { value, loading, error } = useAsync(async () => {
    if (!instanceId) return [];
    const data = (await api.query(HISTORY_QUERY, {
      filter: { instanceId: { eq: instanceId } },
    })) as { deployments: { items?: (Deployment | null)[] | null } | null };
    return (data.deployments?.items ?? []).filter(Boolean) as Deployment[];
  }, [api, instanceId]);

  const items = value ?? [];

  return (
    <TabState loading={loading} error={error}>
      <Root>
        <TitleRow>
          <Typography variant="subtitle1">Deployments</Typography>
        </TitleRow>
        {items.length === 0 ? (
          <EmptyNote>No deployments for this instance yet.</EmptyNote>
        ) : (
          <List>
            {items.map(deployment => (
              <DeploymentRow key={deployment.id} deployment={deployment} />
            ))}
          </List>
        )}
      </Root>
    </TabState>
  );
};

export default HistoryTab;

const DeploymentRow = ({ deployment }: { deployment: Deployment }) => {
  const statusLabel = formatDeploymentStatus(deployment.action, deployment.status);
  const elapsed = formatElapsed(deployment.elapsedTime);
  const time = formatRelativeTime(
    deployment.lastTransitionedAt ?? deployment.createdAt,
  );
  const deployedBy = deployment.deployedBy ?? 'system';
  const truncated = truncateDeploymentId(deployment.id);
  const rollback = isRollback(deployment.message);
  const displayMessage = stripMessageContext(deployment.message);
  const statusColor =
    (deployment.status && (deploymentStatusColors as any)[deployment.status]) || null;

  return (
    <Row>
      <RowA>
        <StatusChip statusColor={statusColor}>{statusLabel}</StatusChip>
        {deployment.version ? <VersionBadge version={deployment.version} /> : null}
        {rollback ? <RollbackTag>Rollback</RollbackTag> : null}
        <RowSpacer />
        <Tooltip
          arrow
          placement="top"
          title={
            <IdTooltip>
              <IdTooltipText>{deployment.id}</IdTooltipText>
              <CopyButton text={deployment.id} ariaLabel="Copy deployment ID" />
            </IdTooltip>
          }
        >
          <DeploymentIdText>{truncated}</DeploymentIdText>
        </Tooltip>
      </RowA>
      <RowB variant="caption">
        <span>{statusLabel}</span>
        <MetaSep>·</MetaSep>
        <span>{time}</span>
        {elapsed ? (
          <>
            <MetaSep>·</MetaSep>
            <span>{elapsed}</span>
          </>
        ) : null}
        <MetaSep>·</MetaSep>
        <strong>{deployedBy}</strong>
      </RowB>
      {displayMessage ? (
        <Message title={displayMessage}>"{displayMessage}"</Message>
      ) : null}
    </Row>
  );
};

const Root = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
  padding: theme.spacing(1),
}));

const TitleRow = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingBottom: theme.spacing(1),
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const List = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
}));

const EmptyNote = stylin(Typography)(({ theme }: { theme: any }) => ({
  fontSize: theme.typography.pxToRem(12),
  color: theme.palette.text.secondary,
  fontStyle: 'italic',
}));

const Row = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.5),
  padding: theme.spacing(1.25, 1.5),
  borderRadius: 1,
  border: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  minWidth: 0,
}));

const RowA = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  flexWrap: 'wrap',
  minWidth: 0,
}));

const RowSpacer = stylin(Box)({ flex: 1 });

const StatusChip = stylin(
  Box,
  ['statusColor'],
)(({ theme, statusColor }: { theme: any; statusColor: string | null }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  fontSize: theme.typography.pxToRem(11),
  fontWeight: theme.typography.fontWeightMedium,
  textTransform: 'lowercase',
  letterSpacing: '0.3px',
  padding: theme.spacing(0.25, 0.75),
  borderRadius: 1,
  color: statusColor ?? theme.palette.text.secondary,
  backgroundColor: statusColor ? `${statusColor}1f` : theme.palette.action.hover,
  border: `1px solid ${statusColor ? `${statusColor}33` : theme.palette.divider}`,
}));

const IdTooltip = stylin('span')(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
}));

const IdTooltipText = stylin('span')(({ theme }: { theme: any }) => ({
  fontFamily: theme.typography.fontFamilyMono,
  fontSize: theme.typography.pxToRem(12),
  wordBreak: 'break-all',
}));

const DeploymentIdText = stylin('span')(({ theme }: { theme: any }) => ({
  fontFamily: theme.typography.fontFamilyMono,
  fontSize: theme.typography.caption.fontSize,
  color: theme.palette.text.secondary,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  maxWidth: theme.spacing(20),
}));

const RowB = stylin(Typography)(({ theme }: { theme: any }) => ({
  color: theme.palette.text.secondary,
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: theme.spacing(0.5),
}));

const MetaSep = stylin('span')(({ theme }: { theme: any }) => ({
  color: theme.palette.text.disabled,
}));

const Message = stylin(Typography)(({ theme }: { theme: any }) => ({
  fontStyle: 'italic',
  fontSize: theme.typography.caption.fontSize,
  color: theme.palette.text.secondary,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}));

const RollbackTag = stylin('span')(({ theme }: { theme: any }) => ({
  fontSize: theme.typography.caption.fontSize,
  fontWeight: theme.typography.fontWeightBold,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  lineHeight: 1.4,
  padding: theme.spacing(0.125, 0.75),
  borderRadius: 1,
  color: theme.palette.warning.main,
  backgroundColor: alpha(theme.palette.warning.main, 0.12),
  border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
}));
