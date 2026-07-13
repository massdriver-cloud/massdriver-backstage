import {
  TestApiProvider,
  renderInTestApp,
} from '@backstage/frontend-test-utils';
import { screen, waitFor } from '@testing-library/react';
import { massdriverApiRef, MassdriverApi } from '../../../api';
import { MassdriverThemeScope } from '../../../theme/MassdriverThemeScope';
import { PermissionsTab } from './PermissionsTab';

const mockApi = (): jest.Mocked<MassdriverApi> => ({
  appUrl: 'https://app.massdriver.cloud',
  organizationId: 'org-1',
  query: jest.fn(),
  fetchText: jest.fn(),
  subscribe: jest.fn().mockResolvedValue(undefined),
});

const renderTab = (api: MassdriverApi) =>
  renderInTestApp(
    <TestApiProvider apis={[[massdriverApiRef, api]]}>
      <MassdriverThemeScope>
        <PermissionsTab
          repoId="aws-s3"
          version="all"
          repo={null}
          hasNoVersions={false}
        />
      </MassdriverThemeScope>
    </TestApiProvider>,
  );

describe('PermissionsTab', () => {
  it('renders grant rows from the nested ociRepo.grants page', async () => {
    const api = mockApi();
    api.query.mockResolvedValue({
      ociRepo: {
        id: 'aws-s3',
        grants: {
          cursor: { next: null, previous: null },
          items: [
            {
              id: 'grant-1',
              action: 'repo:pull',
              recipientConditions: null,
              createdAt: '2024-01-01T00:00:00Z',
            },
          ],
        },
      },
    });

    await renderTab(api);

    expect(screen.getByText('Permissions')).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText('repo:pull')).toBeInTheDocument(),
    );
    expect(api.query).toHaveBeenCalledWith(
      expect.stringContaining('MassdriverRepoGrants'),
      expect.objectContaining({ id: 'aws-s3' }),
    );
  });

  it('deep-links "Add permission" to the repo permissions tab in Massdriver', async () => {
    const api = mockApi();
    api.query.mockResolvedValue({
      ociRepo: { id: 'aws-s3', grants: { cursor: { next: null }, items: [] } },
    });

    await renderTab(api);

    const addLink = screen.getByRole('link', { name: /add permission/i });
    expect(addLink).toHaveAttribute(
      'href',
      'https://app.massdriver.cloud/orgs/org-1/repos/aws-s3/all/permissions',
    );
    expect(addLink).toHaveAttribute('target', '_blank');
  });
});
