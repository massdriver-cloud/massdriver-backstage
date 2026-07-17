import { col } from '@massdriver/ui/DataList';
import Box from '@massdriver/ui/Box';
import Chip from '@massdriver/ui/Chip';
import stylin from '@massdriver/ui/stylin';
import ComparisonValueCell from '../CompareEnvironmentsDialog/ComparisonValueCell';
import {
  VERSION_PATH,
  type ComparisonStatus,
} from '../CompareEnvironmentsDialog/flattenComparison';
import type { DeploymentComparisonRow } from './flattenDeploymentComparison';

const renderPathCell = (value: string, row: DeploymentComparisonRow) => (
  <PathCellWrap>
    <StatusStripe status={row.status} />
    {value === VERSION_PATH ? (
      <Chip size="small" variant="outlined" label="Version" />
    ) : (
      <PathText>{value}</PathText>
    )}
  </PathCellWrap>
);

const renderLeftCell = (_value: unknown, row: DeploymentComparisonRow) => (
  <ComparisonValueCell
    side={row.source}
    isDifferent={row.status === 'different'}
    isMissing={row.status === 'targetOnly'}
  />
);

const renderRightCell = (_value: unknown, row: DeploymentComparisonRow) => (
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
  col.custom('path', 'Path', renderPathCell, {
    flex: 2,
    minWidth: 200,
    sortable: true,
    searchable: true,
  }),
  col.custom('sourceValue', leftLabel || 'Source', renderLeftCell, {
    flex: 2,
    minWidth: 180,
    sortable: true,
    searchable: true,
  }),
  col.custom('targetValue', rightLabel || 'Target', renderRightCell, {
    flex: 2,
    minWidth: 180,
    sortable: true,
    searchable: true,
  }),
];

export default buildCompareColumns;

const stripeColor = (theme: any, status: ComparisonStatus): string => {
  if (status === 'different') return theme.palette.warning.main;
  if (status === 'sourceOnly' || status === 'targetOnly') {
    return theme.palette.info.main;
  }
  return 'transparent';
};

const PathCellWrap = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  minWidth: 0,
}));

const StatusStripe = stylin(Box, ['status'])(
  ({ theme, status }: { theme: any; status: ComparisonStatus }) => ({
    width: 3,
    alignSelf: 'stretch',
    minHeight: theme.spacing(3),
    borderRadius: '2px',
    backgroundColor: stripeColor(theme, status),
    flexShrink: 0,
    marginLeft: '-4px',
  }),
);

const PathText = stylin(Box)(({ theme }: { theme: any }) => ({
  fontFamily: theme.typography.fontFamilyMono,
  fontSize: theme.typography.caption.fontSize,
  color: theme.palette.text.secondary,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}));
