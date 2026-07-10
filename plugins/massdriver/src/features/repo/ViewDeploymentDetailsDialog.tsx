import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import Tooltip from '@massdriver/ui/Tooltip';
import IconButton from '@massdriver/ui/IconButton';
import CopyButton from '@massdriver/ui/CopyButton';
import Alert from '@massdriver/ui/Alert';
import LoadingIndicator from '@massdriver/ui/LoadingIndicator';
import DataList, { col } from '@massdriver/ui/DataList';
import stylin from '@massdriver/ui/stylin';
import CloseIcon from '@massdriver/ui/icons/CloseIcon';
import HistoryIcon from '@massdriver/ui/icons/HistoryIcon';
import { massdriverApiRef } from '../../api';
import { InstanceStatusPill } from '../../components/InstanceStatusPill';
import VersionBadge from '../../components/VersionBadge';
import {
  composeInstanceStatus,
  formatInstanceStatus,
  isDeploymentActive,
} from '../../utils/instanceStatuses';
import { formatRelativeTime } from '../../utils/formatRelativeTime';
import { DEPLOYMENT_DETAIL_QUERY } from './queries';
import {
  deploymentHasLogs,
  formatAbsoluteDateTime,
  formatAttributeValue,
  formatElapsed,
  parseMap,
  parsePlanMessage,
  parseRollbackMessage,
  stripMessageContext,
  truncateDeploymentId,
} from './deploymentHelpers';
import flattenParams from './flattenParams';
import type { DeploymentDetail } from './types';

const TRUNCATE_LENGTH = 64;

const formatParamValue = (value: unknown): string => {
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

// Present-value cell mirroring the web dialog's ComparisonValueCell (that
// component lives under features/environment here, which repo code can't
// import — so its read-only rendering is inlined).
const renderValueCell = (_value: unknown, row: { value: unknown }) => {
  const value = row.value;
  if (value == null) return <NullLiteral>null</NullLiteral>;
  const display = formatParamValue(value);
  const truncated = display.length > TRUNCATE_LENGTH;
  const visible = truncated ? `${display.slice(0, TRUNCATE_LENGTH)}…` : display;
  const cell = <ValueText>{visible}</ValueText>;
  return truncated ? (
    <Tooltip title={display} arrow placement="top">
      <span>{cell}</span>
    </Tooltip>
  ) : (
    cell
  );
};

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

const isActiveStatus = (derivedStatus?: string | null): boolean => {
  if (!derivedStatus) return false;
  const [, deploymentStatus] = derivedStatus.split('_');
  return isDeploymentActive(deploymentStatus);
};

// Heading reads as "{component} · {action verb} [time-ago]". Active deployments
// drop the trailing time-ago (it reads oddly for an in-flight thing); terminal
// states keep it. Ported from the web dialog's buildHeading.
const buildHeading = (
  componentName: string | null | undefined,
  derivedStatus: string | null,
  time: string,
): string => {
  const verb = derivedStatus
    ? formatInstanceStatus(derivedStatus).toLowerCase()
    : null;
  if (!componentName && !verb) return 'Deployment';
  if (!verb) return `${componentName} deployment`;
  const tail =
    time && time !== '--' && !isActiveStatus(derivedStatus) ? ` ${time}` : '';
  return componentName ? `${componentName} · ${verb}${tail}` : `${verb}${tail}`;
};

/**
 * In-place deployment details dialog for the repo Deployments tab. Faithful port
 * of apps/web/shared/components/ViewDeploymentDetailsDialog — driven by the same
 * `deployment` URL param the web reads via useDialogParam (mirrored here with
 * react-router's useSearchParams). The web repo page passes
 * `canApprove={false} canPlan={false}` (and no canRollback), under which the web
 * view renders no approve/reject/plan/rollback affordance at all — so none are
 * ported. The status pill and a "View logs" button open the logs drawer (the
 * `logs` param); the plan/rollback source links re-target the `deployment`
 * param, as in the web.
 */
export const ViewDeploymentDetailsDialog = () => {
  const api = useApi(massdriverApiRef);
  const [searchParams, setSearchParams] = useSearchParams();
  const deploymentId = searchParams.get('deployment');
  const open = Boolean(deploymentId);

  const setParam = (key: string, value: string | null) => {
    setSearchParams(
      prev => {
        const next = new URLSearchParams(prev);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: false },
    );
  };

  const onClose = () => setParam('deployment', null);
  const onShowSource = (sourceId: string) => setParam('deployment', sourceId);

  const { value, loading, error } = useAsync(async () => {
    if (!deploymentId) return null;
    const data = (await api.query(DEPLOYMENT_DETAIL_QUERY, {
      id: deploymentId,
    })) as { deployment: DeploymentDetail | null };
    return data.deployment;
  }, [api, deploymentId]);

  const deployment = value;
  const paramRows = useMemo(
    () => flattenParams(deployment?.params),
    [deployment?.params],
  );

  const derivedStatus = composeInstanceStatus(
    deployment?.action,
    deployment?.status,
  );
  const componentName = deployment?.instance?.component?.name;
  const elapsed = formatElapsed(deployment?.elapsedTime);
  const occurredIso = deployment?.lastTransitionedAt ?? deployment?.createdAt;
  const time = formatRelativeTime(occurredIso);
  const absoluteDate = formatAbsoluteDateTime(occurredIso);
  const deployedBy = deployment?.deployedBy ?? 'system';
  const statusLabel = formatInstanceStatus(derivedStatus);
  const heading = buildHeading(componentName, derivedStatus, time);

  const planSource =
    deployment?.action === 'PLAN'
      ? parsePlanMessage(deployment?.message)
      : null;
  const rollbackSource = parseRollbackMessage(deployment?.message);
  const displayMessage = stripMessageContext(deployment?.message);
  const isProposed = deployment?.status === 'PROPOSED';
  const hasLogs = deploymentHasLogs(deployment?.status);

  // Keep the dialog open beneath the logs drawer (which renders above it),
  // matching the web — the drawer's own `logs` param drives it.
  const onViewLogs = () => {
    if (!deployment) return;
    setParam('logs', deployment.id);
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
                    status={derivedStatus}
                    onClick={hasLogs ? onViewLogs : undefined}
                  />
                  {deployment.version ? (
                    <VersionBadge version={deployment.version} />
                  ) : null}
                </SummaryHeaderLeft>
                {hasLogs ? (
                  <HeaderActions>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={onViewLogs}
                    >
                      View logs
                    </Button>
                  </HeaderActions>
                ) : null}
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

export default ViewDeploymentDetailsDialog;

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

const ValueText = stylin(Box)(({ theme }: { theme: any }) => ({
  fontFamily: theme.typography.fontFamilyMono,
  fontSize: theme.typography.caption.fontSize,
  color: theme.palette.text.secondary,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}));

const NullLiteral = stylin(Box)(({ theme }: { theme: any }) => ({
  fontStyle: 'italic',
  color: theme.palette.text.secondary,
  fontFamily: theme.typography.fontFamilyMono,
  fontSize: theme.typography.caption.fontSize,
}));
