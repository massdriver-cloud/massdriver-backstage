import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApi } from '@backstage/frontend-plugin-api';
import useAsync from 'react-use/esm/useAsync';
import Box from '@massdriver/ui/Box';
import Drawer from '@massdriver/ui/Drawer';
import Typography from '@massdriver/ui/Typography';
import Alert from '@massdriver/ui/Alert';
import LogViewer from '@massdriver/ui/LogViewer';
import {
  CloseIconButton,
  InteractiveIconButton,
} from '@massdriver/ui/IconButton';
import DownloadIcon from '@massdriver/ui/icons/DownloadIcon';
import stylin from '@massdriver/ui/stylin';
import { instanceStatusColors, logSurfaceColors } from '@massdriver/ui/theme';
import { massdriverApiRef } from '../../api';
import { composeInstanceStatus } from '../../utils/instanceStatuses';
import { DEPLOYMENT_LOGS_QUERY, DEPLOYMENT_LOGS_SUBSCRIPTION } from './queries';
import {
  composeLogsText,
  formatDeploymentStatus,
  isDeploymentActive,
} from './deploymentHelpers';
import { DeploymentLogsDrawerLoading } from './DeploymentLogsDrawer.loading';
import type { DeploymentLogLine, DeploymentLogs } from './types';
import useMassdriverSubscription from '../../hooks/useMassdriverSubscription';

const downloadLogs = (text: string, deploymentId: string) => {
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `deployment-${deploymentId}.log`;
  link.click();
  URL.revokeObjectURL(url);
};

// Inner content. Mounted with key={deploymentId} so each open is a fresh
// instance — fresh backfill query and brand-new log subscription, no stale
// state carried across opens (mirrors the web drawer's keyed content). The
// backfill is fetched with useAsync + api.query rather than the environment
// feature's useLiveRelayQuery, which needs the environment RealtimeProvider
// that does not exist on the repo page; the live tail then streams over the
// SSE relay exactly as features/environment's DeploymentLogsPanel does.
const DeploymentLogsContent = ({
  deploymentId,
  onClose,
}: {
  deploymentId: string;
  onClose: () => void;
}) => {
  const api = useApi(massdriverApiRef);
  const { value, loading, error } = useAsync(async () => {
    const data = (await api.query(DEPLOYMENT_LOGS_QUERY, {
      id: deploymentId,
    })) as { deployment: DeploymentLogs | null };
    return data.deployment;
  }, [api, deploymentId]);

  const deployment = value ?? null;
  const status = deployment?.status;
  const active = isDeploymentActive(status);

  // Log lines streamed after the initial backfill.
  const [streamed, setStreamed] = useState<DeploymentLogLine[]>([]);
  useEffect(() => {
    setStreamed([]);
  }, [deployment]);

  useMassdriverSubscription<{ deploymentLogs: DeploymentLogLine | null }>(
    DEPLOYMENT_LOGS_SUBSCRIPTION,
    { deploymentId },
    {
      skip: loading || !active,
      onData: data => {
        const line = data?.deploymentLogs;
        if (line) setStreamed(previous => [...previous, line]);
      },
    },
  );

  const text = useMemo(
    () => composeLogsText([...(deployment?.logs ?? []), ...streamed]),
    [deployment?.logs, streamed],
  );

  const compoundStatus = composeInstanceStatus(deployment?.action, status);
  const statusColor = compoundStatus
    ? (instanceStatusColors as Record<string, string>)[compoundStatus]
    : null;
  const componentName = deployment?.instance?.component?.name;
  const actionLabel = [
    formatDeploymentStatus(deployment?.action, status),
    componentName,
  ]
    .filter(part => part && part !== '—')
    .join(' · ');

  return (
    <PanelContainer>
      <Header>
        <ActionLine variant="subtitle1" title={actionLabel}>
          {actionLabel || 'Deployment logs'}
        </ActionLine>
        {status ? (
          <StatusPill statusColor={statusColor}>
            {status.toLowerCase()}
          </StatusPill>
        ) : null}
        <SurfaceIconButton
          icon={<DownloadIcon />}
          ariaLabel="Download logs"
          tooltip="Download logs"
          onClick={() => downloadLogs(text, deploymentId)}
          disabled={!text}
        />
        <SurfaceCloseButton onClick={onClose} tooltip="Close logs" />
      </Header>
      <Body>
        {loading ? (
          <DeploymentLogsDrawerLoading />
        ) : error ? (
          <Padded>
            <Alert severity="error">{String(error.message ?? error)}</Alert>
          </Padded>
        ) : (
          <LogViewer
            text={text}
            follow
            enableLineNumbers
            enableSearch
            wrapLines
          />
        )}
      </Body>
    </PanelContainer>
  );
};

