import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Alert from '@massdriver/ui/Alert';
import Box from '@massdriver/ui/Box';
import LoadingIndicator from '@massdriver/ui/LoadingIndicator';
import Select, { MenuItem } from '@massdriver/ui/Select';
import FilterListIcon from '@massdriver/ui/icons/FilterListIcon';
import HistoryIcon from '@massdriver/ui/icons/HistoryIcon';
import SortIcon from '@massdriver/ui/icons/SortIcon';
import stylin from '@massdriver/ui/stylin';
import { RepoEmptyState } from '../RepoEmptyState';
import { RepoNoVersionsState } from '../RepoNoVersionsState';
import { RepoTabHeader } from '../RepoTabHeader';
import { RepoTabLayout } from '../RepoTabLayout';
import { buildRepoVersionFilter } from '../repoFilter';
import { ALL_VERSIONS } from '../resolveVersion';
import { REPO_DEPLOYMENTS_QUERY } from '../queries';
import type { RepoTabProps } from '../RepoDetailsPage';
import type { RepoDeployment } from '../types';
import { useInfiniteRelayList } from '../useInfiniteRelayList';
import { useInfiniteScroll } from '../useInfiniteScroll';
import { DeploymentRow } from './DeploymentRow';
import { DeploymentsTabLoading } from './DeploymentsTab.loading';
import {
  ACTION_OPTIONS,
  DEFAULT_ACTION_VALUE,
  DEFAULT_SORT_VALUE,
  DEFAULT_STATUS_VALUE,
  SORT_OPTIONS,
  STATUS_OPTIONS,
  filterValue,
  sortValueToInput,
} from './DeploymentsTab.helpers';
import { selectClasses } from '../../../theme/muiClasses';

export const DeploymentsTab = ({
  repoId,
  version,
  hasNoVersions,
}: RepoTabProps) => {
  const [sortValue, setSortValue] = useState(DEFAULT_SORT_VALUE);
  const [statusValue, setStatusValue] = useState(DEFAULT_STATUS_VALUE);
  const [actionValue, setActionValue] = useState(DEFAULT_ACTION_VALUE);
  const [, setSearchParams] = useSearchParams();
  const versionScoped = version !== ALL_VERSIONS;

  const setParam = (key: string, value: string) =>
    setSearchParams(
      prev => {
        const next = new URLSearchParams(prev);
        next.set(key, value);
        return next;
      },
      { replace: false },
    );
  const onViewDetails = (deploymentId: string) =>
    setParam('deployment', deploymentId);
  const onViewLogs = (deploymentId: string) => setParam('logs', deploymentId);

  const sort = useMemo(() => sortValueToInput(sortValue), [sortValue]);
  const status = useMemo(() => filterValue(statusValue), [statusValue]);
  const action = useMemo(() => filterValue(actionValue), [actionValue]);

  const versionFilter = buildRepoVersionFilter(repoId, version);
  const filter = versionFilter
    ? {
        ...versionFilter,
        ...(status ? { status: { eq: status } } : {}),
        ...(action ? { action: { eq: action } } : {}),
      }
    : undefined;

  const { items, loading, loadingMore, error, hasMore, onLoadMore } =
    useInfiniteRelayList<RepoDeployment>(REPO_DEPLOYMENTS_QUERY, {
      responseKey: 'deployments',
      variables: { filter, sort },
      pageSize: 20,
      skip: hasNoVersions,
    });

  const sentinelRef = useInfiniteScroll({
    onLoadMore,
    hasMore,
    loading: loading || loadingMore,
  });

  if (hasNoVersions) {
    return <RepoNoVersionsState tabLabel="deployments" />;
  }

  const description = versionScoped
    ? 'Deployments stamped with this bundle version, across every instance in your organization.'
    : 'Deployments of this bundle across every instance in your organization.';

  return (
    <RepoTabLayout>
      <RepoTabHeader title="Deployments" description={description} />
      <Controls>
        <ControlGroup>
          <FilterListIcon fontSize="small" />
          <ControlSelect
            value={actionValue}
            onChange={(event: { target: { value: string } }) =>
              setActionValue(event.target.value)
            }
            size="small"
            variant="standard"
            InputProps={{ disableUnderline: true }}
            aria-label="Filter by action"
          >
            {ACTION_OPTIONS.map(option => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </ControlSelect>
        </ControlGroup>
        <ControlGroup>
          <FilterListIcon fontSize="small" />
          <ControlSelect
            value={statusValue}
            onChange={(event: { target: { value: string } }) =>
              setStatusValue(event.target.value)
            }
            size="small"
            variant="standard"
            InputProps={{ disableUnderline: true }}
            aria-label="Filter by deployment status"
          >
            {STATUS_OPTIONS.map(option => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </ControlSelect>
        </ControlGroup>
        <ControlGroup>
          <SortIcon fontSize="small" />
          <ControlSelect
            value={sortValue}
            onChange={(event: { target: { value: string } }) =>
              setSortValue(event.target.value)
            }
            size="small"
            variant="standard"
            InputProps={{ disableUnderline: true }}
            aria-label="Sort deployments"
          >
            {SORT_OPTIONS.map(option => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </ControlSelect>
        </ControlGroup>
      </Controls>
      {error ? (
        <Alert severity="error">{String(error.message ?? error)}</Alert>
      ) : loading && items.length === 0 ? (
        <DeploymentsTabLoading />
      ) : items.length === 0 ? (
        <RepoEmptyState
          icon={<HistoryIcon />}
          title="No deployments"
          description={
            versionScoped
              ? 'No deployments match these filters for this bundle version.'
              : 'No deployments match these filters for this bundle.'
          }
        />
      ) : (
        <List>
          {items.map(deployment => (
            <DeploymentRow
              key={deployment.id}
              deployment={deployment}
              onViewLogs={onViewLogs}
              onViewDetails={onViewDetails}
            />
          ))}
          <Sentinel ref={sentinelRef} />
          {loadingMore ? (
            <LoadingMoreRow>
              <LoadingIndicator size={24} delay={0} />
            </LoadingMoreRow>
          ) : null}
        </List>
      )}
    </RepoTabLayout>
  );
};

const Controls = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  flexWrap: 'wrap',
  paddingBottom: theme.spacing(0.5),
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const ControlGroup = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.75),
  color: theme.palette.text.secondary,
  '& > svg': {
    color: theme.palette.text.disabled,
  },
}));

const ControlSelect = stylin(Select)(({ theme }: { theme: any }) => ({
  [`& .${selectClasses.select}`]: {
    fontSize: theme.typography.body2.fontSize,
    padding: theme.spacing(0.25, 0.5),
    paddingRight: `${theme.spacing(3)} !important`,
    color: theme.palette.text.primary,
    borderRadius: 1,
  },
}));

const List = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1.5),
}));

const Sentinel = stylin('div')({
  height: 1,
  width: '100%',
});

const LoadingMoreRow = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(1.5),
}));
