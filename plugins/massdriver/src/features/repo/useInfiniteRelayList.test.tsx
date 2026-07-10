import { ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { TestApiProvider } from '@backstage/frontend-test-utils';
import { massdriverApiRef, MassdriverApi } from '../../api';
import { useInfiniteRelayList } from './useInfiniteRelayList';

const QUERY =
  'query MassdriverThings { things { items { id } cursor { next } } }';

interface Thing {
  id: string;
}

const mockApi = (): jest.Mocked<MassdriverApi> => ({
  appUrl: 'https://app.massdriver.cloud',
  organizationId: 'org-1',
  query: jest.fn(),
  fetchText: jest.fn(),
  subscribe: jest.fn().mockResolvedValue(undefined),
});

const wrapper =
  (api: MassdriverApi) =>
  ({ children }: { children: ReactNode }) =>
    (
      <TestApiProvider apis={[[massdriverApiRef, api]]}>
        {children}
      </TestApiProvider>
    );

const page = (items: (Thing | null)[], next?: string) => ({
  things: { items, cursor: { next: next ?? null } },
});

describe('useInfiniteRelayList', () => {
  it('fetches the first page with the page-size limit', async () => {
    const api = mockApi();
    api.query.mockResolvedValue(page([{ id: 'a' }]));

    const { result } = renderHook(
      () =>
        useInfiniteRelayList<Thing>(QUERY, {
          responseKey: 'things',
          variables: { filter: { x: 1 } },
        }),
      { wrapper: wrapper(api) },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(api.query).toHaveBeenCalledWith(QUERY, {
      filter: { x: 1 },
      cursor: { limit: 20 },
    });
    expect(result.current.items).toEqual([{ id: 'a' }]);
    expect(result.current.hasMore).toBe(false);
  });

  it('accumulates the next page onto the list via onLoadMore', async () => {
    const api = mockApi();
    api.query
      .mockResolvedValueOnce(page([{ id: 'a' }], 'cursor-2'))
      .mockResolvedValueOnce(page([{ id: 'b' }]));

    const { result } = renderHook(
      () => useInfiniteRelayList<Thing>(QUERY, { responseKey: 'things' }),
      { wrapper: wrapper(api) },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.hasMore).toBe(true);

    act(() => result.current.onLoadMore());

    await waitFor(() =>
      expect(result.current.items).toEqual([{ id: 'a' }, { id: 'b' }]),
    );
    expect(api.query).toHaveBeenLastCalledWith(QUERY, {
      cursor: { limit: 20, next: 'cursor-2' },
    });
    expect(result.current.hasMore).toBe(false);
  });

  it('resets the accumulated list when variables change', async () => {
    const api = mockApi();
    api.query.mockImplementation(async (_query, variables: any) =>
      variables?.filter?.status === 'FAILED'
        ? page([{ id: 'failed-1' }])
        : page([{ id: 'a' }], 'cursor-2'),
    );

    const { result, rerender } = renderHook(
      ({ status }: { status?: string }) =>
        useInfiniteRelayList<Thing>(QUERY, {
          responseKey: 'things',
          variables: { filter: status ? { status } : {} },
        }),
      {
        wrapper: wrapper(api),
        initialProps: { status: undefined } as { status?: string },
      },
    );

    await waitFor(() => expect(result.current.items).toEqual([{ id: 'a' }]));

    rerender({ status: 'FAILED' });
    await waitFor(() =>
      expect(result.current.items).toEqual([{ id: 'failed-1' }]),
    );
    expect(result.current.hasMore).toBe(false);
  });

  it('does not fetch when skipped', async () => {
    const api = mockApi();
    const { result } = renderHook(
      () =>
        useInfiniteRelayList<Thing>(QUERY, {
          responseKey: 'things',
          skip: true,
        }),
      { wrapper: wrapper(api) },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(api.query).not.toHaveBeenCalled();
    expect(result.current.items).toEqual([]);
  });

  it('surfaces query errors', async () => {
    const api = mockApi();
    api.query.mockRejectedValue(new Error('relay down'));

    const { result } = renderHook(
      () => useInfiniteRelayList<Thing>(QUERY, { responseKey: 'things' }),
      { wrapper: wrapper(api) },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error?.message).toBe('relay down');
    expect(result.current.items).toEqual([]);
  });
});
