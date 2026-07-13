import { useApi } from '@backstage/frontend-plugin-api';
import { useCallback, useEffect, useRef, useState } from 'react';
import { massdriverApiRef } from '../../api';

interface RelayPage<T> {
  items?: (T | null)[] | null;
  cursor?: { next?: string | null } | null;
}

export interface InfiniteRelayResult<T> {
  items: T[];
  loading: boolean;
  loadingMore: boolean;
  error?: Error;
  hasMore: boolean;
  onLoadMore: () => void;
}

/**
 * Feature-local equivalent of the web app's `useInfiniteQuery` for the relay:
 * accumulates cursor pages into one growing list (`onLoadMore` appends the next
 * page). The accumulated list resets whenever the query inputs (variables/skip)
 * change, so a filter or sort change starts a fresh list. Page size defaults to
 * 20. Mirrors the web's Apollo `useInfiniteQuery` return shape
 * (`items`/`loading`/`loadingMore`/`error`/`hasMore`/`onLoadMore`).
 */
export const useInfiniteRelayList = <T>(
  query: string,
  {
    responseKey,
    variables,
    pageSize = 20,
    skip = false,
  }: {
    /** Key of the paginated page in the response; an array walks a nested path. */
    responseKey: string | string[];
    variables?: Record<string, unknown>;
    pageSize?: number;
    skip?: boolean;
  },
): InfiniteRelayResult<T> => {
  const api = useApi(massdriverApiRef);

  // Latest values read inside the async fetch without widening its deps — the
  // effect keys off `resetKey` (a stable serialization) instead.
  const variablesRef = useRef(variables);
  variablesRef.current = variables;
  const path = Array.isArray(responseKey) ? responseKey : [responseKey];

  const resetKey = JSON.stringify({
    query,
    variables: variables ?? null,
    skip,
  });

  const [items, setItems] = useState<T[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<Error | undefined>(undefined);

  const fetchingRef = useRef(false);
  const requestIdRef = useRef(0);

  const runFetch = useCallback(
    async (cursorNext: string | null, mode: 'initial' | 'more') => {
      fetchingRef.current = true;
      const requestId = ++requestIdRef.current;
      if (mode === 'initial') setLoading(true);
      else setLoadingMore(true);
      setError(undefined);
      try {
        const data = (await api.query(query, {
          ...(variablesRef.current ?? {}),
          cursor: {
            limit: pageSize,
            ...(cursorNext ? { next: cursorNext } : {}),
          },
        })) as Record<string, unknown>;
        // A newer fetch superseded this one (filters changed mid-flight); drop it.
        if (requestId !== requestIdRef.current) return;
        const page = path.reduce<unknown>(
          (node, key) =>
            (node as Record<string, unknown> | null | undefined)?.[key],
          data,
        ) as RelayPage<T> | undefined;
        const pageItems = (page?.items ?? []).filter(Boolean) as T[];
        setItems(prev =>
          mode === 'initial' ? pageItems : [...prev, ...pageItems],
        );
        setNextCursor(page?.cursor?.next ?? null);
      } catch (caught) {
        if (requestId !== requestIdRef.current) return;
        setError(caught as Error);
      } finally {
        if (requestId === requestIdRef.current) {
          if (mode === 'initial') setLoading(false);
          else setLoadingMore(false);
        }
        fetchingRef.current = false;
      }
    },
    // path is derived from responseKey, which is part of resetKey.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [api, query, pageSize, resetKey],
  );

  // Reset and re-fetch from the first page whenever the query inputs change.
  useEffect(() => {
    setItems([]);
    setNextCursor(null);
    if (skip) {
      setLoading(false);
      setLoadingMore(false);
      return;
    }
    runFetch(null, 'initial');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  const onLoadMore = useCallback(() => {
    if (!nextCursor || fetchingRef.current || loading || loadingMore) return;
    runFetch(nextCursor, 'more');
  }, [nextCursor, loading, loadingMore, runFetch]);

  return {
    items,
    loading,
    loadingMore,
    error,
    hasMore: Boolean(nextCursor),
    onLoadMore,
  };
};

export default useInfiniteRelayList;
