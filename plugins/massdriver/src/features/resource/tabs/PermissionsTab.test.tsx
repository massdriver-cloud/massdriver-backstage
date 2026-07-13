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
        <PermissionsTab resourceId="aws-s3.bucket" />
      </MassdriverThemeScope>
    </TestApiProvider>,
  );

describe('PermissionsTab', () => {
  it('renders grant rows and a deep-linked Add permission action', async () => {
    const api = mockApi();
    api.query.mockResolvedValue({
      resource: {
        id: 'aws-s3.bucket',
        name: 'bucket',
        grants: {
          items: [
            {
              id: 'g1',
              action: 'resource:export',
              recipientConditions: null,
              createdAt: '2020-01-01T00:00:00Z',
            },
          ],
        },
      },
    });

    await renderTab(api);

    await waitFor(() =>
      expect(screen.getByText('resource:export')).toBeInTheDocument(),
    );
    expect(
      screen.getByRole('link', { name: /add permission/i }),
    ).toHaveAttribute(
      'href',
      'https://app.massdriver.cloud/orgs/org-1/resources/aws-s3.bucket/permissions',
    );
  });
});
