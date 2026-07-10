import { useMemo, useState } from 'react';
import Box from '@massdriver/ui/Box';
import Typography from '@massdriver/ui/Typography';
import Button from '@massdriver/ui/Button';
import Tooltip from '@massdriver/ui/Tooltip';
import CopyButton from '@massdriver/ui/CopyButton';
import Select, { MenuItem } from '@massdriver/ui/Select';
import stylin from '@massdriver/ui/stylin';
import { alpha } from '@massdriver/ui/theme';
import CompareArrowsIcon from '@massdriver/ui/icons/CompareArrowsIcon';
import FilterListIcon from '@massdriver/ui/icons/FilterListIcon';
import SortIcon from '@massdriver/ui/icons/SortIcon';
import { useLiveRelayQuery } from '../../realtime/useLiveRelayQuery';
import InstanceStatusPill from '../../components/InstanceStatusPill';
import { composeInstanceStatus } from '../../../../utils/instanceStatuses';
import VersionBadge from '../../../../components/VersionBadge';
import CompareDeploymentsDialog from '../../CompareDeploymentsDialog';
import { TabState } from '../TabState';
import { HISTORY_QUERY } from '../queries';
import {
  formatDeploymentStatus,
  formatElapsed,
  deploymentHasLogs,
  formatRelativeTime,
  parsePlanMessage,
  parseRollbackMessage,
  stripMessageContext,
  truncateDeploymentId,
} from '../helpers';
import type { Deployment, HistoryInstance } from '../types';
import ViewDeploymentDetails from './ViewDeploymentDetails';
import { useOpenLogs } from './DeploymentLogsPanel';
import {
  DisabledApprovalCluster,
  LogsButton,
} from './DeploymentReadOnlyActions';

// --- Sort + filter controls (ported verbatim from the web app's
// historyControls.js). Centralised so label rendering and the DeploymentsSort
// input mapping stay in lockstep. ------------------------------------------

const SORT_OPTIONS = [
  { value: 'UPDATED_AT_DESC', label: 'Recently active first' },
  { value: 'UPDATED_AT_ASC', label: 'Least recently active first' },
  { value: 'STATUS_ASC', label: 'Status (A–Z)' },
];

const DEFAULT_SORT_VALUE = 'UPDATED_AT_DESC';

const sortValueToInput = (value: string) => {
  switch (value) {
    case 'UPDATED_AT_ASC':
      return { field: 'UPDATED_AT', order: 'ASC' };
    case 'STATUS_ASC':
      return { field: 'STATUS', order: 'ASC' };
    case 'UPDATED_AT_DESC':
    default:
      return { field: 'UPDATED_AT', order: 'DESC' };
  }
};

const ACTION_OPTIONS = [
  { value: 'ALL', label: 'All actions' },
  { value: 'PROVISION', label: 'Provision' },
  { value: 'DECOMMISSION', label: 'Decommission' },
  { value: 'PLAN', label: 'Plan' },
];

const DEFAULT_ACTION_VALUE = 'ALL';

interface HistoryResult {
  deployments: { items?: (Deployment | null)[] | null } | null;
  instance: HistoryInstance | null;
}

/**
 * Read-only History tab: the web app's deployment history, faithfully ported.
 * Mutations (approve/reject/plan/rollback) render as disabled `DisabledAction`
 * controls; logs link out to Massdriver. Compare + per-row detail panels are
 * driven by local state (the drawer uses `?tab=`, not URL dialog params).
 */
