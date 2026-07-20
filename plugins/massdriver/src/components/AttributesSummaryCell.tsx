import Box from '@massdriver/ui/Box';
import Chip from '@massdriver/ui/Chip';
import Tooltip from '@massdriver/ui/Tooltip';
import Typography from '@massdriver/ui/Typography';
import stylin from '@massdriver/ui/stylin';
import { formatAttributeValue, parseMap } from '../utils/attributes';

const toEntries = (value: unknown): [string, unknown][] => {
  const parsed = parseMap(value);
  return parsed ? Object.entries(parsed) : [];
};

const Group = ({
  label,
  entries,
}: {
  label: string;
  entries: [string, unknown][];
}) => (
  <Section>
    <SectionHeader>
      {label} ({entries.length})
    </SectionHeader>
    {entries.length === 0 ? (
      <EmptyNote>None</EmptyNote>
    ) : (
      <BulletList>
        {entries.map(([key, value]) => (
          <BulletItem key={key}>{`${key}: ${formatAttributeValue(
            value,
          )}`}</BulletItem>
        ))}
      </BulletList>
    )}
  </Section>
);

export const AttributesSummaryCell = ({
  direct,
  effective,
}: {
  direct?: unknown;
  effective?: unknown;
}) => {
  const directEntries = toEntries(direct);
  const effectiveEntries = toEntries(effective);

  if (directEntries.length === 0 && effectiveEntries.length === 0) {
    return <MutedText variant="body2">—</MutedText>;
  }

  return (
    <Tooltip
      arrow
      enterDelay={400}
      placement="top"
      title={
        <TooltipBody>
          <Group label="Direct" entries={directEntries} />
          <Group label="Effective" entries={effectiveEntries} />
        </TooltipBody>
      }
    >
      <Anchor>
        <Chip
          size="small"
          variant="outlined"
          label={`${directEntries.length} direct · ${effectiveEntries.length} effective`}
        />
      </Anchor>
    </Tooltip>
  );
};

const MutedText = stylin(Typography)(({ theme }: { theme: any }) => ({
  color: theme.palette.text.secondary,
}));

const Anchor = stylin('span')({ display: 'inline-flex' });

const TooltipBody = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
  minWidth: 200,
  color: 'inherit',
}));

const Section = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.25),
  color: 'inherit',
}));

const SectionHeader = stylin('div')(({ theme }: { theme: any }) => ({
  fontSize: theme.typography.pxToRem(10),
  fontWeight: theme.typography.fontWeightBold,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  opacity: 0.7,
  color: 'inherit',
}));

const BulletList = stylin('ul')(({ theme }: { theme: any }) => ({
  margin: 0,
  paddingLeft: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.25),
  color: 'inherit',
}));

const BulletItem = stylin('li')(({ theme }: { theme: any }) => ({
  fontSize: theme.typography.body2.fontSize,
  lineHeight: 1.5,
  color: 'inherit',
}));

const EmptyNote = stylin('div')(({ theme }: { theme: any }) => ({
  fontSize: theme.typography.pxToRem(12),
  fontStyle: 'italic',
  opacity: 0.7,
  color: 'inherit',
}));
