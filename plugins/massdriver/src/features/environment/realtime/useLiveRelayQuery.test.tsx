import { ReactNode } from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import { TestApiProvider } from '@backstage/frontend-test-utils';
import { massdriverApiRef, MassdriverApi } from '../../../api';
import { useLiveRelayQuery } from './useLiveRelayQuery';
import { RealtimeProvider } from './RealtimeProvider';

const QUERY = 'query MassdriverThing($id: ID!) { thing(id: $id) { id } }';

describe('useLiveRelayQuery', () => {
  const createMockApi = () => {
    const api: jest.Mocked<MassdriverApi> = {
      appUrl: 'https://app.massdriver.cloud',
      organizationId: 'org-1',
      query: jest.fn(),
      fetchText: jest.fn(),
      subscribe: jest.fn().mockImplementation(
        (_query, _variables, _handlers, signal?: AbortSignal) =>
          new Promise<void>(resolve => {
            signal?.addEventListener('abort', () => resolve(), { once: true });
          }),
      ),
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

  it('loads once and exposes the result', async () => {
    const api = createMockApi();
    api.query.mockResolvedValue({ thing: { id: 'a' } });

    const { result } = renderHook(
      () => useLiveRelayQuery<{ thing: { id: string } }>(QUERY, { id: 'a' }),
      { wrapper: createWrapper(api) },
    );

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.value).toEqual({ thing: { id: 'a' } });
    expect(api.query).toHaveBeenCalledWith(QUERY, { id: 'a' });
  });

  it('skips when variables are null', () => {
    const api = createMockApi();
    const { result } = renderHook(() => useLiveRelayQuery(QUERY, null), {
      wrapper: createWrapper(api),
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.value).toBeUndefined();
    expect(api.query).not.toHaveBeenCalled();
  });

  it('exposes errors', async () => {
    const api = createMockApi();
    api.query.mockRejectedValue(new Error('boom'));

    const { result } = renderHook(() => useLiveRelayQuery(QUERY, { id: 'a' }), {
      wrapper: createWrapper(api),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error?.message).toBe('boom');
  });

  it('drops the previous result and reloads when the identity changes', async () => {
    const api = createMockApi();
    api.query.mockResolvedValueOnce({ thing: { id: 'a' } });

    const { result, rerender } = renderHook(
      ({ id }: { id: string }) =>
        useLiveRelayQuery<{ thing: { id: string } }>(QUERY, { id }),
      { wrapper: createWrapper(api), initialProps: { id: 'a' } },
    );
    await waitFor(() => expect(result.current.value).toBeDefined());

    let resolveSecond!: (value: unknown) => void;
    api.query.mockImplementationOnce(
      () => new Promise(resolve => (resolveSecond = resolve)),
    );
    rerender({ id: 'b' });

    expect(result.current.loading).toBe(true);
    expect(result.current.value).toBeUndefined();

    await act(async () => resolveSecond({ thing: { id: 'b' } }));
    await waitFor(() =>
      expect(result.current.value).toEqual({ thing: { id: 'b' } }),
    );
    expect(result.current.loading).toBe(false);
  });

  it('keeps the previous result rendered during a revision refetch (no flash)', async () => {
    jest.useFakeTimers();
    try {
      const api = createMockApi();
      let emitEvent: ((data: unknown) => void) | undefined;
      api.subscribe.mockImplementation(
        (_query, _variables, handlers, signal?: AbortSignal) => {
          emitEvent = handlers.onData;
          return new Promise<void>(resolve => {
            signal?.addEventListener('abort', () => resolve(), { once: true });
          });
        },
      );
      api.query.mockResolvedValueOnce({ thing: { id: 'a', version: 1 } });

      const wrapper = ({ children }: { children: ReactNode }) => (
        <TestApiProvider apis={[[massdriverApiRef, api]]}>
          <RealtimeProvider projectId="proj" environmentId="proj-env">
            {children}
          </RealtimeProvider>
        </TestApiProvider>
      );

      const { result } = renderHook(
        () => useLiveRelayQuery<{ thing: unknown }>(QUERY, { id: 'a' }),
        { wrapper },
      );
      await waitFor(() =>
        expect(result.current.value).toEqual({
          thing: { id: 'a', version: 1 },
        }),
      );

      let resolveRefetch!: (value: unknown) => void;
      api.query.mockImplementationOnce(
        () => new Promise(resolve => (resolveRefetch = resolve)),
      );
      act(() => emitEvent?.({ environmentEvents: { action: 'UPDATED' } }));
      act(() => jest.advanceTimersByTime(300));

      expect(result.current.loading).toBe(false);
      expect(result.current.value).toEqual({ thing: { id: 'a', version: 1 } });

      await act(async () => resolveRefetch({ thing: { id: 'a', version: 2 } }));
      await waitFor(() =>
        expect(result.current.value).toEqual({
          thing: { id: 'a', version: 2 },
        }),
      );
    } finally {
      jest.useRealTimers();
    }
  });
});
