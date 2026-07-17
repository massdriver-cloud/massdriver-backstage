import Chip from '@massdriver/ui/Chip';
import stylin from '@massdriver/ui/stylin';
import { instanceStatusColors } from '@massdriver/ui/theme';
import {
  INSTANCE_STATUS,
  formatInstanceStatus,
  isInstanceStatusActionable,
} from '../utils/instanceStatuses';
import { chipClasses } from '../theme/muiClasses';

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
