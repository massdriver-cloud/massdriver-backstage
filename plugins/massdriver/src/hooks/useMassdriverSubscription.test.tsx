import { ReactNode } from 'react';
import { renderHook, act } from '@testing-library/react';
import { TestApiProvider } from '@backstage/frontend-test-utils';
import { massdriverApiRef, MassdriverApi } from '../api';
import { useMassdriverSubscription } from './useMassdriverSubscription';

const QUERY =
  'subscription MassdriverThing($id: ID!) { thing(id: $id) { id } }';

type Handlers = {
  onData: (data: unknown) => void;
  onError?: (error: Error) => void;
};

describe('useMassdriverSubscription', () => {
  const createMockApi = () => {
    const streams: Array<{
      handlers: Handlers;
      signal?: AbortSignal;
      end: () => void;
    }> = [];
    const api: jest.Mocked<MassdriverApi> = {
      appUrl: 'https://app.massdriver.cloud',
      organizationId: 'org-1',
      query: jest.fn(),
      fetchText: jest.fn(),
      subscribe: jest.fn().mockImplementation(
        (
          _query: string,
          _variables: unknown,
          handlers: Handlers,
          signal?: AbortSignal,
        ) =>
          new Promise<void>(resolve => {
            streams.push({ handlers, signal, end: () => resolve() });
            signal?.addEventListener('abort', () => resolve(), { once: true });
          }),
      ),
    };
    return { api, streams };
  };

  const createWrapper =
    (api: MassdriverApi) =>
    ({ children }: { children: ReactNode }) =>
      (
        <TestApiProvider apis={[[massdriverApiRef, api]]}>
          {children}
        </TestApiProvider>
      );

  const flushMicrotasks = async () => {
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
  };

  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('subscribes with the query, variables, handlers, and an abort signal', async () => {
    const { api, streams } = createMockApi();
    const onData = jest.fn();

    renderHook(
      () => useMassdriverSubscription(QUERY, { id: 'a' }, { onData }),
      {
        wrapper: createWrapper(api),
      },
    );
    await flushMicrotasks();

    expect(api.subscribe).toHaveBeenCalledTimes(1);
    const [query, variables, handlers, signal] = api.subscribe.mock.calls[0];
    expect(query).toBe(QUERY);
    expect(variables).toEqual({ id: 'a' });
    expect(typeof handlers.onData).toBe('function');
    expect(signal).toBeInstanceOf(AbortSignal);
    expect(streams[0].signal?.aborted).toBe(false);
  });

  it('reconnects with exponential backoff capped at 10s', async () => {
    const { api, streams } = createMockApi();

    renderHook(
      () =>
        useMassdriverSubscription(QUERY, { id: 'a' }, { onData: jest.fn() }),
      { wrapper: createWrapper(api) },
    );
    await flushMicrotasks();
    expect(api.subscribe).toHaveBeenCalledTimes(1);

    const expectedDelays = [1000, 2000, 4000, 8000, 10_000, 10_000];
    for (let attempt = 0; attempt < expectedDelays.length; attempt += 1) {
      const callsBefore = api.subscribe.mock.calls.length;
      act(() => streams[streams.length - 1].end());
      await flushMicrotasks();
      expect(api.subscribe).toHaveBeenCalledTimes(callsBefore);

      act(() => jest.advanceTimersByTime(expectedDelays[attempt] - 1));
      await flushMicrotasks();
      expect(api.subscribe).toHaveBeenCalledTimes(callsBefore);

      act(() => jest.advanceTimersByTime(1));
      await flushMicrotasks();
      expect(api.subscribe).toHaveBeenCalledTimes(callsBefore + 1);
    }
  });

  it('resets the backoff after a data message', async () => {
    const { api, streams } = createMockApi();

    renderHook(
      () =>
        useMassdriverSubscription(QUERY, { id: 'a' }, { onData: jest.fn() }),
      { wrapper: createWrapper(api) },
    );
    await flushMicrotasks();

    act(() => streams[streams.length - 1].end());
    await flushMicrotasks();
    act(() => jest.advanceTimersByTime(1000));
    await flushMicrotasks();
    act(() => streams[streams.length - 1].end());
    await flushMicrotasks();
    act(() => jest.advanceTimersByTime(2000));
    await flushMicrotasks();
    expect(api.subscribe).toHaveBeenCalledTimes(3);

    act(() => streams[streams.length - 1].handlers.onData({ ok: true }));
    const callsBefore = api.subscribe.mock.calls.length;
    act(() => streams[streams.length - 1].end());
    await flushMicrotasks();
    act(() => jest.advanceTimersByTime(1000));
    await flushMicrotasks();
    expect(api.subscribe).toHaveBeenCalledTimes(callsBefore + 1);
  });

  it('aborts the signal and stops reconnecting on unmount', async () => {
    const { api, streams } = createMockApi();

    const { unmount } = renderHook(
      () =>
        useMassdriverSubscription(QUERY, { id: 'a' }, { onData: jest.fn() }),
      { wrapper: createWrapper(api) },
    );
    await flushMicrotasks();
    expect(api.subscribe).toHaveBeenCalledTimes(1);

    unmount();
    expect(streams[0].signal?.aborted).toBe(true);

    await flushMicrotasks();
    act(() => jest.advanceTimersByTime(60_000));
    await flushMicrotasks();
    expect(api.subscribe).toHaveBeenCalledTimes(1);
  });

  it('never subscribes while skip is true and tears down when skip flips true', async () => {
    const { api, streams } = createMockApi();

    const { rerender } = renderHook(
      ({ skip }: { skip: boolean }) =>
        useMassdriverSubscription(
          QUERY,
          { id: 'a' },
          { onData: jest.fn(), skip },
        ),
      { wrapper: createWrapper(api), initialProps: { skip: true } },
    );
    await flushMicrotasks();
    expect(api.subscribe).not.toHaveBeenCalled();

    rerender({ skip: false });
    await flushMicrotasks();
    expect(api.subscribe).toHaveBeenCalledTimes(1);

    rerender({ skip: true });
    expect(streams[0].signal?.aborted).toBe(true);
  });

  it('does not re-subscribe when only the callback identities change', async () => {
    const { api } = createMockApi();

    const { rerender } = renderHook(
      () =>
        useMassdriverSubscription(
          QUERY,
          { id: 'a' },
          {
            onData: () => {},
            onError: () => {},
          },
        ),
      { wrapper: createWrapper(api) },
    );
    await flushMicrotasks();
    expect(api.subscribe).toHaveBeenCalledTimes(1);

    rerender();
    rerender();
    await flushMicrotasks();
    expect(api.subscribe).toHaveBeenCalledTimes(1);
  });
});
