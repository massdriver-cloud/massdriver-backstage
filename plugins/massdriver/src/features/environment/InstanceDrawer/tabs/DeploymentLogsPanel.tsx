import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import Box from '@massdriver/ui/Box';
import Typography from '@massdriver/ui/Typography';
import Alert from '@massdriver/ui/Alert';
import LoadingIndicator from '@massdriver/ui/LoadingIndicator';
import LogViewer from '@massdriver/ui/LogViewer';
import {
  CloseIconButton,
  InteractiveIconButton,
} from '@massdriver/ui/IconButton';
import DownloadIcon from '@massdriver/ui/icons/DownloadIcon';
import stylin from '@massdriver/ui/stylin';
import { deploymentStatusColors, logSurfaceColors } from '@massdriver/ui/theme';
import { useLiveRelayQuery } from '../../realtime/useLiveRelayQuery';
import { useMassdriverSubscription } from '../../realtime/useMassdriverSubscription';
import { DEPLOYMENT_LOGS_SUBSCRIPTION } from '../../realtime/queries';
import { DEPLOYMENT_LOGS_QUERY } from '../queries';
import {
  composeLogsText,
  formatDeploymentStatus,
  isDeploymentActive,
} from '../helpers';
import type { DeploymentLogLine, DeploymentLogs } from '../types';

// Lets any drawer tab open the read-only logs overlay. Hosted by the drawer so
// the panel overlays the whole drawer (header + tabs), matching the web app's
// page-level DeploymentLogsDrawer. No-op default when rendered outside a drawer.
const OpenLogsContext = createContext<(deploymentId: string) => void>(() => {});

/** Open the read-only deployment logs overlay for a deployment id. */
export const useOpenLogs = (): ((deploymentId: string) => void) =>
  useContext(OpenLogsContext);

export const OpenLogsProvider = OpenLogsContext.Provider;

const downloadLogs = (text: string, deploymentId: string) => {
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `deployment-${deploymentId}.log`;
  link.click();
  URL.revokeObjectURL(url);
};

/**
 * Read-only deployment logs overlay. Ported from the web app's
 * `DeploymentLogsDrawer`: fetch the transcript once (`network-only`), then — if
 * the deployment is still active — stream new batches via the `deploymentLogs`
 * subscription and append them. Rendered as a dark, absolutely-positioned panel
 * that overlays the drawer (Backstage's hybrid runtime doesn't paint MUI
 * Drawer/Modal reliably, so we use a plain Box, as the drawer itself does).
 */
export const DeploymentLogsPanel = ({
  deploymentId,
  onClose,
}: {
  deploymentId: string;
  onClose: () => void;
}) => {
  // Live query: a deployment finishing while the panel is open bumps the
  // environment revision → refetch → `active` flips false, which both fixes
  // the status pill and tears down the log subscription (otherwise the
  // upstream Absinthe socket would stay open until the panel closes).
  const { value, loading, error } = useLiveRelayQuery<{
    deployment: DeploymentLogs | null;
  }>(DEPLOYMENT_LOGS_QUERY, { id: deploymentId });

  const deployment = value?.deployment ?? null;
  const status = deployment?.status;
  const active = isDeploymentActive(status);

  // Log batches streamed after the initial backfill. Each refetched backfill
  // already contains everything streamed so far — reset the tail so lines
  // aren't duplicated.
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

  const actionLabel = [
    formatDeploymentStatus(deployment?.action, status),
    deployment?.instance?.component?.name,
  ]
    .filter(part => part && part !== '—')
    .join(' · ');
  const statusColor = status
    ? (deploymentStatusColors as Record<string, string>)[status]
    : null;

  return (
    <Root>
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
          <Centered>
            <LoadingIndicator />
          </Centered>
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
    </Root>
  );
};

export default DeploymentLogsPanel;

const Root = stylin(Box)({
  position: 'absolute',
  inset: 0,
  zIndex: 20,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  backgroundColor: logSurfaceColors.bg,
});

const Header = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(1.5, 2),
  height: 57,
  flexShrink: 0,
  backgroundColor: logSurfaceColors.bg,
  borderBottom: `1px solid ${logSurfaceColors.border}`,
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

const Centered = stylin(Box)(({ theme }: { theme: any }) => ({
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(6),
}));

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
