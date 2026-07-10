import {
  TestApiProvider,
  renderInTestApp,
} from '@backstage/frontend-test-utils';
import { screen, waitFor } from '@testing-library/react';
import { massdriverApiRef, MassdriverApi } from '../../../api';
import { MassdriverThemeScope } from '../../../theme/MassdriverThemeScope';
import { InstancesTab } from './InstancesTab';

const mockApi = (): jest.Mocked<MassdriverApi> => ({
  appUrl: 'https://app.massdriver.cloud',
  organizationId: 'org-1',
  query: jest.fn(),
  fetchText: jest.fn(),
  subscribe: jest.fn().mockResolvedValue(undefined),
});

const renderTab = (api: MassdriverApi, props: Record<string, unknown> = {}) =>
  renderInTestApp(
    <TestApiProvider apis={[[massdriverApiRef, api]]}>
      <MassdriverThemeScope>
        <InstancesTab
          repoId="aws-s3"
          version="all"
          repo={null}
          hasNoVersions={false}
          {...(props as any)}
        />
      </MassdriverThemeScope>
    </TestApiProvider>,
  );

describe('InstancesTab', () => {
  it('renders instance cards linking to the internal instance route', async () => {
    const api = mockApi();
    api.query.mockResolvedValue({
      instances: {
        cursor: { next: null },
        items: [
          {
            id: 'proj-env-cache',
            status: 'PROVISIONED',
            deployedVersion: '1.2.3',
            updatedAt: '2024-01-01T00:00:00Z',
            cost: { lastMonth: { amount: 12.5, currency: 'USD' } },
            environment: { id: 'proj-env', name: 'staging' },
            component: {
              id: 'proj-cache',
              project: { id: 'proj', name: 'app' },
            },
          },
        ],
      },
    });

    await renderTab(api);

    // The whole card is a single link (the web InstanceRow behavior), so its
    // accessible name is the composed row text — assert by href + contents.
    const card = await screen.findByRole('link');
    expect(card).toHaveAttribute(
      'href',
      '/massdriver/projects/proj/environments/env/instances/cache',
    );
    expect(screen.getByText('proj-env-cache')).toBeInTheDocument();
    expect(screen.getByText('Provisioned')).toBeInTheDocument();
    expect(screen.getByText('v1.2.3')).toBeInTheDocument();
    expect(screen.getByText(/\$12\.50 last month/)).toBeInTheDocument();
    expect(api.query).toHaveBeenCalledWith(
      expect.stringContaining('MassdriverRepoInstances'),
      expect.objectContaining({
        filter: { ociRepoName: { eq: 'aws-s3' } },
      }),
    );
  });

  it('renders the empty state when there are no instances', async () => {
    const api = mockApi();
    api.query.mockResolvedValue({
      instances: { cursor: { next: null }, items: [] },
    });

    await renderTab(api);

    await waitFor(() =>
      expect(screen.getByText('No instances')).toBeInTheDocument(),
    );
  });

  it('renders the no-versions empty state', async () => {
    const api = mockApi();
    await renderTab(api, { hasNoVersions: true });
    expect(screen.getByText('No versions yet')).toBeInTheDocument();
    expect(api.query).not.toHaveBeenCalled();
  });
});
