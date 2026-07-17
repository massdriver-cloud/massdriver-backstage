import {
  TestApiProvider,
  renderInTestApp,
} from '@backstage/frontend-test-utils';
import { screen, waitFor } from '@testing-library/react';
import { massdriverApiRef, MassdriverApi } from '../../../api';
import { MassdriverThemeScope } from '../../../theme/MassdriverThemeScope';
import { GeneralTab } from './GeneralTab';

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
        <GeneralTab resourceId="proj-env-cache" />
      </MassdriverThemeScope>
    </TestApiProvider>,
  );

describe('GeneralTab', () => {
  it('renders identifiers, origin, and a parsed payload with a deep-linked export', async () => {
    const api = mockApi();
    api.query.mockResolvedValue({
      resource: {
        id: 'aws-sns.topic',
        name: 'topic',
        origin: 'PROVISIONED',
        payload: JSON.stringify({ arn: 'arn:aws:sns:topic' }),
        createdAt: '2020-01-01T00:00:00Z',
        updatedAt: '2020-01-02T00:00:00Z',
        resourceType: { id: 'aws-sns', name: 'SNS Topic' },
        instance: { id: 'proj-env-cache' },
      },
    });

    await renderTab(api);

    await waitFor(() =>
      expect(screen.getByText('aws-sns.topic')).toBeInTheDocument(),
    );
    expect(screen.getByText('Provisioned')).toBeInTheDocument();
    expect(screen.getByText('proj : env')).toBeInTheDocument();
    expect(screen.getByText(/arn:aws:sns:topic/)).toBeInTheDocument();
    expect(
      screen.getByLabelText('Download payload in Massdriver'),
    ).toHaveAttribute('target', '_blank');
  });

  it('omits the payload card when there is no payload', async () => {
    const api = mockApi();
    api.query.mockResolvedValue({
      resource: {
        id: 'aws-s3.bucket',
        name: 'bucket',
        origin: 'IMPORTED',
        payload: null,
        resourceType: { id: 'aws-s3', name: 'S3 Bucket' },
      },
    });

    await renderTab(api);

    await waitFor(() =>
      expect(screen.getByText('Imported')).toBeInTheDocument(),
    );
    expect(
      screen.queryByLabelText('Download payload in Massdriver'),
    ).not.toBeInTheDocument();
  });
});