export const HistoryTab = ({ instanceId }: { instanceId: string | null }) => {
  const openLogs = useOpenLogs();
  const [sortValue, setSortValue] = useState(DEFAULT_SORT_VALUE);
  const [actionFilter, setActionFilter] = useState(DEFAULT_ACTION_VALUE);
  const [selectedDeploymentId, setSelectedDeploymentId] = useState<
    string | null
  >(null);
  const [compareOpen, setCompareOpen] = useState(false);

  // Live query: realtime revision bumps keep the rendered list mounted;
  // changing instance/filter/sort resets to a fresh loading state.
  const { value, loading, error } = useLiveRelayQuery<HistoryResult>(
    HISTORY_QUERY,
    instanceId
      ? {
          instanceId,
          filter: {
            instanceId: { eq: instanceId },
            ...(actionFilter !== 'ALL' && { action: { eq: actionFilter } }),
          },
          sort: sortValueToInput(sortValue),
        }
      : null,
  );

  const items = useMemo(
    () => (value?.deployments?.items ?? []).filter(Boolean) as Deployment[],
    [value],
  );
  const instance = value?.instance ?? null;
  const canCompare = items.length >= 2;

  const showInitializedRow = Boolean(instance) && actionFilter === 'ALL';

  return (
    <>
      <Root>
        <TitleRow>
          <Typography variant="subtitle1">Deployments</Typography>
          <Tooltip
            title={
              canCompare ? '' : 'You need at least 2 deployments to compare.'
            }
            arrow
            placement="top"
          >
            <CompareButtonWrap>
              <Button
                variant="outlined"
                size="small"
                startIcon={<CompareArrowsIcon />}
                disabled={!canCompare}
                onClick={() => setCompareOpen(true)}
              >
                Compare deployments
              </Button>
            </CompareButtonWrap>
          </Tooltip>
        </TitleRow>

        <ControlRow>
          <ControlGroup>
            <FilterListIcon fontSize="small" />
            <ControlSelect
              value={actionFilter}
              onChange={(event: any) => setActionFilter(event.target.value)}
              size="small"
              variant="standard"
              disableUnderline
              aria-label="Filter by action"
            >
              {ACTION_OPTIONS.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </ControlSelect>
          </ControlGroup>
          <ControlGroup>
            <SortIcon fontSize="small" />
            <ControlSelect
              value={sortValue}
              onChange={(event: any) => setSortValue(event.target.value)}
              size="small"
              variant="standard"
              disableUnderline
              aria-label="Sort deployments"
            >
              {SORT_OPTIONS.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </ControlSelect>
          </ControlGroup>
        </ControlRow>

        <TabState loading={loading} error={error}>
          {items.length === 0 && !showInitializedRow ? (
            <EmptyNote>No deployments for this instance yet.</EmptyNote>
          ) : (
            <List>
              {items.map(deployment => (
                <DeploymentRow
                  key={deployment.id}
                  deployment={deployment}
                  onViewLogs={openLogs}
                  onShowDetails={setSelectedDeploymentId}
                />
              ))}
              {showInitializedRow ? (
                <InitializedRow>
                  <RowA>
                    <InstanceStatusPill status="INITIALIZED" />
                    <RowSpacer />
                  </RowA>
                  <Tooltip
                    title="When this instance was added to the environment"
                    arrow
                    placement="bottom"
                  >
                    <RowB variant="caption">
                      Added to{' '}
                      <strong>
                        {instance?.environment?.name ?? 'environment'}
                      </strong>{' '}
                      {formatRelativeTime(instance?.createdAt)}
                    </RowB>
                  </Tooltip>
                </InitializedRow>
              ) : null}
            </List>
          )}
        </TabState>
      </Root>

      <ViewDeploymentDetails
        deploymentId={selectedDeploymentId}
        onClose={() => setSelectedDeploymentId(null)}
        onShowSource={setSelectedDeploymentId}
      />
      <CompareDeploymentsDialog
        open={compareOpen}
        onClose={() => setCompareOpen(false)}
        instanceId={instanceId}
      />
    </>
  );
};

export default HistoryTab;

const DeploymentRow = ({
  deployment,
  onViewLogs,
  onShowDetails,
}: {
  deployment: Deployment;
  onViewLogs: (id: string) => void;
  onShowDetails: (id: string) => void;
}) => {
  const statusLabel = formatDeploymentStatus(
    deployment.action,
    deployment.status,
  );
  const elapsed = formatElapsed(deployment.elapsedTime);
  const time = formatRelativeTime(
    deployment.lastTransitionedAt ?? deployment.createdAt,
  );
  const deployedBy = deployment.deployedBy ?? 'system';
  const truncated = truncateDeploymentId(deployment.id);

  const isProposed = deployment.status === 'PROPOSED';

  const planSource =
    deployment.action === 'PLAN' ? parsePlanMessage(deployment.message) : null;
  const rollbackSource = parseRollbackMessage(deployment.message);
  const displayMessage = stripMessageContext(deployment.message);

  return (
    <Row>
      <RowA>
        <InstanceStatusPill
          status={composeInstanceStatus(deployment.action, deployment.status)}
          onClick={() => onViewLogs(deployment.id)}
        />
        {deployment.version ? (
          <VersionBadge version={deployment.version} />
        ) : null}
        {rollbackSource ? <RollbackTag>Rollback</RollbackTag> : null}
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
        <DetailsButton
          variant="text"
          size="small"
          onClick={() => onShowDetails(deployment.id)}
        >
          View details
        </DetailsButton>
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

      {planSource ? (
        <>
          <SourceLink
            variant="text"
            size="small"
            onClick={() => onShowDetails(planSource.sourceId)}
          >
            Planned deployment of {truncateDeploymentId(planSource.sourceId)}
          </SourceLink>
          {displayMessage ? (
            <Message title={displayMessage}>"{displayMessage}"</Message>
          ) : null}
        </>
      ) : rollbackSource ? (
        <>
          <SourceLink
            variant="text"
            size="small"
            onClick={() => onShowDetails(rollbackSource.sourceId)}
          >
            {isProposed
              ? 'Proposed rollback to deployment'
              : 'Rollback to deployment'}{' '}
            {truncateDeploymentId(rollbackSource.sourceId)}
            {rollbackSource.version ? ` (v${rollbackSource.version})` : ''}
          </SourceLink>
          {displayMessage ? (
            <Message title={displayMessage}>"{displayMessage}"</Message>
          ) : null}
        </>
      ) : displayMessage ? (
        <Message title={displayMessage}>"{displayMessage}"</Message>
      ) : null}

      <Footer>
        {isProposed ? (
          <DisabledApprovalCluster />
        ) : deploymentHasLogs(deployment.status) ? (
          <LogsButton onClick={() => onViewLogs(deployment.id)} />
        ) : null}
      </Footer>
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
  gap: theme.spacing(1),
  flexWrap: 'wrap',
  paddingBottom: theme.spacing(1),
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const CompareButtonWrap = stylin('span')({
  display: 'inline-flex',
});

const ControlRow = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  flexWrap: 'wrap',
  paddingBottom: theme.spacing(0.5),
}));

const ControlGroup = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.75),
  color: theme.palette.text.secondary,
  '& > svg': {
    color: theme.palette.text.disabled,
  },
}));

const ControlSelect = stylin(Select)(({ theme }: { theme: any }) => ({
  '& .MuiSelect-select': {
    fontSize: theme.typography.body2.fontSize,
    padding: theme.spacing(0.25, 0.5),
    paddingRight: `${theme.spacing(3)} !important`,
    color: theme.palette.text.primary,
  },
  '&:hover': {
    color: theme.palette.primary.main,
  },
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

const DetailsButton = stylin(Button)(({ theme }: { theme: any }) => ({
  flexShrink: 0,
  padding: theme.spacing(0.25, 1),
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

const SourceLink = stylin(Button)(({ theme }: { theme: any }) => ({
  alignSelf: 'flex-start',
  padding: theme.spacing(0.25, 1),
  marginLeft: theme.spacing(-1),
}));

const Footer = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  justifyContent: 'flex-end',
  alignItems: 'center',
  gap: theme.spacing(1),
  marginTop: theme.spacing(0.25),
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

const InitializedRow = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.5),
  padding: theme.spacing(1.25, 1.5),
  borderRadius: 1,
  border: `1px dashed ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  minWidth: 0,
}));
