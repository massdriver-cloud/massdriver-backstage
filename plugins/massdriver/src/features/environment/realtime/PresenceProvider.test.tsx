import { render, act } from '@testing-library/react';
import { TestApiProvider } from '@backstage/frontend-test-utils';
import {
  massdriverApiRef,
  MassdriverApi,
  type MassdriverPresenceViewers,
} from '../../../api';
import {
  PresenceProvider,
  usePresence,
  type PresenceViewer,
} from './PresenceProvider';

type PresenceHandlers = {
  onData: (viewers: MassdriverPresenceViewers) => void;
  onError?: (error: Error) => void;
};

describe('PresenceProvider', () => {
  const createMockApi = () => {
    // Capture each presence stream's handlers so the test can emit snapshots.
    const captured: PresenceHandlers[] = [];
    const api: jest.Mocked<MassdriverApi> = {
      appUrl: 'https://app.massdriver.cloud',
      organizationId: 'org-1',
      query: jest.fn(),
      subscribe: jest.fn().mockResolvedValue(undefined),
      subscribePresence: jest
        .fn()
        .mockImplementation(
          (
            _environmentId: string,
            handlers: PresenceHandlers,
            signal?: AbortSignal,
          ) => {
            captured.push(handlers);
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

  const setup = (environmentId = 'proj-env') => {
    const { api, captured } = createMockApi();
    const snapshots: PresenceViewer[][] = [];
    const Probe = () => {
      snapshots.push(usePresence().viewers);
      return null;
    };
    const view = render(
      <TestApiProvider apis={[[massdriverApiRef, api]]}>
        <PresenceProvider environmentId={environmentId}>
          <Probe />
        </PresenceProvider>
      </TestApiProvider>,
    );
    const latest = () => snapshots[snapshots.length - 1];
    const emit = (viewers: MassdriverPresenceViewers) =>
      act(() => captured[captured.length - 1]?.onData(viewers));
    const fail = (error: Error) =>
      act(() => captured[captured.length - 1]?.onError?.(error));
    return { api, latest, emit, fail, view };
  };

  it('starts with no viewers', () => {
    const { latest } = setup();
    expect(latest()).toEqual([]);
  });

  it('opens the presence stream for the environment', () => {
    const { api } = setup();
    expect(api.subscribePresence).toHaveBeenCalledWith(
      'proj-env',
      expect.anything(),
      expect.anything(),
    );
  });

  it('skips when no environmentId is set', () => {
    const { api } = setup('');
    expect(api.subscribePresence).not.toHaveBeenCalled();
  });

  it('maps snake_case metas to viewers with focus derived from the cursor', () => {
    const { latest, emit } = setup();

    emit({
      'acct-1': {
        first_name: 'Joe',
        email: 'joe@example.com',
        avatar: { url: 'https://cdn/avatar.png' },
        cursor: { x: 10, y: 20, package_identifier: 'proj-cache' },
        _metasCount: 1,
      },
      'acct-2': {
        first_name: 'Dana',
        email: 'dana@example.com',
        avatar: null,
        cursor: null,
        _metasCount: 2,
      },
    });

    expect(latest()).toEqual([
      {
        accountId: 'acct-1',
        firstName: 'Joe',
        email: 'joe@example.com',
        avatarUrl: 'https://cdn/avatar.png',
        cursor: { x: 10, y: 20, packageIdentifier: 'proj-cache' },
        focus: { kind: 'node', nodeId: 'proj-cache' },
      },
      {
        accountId: 'acct-2',
        firstName: 'Dana',
        email: 'dana@example.com',
        avatarUrl: null,
        cursor: null,
        focus: { kind: 'floating' },
      },
    ]);
  });

  it('treats a cursor without a package as floating focus', () => {
    const { latest, emit } = setup();

    emit({
      'acct-1': {
        first_name: 'Joe',
        cursor: { x: 1, y: 2, package_identifier: null },
      },
    });

    expect(latest()[0].focus).toEqual({ kind: 'floating' });
    expect(latest()[0].cursor).toEqual({
      x: 1,
      y: 2,
      packageIdentifier: null,
    });
  });

  it('clears viewers when the stream errors (no ghost cursors)', () => {
    const { latest, emit, fail } = setup();

    emit({ 'acct-1': { first_name: 'Joe' } });
    expect(latest()).toHaveLength(1);

    fail(new Error('stream dropped'));
    expect(latest()).toEqual([]);
  });
});
