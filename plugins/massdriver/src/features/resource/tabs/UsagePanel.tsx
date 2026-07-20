import Alert from '@massdriver/ui/Alert';
import DataList from '@massdriver/ui/DataList';
import { usePaginatedRelayQuery } from '../../../hooks/usePaginatedRelayQuery';
import { USAGE_TYPE_CONFIG, UsageType } from './UsageTab.helpers';

export const UsagePanel = ({
  type,
  resourceId,
}: {
  type: UsageType;
  resourceId: string;
}) => {
  const config = USAGE_TYPE_CONFIG[type];

  const { items, loading, error, hasMore, dataListParams } =
    usePaginatedRelayQuery<any>(config.query, {
      responseKey: config.responseKey,
      variables: { id: resourceId },
      pageSize: 20,
    });

  const columns = config.buildColumns();
  const rows = items.map(config.mapRow);

  return error ? (
    <Alert severity="error">{String(error.message ?? error)}</Alert>
  ) : (
    <DataList
      rows={rows}
      columns={columns}
      loading={loading}
      serverSide
      hasMore={hasMore}
      emptyMessage={config.emptyMessage}
      variant="outlined"
      {...dataListParams}
    />
  );
};
