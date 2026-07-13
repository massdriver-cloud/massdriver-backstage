import {
  TestApiProvider,
  renderInTestApp,
} from '@backstage/frontend-test-utils';
import { screen, waitFor } from '@testing-library/react';
import { massdriverApiRef, MassdriverApi } from '../../api';
import { MassdriverThemeScope } from '../../theme/MassdriverThemeScope';
import { DeploymentLogsDrawer } from './DeploymentLogsDrawer';

// LogViewer relies on ResizeObserver, which jsdom lacks; render its text prop
// as a plain element so the drawer's header/logs can be asserted.
jest.mock('@massdriver/ui/LogViewer', () => ({
  __esModule: true,
  default: ({ text }: { text: string }) => (
    <pre data-testid="log-viewer">{text}</pre>
  ),
}));

const mockApi = (): jest.Mocked<MassdriverApi> => ({
  appUrl: 'https://app.massdriver.cloud',
  organizationId: 'org-1',
  query: jest.fn(),
  fetchText: jest.fn(),
  subscribe: jest.fn().mockResolvedValue(undefined),
});

const renderDrawer = (
  api: MassdriverApi,
  entry = '/?logs=proj-env-cache-abc123',
) =>
  renderInTestApp(
    <TestApiProvider apis={[[massdriverApiRef, api]]}>
      <MassdriverThemeScope>
        <DeploymentLogsDrawer />
      </MassdriverThemeScope>
    </TestApiProvider>,
    { initialRouteEntries: [entry] },
  );

describe('DeploymentLogsDrawer', () => {
  it('renders the header and backfilled logs for a terminal deployment', async () => {
    const api = mockApi();
    api.query.mockResolvedValue({
      deployment: {
        id: 'proj-env-cache-abc123',
        status: 'COMPLETED',
        action: 'PROVISION',
        version: '1.2.3',
        instance: {
          id: 'proj-env-cache',
          component: { id: 'c', name: 'cache' },
        },
        logs: [{ timestamp: '2024-01-01T00:00:00Z', message: 'hello world\n' }],
      },
    });

    await renderDrawer(api);

    // Header: compound action label + status pill + backfilled log line.
    await waitFor(() =>
      expect(screen.getByText('Provisioned · cache')).toBeInTheDocument(),
    );
    expect(screen.getByText('completed')).toBeInTheDocument();
    expect(screen.getByText(/hello world/)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Download logs' }),
    ).toBeInTheDocument();

    // Terminal deployment → no live tail subscription.
    expect(api.subscribe).not.toHaveBeenCalled();
    expect(api.query).toHaveBeenCalledWith(
      expect.stringContaining('MassdriverDeploymentLogs'),
      { id: 'proj-env-cache-abc123' },
    );
  });

  it('opens the live log tail for an in-flight deployment', async () => {
    const api = mockApi();
    // Keep the SSE "stream" open until the component unmounts (abort), instead
    // of resolving immediately — otherwise the reconnect loop schedules a
    // backoff timer that outlives the test and leaks a worker handle.
    api.subscribe.mockImplementation(
      (_query, _variables, _handlers, signal?: AbortSignal) =>
        new Promise<void>(resolve => {
          signal?.addEventListener('abort', () => resolve(), { once: true });
        }),
    );
    api.query.mockResolvedValue({
      deployment: {
        id: 'proj-env-cache-abc123',
        status: 'RUNNING',
        action: 'PROVISION',
        instance: {
          id: 'proj-env-cache',
          component: { id: 'c', name: 'cache' },
        },
        logs: [],
      },
    });

    await renderDrawer(api);

    await waitFor(() =>
      expect(api.subscribe).toHaveBeenCalledWith(
        expect.stringContaining('subscription MassdriverDeploymentLogs'),
        { deploymentId: 'proj-env-cache-abc123' },
        expect.anything(),
        expect.anything(),
      ),
    );
  });

  it('renders nothing when the `logs` param is absent', async () => {
    const api = mockApi();
    await renderDrawer(api, '/');
    expect(api.query).not.toHaveBeenCalled();
  });
});
