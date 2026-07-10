import {
  TestApiProvider,
  renderInTestApp,
} from '@backstage/frontend-test-utils';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { useLocation } from 'react-router-dom';
import { massdriverApiRef, MassdriverApi } from '../../../api';
import { MassdriverThemeScope } from '../../../theme/MassdriverThemeScope';
import { DeploymentsTab } from './DeploymentsTab';

const mockApi = (): jest.Mocked<MassdriverApi> => ({
  appUrl: 'https://app.massdriver.cloud',
  organizationId: 'org-1',
  query: jest.fn(),
  fetchText: jest.fn(),
  subscribe: jest.fn().mockResolvedValue(undefined),
});

// Surfaces the current URL search string so tests can assert that a row opens
// the in-place dialog/drawer (which are driven by the `deployment` / `logs`
// params, matching the web app's useDialogParam).
const LocationProbe = () => {
  const { search } = useLocation();
  return <div data-testid="search">{search}</div>;
};

const renderTab = (api: MassdriverApi, props: Record<string, unknown> = {}) =>
  renderInTestApp(
    <TestApiProvider apis={[[massdriverApiRef, api]]}>
      <MassdriverThemeScope>
        <DeploymentsTab
          repoId="aws-s3"
          version="all"
          repo={null}
          hasNoVersions={false}
          {...(props as any)}
        />
        <LocationProbe />
      </MassdriverThemeScope>
    </TestApiProvider>,
  );

describe('DeploymentsTab', () => {
  it('renders deployment cards and opens details/logs in place', async () => {
    const api = mockApi();
    api.query.mockResolvedValue({
      deployments: {
        cursor: { next: null },
        items: [
          {
            id: 'proj-env-cache-abc123',
            status: 'RUNNING',
            action: 'PROVISION',
            version: '1.2.3',
            deployedBy: 'joe',
            message: 'Deploying cache',
            createdAt: '2024-01-01T00:00:00Z',
            instance: {
              id: 'proj-env-cache',
              environment: { id: 'proj-env', name: 'staging' },
              component: { id: 'proj-cache', project: { id: 'proj', name: 'app' } },
            },
          },
        ],
      },
    });

    await renderTab(api);

    // Compound status label from composeInstanceStatus(PROVISION, RUNNING).
    await waitFor(() =>
      expect(screen.getByText('Provision Running')).toBeInTheDocument(),
    );
    expect(screen.getByText('abc123')).toBeInTheDocument();
    expect(screen.getByText('"Deploying cache"')).toBeInTheDocument();
    expect(screen.getByText('joe')).toBeInTheDocument();

    // The instance name still navigates internally to the instance drawer.
    expect(
      screen.getByRole('link', { name: 'proj-env-cache' }),
    ).toHaveAttribute(
      'href',
      '/massdriver/projects/proj/environments/env/instances/cache',
    );

    // "Details" is a button that opens the details dialog via `?deployment=`.
    fireEvent.click(screen.getByRole('button', { name: 'Details' }));
    await waitFor(() =>
      expect(screen.getByTestId('search').textContent).toContain(
        'deployment=proj-env-cache-abc123',
      ),
    );

    // "Logs" opens the logs drawer via `?logs=`.
    fireEvent.click(screen.getByRole('button', { name: 'Logs' }));
    await waitFor(() =>
      expect(screen.getByTestId('search').textContent).toContain(
        'logs=proj-env-cache-abc123',
      ),
    );

    // The in-flight status pill is click-to-logs.
    fireEvent.click(screen.getByText('Provision Running'));
    await waitFor(() =>
      expect(screen.getByTestId('search').textContent).toContain(
        'logs=proj-env-cache-abc123',
      ),
    );

    expect(api.query).toHaveBeenCalledWith(
      expect.stringContaining('MassdriverRepoDeployments'),
      expect.objectContaining({ filter: { ociRepoName: { eq: 'aws-s3' } } }),
    );
  });

  it('renders the empty state when there are no deployments', async () => {
    const api = mockApi();
    api.query.mockResolvedValue({
      deployments: { cursor: { next: null }, items: [] },
    });

    await renderTab(api);

    await waitFor(() =>
      expect(screen.getByText('No deployments')).toBeInTheDocument(),
    );
  });

  it('renders the no-versions empty state', async () => {
    const api = mockApi();
    await renderTab(api, { hasNoVersions: true });
    expect(screen.getByText('No versions yet')).toBeInTheDocument();
    expect(api.query).not.toHaveBeenCalled();
  });
});
