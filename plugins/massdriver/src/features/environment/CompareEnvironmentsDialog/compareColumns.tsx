import { col } from '@massdriver/ui/DataList';
import Box from '@massdriver/ui/Box';
import Chip from '@massdriver/ui/Chip';
import stylin from '@massdriver/ui/stylin';
import ComparisonValueCell from './ComparisonValueCell';
import { VERSION_PATH, type ComparisonRow, type ComparisonStatus } from './flattenComparison';

// MUI sx-style color tokens (only valid in sx contexts).
const STATUS_COLORS: Record<ComparisonStatus, string> = {
  equal: 'transparent',
  different: 'warning.main',
  sourceOnly: 'info.main',
  targetOnly: 'info.main',
};

const getStatusColor = (status: ComparisonStatus): string =>
  STATUS_COLORS[status] ?? 'transparent';

const renderComponentCell = (value: string, row: ComparisonRow) => (
  <ComponentCellWrap>
    <StatusStripe statusColor={getStatusColor(row.status)} />
    <ComponentName>{value || '--'}</ComponentName>
  </ComponentCellWrap>
);

const renderPathCell = (value: string) =>
  value === VERSION_PATH ? (
    <Chip size="small" variant="outlined" label="Version" />
  ) : (
    <PathCell>{value}</PathCell>
  );

const renderLeftCell = (_value: unknown, row: ComparisonRow) => (
  <ComparisonValueCell
    side={row.source}
    isDifferent={row.status === 'different'}
    isMissing={row.status === 'targetOnly'}
  />
);

const renderRightCell = (_value: unknown, row: ComparisonRow) => (
  <ComparisonValueCell
    side={row.target}
    isDifferent={row.status === 'different'}
    isMissing={row.status === 'sourceOnly'}
  />
);

export const buildCompareColumns = ({
  leftLabel,
  rightLabel,
}: {
  leftLabel?: string;
  rightLabel?: string;
} = {}) => [
  col.custom('componentName', 'Component', renderComponentCell, {
    flex: 1.5,
    minWidth: 160,
    sortable: true,
    searchable: true,
  }),
  col.custom('path', 'Path', renderPathCell, {
    flex: 2,
    minWidth: 180,
    sortable: true,
    searchable: true,
  }),
  col.custom('sourceValue', leftLabel || 'Environment 1', renderLeftCell, {
    flex: 2,
    minWidth: 160,
    sortable: true,
    searchable: true,
  }),
  col.custom('targetValue', rightLabel || 'Environment 2', renderRightCell, {
    flex: 2,
    minWidth: 160,
    sortable: true,
    searchable: true,
  }),
];

export default buildCompareColumns;

const ComponentCellWrap = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  minWidth: 0,
}));

const StatusStripe = stylin(
  Box,
  ['statusColor'],
)(({ theme, statusColor }: { theme: any; statusColor: string }) => ({
  width: 3,
  alignSelf: 'stretch',
  minHeight: theme.spacing(3),
  borderRadius: '2px',
  backgroundColor: statusColor,
  flexShrink: 0,
  marginLeft: '-4px',
}));

const ComponentName = stylin(Box)(({ theme }: { theme: any }) => ({
  fontSize: theme.typography.body2.fontSize,
  color: theme.palette.text.primary,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}));

const PathCell = stylin(Box)(({ theme }: { theme: any }) => ({
  fontFamily: theme.typography.fontFamilyMono,
  fontSize: theme.typography.caption.fontSize,
  color: theme.palette.text.secondary,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}));
