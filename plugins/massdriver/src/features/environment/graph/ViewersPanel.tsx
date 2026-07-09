import Avatar from '@massdriver/ui/Avatar';
import AvatarGroup from '@massdriver/ui/AvatarGroup';
import Box from '@massdriver/ui/Box';
import Tooltip from '@massdriver/ui/Tooltip';
import stylin from '@massdriver/ui/stylin';
import { usePresence, type PresenceViewer } from '../realtime/PresenceProvider';
import userColor from '../realtime/userColor';

// Ported from apps/web features/environments/sections/ViewersPanel. The plugin
// is a read-only spectator, so there is no "you" entry — only web-app viewers.
const MAX_VISIBLE = 5;
const AVATAR_SIZE = 22;

const TOOLTIP_SLOT_PROPS = {
  tooltip: { sx: { maxWidth: 260, px: 1.25, py: 1 } },
};

const initialFor = (viewer: PresenceViewer) =>
  (viewer.firstName || viewer.email || '?').trim().charAt(0).toUpperCase();

const focusLine = (
  focus: PresenceViewer['focus'],
  resolveLabel?: (nodeId: string) => string | null,
) => {
  if (focus.kind !== 'node') return 'Browsing the canvas';
  const label = resolveLabel?.(focus.nodeId);
  return label ? `Viewing ${label}` : 'Viewing a component';
};

const renderAvatar = (
  viewer: PresenceViewer,
  resolveLabel?: (nodeId: string) => string | null,
) => {
  const displayName = viewer.firstName || viewer.email || 'Unknown';
  const color = userColor(viewer.accountId);

  const tooltipTitle = (
    <TooltipBody>
      <TooltipDot sx={{ backgroundColor: color }} />
      <TooltipText>
        <TooltipName>{displayName}</TooltipName>
        <TooltipFocus>{focusLine(viewer.focus, resolveLabel)}</TooltipFocus>
      </TooltipText>
    </TooltipBody>
  );

  return (
    <Tooltip
      key={viewer.accountId}
      title={tooltipTitle}
      arrow
      placement="bottom"
      enterDelay={150}
      slotProps={TOOLTIP_SLOT_PROPS}
    >
      <AvatarSlot>
        <ViewerAvatar src={viewer.avatarUrl || undefined} alt={displayName}>
          {initialFor(viewer)}
        </ViewerAvatar>
      </AvatarSlot>
    </Tooltip>
  );
};

/** Who's viewing this environment in the web app right now. */
const ViewersPanel = ({
  resolveLabel,
}: {
  resolveLabel?: (nodeId: string) => string | null;
}) => {
  const { viewers } = usePresence();
  if (viewers.length === 0) return null;

  return (
    <Panel>
      <AvatarGroup max={MAX_VISIBLE} size={AVATAR_SIZE} spacing={-6}>
        {viewers.map(viewer => renderAvatar(viewer, resolveLabel))}
      </AvatarGroup>
    </Panel>
  );
};

export default ViewersPanel;

const Panel = stylin(Box)(({ theme }: { theme: any }) => ({
  position: 'absolute',
  top: theme.spacing(1),
  right: theme.spacing(1),
  zIndex: 5,
  padding: theme.spacing(0.25, 0.5),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.custom.general.borderRadiusSm,
  boxShadow: theme.custom.shadows.cardSm,
  display: 'flex',
  alignItems: 'center',
}));

const AvatarSlot = stylin('span')({
  display: 'inline-flex',
  alignItems: 'center',
});

const ViewerAvatar = stylin(Avatar)(({ theme }: { theme: any }) => ({
  width: AVATAR_SIZE,
  height: AVATAR_SIZE,
  fontSize: theme.typography.caption.fontSize,
  border: `1.5px solid ${theme.palette.background.paper}`,
}));

const TooltipBody = stylin('span')(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
}));

const TooltipDot = stylin('span')({
  width: 8,
  height: 8,
  borderRadius: '50%',
  flexShrink: 0,
  boxShadow: '0 0 0 2px rgba(255,255,255,0.15)',
});

const TooltipText = stylin('span')({
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
});

const TooltipName = stylin('span')(({ theme }: { theme: any }) => ({
  fontSize: theme.typography.pxToRem(13),
  fontWeight: 600,
  lineHeight: 1.3,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}));

const TooltipFocus = stylin('span')(({ theme }: { theme: any }) => ({
  fontSize: theme.typography.pxToRem(11),
  opacity: 0.7,
  lineHeight: 1.3,
}));
