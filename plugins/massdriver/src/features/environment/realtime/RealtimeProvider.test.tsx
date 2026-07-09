import { ReactNode } from 'react';
import { render, renderHook, act } from '@testing-library/react';
import { TestApiProvider } from '@backstage/frontend-test-utils';
import { massdriverApiRef, MassdriverApi } from '../../../api';
import { RealtimeProvider, useRealtimeRevision } from './RealtimeProvider';

type Handlers = { onData: (data: unknown) => void };

describe('RealtimeProvider', () => {
  const createMockApi = () => {
    // Capture the subscription's onData so the test can emit environment events.
    const captured: { emit?: (data: unknown) => void } = {};
    const api: jest.Mocked<MassdriverApi> = {
      appUrl: 'https://app.massdriver.cloud',
      organizationId: 'org-1',
      query: jest.fn(),
      subscribe: jest
        .fn()
        .mockImplementation(
          (
            _query: string,
            _variables: unknown,
            handlers: Handlers,
            signal?: AbortSignal,
          ) => {
            captured.emit = handlers.onData;
            return new Promise<void>(resolve => {
              signal?.addEventListener('abort', () => resolve(), {
                once: true,
              });
            });
          },
        ),
    };
    return { api, captured };
  };

  // Renders a probe that reports the current revision and lets the test emit
  // realtime events through the captured subscription handler.
  const setup = () => {
    const { api, captured } = createMockApi();
    const revisions: number[] = [];
    const Probe = () => {
      revisions.push(useRealtimeRevision());
      return null;
    };
    render(
      <TestApiProvider apis={[[massdriverApiRef, api]]}>
        <RealtimeProvider environmentId="proj-env">
          <Probe />
        </RealtimeProvider>
      </TestApiProvider>,
    );
    const latestRevision = () => revisions[revisions.length - 1];
    const emit = () => act(() => captured.emit?.({ environmentEvents: {} }));
    return { latestRevision, emit };
  };

  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('starts at revision 0', () => {
    const { latestRevision } = setup();
    expect(latestRevision()).toBe(0);
  });

  it('bumps the revision once after the coalesce window following one event', () => {
    const { latestRevision, emit } = setup();

    emit();
    // Not yet — the trailing-edge timer has not fired.
    act(() => jest.advanceTimersByTime(249));
    expect(latestRevision()).toBe(0);

    act(() => jest.advanceTimersByTime(1));
    expect(latestRevision()).toBe(1);
  });

  it('coalesces a burst of events within one window into a single bump', () => {
    const { latestRevision, emit } = setup();

    for (let count = 0; count < 5; count += 1) {
      emit();
    }
    act(() => jest.advanceTimersByTime(250));

    expect(latestRevision()).toBe(1);
  });

  it('bumps separately for events in separate windows', () => {
    const { latestRevision, emit } = setup();

    emit();
    act(() => jest.advanceTimersByTime(250));
    expect(latestRevision()).toBe(1);

    emit();
    act(() => jest.advanceTimersByTime(250));
    expect(latestRevision()).toBe(2);
  });

  it('returns 0 from useRealtimeRevision outside a provider', () => {
    const { result } = renderHook(() => useRealtimeRevision(), {
      wrapper: ({ children }: { children: ReactNode }) => <>{children}</>,
    });
    expect(result.current).toBe(0);
  });
});
