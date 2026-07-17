import { useMemo } from 'react';
import { useApi } from '@backstage/frontend-plugin-api';
import useAsync from 'react-use/esm/useAsync';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogHeader,
} from '@massdriver/ui/Dialog';
import Box from '@massdriver/ui/Box';
import Typography from '@massdriver/ui/Typography';
import Button from '@massdriver/ui/Button';
import IconButton from '@massdriver/ui/IconButton';
import CopyButton from '@massdriver/ui/CopyButton';
import Alert from '@massdriver/ui/Alert';
import LoadingIndicator from '@massdriver/ui/LoadingIndicator';
import DataList, { col } from '@massdriver/ui/DataList';
import stylin from '@massdriver/ui/stylin';
import CloseIcon from '@massdriver/ui/icons/CloseIcon';
import HistoryIcon from '@massdriver/ui/icons/HistoryIcon';
import { massdriverApiRef } from '../../../../api';
import InstanceStatusPill from '../../components/InstanceStatusPill';
import { composeInstanceStatus } from '../../../../utils/instanceStatuses';
import VersionBadge from '../../../../components/VersionBadge';
import ComparisonValueCell from '../../CompareEnvironmentsDialog/ComparisonValueCell';
import { DEPLOYMENT_QUERY } from '../queries';
import {
  formatAbsoluteDateTime,
  formatAttributeValue,
  formatDeploymentStatus,
  formatElapsed,
  deploymentHasLogs,
  formatRelativeTime,
  parseMap,
  parsePlanMessage,
  parseRollbackMessage,
  stripMessageContext,
  truncateDeploymentId,
} from '../helpers';
import type { DeploymentDetail } from '../types';
import flattenParams from './flattenParams';
import { useOpenLogs } from './DeploymentLogsPanel';
import {
  DisabledApprovalCluster,
  DisabledRollbackButton,
  LogsButton,
} from './DeploymentReadOnlyActions';

const renderValueCell = (_value: unknown, row: { value: unknown }) => (
  <ComparisonValueCell
    side={{ present: true, value: row.value }}
    isDifferent={false}
    isMissing={false}
  />
);

const COLUMNS = [
  col.text('path', 'Path', {
    flex: 2,
    minWidth: 200,
    sortable: true,
    searchable: true,
  }),
  col.custom('value', 'Value', renderValueCell, {
    flex: 3,
    minWidth: 220,
    sortable: false,
    searchable: false,
  }),
];

const buildHeading = (
  componentName?: string | null,
  statusLabel?: string,
): string => {
  const verb =
    statusLabel && statusLabel !== '—' ? statusLabel.toLowerCase() : null;
  if (!componentName && !verb) return 'Deployment';
  if (!verb) return `${componentName} deployment`;
  return componentName ? `${componentName} · ${verb}` : verb;
};

