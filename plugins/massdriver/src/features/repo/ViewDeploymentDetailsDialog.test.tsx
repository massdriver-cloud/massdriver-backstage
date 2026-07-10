import {
  TestApiProvider,
  renderInTestApp,
} from '@backstage/frontend-test-utils';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { useLocation } from 'react-router-dom';
import { massdriverApiRef, MassdriverApi } from '../../api';
import { MassdriverThemeScope } from '../../theme/MassdriverThemeScope';
import { ViewDeploymentDetailsDialog } from './ViewDeploymentDetailsDialog';

const mockApi = (): jest.Mocked<MassdriverApi> => ({
  appUrl: 'https://app.massdriver.cloud',
  organizationId: 'org-1',
  query: jest.fn(),
  fetchText: jest.fn(),
  subscribe: jest.fn().mockResolvedValue(undefined),
});

const DEPLOYMENT = {
  id: 'proj-env-cache-abc123',
  status: 'COMPLETED',
  action: 'PROVISION',
  version: '1.2.3',
  message: 'Deploying cache',
  params: { name: 'cache', replicas: 3 },
  effectiveAttributes: { env: 'staging' },
  createdAt: '2024-01-01T00:00:00Z',
  lastTransitionedAt: '2024-01-01T00:05:00Z',
  elapsedTime: 125,
  deployedBy: 'joe',
  instance: { id: 'proj-env-cache', component: { id: 'proj-cache', name: 'cache' } },
};

const LocationProbe = () => {
  const { search } = useLocation();
  return <div data-testid="search">{search}</div>;
};

const renderDialog = (api: MassdriverApi, entry = '/?deployment=proj-env-cache-abc123') =>
  renderInTestApp(
    <TestApiProvider apis={[[massdriverApiRef, api]]}>
      <MassdriverThemeScope>
        <ViewDeploymentDetailsDialog />
        <LocationProbe />
      </MassdriverThemeScope>
    </TestApiProvider>,
    { initialRouteEntries: [entry] },
  );

describe('ViewDeploymentDetailsDialog', () => {
  it('fetches and renders the deployment from the `deployment` URL param', async () => {
    const api = mockApi();
    api.query.mockResolvedValue({ deployment: DEPLOYMENT });

    await renderDialog(api);

    await waitFor(() =>
      expect(screen.getByText('Snapshot params')).toBeInTheDocument(),
    );
    // Terminal label appears on both the status pill and the Status def-value.
    expect(screen.getAllByText('Provisioned').length).toBeGreaterThan(0);
    // The full deployment id renders in the def list.
    expect(screen.getByText('proj-env-cache-abc123')).toBeInTheDocument();
    // Effective attribute + a flattened snapshot param path.
    expect(screen.getByText('env')).toBeInTheDocument();
    expect(screen.getByText('.name')).toBeInTheDocument();

    expect(api.query).toHaveBeenCalledWith(
      expect.stringContaining('MassdriverDeployment'),
      { id: 'proj-env-cache-abc123' },
    );
  });

  it('opens the logs drawer via `?logs=` while keeping the dialog open', async () => {
    const api = mockApi();
    api.query.mockResolvedValue({ deployment: DEPLOYMENT });

    await renderDialog(api);

    await waitFor(() =>
      expect(screen.getByText('Snapshot params')).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole('button', { name: 'View logs' }));

    await waitFor(() => {
      const search = screen.getByTestId('search').textContent ?? '';
      expect(search).toContain('logs=proj-env-cache-abc123');
      expect(search).toContain('deployment=proj-env-cache-abc123');
    });
  });

  it('clears the `deployment` param when closed', async () => {
    const api = mockApi();
    api.query.mockResolvedValue({ deployment: DEPLOYMENT });

    await renderDialog(api);

    await waitFor(() =>
      expect(screen.getByText('Snapshot params')).toBeInTheDocument(),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Close deployment details' }),
    );

    await waitFor(() =>
      expect(screen.getByTestId('search').textContent).not.toContain(
        'deployment=',
      ),
    );
  });
});
