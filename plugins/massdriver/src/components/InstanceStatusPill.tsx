import Chip from '@massdriver/ui/Chip';
import stylin from '@massdriver/ui/stylin';
import { instanceStatusColors } from '@massdriver/ui/theme';
import {
  INSTANCE_STATUS,
  formatInstanceStatus,
  isInstanceStatusActionable,
} from '../utils/instanceStatuses';
import { chipClasses } from '../theme/muiClasses';

/**
 * Presentational instance/deployment status pill — the web app's
 * `InstanceStatusPill` rendering (12% / 20% alpha tints of the flat status
 * color, lowercase label, dashed border for remote references). Takes a static
 * or compound status string; callers with a deployment at hand compose it via
 * `composeInstanceStatus`. The live, latest-deployment-aware variant wraps this
 * in `features/environment/components/InstanceStatusPill`.
 *
 * The pill is only clickable while the status is actionable (a deployment in
 * flight or failed), mirroring the web app's click-to-logs affordance.
 */
export const InstanceStatusPill = ({
  status,
  onClick,
  size = 'small',
  ...props
}: {
  status?: string | null;
  onClick?: () => void;
  size?: string;
  [key: string]: unknown;
}) => {
  const clickable = Boolean(onClick) && isInstanceStatusActionable(status);
  // Stop propagation so the pill click doesn't fall through to ancestor click
  // handlers (e.g. a row or diagram node opening its own detail surface).
  const handleClick = clickable
    ? (event: { stopPropagation?: () => void }) => {
        event?.stopPropagation?.();
        onClick?.();
      }
    : undefined;

  const label = formatInstanceStatus(status);
  const color = (status && instanceStatusColors[status]) ?? null;
  return (
    <StyledChip
      label={label}
      size={size}
      statusColor={color}
      external={status === INSTANCE_STATUS.EXTERNAL}
      clickable={clickable}
      onClick={handleClick}
      {...props}
    />
  );
};

export default InstanceStatusPill;

// Background and border use 12% / 20% alpha tints of the flat status color,
// matching the web app's pill so surfaces stay visually consistent.
const StyledChip = stylin(Chip, ['statusColor', 'external', 'clickable'])(
  ({
    theme,
    statusColor,
    external,
    clickable,
  }: {
    theme: any;
    statusColor: string | null;
    external: boolean;
    clickable: boolean;
  }) => ({
    height: 'auto',
    fontSize: theme.typography.pxToRem(11),
    fontWeight: theme.typography.fontWeightMedium,
    letterSpacing: '0.3px',
    textTransform: 'lowercase',
    color: statusColor ?? theme.palette.text.secondary,
    backgroundColor: statusColor
      ? `${statusColor}1f`
      : theme.palette.action.hover,
    border: statusColor
      ? `${external ? '2px dashed' : '1px solid'} ${statusColor}${
          external ? '' : '33'
        }`
      : `1px solid ${theme.palette.divider}`,
    fontStyle: external ? 'italic' : undefined,
    ...(clickable && {
      cursor: 'pointer',
      '&:hover': {
        filter: 'brightness(0.96)',
      },
    }),
    [`& .${chipClasses.label}`]: {
      textTransform: 'lowercase',
    },
  }),
);
