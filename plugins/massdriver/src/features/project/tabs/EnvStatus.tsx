import Box from '@massdriver/ui/Box';
import Tooltip from '@massdriver/ui/Tooltip';
import Typography from '@massdriver/ui/Typography';
import stylin from '@massdriver/ui/stylin';
import { instanceStatusColors } from '@massdriver/ui/theme';
import { RouterLinkAdapter } from '../../../components/RouterLinkAdapter';

export interface EnvInstance {
  id: string;
  status?: string | null;
  deployedVersion?: string | null;
  resolvedVersion?: string | null;
  availableUpgrade?: string | null;
  environment?: { id: string; name?: string | null } | null;
}

const STATUS_LABELS: Record<string, string> = {
  INITIALIZED: 'Not deployed yet',
  PROVISIONED: 'Provisioned',
  DECOMMISSIONED: 'Decommissioned',
  FAILED: 'Failed',
  EXTERNAL: 'External',
};

const labelFor = (status?: string | null) =>
  (status && STATUS_LABELS[status]) ?? status ?? 'Unknown';
const colorFor = (status?: string | null) =>
  (status && instanceStatusColors[status]) ?? instanceStatusColors.INITIALIZED;

export const EnvStatusStrip = ({
  instances,
  getInstanceUrl,
}: {
  instances?: EnvInstance[] | null;
  getInstanceUrl?: (instance: EnvInstance) => string | null;
}) => {
  if (!instances || instances.length === 0) {
    return (
      <EmptyText variant="caption" color="text.secondary">
        Not deployed in any environment
      </EmptyText>
    );
  }
  return (
    <Strip>
      {instances.map(instance => (
        <EnvStatusChip
          key={instance.id}
          instance={instance}
          href={getInstanceUrl?.(instance) ?? null}
        />
      ))}
    </Strip>
  );
};

const EnvStatusChip = ({
  instance,
  href,
}: {
  instance: EnvInstance;
  href: string | null;
}) => {
  const color = colorFor(instance.status);
  const versionLabel = instance.deployedVersion ?? '—';
  const showResolved =
    instance.resolvedVersion &&
    instance.resolvedVersion !== instance.deployedVersion;

  const tooltipRows = [
    instance.environment?.name && {
      label: 'Environment',
      value: instance.environment.name,
    },
    { label: 'Status', value: labelFor(instance.status) },
    {
      label: 'Deployed',
      value: instance.deployedVersion
        ? `v${instance.deployedVersion}`
        : 'Not deployed',
    },
    showResolved && {
      label: 'Resolves to',
      value: `v${instance.resolvedVersion}`,
    },
    instance.availableUpgrade && {
      label: 'Upgrade available',
      value: `v${instance.availableUpgrade}`,
    },
  ].filter(Boolean) as { label: string; value: string }[];

  const content = (
    <Chip interactive={Boolean(href)}>
      <Dot color={color} />
      <Name variant="caption">{instance.environment?.name}</Name>
      <Version variant="caption">{versionLabel}</Version>
    </Chip>
  );

  return (
    <Tooltip
      arrow
      enterDelay={400}
      placement="top"
      slotProps={{ tooltip: { sx: { maxWidth: 260 } } }}
      title={
        <TooltipBody>
          {tooltipRows.map(row => (
            <TooltipRow key={row.label}>
              <TooltipLabel>{row.label}</TooltipLabel>
              <TooltipValue>{row.value}</TooltipValue>
            </TooltipRow>
          ))}
        </TooltipBody>
      }
    >
      {href ? <ChipLink href={href}>{content}</ChipLink> : content}
    </Tooltip>
  );
};

const Strip = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(0.75),
  alignItems: 'center',
}));

const EmptyText = stylin(Typography)(({ theme }: { theme: any }) => ({
  fontStyle: 'italic',
  paddingTop: theme.spacing(0.5),
  paddingBottom: theme.spacing(0.5),
}));

const ChipLink = stylin(RouterLinkAdapter)({ textDecoration: 'none' });

const Chip = stylin(Box, ['interactive'])(
  ({ theme, interactive }: { theme: any; interactive: boolean }) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    padding: `${theme.spacing(0.25)} ${theme.spacing(1)}`,
    borderRadius: theme.custom.general.borderRadiusSm,
    backgroundColor: theme.palette.background.field,
    border: `1px solid ${theme.palette.divider}`,
    textDecoration: 'none',
    transition: 'background-color 120ms ease, border-color 120ms ease',
    ...(interactive && {
      cursor: 'pointer',
      '&:hover': {
        backgroundColor: theme.palette.action.hover,
        borderColor: theme.palette.text.secondary,
      },
    }),
  }),
);

const Dot = stylin('span', ['color'])(({ color }: { color: string }) => ({
  width: 8,
  height: 8,
  borderRadius: '50%',
  flexShrink: 0,
  backgroundColor: color,
}));

const Name = stylin(Typography)(({ theme }: { theme: any }) => ({
  color: theme.palette.text.primary,
  fontWeight: theme.typography.fontWeightMedium,
}));

const Version = stylin(Typography)(({ theme }: { theme: any }) => ({
  color: theme.palette.text.secondary,
  fontFamily: theme.typography.fontFamilyMono,
}));

const TooltipBody = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.25),
}));

const TooltipRow = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  gap: theme.spacing(1),
  fontSize: 11,
  lineHeight: 1.4,
}));

const TooltipLabel = stylin('span')({
  fontWeight: 600,
  color: 'inherit',
  opacity: 0.75,
});

const TooltipValue = stylin('span')(({ theme }: { theme: any }) => ({
  color: 'inherit',
  fontFamily: theme.typography.fontFamilyMono,
}));