export const ViewDeploymentDetails = ({
  deploymentId,
  onClose,
  onShowSource,
}: {
  deploymentId: string | null;
  onClose: () => void;
  onShowSource: (sourceId: string) => void;
}) => {
  const api = useApi(massdriverApiRef);
  const openLogs = useOpenLogs();
  const open = Boolean(deploymentId);

  const { value, loading, error } = useAsync(async () => {
    if (!deploymentId) return null;
    const data = (await api.query(DEPLOYMENT_QUERY, { id: deploymentId })) as {
      deployment: DeploymentDetail | null;
    };
    return data.deployment;
  }, [api, deploymentId]);

  const deployment = value;
  const paramRows = useMemo(
    () => flattenParams(deployment?.params),
    [deployment?.params],
  );

  const statusLabel = formatDeploymentStatus(
    deployment?.action,
    deployment?.status,
  );
  const componentName = deployment?.instance?.component?.name;
  const elapsed = formatElapsed(deployment?.elapsedTime);
  const occurredIso = deployment?.lastTransitionedAt ?? deployment?.createdAt;
  const time = formatRelativeTime(occurredIso);
  const absoluteDate = formatAbsoluteDateTime(occurredIso);
  const deployedBy = deployment?.deployedBy ?? 'system';
  const heading = buildHeading(componentName, statusLabel);

  const planSource =
    deployment?.action === 'PLAN'
      ? parsePlanMessage(deployment?.message)
      : null;
  const rollbackSource = parseRollbackMessage(deployment?.message);
  const displayMessage = stripMessageContext(deployment?.message);
  const isProposed = deployment?.status === 'PROPOSED';
  const isRollbackEligible =
    deployment?.action === 'PROVISION' && deployment?.status === 'COMPLETED';
  const hasLogs = deploymentHasLogs(deployment?.status);

  const handleViewLogs = () => {
    if (!deployment) return;
    onClose();
    openLogs(deployment.id);
  };

  const attributes = parseMap(deployment?.effectiveAttributes);
  const attributeEntries = attributes ? Object.entries(attributes) : [];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogHeader
        icon={<HistoryIcon />}
        actions={
          <IconButton onClick={onClose} aria-label="Close deployment details">
            <CloseIcon />
          </IconButton>
        }
      >
        {heading}
      </DialogHeader>
      <Body>
        {loading ? (
          <Centered>
            <LoadingIndicator />
          </Centered>
        ) : error ? (
          <Alert severity="error">{String(error.message ?? error)}</Alert>
        ) : deployment ? (
          <>
            <SummaryCard>
              <SummaryHeader>
                <SummaryHeaderLeft>
                  <InstanceStatusPill
                    status={composeInstanceStatus(
                      deployment.action,
                      deployment.status,
                    )}
                    onClick={hasLogs ? handleViewLogs : undefined}
                  />
                  {deployment.version ? (
                    <VersionBadge version={deployment.version} />
                  ) : null}
                </SummaryHeaderLeft>
                {isProposed ? (
                  <DisabledApprovalCluster />
                ) : (
                  <HeaderActions>
                    {isRollbackEligible ? <DisabledRollbackButton /> : null}
                    {hasLogs ? <LogsButton onClick={handleViewLogs} /> : null}
                  </HeaderActions>
                )}
              </SummaryHeader>

              <DefList>
                <DefRow>
                  <DefLabel>Status</DefLabel>
                  <DefValue>{statusLabel}</DefValue>
                </DefRow>
                <DefRow>
                  <DefLabel>Occurred</DefLabel>
                  <DefValue>
                    {time}
                    {absoluteDate ? (
                      <DefMuted>{` · ${absoluteDate}`}</DefMuted>
                    ) : null}
                  </DefValue>
                </DefRow>
                <DefRow>
                  <DefLabel>Duration</DefLabel>
                  <DefValue>{elapsed ?? '—'}</DefValue>
                </DefRow>
                <DefRow>
                  <DefLabel>Deployed by</DefLabel>
                  <DefValue>
                    <strong>{deployedBy}</strong>
                  </DefValue>
                </DefRow>
                <DefRow>
                  <DefLabel>Deployment ID</DefLabel>
                  <DefValue>
                    <Mono>{deployment.id}</Mono>
                    <CopyButton
                      text={deployment.id}
                      ariaLabel="Copy deployment ID"
                    />
                  </DefValue>
                </DefRow>
              </DefList>

              {planSource ? (
                <PlanSourceBlock>
                  <PlanSourceLink
                    variant="text"
                    size="small"
                    onClick={() => onShowSource(planSource.sourceId)}
                  >
                    Planned deployment of{' '}
                    {truncateDeploymentId(planSource.sourceId)}
                  </PlanSourceLink>
                  {displayMessage ? (
                    <MessageQuote>"{displayMessage}"</MessageQuote>
                  ) : null}
                </PlanSourceBlock>
              ) : rollbackSource ? (
                <PlanSourceBlock>
                  <PlanSourceLink
                    variant="text"
                    size="small"
                    onClick={() => onShowSource(rollbackSource.sourceId)}
                  >
                    {isProposed
                      ? 'Proposed rollback to deployment'
                      : 'Rollback to deployment'}{' '}
                    {truncateDeploymentId(rollbackSource.sourceId)}
                    {rollbackSource.version
                      ? ` (v${rollbackSource.version})`
                      : ''}
                  </PlanSourceLink>
                  {displayMessage ? (
                    <MessageQuote>"{displayMessage}"</MessageQuote>
                  ) : null}
                </PlanSourceBlock>
              ) : displayMessage ? (
                <MessageQuote>"{displayMessage}"</MessageQuote>
              ) : null}
            </SummaryCard>

            <Section>
              <SectionHeading variant="subtitle1">Attributes</SectionHeading>
              <Card>
                {attributeEntries.length === 0 ? (
                  <EmptyNote>No effective attributes.</EmptyNote>
                ) : (
                  attributeEntries.map(([key, attrValue]) => (
                    <RowLine key={key}>
                      <MonoLabel title={key}>{key}</MonoLabel>
                      <MonoValue title={formatAttributeValue(attrValue)}>
                        {formatAttributeValue(attrValue)}
                      </MonoValue>
                    </RowLine>
                  ))
                )}
              </Card>
            </Section>

            <Section>
              <SectionHeading variant="subtitle1">
                Snapshot params
              </SectionHeading>
              <DataList
                rows={paramRows}
                columns={COLUMNS}
                searchable
                searchPlaceholder="Search path…"
                defaultSort={{ field: 'path', direction: 'asc' }}
                defaultPageSize={5}
                variant="outlined"
                size="small"
                emptyMessage="No parameters captured for this deployment."
              />
            </Section>
          </>
        ) : null}
      </Body>
      <DialogActions>
        <Button variant="contained" onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ViewDeploymentDetails;

const Body = stylin(DialogContent)(({ theme }: { theme: any }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  '& > *': {
    flexShrink: 0,
  },
}));

