import {
  TestApiProvider,
  renderInTestApp,
} from '@backstage/frontend-test-utils';
import { screen, waitFor } from '@testing-library/react';
import { massdriverApiRef, MassdriverApi } from '../../../api';
import { MassdriverThemeScope } from '../../../theme/MassdriverThemeScope';
import { UsageTab } from './UsageTab';

const mockApi = (): jest.Mocked<MassdriverApi> => ({
  appUrl: 'https://app.massdriver.cloud',
  organizationId: 'org-1',
  query: jest.fn(),
  fetchText: jest.fn(),
  subscribe: jest.fn().mockResolvedValue(undefined),
});

const renderTab = (api: MassdriverApi, resourceOrigin = 'PROVISIONED') =>
  renderInTestApp(
    <TestApiProvider apis={[[massdriverApiRef, api]]}>
      <MassdriverThemeScope>
        <UsageTab resourceId="aws-sns.topic" resourceOrigin={resourceOrigin} />
      </MassdriverThemeScope>
    </TestApiProvider>,
  );

describe('UsageTab', () => {
  it('renders a connection row with the instance id and status pill', async () => {
    const api = mockApi();
    api.query.mockResolvedValue({
      resource: {
        id: 'aws-sns.topic',
        connections: {
          cursor: { next: null },
          items: [
            {
              id: 'c1',
              toField: 'topic',
              createdAt: '2020-01-01T00:00:00Z',
              toInstance: {
                id: 'proj-env-cache',
                status: 'PROVISIONED',
                bundle: { id: 'b1', name: 'aws-sns' },
                environment: {
                  id: 'proj-env',
                  project: { id: 'proj', name: 'Payments' },
                },
              },
            },
          ],
        },
      },
    });

    await renderTab(api);

    expect(
      screen.getByRole('button', { name: 'Connections' }),
    ).toBeInTheDocument();

    await waitFor(() =>
      expect(screen.getByText('proj-env-cache')).toBeInTheDocument(),
    );
    expect(screen.getByText('Provisioned')).toBeInTheDocument();
    expect(screen.getByText('aws-sns')).toBeInTheDocument();
  });

  it('drops the Connections toggle for imported resources', async () => {
    const api = mockApi();
    api.query.mockResolvedValue({
      resource: {
        id: 'aws-sns.topic',
        remoteReferences: { cursor: { next: null }, items: [] },
      },
    });

    await renderTab(api, 'IMPORTED');

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Remote references' }),
      ).toBeInTheDocument(),
    );
    expect(
      screen.queryByRole('button', { name: 'Connections' }),
    ).not.toBeInTheDocument();
  });
});
