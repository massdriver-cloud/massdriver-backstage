import { useRef } from 'react';

export interface DataListSort {
  field: string;
  direction: 'asc' | 'desc';
}
export interface DataListState {
  search: string;
  page: number;
  pageSize: number;
  sort: DataListSort | null;
}

interface PageResult {
  cursor?: { next?: string | null } | null;
}

const mapSort = (
  sort: DataListSort | null,
  fieldMap: Record<string, string>,
): { field: string; order: 'ASC' | 'DESC' } | undefined => {
  if (!sort) {
    return undefined;
  }
  const field = fieldMap[sort.field];
  if (!field) {
    return undefined;
  }
  return { field, order: sort.direction === 'asc' ? 'ASC' : 'DESC' };
};

export const useCursorPagination = ({
  state,
  sortFieldMap = {},
}: {
  state: DataListState;
  sortFieldMap?: Record<string, string>;
}) => {
  const cursorsRef = useRef(new Map<number, string>());
  const prevSortKeyRef = useRef('');

  const sort = mapSort(state.sort, sortFieldMap);

  const sortKey = `${sort?.field}-${sort?.order}-${state.pageSize}-${state.search}`;
  if (sortKey !== prevSortKeyRef.current) {
    cursorsRef.current = new Map();
    prevSortKeyRef.current = sortKey;
  }

  const next = state.page > 0 ? cursorsRef.current.get(state.page) : undefined;
  const cursor = {
    limit: state.pageSize,
    ...(next ? { next } : {}),
  };

  const processPage = (page: PageResult | null | undefined) => {
    if (page?.cursor?.next) {
      cursorsRef.current.set(state.page + 1, page.cursor.next);
    }
    return { hasMore: !!page?.cursor?.next };
  };

  return { cursor, sort, processPage };
};
