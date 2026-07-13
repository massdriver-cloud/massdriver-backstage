import {
  TestApiProvider,
  renderInTestApp,
} from '@backstage/frontend-test-utils';
import { screen, waitFor } from '@testing-library/react';
import { massdriverApiRef, MassdriverApi } from '../../api';
import { MassdriverThemeScope } from '../../theme/MassdriverThemeScope';
import { RepoDetailsPage } from './RepoDetailsPage';

// renderInTestApp supplies a Router; drive params via a mock rather than
// nesting another router. useNavigate stays real (spread from requireActual).
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
        <RepoDetailsPage />
      </MassdriverThemeScope>
    </TestApiProvider>,
  );
};

describe('RepoDetailsPage', () => {
  it('renders the repo header and deep-links the current tab out to Massdriver', async () => {
    const api = mockApi();
    api.query.mockResolvedValue({
      ociRepo: {
        id: 'aws-s3',
        name: 'aws-s3',
        description: 'S3 bucket bundle',
        tags: { items: [{ tag: '1.2.3', createdAt: '2024-01-01' }] },
        releaseChannels: { items: [] },
      },
    });

    // Versions tab is purely presentational (no extra query).
    await renderPage(api, {
      repoId: 'aws-s3',
      version: 'all',
      tab: 'versions',
    });

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'aws-s3' }),
      ).toBeInTheDocument(),
    );
    expect(screen.getByText('v1.2.3')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /Open in Massdriver/i });
    expect(link).toHaveAttribute(
      'href',
      'https://app.massdriver.cloud/orgs/org-1/repos/aws-s3/all/versions',
    );
  });

  it('titles the page name@version when a concrete version is selected', async () => {
    const api = mockApi();
    api.query.mockResolvedValue({
      ociRepo: {
        id: 'aws-s3',
        name: 'aws-s3',
        tags: { items: [{ tag: '1.2.3' }] },
        releaseChannels: { items: [] },
      },
    });

    await renderPage(api, {
      repoId: 'aws-s3',
      version: '1.2.3',
      tab: 'versions',
    });

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'aws-s3@1.2.3' }),
      ).toBeInTheDocument(),
    );
  });

  it('renders NotFound when the repo is missing', async () => {
    const api = mockApi();
    api.query.mockResolvedValue({ ociRepo: null });

    await renderPage(api, { repoId: 'ghost', version: 'all', tab: 'versions' });

    await waitFor(() =>
      expect(screen.getByText('Repository not found')).toBeInTheDocument(),
    );
  });

  it('decodes a percent-encoded repo id before querying', async () => {
    const api = mockApi();
    api.query.mockResolvedValue({
      ociRepo: { id: 'a/b', name: 'a/b', tags: { items: [] } },
    });

    await renderPage(api, { repoId: 'a%2Fb', version: 'all', tab: 'versions' });

    await waitFor(() => expect(api.query).toHaveBeenCalled());
    expect(api.query).toHaveBeenCalledWith(
      expect.stringContaining('MassdriverOciRepoHeader'),
      { id: 'a/b' },
    );
  });
});
