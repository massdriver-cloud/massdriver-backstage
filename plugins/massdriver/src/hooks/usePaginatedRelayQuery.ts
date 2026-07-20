import { useApi } from '@backstage/frontend-plugin-api';
import { useState } from 'react';
import useAsync from 'react-use/esm/useAsync';
import { massdriverApiRef } from '../api';
import {
  DataListSort,
  DataListState,
  useCursorPagination,
} from './useCursorPagination';

export interface PaginatedResult<T> {
  items: T[];
  loading: boolean;
  error?: Error;
  hasMore: boolean;
  dataListParams: {
    state: DataListState;
    onStateChange: (state: DataListState) => void;
  };
}

interface RelayPage<T> {
  items?: (T | null)[] | null;
  cursor?: { next?: string | null } | null;
}

export const usePaginatedRelayQuery = <T>(
  query: string,
  {
    responseKey,
    sortFieldMap = {},
    defaultSort = null,
    pageSize = 20,
    filterFromSearch,
    baseFilter,
    variables,
  }: {
    responseKey: string | string[];
    sortFieldMap?: Record<string, string>;
    defaultSort?: DataListSort | null;
    pageSize?: number;
    filterFromSearch?: (search: string) => Record<string, unknown>;
    baseFilter?: Record<string, unknown>;
    variables?: Record<string, unknown>;
  },
): PaginatedResult<T> => {
  const api = useApi(massdriverApiRef);
  const [state, setState] = useState<DataListState>({
    search: '',
    page: 0,
    pageSize,
    sort: defaultSort,
  });

  const { cursor, sort, processPage } = useCursorPagination({
    state,
    sortFieldMap,
  });

  const searchFilter = state.search
    ? filterFromSearch
      ? filterFromSearch(state.search)
      : { search: state.search }
    : undefined;
  const filter =
    baseFilter || searchFilter
      ? { ...(baseFilter ?? {}), ...(searchFilter ?? {}) }
      : undefined;

  const {
    value: page,
    loading,
    error,
  } = useAsync(async () => {
    const data = (await api.query(query, {
      ...(variables ?? {}),
      sort,
      cursor,
      filter,
    })) as Record<string, unknown>;
    const path = Array.isArray(responseKey) ? responseKey : [responseKey];
    return path.reduce<unknown>(
      (node, key) =>
        (node as Record<string, unknown> | null | undefined)?.[key],
      data,
    ) as RelayPage<T> | undefined;
  }, [
    api,
    query,
    JSON.stringify(responseKey),
    state.page,
    state.pageSize,
    state.search,
    sort?.field,
    sort?.order,
    JSON.stringify(baseFilter ?? null),
    JSON.stringify(variables ?? null),
  ]);

  const { hasMore } = processPage(page);

  return {
    items: (page?.items ?? []).filter(Boolean) as T[],
    loading,
    error,
    hasMore,
    dataListParams: { state, onStateChange: setState },
  };
};
