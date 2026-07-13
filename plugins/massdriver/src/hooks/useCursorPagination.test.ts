import { renderHook, act } from '@testing-library/react';
import { useCursorPagination, type DataListState } from './useCursorPagination';

const baseState = (overrides: Partial<DataListState> = {}): DataListState => ({
  search: '',
  page: 0,
  pageSize: 20,
  sort: null,
  ...overrides,
});

describe('useCursorPagination', () => {
  it('requests only a limit on page zero', () => {
    const { result } = renderHook(() =>
      useCursorPagination({ state: baseState() }),
    );
    expect(result.current.cursor).toEqual({ limit: 20 });
  });

  it('maps a sort field through the sort field map', () => {
    const { result } = renderHook(() =>
      useCursorPagination({
        state: baseState({ sort: { field: 'name', direction: 'asc' } }),
        sortFieldMap: { name: 'NAME' },
      }),
    );
    expect(result.current.sort).toEqual({ field: 'NAME', order: 'ASC' });
  });

  it('maps descending direction to DESC', () => {
    const { result } = renderHook(() =>
      useCursorPagination({
        state: baseState({ sort: { field: 'name', direction: 'desc' } }),
        sortFieldMap: { name: 'NAME' },
      }),
    );
    expect(result.current.sort).toEqual({ field: 'NAME', order: 'DESC' });
  });

  it('yields an undefined sort for a null or unmapped field', () => {
    const { result: nullSort } = renderHook(() =>
      useCursorPagination({ state: baseState() }),
    );
    expect(nullSort.current.sort).toBeUndefined();

    const { result: unmapped } = renderHook(() =>
      useCursorPagination({
        state: baseState({ sort: { field: 'unknown', direction: 'asc' } }),
        sortFieldMap: { name: 'NAME' },
      }),
    );
    expect(unmapped.current.sort).toBeUndefined();
  });

  it('reports hasMore from the presence of a next cursor', () => {
    const { result } = renderHook(() =>
      useCursorPagination({ state: baseState() }),
    );
    expect(result.current.processPage({ cursor: { next: 'abc' } })).toEqual({
      hasMore: true,
    });
    expect(result.current.processPage({ cursor: { next: null } })).toEqual({
      hasMore: false,
    });
    expect(result.current.processPage(null)).toEqual({ hasMore: false });
  });

  it('records a page cursor and uses it on the next page', () => {
    const { result, rerender } = renderHook(
      ({ state }) => useCursorPagination({ state }),
      { initialProps: { state: baseState({ page: 0 }) } },
    );
    act(() => {
      result.current.processPage({ cursor: { next: 'cursor-1' } });
    });
    rerender({ state: baseState({ page: 1 }) });
    expect(result.current.cursor).toEqual({ limit: 20, next: 'cursor-1' });
  });

  it('resets recorded cursors when the sort changes', () => {
    const { result, rerender } = renderHook(
      ({ state, sortFieldMap }) => useCursorPagination({ state, sortFieldMap }),
      {
        initialProps: {
          state: baseState({
            page: 0,
            sort: { field: 'name', direction: 'asc' },
          }),
          sortFieldMap: { name: 'NAME' },
        },
      },
    );
    act(() => {
      result.current.processPage({ cursor: { next: 'cursor-1' } });
    });
    rerender({
      state: baseState({ page: 1, sort: { field: 'name', direction: 'desc' } }),
      sortFieldMap: { name: 'NAME' },
    });
    expect(result.current.cursor).toEqual({ limit: 20 });
  });

  it('resets recorded cursors when the search term changes', () => {
    const { result, rerender } = renderHook(
      ({ state }) => useCursorPagination({ state }),
      { initialProps: { state: baseState({ page: 0, search: '' }) } },
    );
    act(() => {
      result.current.processPage({ cursor: { next: 'cursor-1' } });
    });
    rerender({ state: baseState({ page: 1, search: 'redis' }) });
    expect(result.current.cursor).toEqual({ limit: 20 });
  });

  it('resets recorded cursors when the page size changes', () => {
    const { result, rerender } = renderHook(
      ({ state }) => useCursorPagination({ state }),
      { initialProps: { state: baseState({ page: 0, pageSize: 20 }) } },
    );
    act(() => {
      result.current.processPage({ cursor: { next: 'cursor-1' } });
    });
    rerender({ state: baseState({ page: 1, pageSize: 50 }) });
    expect(result.current.cursor).toEqual({ limit: 50 });
  });
});
