import { useApi } from '@backstage/frontend-plugin-api';
import { resourcesUrl } from '@massdriver/backstage-plugin-common';
import Alert from '@massdriver/ui/Alert';
import Box from '@massdriver/ui/Box';
import DataList from '@massdriver/ui/DataList';
import Select from '@massdriver/ui/Select';
import stylin from '@massdriver/ui/stylin';
import { useState } from 'react';
import { massdriverApiRef } from '../../api';
import { OpenInMassdriverButton } from '../../components/OpenInMassdriverButton';
import { PageLayout } from '../../components/PageLayout';
import { usePaginatedRelayQuery } from '../../hooks/usePaginatedRelayQuery';
import { RESOURCES_QUERY } from './queries';
import { buildResourceColumns } from './resourceColumns';
import { ResourcesEmptyState } from './ResourcesEmptyState';
import { ResourceListItem, toResourceRow } from './toResourceRow';

// Ported from the Massdriver web app. The web app's "Import Resource" opens a dialog; here
// it deep-links into Massdriver (read-only parity).

type Origin = 'all' | 'IMPORTED' | 'PROVISIONED';

const ORIGIN_OPTIONS = [
  { value: 'all', label: 'All resources' },
  { value: 'IMPORTED', label: 'Imported only' },
  { value: 'PROVISIONED', label: 'Provisioned only' },
];

/** Read-only resources list, mirroring the web app's Resources page. */
export const ResourcesListPage = () => {
  const api = useApi(massdriverApiRef);
  const [origin, setOrigin] = useState<Origin>('all');
  const importUrl = `${resourcesUrl(
    api.appUrl,
    api.organizationId,
  )}?importResource=true`;

  return (
    <PageLayout
      title="Resources"
      description="All resources for your organization — both imported and provisioned. Resources flow into Massdriver automatically as instances deploy, or you can import existing resources by hand."
      actions={
        <OpenInMassdriverButton url={importUrl}>
          Import Resource
        </OpenInMassdriverButton>
      }
    >
      {/* Remount on origin change so paging state resets (mirrors the web's
          UsagePanel key pattern). */}
      <ResourcesList
        key={origin}
        origin={origin}
        onOriginChange={setOrigin}
        importUrl={importUrl}
      />
    </PageLayout>
  );
};

const ResourcesList = ({
  origin,
  onOriginChange,
  importUrl,
}: {
  origin: Origin;
  onOriginChange: (origin: Origin) => void;
  importUrl: string;
}) => {
  const baseFilter = origin === 'all' ? undefined : { origin: { eq: origin } };

  const { items, loading, error, hasMore, dataListParams } =
    usePaginatedRelayQuery<ResourceListItem>(RESOURCES_QUERY, {
      responseKey: 'resources',
      sortFieldMap: { name: 'NAME', createdAt: 'CREATED_AT' },
      defaultSort: { field: 'name', direction: 'asc' },
      pageSize: 25,
      baseFilter,
    });

  const api = useApi(massdriverApiRef);
  const columns = buildResourceColumns({
    appUrl: api.appUrl,
    organizationId: api.organizationId,
  });
  const rows = items.map(toResourceRow);

  const filtersActive =
    origin !== 'all' || Boolean(dataListParams.state.search);
  const showEmptyState =
    !loading && !error && !filtersActive && rows.length === 0;

  // With no resources and no active filters, the web shows a catalog-onboarding
  // card in place of the toolbar + table.
  if (showEmptyState) {
    return <ResourcesEmptyState importUrl={importUrl} />;
  }

  return (
    <Wrap>
      <Toolbar>
        <FilterSelect
          size="small"
          label="Show"
          options={ORIGIN_OPTIONS}
          value={origin}
          onChange={(event: { target: { value: Origin } }) =>
            onOriginChange(event.target.value)
          }
        />
      </Toolbar>
      {error ? (
        <Alert severity="error">{String(error.message ?? error)}</Alert>
      ) : (
        <DataList
          rows={rows}
          columns={columns}
          loading={loading}
          serverSide
          searchable
          searchPlaceholder="Search resources…"
          hasMore={hasMore}
          emptyMessage="No resources match."
          variant="outlined"
          {...dataListParams}
        />
      )}
    </Wrap>
  );
};

const Wrap = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
}));

const Toolbar = stylin(Box)({
  display: 'flex',
  alignItems: 'center',
});

const FilterSelect = stylin(Select)(({ theme }: { theme: any }) => ({
  minWidth: theme.spacing(28),
}));