/**
 * In-place deployment logs drawer for the repo Deployments tab. Faithful port of
 * apps/web/shared/components/DeploymentLogsDrawer — a dark, right-anchored,
 * resizable Drawer driven by the same `logs` URL param the web reads via
 * useDialogParam (mirrored here with react-router's useSearchParams). Rendered
 * above MUI Dialog (zIndex.modal + 100) with an invisible backdrop, so it
 * overlays the details dialog with click-away-to-close, exactly as in the web.
 */
export const DeploymentLogsDrawer = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const deploymentId = searchParams.get('logs');
  const isOpen = Boolean(deploymentId);

  const onClose = () =>
    setSearchParams(
      prev => {
        const next = new URLSearchParams(prev);
        next.delete('logs');
        return next;
      },
      { replace: false },
    );

  return (
    <StyledDrawer
      open={isOpen}
      onClose={onClose}
      anchor="right"
      variant="temporary"
      resizable
      minWidth={575}
      defaultWidth={720}
      transitionDuration={{ enter: 280, exit: 220 }}
      ModalProps={{
        keepMounted: true,
        BackdropProps: { invisible: true },
        sx: { zIndex: (theme: any) => theme.zIndex.modal + 100 },
      }}
    >
      {deploymentId ? (
        <DeploymentLogsContent
          key={deploymentId}
          deploymentId={deploymentId}
          onClose={onClose}
        />
      ) : null}
    </StyledDrawer>
  );
};

export default DeploymentLogsDrawer;

const StyledDrawer = stylin(Drawer)({
  '& .MuiDrawer-paper': {
    backgroundColor: logSurfaceColors.bg,
  },
});

const PanelContainer = stylin(Box)({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  width: '100%',
  overflow: 'hidden',
  backgroundColor: logSurfaceColors.bg,
});

const Header = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(1.5, 2),
  height: 57,
  backgroundColor: logSurfaceColors.bg,
  borderBottom: `1px solid ${logSurfaceColors.border}`,
  flexShrink: 0,
}));

const ActionLine = stylin(Typography)({
  flex: 1,
  minWidth: 0,
  color: logSurfaceColors.textAction,
  fontWeight: 700,
  textTransform: 'capitalize',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

const StatusPill = stylin('span', ['statusColor'])(
  ({ statusColor }: { statusColor: string | null }) => ({
    display: 'inline-flex',
    alignItems: 'center',
    flexShrink: 0,
    padding: '2px 8px',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: 600,
    lineHeight: 1.4,
    textTransform: 'lowercase',
    letterSpacing: '0.02em',
    color: statusColor || logSurfaceColors.textMuted,
    backgroundColor: statusColor ? `${statusColor}1f` : 'transparent',
    border: `1px solid ${
      statusColor ? `${statusColor}33` : logSurfaceColors.border
    }`,
  }),
);

const Body = stylin(Box)({
  flex: 1,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: logSurfaceColors.bg,
});

const Padded = stylin(Box)(({ theme }: { theme: any }) => ({
  padding: theme.spacing(2),
}));

const SurfaceIconButton = stylin(InteractiveIconButton)({
  color: logSurfaceColors.textMuted,
  '&:hover': { color: logSurfaceColors.textHover },
});

const SurfaceCloseButton = stylin(CloseIconButton)({
  color: logSurfaceColors.textMuted,
  '&:hover': { color: logSurfaceColors.textHover },
});
