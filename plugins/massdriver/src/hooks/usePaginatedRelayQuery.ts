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
  /** Spread onto DataList (controlled state + change handler). */
  dataListParams: {
    state: DataListState;
    onStateChange: (state: DataListState) => void;
  };
}

interface RelayPage<T> {
  items?: (T | null)[] | null;
  cursor?: { next?: string | null } | null;
}

/**
 * Server-side cursor pagination for a DataList, over the relay. Mirrors the web
 * app's `usePaginatedQuery` but keeps state local (no URL persistence) and
 * fetches through `massdriverApiRef` instead of Apollo.
 */
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
    /** Key of the paginated page in the response; an array walks a nested path
     * (e.g. `['resource', 'connections']`). */
    responseKey: string | string[];
    sortFieldMap?: Record<string, string>;
    defaultSort?: DataListSort | null;
    pageSize?: number;
    filterFromSearch?: (search: string) => Record<string, unknown>;
    /** Filter always applied (e.g. scoping by project), merged with search. */
    baseFilter?: Record<string, unknown>;
    /** Extra query variables (e.g. the parent entity `id` for nested pages). */
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
      (node, key) => (node as Record<string, unknown> | null | undefined)?.[key],
      data,
    ) as RelayPage<T> | undefined;
    // Re-fetch whenever the effective query inputs change.
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
