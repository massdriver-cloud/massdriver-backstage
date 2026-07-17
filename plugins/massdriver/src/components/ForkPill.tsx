import Box from '@massdriver/ui/Box';
import Tooltip from '@massdriver/ui/Tooltip';
import stylin from '@massdriver/ui/stylin';
import {
  formatAbsoluteTime,
  formatRelativeTime,
} from '../utils/formatRelativeTime';

const TOOLTIP_SLOT_PROPS = {
  tooltip: { sx: { maxWidth: 280, px: 1.25, py: 1 } },
};

export const ForkPill = ({
  parent,
  createdAt,
  size = 'small',
}: {
  parent?: { name?: string } | null;
  createdAt?: string | null;
  size?: 'small' | 'medium';
}) => {
  if (!parent) {
    return null;
  }
  const absolute = formatAbsoluteTime(createdAt);

  return (
    <Tooltip
      arrow
      enterDelay={300}
      placement="top"
      slotProps={TOOLTIP_SLOT_PROPS}
      title={
        <TooltipBody>
          <TooltipRow>
            <TooltipLabel>Forked from</TooltipLabel>
            <TooltipValue>{parent.name}</TooltipValue>
          </TooltipRow>
          {createdAt ? (
            <TooltipRow>
              <TooltipLabel>Forked</TooltipLabel>
              <TooltipValue>{formatRelativeTime(createdAt)}</TooltipValue>
            </TooltipRow>
          ) : null}
          {absolute ? <TooltipMeta>{absolute}</TooltipMeta> : null}
        </TooltipBody>
      }
    >
      <Pill size={size}>Fork</Pill>
    </Tooltip>
  );
};

const Pill = stylin(Box, ['size'])(
  ({ theme, size }: { theme: any; size: string }) => {
    const color = theme.palette.info.main;
    return {
      display: 'inline-flex',
      alignItems: 'center',
      flexShrink: 0,
      lineHeight: 1,
      padding: size === 'small' ? '3px 6px 1px' : '5px 8px 3px',
      borderRadius: theme.custom.general.borderRadiusSm,
      fontSize: theme.typography.pxToRem(size === 'small' ? 10 : 11),
      fontWeight: theme.typography.fontWeightMedium,
      letterSpacing: '0.4px',
      textTransform: 'uppercase',
      color,
      backgroundColor: `${color}1f`,
      border: `1px solid ${color}33`,
      cursor: 'default',
      userSelect: 'none',
    };
  },
);

const TooltipBody = stylin('span')(({ theme }: { theme: any }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.25),
}));

const TooltipRow = stylin('span')(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'baseline',
  gap: theme.spacing(0.75),
  fontSize: theme.typography.pxToRem(12),
  lineHeight: 1.4,
}));

const TooltipLabel = stylin('span')({ fontWeight: 600, opacity: 0.7 });
const TooltipValue = stylin('span')({ fontWeight: 500 });
const TooltipMeta = stylin('span')(({ theme }: { theme: any }) => ({
  fontSize: theme.typography.pxToRem(11),
  opacity: 0.6,
  marginTop: theme.spacing(0.25),
}));
