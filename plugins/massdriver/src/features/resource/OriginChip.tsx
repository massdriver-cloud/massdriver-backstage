import Chip from '@massdriver/ui/Chip';
import stylin from '@massdriver/ui/stylin';

// Ported from apps/web/features/resources/sections/GeneralTab/GeneralTab.view.js
// (the OriginChip styled component + ORIGIN_LABELS).

const ORIGIN_LABELS: Record<string, string> = {
  IMPORTED: 'Imported',
  PROVISIONED: 'Provisioned',
};

/** Small uppercase status chip: provisioned reads info, imported reads success. */
export const OriginChip = ({ origin }: { origin?: string | null }) => {
  const provisioned = origin === 'PROVISIONED';
  return (
    <StyledChip
      size="small"
      label={ORIGIN_LABELS[origin ?? ''] ?? origin}
      provisioned={provisioned}
    />
  );
};

export default OriginChip;

const StyledChip = stylin(Chip, ['provisioned'])(
  ({ theme, provisioned }: { theme: any; provisioned: boolean }) => ({
    height: 20,
    fontSize: '0.6875rem',
    fontWeight: 600,
    letterSpacing: '0.03em',
    textTransform: 'uppercase',
    borderRadius: '4px',
    backgroundColor: provisioned
      ? theme.palette.info.lighter
      : theme.palette.success.lighter,
    color: provisioned ? theme.palette.info.dark : theme.palette.success.dark,
    '& .MuiChip-label': {
      padding: theme.spacing(0, 0.75),
    },
  }),
);
