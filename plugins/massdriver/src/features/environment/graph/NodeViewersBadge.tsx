import Avatar from '@massdriver/ui/Avatar';
import AvatarGroup from '@massdriver/ui/AvatarGroup';
import Box from '@massdriver/ui/Box';
import Tooltip from '@massdriver/ui/Tooltip';
import stylin from '@massdriver/ui/stylin';
import { type PresenceViewer } from '../realtime/PresenceProvider';
import useNodeViewers from '../realtime/useNodeViewers';
import userColor from '../realtime/userColor';

// Ported from apps/web features/environments/components/NodeViewersBadge —
// avatars of web-app users whose cursor is focused on this node.
const BADGE_AVATAR_SIZE = 20;
const MAX_VISIBLE = 3;

const TOOLTIP_SLOT_PROPS = {
  tooltip: { sx: { maxWidth: 220, px: 1, py: 0.75 } },
};

const initialFor = (viewer: PresenceViewer) =>
  (viewer.firstName || viewer.email || '?').trim().charAt(0).toUpperCase();

const renderAvatar = (viewer: PresenceViewer) => {
  const color = userColor(viewer.accountId);
  const displayName = viewer.firstName || viewer.email || 'Unknown';
  return (
    <Tooltip
      key={viewer.accountId}
      arrow
      placement="top"
      enterDelay={150}
      slotProps={TOOLTIP_SLOT_PROPS}
      title={
        <TooltipBody>
          <TooltipDot sx={{ backgroundColor: color }} />
          <TooltipName>{displayName}</TooltipName>
        </TooltipBody>
      }
    >
      <AvatarSlot>
        <BadgeAvatar
          src={viewer.avatarUrl || undefined}
          alt={displayName}
          sx={{ boxShadow: `0 0 0 2px ${color}` }}
        >
          {initialFor(viewer)}
        </BadgeAvatar>
      </AvatarSlot>
    </Tooltip>
  );
};

const NodeViewersBadge = ({ nodeId }: { nodeId: string }) => {
  const viewers = useNodeViewers(nodeId);
  if (viewers.length === 0) return null;

  return (
    <Wrapper>
      <AvatarGroup max={MAX_VISIBLE} size={BADGE_AVATAR_SIZE} spacing={-6}>
        {viewers.map(renderAvatar)}
      </AvatarGroup>
    </Wrapper>
  );
};

export default NodeViewersBadge;

const Wrapper = stylin(Box)({
  position: 'absolute',
  top: -10,
  right: -6,
  zIndex: 2,
  pointerEvents: 'auto',
});

const AvatarSlot = stylin('span')({
  display: 'inline-flex',
  alignItems: 'center',
});

const BadgeAvatar = stylin(Avatar)(({ theme }: { theme: any }) => ({
  width: BADGE_AVATAR_SIZE,
  height: BADGE_AVATAR_SIZE,
  fontSize: theme.typography.pxToRem(10),
  fontWeight: 600,
  border: `1.5px solid ${theme.palette.background.paper}`,
}));

const TooltipBody = stylin('span')(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.75),
}));

const TooltipDot = stylin('span')({
  width: 8,
  height: 8,
  borderRadius: '50%',
  flexShrink: 0,
});

const TooltipName = stylin('span')(({ theme }: { theme: any }) => ({
  fontSize: theme.typography.pxToRem(12),
  fontWeight: 600,
  lineHeight: 1.3,
  whiteSpace: 'nowrap',
}));
