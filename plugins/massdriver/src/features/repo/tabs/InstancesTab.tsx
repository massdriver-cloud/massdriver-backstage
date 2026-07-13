import { useMemo, useState } from 'react';
import Alert from '@massdriver/ui/Alert';
import Box from '@massdriver/ui/Box';
import LoadingIndicator from '@massdriver/ui/LoadingIndicator';
import Select, { MenuItem } from '@massdriver/ui/Select';
import ExtensionIcon from '@massdriver/ui/icons/ExtensionIcon';
import FilterListIcon from '@massdriver/ui/icons/FilterListIcon';
import SortIcon from '@massdriver/ui/icons/SortIcon';
import stylin from '@massdriver/ui/stylin';
import { RepoEmptyState } from '../RepoEmptyState';
import { RepoNoVersionsState } from '../RepoNoVersionsState';
import { RepoTabHeader } from '../RepoTabHeader';
import { RepoTabLayout } from '../RepoTabLayout';
import { buildRepoVersionFilter } from '../repoFilter';
import { ALL_VERSIONS } from '../resolveVersion';
import { REPO_INSTANCES_QUERY } from '../queries';
import type { RepoTabProps } from '../RepoDetailsPage';
import type { RepoInstance } from '../types';
import { useInfiniteRelayList } from '../useInfiniteRelayList';
import { useInfiniteScroll } from '../useInfiniteScroll';
import { InstanceRow } from './InstanceRow';
import { InstancesTabLoading } from './InstancesTab.loading';
import {
  DEFAULT_SORT_VALUE,
  DEFAULT_STATUS_VALUE,
  SORT_OPTIONS,
  STATUS_OPTIONS,
  sortValueToInput,
  statusValueToFilter,
} from './InstancesTab.helpers';
import { selectClasses } from '../../../theme/muiClasses';

// Ported from apps/web/features/repos/sections/InstancesTab/ (container + view
// merged into one component, matching this plugin's single-file tab style). The
// web app's infinite-scroll card list is reproduced here over the relay via
// useInfiniteRelayList + an IntersectionObserver sentinel.
export const InstancesTab = ({
  repoId,
  version,
  hasNoVersions,
}: RepoTabProps) => {
  const [sortValue, setSortValue] = useState(DEFAULT_SORT_VALUE);
  const [statusValue, setStatusValue] = useState(DEFAULT_STATUS_VALUE);
  const versionScoped = version !== ALL_VERSIONS;

  const sort = useMemo(() => sortValueToInput(sortValue), [sortValue]);
  const status = useMemo(() => statusValueToFilter(statusValue), [statusValue]);

  const versionFilter = buildRepoVersionFilter(repoId, version);
  const filter =
    versionFilter && status
      ? { ...versionFilter, status: { eq: status } }
      : versionFilter;

  const { items, loading, loadingMore, error, hasMore, onLoadMore } =
    useInfiniteRelayList<RepoInstance>(REPO_INSTANCES_QUERY, {
      responseKey: 'instances',
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
    return <RepoNoVersionsState tabLabel="instances" />;
  }

  const description = versionScoped
    ? 'Instances of this bundle version across your organization.'
    : 'Instances using any version of this bundle across your organization.';

  return (
    <RepoTabLayout>
      <RepoTabHeader title="Instances" description={description} />
      <Controls>
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
            aria-label="Filter by instance status"
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
            aria-label="Sort instances"
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
        <InstancesTabLoading />
      ) : items.length === 0 ? (
        <RepoEmptyState
          icon={<ExtensionIcon />}
          title="No instances"
          description={
            versionScoped
              ? 'No instances match these filters for this bundle version.'
              : 'No instances match these filters for this bundle.'
          }
        />
      ) : (
        <List>
          {items.map(instance => (
            <InstanceRow key={instance.id} instance={instance} />
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
