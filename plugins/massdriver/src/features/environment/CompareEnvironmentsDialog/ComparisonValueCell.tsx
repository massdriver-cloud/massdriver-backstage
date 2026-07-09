import Box from '@massdriver/ui/Box';
import Tooltip from '@massdriver/ui/Tooltip';
import stylin from '@massdriver/ui/stylin';
import type { ComparisonSide } from './flattenComparison';

const TRUNCATE_LENGTH = 64;

const formatValue = (value: unknown): string => {
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

/** Renders one side of a comparison row (source or target value). */
export const ComparisonValueCell = ({
  side,
  isDifferent,
  isMissing,
}: {
  side?: ComparisonSide | null;
  isDifferent: boolean;
  isMissing: boolean;
}) => {
  const present = side?.present === true;

  if (!present) {
    return isMissing ? (
      <MissingPill>not set</MissingPill>
    ) : (
      <Missing>—</Missing>
    );
  }

  const value = side?.value;
  if (value == null) {
    return <NullLiteral>null</NullLiteral>;
  }

  const display = formatValue(value);
  const truncated = display.length > TRUNCATE_LENGTH;
  const visible = truncated ? `${display.slice(0, TRUNCATE_LENGTH)}…` : display;

  const cell = <ValueText isDifferent={isDifferent}>{visible}</ValueText>;

  return truncated ? (
    <Tooltip title={display} arrow placement="top">
      <span>{cell}</span>
    </Tooltip>
  ) : (
    cell
  );
};

export default ComparisonValueCell;

const ValueText = stylin(Box, ['isDifferent'])(
  ({ theme, isDifferent }: { theme: any; isDifferent: boolean }) => ({
    fontFamily: theme.typography.fontFamilyMono,
    fontSize: theme.typography.caption.fontSize,
    color: isDifferent
      ? theme.palette.text.primary
      : theme.palette.text.secondary,
    fontWeight: isDifferent ? 600 : 400,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }),
);

const NullLiteral = stylin(Box)(({ theme }: { theme: any }) => ({
  fontStyle: 'italic',
  color: theme.palette.text.secondary,
  fontFamily: theme.typography.fontFamilyMono,
  fontSize: theme.typography.caption.fontSize,
}));

const Missing = stylin(Box)(({ theme }: { theme: any }) => ({
  fontStyle: 'italic',
  color: theme.palette.text.disabled,
  fontSize: theme.typography.caption.fontSize,
}));

const MissingPill = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'inline-block',
  fontStyle: 'italic',
  fontSize: theme.typography.caption.fontSize,
  color: theme.palette.error.main,
  backgroundColor: `${theme.palette.error.main}14`,
  padding: `${theme.spacing(0.25)} ${theme.spacing(0.75)}`,
  borderRadius: 1,
}));