const Centered = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  justifyContent: 'center',
  padding: theme.spacing(6),
}));

const SummaryCard = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2.5),
  padding: theme.spacing(2.5, 3),
  borderRadius: 1,
  border: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
}));

const SummaryHeader = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: theme.spacing(1.5),
}));

const SummaryHeaderLeft = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: theme.spacing(1.5),
}));

const HeaderActions = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
}));

const DefList = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1.25),
}));

const DefRow = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'grid',
  gridTemplateColumns: `${theme.spacing(18)} 1fr`,
  alignItems: 'center',
  gap: theme.spacing(2),
  [theme.breakpoints.down('sm')]: {
    gridTemplateColumns: '1fr',
    gap: theme.spacing(0.25),
  },
}));

const DefLabel = stylin(Typography)(({ theme }: { theme: any }) => ({
  color: theme.palette.text.secondary,
  fontSize: theme.typography.body2.fontSize,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  fontWeight: theme.typography.fontWeightMedium,
}));

const DefValue = stylin(Typography)(({ theme }: { theme: any }) => ({
  color: theme.palette.text.primary,
  fontSize: theme.typography.body1.fontSize,
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.75),
  minWidth: 0,
}));

const DefMuted = stylin('span')(({ theme }: { theme: any }) => ({
  color: theme.palette.text.secondary,
}));

const Mono = stylin('span')(({ theme }: { theme: any }) => ({
  fontFamily: theme.typography.fontFamilyMono,
  fontSize: theme.typography.body2.fontSize,
  color: theme.palette.text.primary,
  wordBreak: 'break-all',
  minWidth: 0,
}));

const MessageQuote = stylin(Box)(({ theme }: { theme: any }) => ({
  fontStyle: 'italic',
  color: theme.palette.text.secondary,
  borderLeft: `3px solid ${theme.palette.divider}`,
  paddingLeft: theme.spacing(1.5),
  paddingTop: theme.spacing(0.5),
  paddingBottom: theme.spacing(0.5),
}));

const PlanSourceBlock = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
  alignItems: 'flex-start',
}));

const PlanSourceLink = stylin(Button)(({ theme }: { theme: any }) => ({
  alignSelf: 'flex-start',
  padding: theme.spacing(0.25, 1),
  marginLeft: theme.spacing(-1),
}));

const Section = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
}));

const SectionHeading = stylin(Typography)(({ theme }: { theme: any }) => ({
  fontWeight: theme.typography.fontWeightBold,
}));

const Card = stylin(Box)(({ theme }: { theme: any }) => ({
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 1,
  padding: theme.spacing(1),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.5),
  overflow: 'hidden',
}));

const RowLine = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  flexWrap: 'wrap',
  minWidth: 0,
}));

const MonoLabel = stylin(Typography)(({ theme }: { theme: any }) => ({
  fontSize: theme.typography.pxToRem(11),
  color: theme.palette.text.secondary,
  minWidth: 110,
  fontFamily: theme.typography.fontFamilyMono,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}));

const MonoValue = stylin(Typography)(({ theme }: { theme: any }) => ({
  fontSize: theme.typography.pxToRem(12),
  color: theme.palette.text.primary,
  fontFamily: theme.typography.fontFamilyMono,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  flex: 1,
  minWidth: 0,
}));

const EmptyNote = stylin(Typography)(({ theme }: { theme: any }) => ({
  fontSize: theme.typography.pxToRem(12),
  color: theme.palette.text.secondary,
  fontStyle: 'italic',
}));
