import Box from '@massdriver/ui/Box';
import Typography from '@massdriver/ui/Typography';
import stylin from '@massdriver/ui/stylin';
import { denormalizeConditionsFromWire } from '../utils/conditions';

export const ConditionsCell = ({
  conditions,
  wildcardLabel = 'Applies to everything',
}: {
  conditions: unknown;
  wildcardLabel?: string;
}) => {
  const parsed = denormalizeConditionsFromWire(conditions);
  const entries = Object.entries(parsed);

  return entries.length === 0 ? (
    <Wildcard variant="body2" color="text.secondary">
      {wildcardLabel}
    </Wildcard>
  ) : (
    <Wrapper>
      {entries.map(([key, value]) => (
        <ConditionPiece key={key}>
          <Key>{key}</Key>
          <Equals>{Array.isArray(value) ? '∈' : '='}</Equals>
          <Value>
            {Array.isArray(value) ? `[${value.join(', ')}]` : String(value)}
          </Value>
        </ConditionPiece>
      ))}
    </Wrapper>
  );
};

const Wrapper = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.25),
}));

const ConditionPiece = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  fontSize: theme.typography.body2.fontSize,
}));

const Key = stylin(Typography)(({ theme }: { theme: any }) => ({
  fontFamily: theme.typography.fontFamilyMono ?? 'monospace',
  fontSize: theme.typography.body2.fontSize,
  color: theme.palette.text.primary,
}));

const Equals = stylin(Typography)(({ theme }: { theme: any }) => ({
  color: theme.palette.text.secondary,
  fontSize: theme.typography.body2.fontSize,
}));

const Value = stylin(Typography)(({ theme }: { theme: any }) => ({
  color: theme.palette.text.primary,
  fontSize: theme.typography.body2.fontSize,
}));

const Wildcard = stylin(Typography)({
  fontStyle: 'italic',
});
