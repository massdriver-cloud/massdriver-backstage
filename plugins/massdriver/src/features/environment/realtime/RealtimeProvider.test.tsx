import { ReactNode } from 'react';
import { render, renderHook, act } from '@testing-library/react';
import { TestApiProvider } from '@backstage/frontend-test-utils';
import { massdriverApiRef, MassdriverApi } from '../../../api';
import { RealtimeProvider, useRealtimeRevision } from './RealtimeProvider';
import {
  ENVIRONMENT_EVENTS_SUBSCRIPTION,
  PROJECT_EVENTS_SUBSCRIPTION,
} from './queries';

type Handlers = { onData: (data: unknown) => void };

describe('RealtimeProvider', () => {
  const createMockApi = () => {
    const captured = new Map<string, (data: unknown) => void>();
    const api: jest.Mocked<MassdriverApi> = {
      appUrl: 'https://app.massdriver.cloud',
      organizationId: 'org-1',
      query: jest.fn(),
      fetchText: jest.fn(),
      subscribe: jest
        .fn()
        .mockImplementation(
          (
            query: string,
            _variables: unknown,
            handlers: Handlers,
            signal?: AbortSignal,
          ) => {
            captured.set(query, handlers.onData);
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

  const setup = () => {
    const { api, captured } = createMockApi();
    const revisions: number[] = [];
    const Probe = () => {
      revisions.push(useRealtimeRevision());
      return null;
    };
    render(
      <TestApiProvider apis={[[massdriverApiRef, api]]}>
        <RealtimeProvider projectId="proj" environmentId="proj-env">
          <Probe />
        </RealtimeProvider>
      </TestApiProvider>,
    );
    const latestRevision = () => revisions[revisions.length - 1];
    const emitEnvironment = () =>
      act(() =>
        captured.get(ENVIRONMENT_EVENTS_SUBSCRIPTION)?.({
          environmentEvents: {},
        }),
      );
    const emitProject = () =>
      act(() =>
        captured.get(PROJECT_EVENTS_SUBSCRIPTION)?.({ projectEvents: {} }),
      );
    return { api, latestRevision, emitEnvironment, emitProject };
  };

  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('starts at revision 0', () => {
    const { latestRevision } = setup();
    expect(latestRevision()).toBe(0);
  });

  it('subscribes to both environment and project events', () => {
    const { api } = setup();
    const documents = api.subscribe.mock.calls.map(call => call[0]);
    expect(documents).toContain(ENVIRONMENT_EVENTS_SUBSCRIPTION);
    expect(documents).toContain(PROJECT_EVENTS_SUBSCRIPTION);
    expect(api.subscribe).toHaveBeenCalledWith(
      PROJECT_EVENTS_SUBSCRIPTION,
      { projectId: 'proj' },
      expect.anything(),
      expect.anything(),
    );
  });

  it('bumps the revision once after the coalesce window following one event', () => {
    const { latestRevision, emitEnvironment } = setup();

    emitEnvironment();
    act(() => jest.advanceTimersByTime(249));
    expect(latestRevision()).toBe(0);

    act(() => jest.advanceTimersByTime(1));
    expect(latestRevision()).toBe(1);
  });

  it('bumps the revision for a project event (blueprint changes)', () => {
    const { latestRevision, emitProject } = setup();

    emitProject();
    act(() => jest.advanceTimersByTime(250));
    expect(latestRevision()).toBe(1);
  });

  it('coalesces a burst of events within one window into a single bump', () => {
    const { latestRevision, emitEnvironment } = setup();

    for (let count = 0; count < 5; count += 1) {
      emitEnvironment();
    }
    act(() => jest.advanceTimersByTime(250));

    expect(latestRevision()).toBe(1);
  });

  it('coalesces a cross-scope burst (project + environment) into a single bump', () => {
    const { latestRevision, emitEnvironment, emitProject } = setup();

    emitEnvironment();
    emitProject();
    emitEnvironment();
    act(() => jest.advanceTimersByTime(250));

    expect(latestRevision()).toBe(1);
  });

  it('bumps separately for events in separate windows', () => {
    const { latestRevision, emitEnvironment } = setup();

    emitEnvironment();
    act(() => jest.advanceTimersByTime(250));
    expect(latestRevision()).toBe(1);

    emitEnvironment();
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
