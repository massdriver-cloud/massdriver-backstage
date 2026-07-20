import { useMemo, useState } from 'react';
import Box from '@massdriver/ui/Box';
import Typography from '@massdriver/ui/Typography';
import Switch from '@massdriver/ui/Switch';
import Select, { MenuItem } from '@massdriver/ui/Select';
import Alert from '@massdriver/ui/Alert';
import Button from '@massdriver/ui/Button';
import DataList from '@massdriver/ui/DataList';
import stylin from '@massdriver/ui/stylin';
import ChevronLeftIcon from '@massdriver/ui/icons/ChevronLeftIcon';
import buildCompareColumns from './compareColumns';
import type { ComparisonRow } from './flattenComparison';

const ALL_COMPONENTS = '__all__';

export const ResultsStep = ({
  rows,
  sourceName,
  targetName,
  loading,
  onChangeSelection,
}: {
  rows: ComparisonRow[];
  sourceName?: string;
  targetName?: string;
  loading: boolean;
  onChangeSelection: () => void;
}) => {
  const [hideEqual, setHideEqual] = useState(true);
  const [componentFilter, setComponentFilter] = useState(ALL_COMPONENTS);

  const componentOptions = useMemo(() => {
    const seen = new Map<string, string>();
    rows.forEach(row => {
      if (!seen.has(row.component.id)) {
        seen.set(row.component.id, row.component.name);
      }
    });
    return Array.from(seen, ([id, name]) => ({ id, name })).sort(
      (first, second) => first.name.localeCompare(second.name),
    );
  }, [rows]);

  const filteredRows = useMemo(
    () =>
      rows.filter(row => {
        if (hideEqual && row.status === 'equal') return false;
        if (
          componentFilter !== ALL_COMPONENTS &&
          row.component.id !== componentFilter
        ) {
          return false;
        }
        return true;
      }),
    [rows, hideEqual, componentFilter],
  );

  const columns = useMemo(
    () =>
      buildCompareColumns({ leftLabel: sourceName, rightLabel: targetName }),
    [sourceName, targetName],
  );

  const differingCount = useMemo(
    () => rows.filter(row => row.status !== 'equal').length,
    [rows],
  );
  const componentCount = useMemo(() => {
    const seen = new Set<string>();
    rows.forEach(row => seen.add(row.component.id));
    return seen.size;
  }, [rows]);
  const allEqual = rows.length > 0 && differingCount === 0;

  return (
    <Root>
      <HeaderBar>
        <BackButton
          variant="text"
          size="small"
          startIcon={<ChevronLeftIcon />}
          onClick={onChangeSelection}
        >
          Change selection
        </BackButton>
        <Title>
          <EnvName>{sourceName || 'Environment 1'}</EnvName>
          <ArrowText>↔</ArrowText>
          <EnvName>{targetName || 'Environment 2'}</EnvName>
        </Title>
        <HeaderSpacer />
      </HeaderBar>

      <SummaryRow>
        <Typography variant="body2" color="text.secondary">
          {allEqual ? (
            'No differences.'
          ) : (
            <>
              <Strong>{differingCount}</Strong>{' '}
              {differingCount === 1 ? 'difference' : 'differences'} across{' '}
              <Strong>{componentCount}</Strong>{' '}
              {componentCount === 1 ? 'component' : 'components'}
            </>
          )}
        </Typography>
        <ToolbarActions>
          <ComponentFilterSelect
            size="small"
            value={componentFilter}
            onChange={(event: any) => setComponentFilter(event.target.value)}
          >
            <MenuItem value={ALL_COMPONENTS}>All components</MenuItem>
            {componentOptions.map(component => (
              <MenuItem key={component.id} value={component.id}>
                {component.name}
              </MenuItem>
            ))}
          </ComponentFilterSelect>
          <SwitchLabel>
            <Switch
              size="small"
              checked={hideEqual}
              onChange={(event: any) => setHideEqual(event.target.checked)}
            />
            <Typography variant="body2" color="text.secondary">
              Hide identical
            </Typography>
          </SwitchLabel>
        </ToolbarActions>
      </SummaryRow>

      {allEqual ? (
        <Alert severity="success" variant="outlined">
          These environments are identical.
        </Alert>
      ) : null}

      <DataList
        rows={filteredRows}
        columns={columns}
        searchable
        searchPlaceholder="Search component or path…"
        defaultSort={{ field: 'componentName', direction: 'asc' }}
        defaultPageSize={20}
        variant="outlined"
        size="small"
        loading={loading}
        emptyMessage={
          hideEqual && allEqual
            ? 'All fields are identical.'
            : 'No fields match the current filters. Try clearing the search, switching the component filter, or toggling "Hide identical".'
        }
      />
    </Root>
  );
};

export default ResultsStep;

const Root = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  flex: 1,
}));

const HeaderBar = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  paddingBottom: theme.spacing(1.5),
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const BackButton = stylin(Button)(({ theme }: { theme: any }) => ({
  color: theme.palette.text.secondary,
  flexShrink: 0,
}));

const Title = stylin(Box)(({ theme }: { theme: any }) => ({
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(1.5),
}));

const EnvName = stylin('span')(({ theme }: { theme: any }) => ({
  fontSize: theme.typography.h6.fontSize,
  fontWeight: 600,
  color: theme.palette.text.primary,
  maxWidth: theme.spacing(40),
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}));

const ArrowText = stylin('span')(({ theme }: { theme: any }) => ({
  color: theme.palette.text.disabled,
  fontSize: theme.typography.h6.fontSize,
}));

const HeaderSpacer = stylin(Box)(({ theme }: { theme: any }) => ({
  width: theme.spacing(20),
  flexShrink: 0,
}));

const SummaryRow = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: theme.spacing(2),
  flexWrap: 'wrap',
}));

const Strong = stylin('span')(({ theme }: { theme: any }) => ({
  color: theme.palette.text.primary,
  fontWeight: 600,
}));

const ToolbarActions = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  flexWrap: 'wrap',
}));

const ComponentFilterSelect = stylin(Select)(({ theme }: { theme: any }) => ({
  minWidth: theme.spacing(22.5),
}));

const SwitchLabel = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  userSelect: 'none',
}));
