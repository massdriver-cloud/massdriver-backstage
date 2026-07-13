import { useMemo, useState } from 'react';
import Box from '@massdriver/ui/Box';
import Typography from '@massdriver/ui/Typography';
import Switch from '@massdriver/ui/Switch';
import Alert from '@massdriver/ui/Alert';
import Button from '@massdriver/ui/Button';
import DataList from '@massdriver/ui/DataList';
import stylin from '@massdriver/ui/stylin';
import ChevronLeftIcon from '@massdriver/ui/icons/ChevronLeftIcon';
import buildCompareColumns from './compareColumns';
import type { DeploymentComparisonRow } from './flattenDeploymentComparison';
import { truncateDeploymentId } from '../InstanceDrawer/helpers';
import type { Deployment } from '../InstanceDrawer/types';

const labelFor = (
  deployment?: Deployment | null,
  position?: number,
): string => {
  if (!deployment) return '';
  const id = truncateDeploymentId(deployment.id);
  return position != null ? `#${position} · ${id}` : id;
};

/** Step 2 of the deployment compare flow: the flattened diff as a DataList. */
export const ResultsStep = ({
  rows,
  source,
  target,
  sourcePosition,
  targetPosition,
  onChangeSelection,
}: {
  rows: DeploymentComparisonRow[];
  source: Deployment | null;
  target: Deployment | null;
  sourcePosition?: number;
  targetPosition?: number;
  onChangeSelection: () => void;
}) => {
  const [hideEqual, setHideEqual] = useState(true);

  const filteredRows = useMemo(
    () => (hideEqual ? rows.filter(row => row.status !== 'equal') : rows),
    [rows, hideEqual],
  );

  const columns = useMemo(
    () =>
      buildCompareColumns({
        leftLabel: labelFor(source, sourcePosition),
        rightLabel: labelFor(target, targetPosition),
      }),
    [source, target, sourcePosition, targetPosition],
  );

  const differingCount = useMemo(
    () => rows.filter(row => row.status !== 'equal').length,
    [rows],
  );
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
          <DeploymentLabel>{labelFor(source, sourcePosition)}</DeploymentLabel>
          <ArrowText>↔</ArrowText>
          <DeploymentLabel>{labelFor(target, targetPosition)}</DeploymentLabel>
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
              {differingCount === 1 ? 'difference' : 'differences'}
            </>
          )}
        </Typography>
        <ToolbarActions>
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
          These deployments are identical.
        </Alert>
      ) : null}

      {allEqual && hideEqual ? null : (
        <DataList
          rows={filteredRows}
          columns={columns}
          searchable
          searchPlaceholder="Search path…"
          defaultSort={{ field: 'path', direction: 'asc' }}
          defaultPageSize={20}
          variant="outlined"
          size="small"
          emptyMessage='No fields match the current filters. Try clearing the search or toggling "Hide identical".'
        />
      )}
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

const DeploymentLabel = stylin('span')(({ theme }: { theme: any }) => ({
  fontFamily: theme.typography.fontFamilyMono,
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

const SwitchLabel = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  userSelect: 'none',
}));
