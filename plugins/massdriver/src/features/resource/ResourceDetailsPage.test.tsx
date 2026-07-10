import {
  TestApiProvider,
  renderInTestApp,
} from '@backstage/frontend-test-utils';
import { screen, waitFor } from '@testing-library/react';
import { massdriverApiRef, MassdriverApi } from '../../api';
import { MassdriverThemeScope } from '../../theme/MassdriverThemeScope';
import { ResourceDetailsPage } from './ResourceDetailsPage';

// renderInTestApp already supplies a Router, so drive params via a mock rather
// than nesting another router.
let mockParams: Record<string, string> = {};
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => mockParams,
}));

const mockApi = (): jest.Mocked<MassdriverApi> => ({
  appUrl: 'https://app.massdriver.cloud',
  organizationId: 'org-1',
  query: jest.fn(),
  fetchText: jest.fn(),
  subscribe: jest.fn().mockResolvedValue(undefined),
});

const renderPage = (api: MassdriverApi, params: Record<string, string>) => {
  mockParams = params;
  return renderInTestApp(
    <TestApiProvider apis={[[massdriverApiRef, api]]}>
      <MassdriverThemeScope>
        <ResourceDetailsPage />
      </MassdriverThemeScope>
    </TestApiProvider>,
  );
};

describe('ResourceDetailsPage', () => {
  it('renders the resource header and deep-links out to Massdriver', async () => {
    const api = mockApi();
    api.query.mockResolvedValue({
      resource: {
        id: 'aws-s3-bucket.my-bucket',
        name: 'my-bucket',
        origin: 'IMPORTED',
        resourceType: { id: 'aws-s3', name: 'S3 Bucket', icon: null },
      },
    });

    await renderPage(api, {
      resourceId: 'aws-s3-bucket.my-bucket',
      tab: 'general',
    });

    await waitFor(() =>
      expect(screen.getByText('my-bucket')).toBeInTheDocument(),
    );
    const link = screen.getByRole('link', { name: /Open in Massdriver/i });
    expect(link).toHaveAttribute(
      'href',
      'https://app.massdriver.cloud/orgs/org-1/resources/aws-s3-bucket.my-bucket/general',
    );
  });

  it('decodes a percent-encoded resource id before querying', async () => {
    const api = mockApi();
    api.query.mockResolvedValue({
      resource: { id: 'a/b', name: 'thing', origin: 'IMPORTED' },
    });

    await renderPage(api, { resourceId: 'a%2Fb', tab: 'general' });

    await waitFor(() =>
      expect(api.query).toHaveBeenCalledWith(
        expect.stringContaining('MassdriverResourceHeader'),
        { id: 'a/b' },
      ),
    );
  });

  it('renders NotFound when the resource is null', async () => {
    const api = mockApi();
    api.query.mockResolvedValue({ resource: null });

    await renderPage(api, { resourceId: 'missing', tab: 'general' });

    await waitFor(() =>
      expect(screen.getByText('Resource not found')).toBeInTheDocument(),
    );
  });
});
