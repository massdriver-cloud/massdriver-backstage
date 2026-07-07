import Chip from '@massdriver/ui/Chip';
import stylin from '@massdriver/ui/stylin';
import { instanceStatusColors } from '@massdriver/ui/theme';

// Static instance statuses the read-only graph can render. The web app's pill
// also derives in-flight compound statuses (e.g. PROVISION_RUNNING) from a
// live deployment query; that query is intentionally dropped here, so the pill
// shows the bare stored instance status.
const INSTANCE_STATUS = {
  INITIALIZED: 'INITIALIZED',
  EXTERNAL: 'EXTERNAL',
  PROVISIONED: 'PROVISIONED',
  DECOMMISSIONED: 'DECOMMISSIONED',
  FAILED: 'FAILED',
} as const;

const STATIC_LABELS: Record<string, string> = {
  [INSTANCE_STATUS.INITIALIZED]: 'Initialized',
  [INSTANCE_STATUS.PROVISIONED]: 'Provisioned',
  [INSTANCE_STATUS.DECOMMISSIONED]: 'Decommissioned',
  [INSTANCE_STATUS.EXTERNAL]: 'Remote Reference',
  [INSTANCE_STATUS.FAILED]: 'Deployment Failed',
};

const formatInstanceStatus = (status?: string | null): string =>
  (status && STATIC_LABELS[status]) ?? '—';

/** Read-only instance status chip. Faithful port of the web app's pill view. */
const InstanceStatusPill = ({
  status,
  size = 'small',
  ...props
}: {
  status?: string | null;
  size?: string;
  [key: string]: unknown;
}) => {
  const label = formatInstanceStatus(status);
  const color = (status && instanceStatusColors[status]) ?? null;
  return (
    <StyledChip
      label={label}
      size={size}
      statusColor={color}
      external={status === INSTANCE_STATUS.EXTERNAL}
      {...props}
    />
  );
};

export default InstanceStatusPill;

// Background and border use 12% / 20% alpha tints of the flat status color,
// matching the web app's pill so surfaces stay visually consistent.
const StyledChip = stylin(
  Chip,
  ['statusColor', 'external'],
)(
  ({
    theme,
    statusColor,
    external,
  }: {
    theme: any;
    statusColor: string | null;
    external: boolean;
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
    '& .MuiChip-label': {
      textTransform: 'lowercase',
    },
  }),
);
