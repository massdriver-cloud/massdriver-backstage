import { ReactNode } from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import { TestApiProvider } from '@backstage/frontend-test-utils';
import { massdriverApiRef, MassdriverApi } from '../api';
import { usePaginatedRelayQuery } from './usePaginatedRelayQuery';

const QUERY =
  'query MassdriverThings { things { items { id } cursor { next } } }';
const RESPONSE_KEY = 'things';

interface Thing {
  id: string;
}

describe('usePaginatedRelayQuery', () => {
  const createMockApi = () => {
    const api: jest.Mocked<MassdriverApi> = {
      appUrl: 'https://app.massdriver.cloud',
      organizationId: 'org-1',
      query: jest.fn(),
      subscribe: jest.fn().mockResolvedValue(undefined),
    };
    return api;
  };

  const createWrapper =
    (api: MassdriverApi) =>
    ({ children }: { children: ReactNode }) =>
      (
        <TestApiProvider apis={[[massdriverApiRef, api]]}>
          {children}
        </TestApiProvider>
      );

  const page = (items: (Thing | null)[], next?: string) => ({
    [RESPONSE_KEY]: { items, cursor: { next: next ?? null } },
  });

  it('issues the initial fetch with limit, no sort, and no filter', async () => {
    const api = createMockApi();
    api.query.mockResolvedValue(page([{ id: 'a' }]));

    const { result } = renderHook(
      () => usePaginatedRelayQuery<Thing>(QUERY, { responseKey: RESPONSE_KEY }),
      { wrapper: createWrapper(api) },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(api.query).toHaveBeenCalledWith(QUERY, {
      sort: undefined,
      cursor: { limit: 20 },
      filter: undefined,
    });
    expect(result.current.items).toEqual([{ id: 'a' }]);
  });

  it('merges baseFilter into the request filter', async () => {
    const api = createMockApi();
    api.query.mockResolvedValue(page([{ id: 'a' }]));

    const { result } = renderHook(
      () =>
        usePaginatedRelayQuery<Thing>(QUERY, {
          responseKey: RESPONSE_KEY,
          baseFilter: { projectId: 'proj-1' },
        }),
      { wrapper: createWrapper(api) },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(api.query).toHaveBeenCalledWith(QUERY, {
      sort: undefined,
      cursor: { limit: 20 },
      filter: { projectId: 'proj-1' },
    });
  });

  it('adds the default {search} filter when the search state changes', async () => {
    const api = createMockApi();
    api.query.mockResolvedValue(page([{ id: 'a' }]));

    const { result } = renderHook(
      () => usePaginatedRelayQuery<Thing>(QUERY, { responseKey: RESPONSE_KEY }),
      { wrapper: createWrapper(api) },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() =>
      result.current.dataListParams.onStateChange({
        search: 'db',
        page: 0,
        pageSize: 20,
        sort: null,
      }),
    );

    await waitFor(() =>
      expect(api.query).toHaveBeenLastCalledWith(QUERY, {
        sort: undefined,
        cursor: { limit: 20 },
        filter: { search: 'db' },
      }),
    );
  });

  it('uses filterFromSearch to shape the search filter', async () => {
    const api = createMockApi();
    api.query.mockResolvedValue(page([{ id: 'a' }]));

    const { result } = renderHook(
      () =>
        usePaginatedRelayQuery<Thing>(QUERY, {
          responseKey: RESPONSE_KEY,
          filterFromSearch: (search: string) => ({
            name: { contains: search },
          }),
        }),
      { wrapper: createWrapper(api) },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() =>
      result.current.dataListParams.onStateChange({
        search: 'db',
        page: 0,
        pageSize: 20,
        sort: null,
      }),
    );

    await waitFor(() =>
      expect(api.query).toHaveBeenLastCalledWith(QUERY, {
        sort: undefined,
        cursor: { limit: 20 },
        filter: { name: { contains: 'db' } },
      }),
    );
  });

  it('advances a page using the recorded next cursor and reflects hasMore', async () => {
    const api = createMockApi();
    api.query.mockResolvedValueOnce(page([{ id: 'a' }], 'cursor-2'));

    const { result } = renderHook(
      () =>
        usePaginatedRelayQuery<Thing>(QUERY, {
          responseKey: RESPONSE_KEY,
          pageSize: 10,
        }),
      { wrapper: createWrapper(api) },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.hasMore).toBe(true);

    api.query.mockResolvedValueOnce(page([{ id: 'b' }]));
    act(() =>
      result.current.dataListParams.onStateChange({
        search: '',
        page: 1,
        pageSize: 10,
        sort: null,
      }),
    );

    await waitFor(() => expect(result.current.items).toEqual([{ id: 'b' }]));
    expect(api.query).toHaveBeenLastCalledWith(QUERY, {
      sort: undefined,
      cursor: { limit: 10, next: 'cursor-2' },
      filter: undefined,
    });
    expect(result.current.hasMore).toBe(false);
  });

  it('filters null entries out of the items list', async () => {
    const api = createMockApi();
    api.query.mockResolvedValue(page([{ id: 'a' }, null, { id: 'c' }]));

    const { result } = renderHook(
      () => usePaginatedRelayQuery<Thing>(QUERY, { responseKey: RESPONSE_KEY }),
      { wrapper: createWrapper(api) },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items).toEqual([{ id: 'a' }, { id: 'c' }]);
  });

  it('surfaces query errors', async () => {
    const api = createMockApi();
    api.query.mockRejectedValue(new Error('relay down'));

    const { result } = renderHook(
      () => usePaginatedRelayQuery<Thing>(QUERY, { responseKey: RESPONSE_KEY }),
      { wrapper: createWrapper(api) },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error?.message).toBe('relay down');
    expect(result.current.items).toEqual([]);
  });

  it('transitions loading from true to false', async () => {
    const api = createMockApi();
    api.query.mockResolvedValue(page([{ id: 'a' }]));

    const { result } = renderHook(
      () => usePaginatedRelayQuery<Thing>(QUERY, { responseKey: RESPONSE_KEY }),
      { wrapper: createWrapper(api) },
    );

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
  });
});
