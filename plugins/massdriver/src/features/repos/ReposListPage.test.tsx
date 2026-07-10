import {
  TestApiProvider,
  renderInTestApp,
} from '@backstage/frontend-test-utils';
import { screen, waitFor } from '@testing-library/react';
import { massdriverApiRef, MassdriverApi } from '../../api';
import { MassdriverThemeScope } from '../../theme/MassdriverThemeScope';
import { ReposListPage } from './ReposListPage';

const mockApi = (): jest.Mocked<MassdriverApi> => ({
  appUrl: 'https://app.massdriver.cloud',
  organizationId: 'org-1',
  query: jest.fn(),
  fetchText: jest.fn(),
  subscribe: jest.fn().mockResolvedValue(undefined),
});

const renderPage = (api: MassdriverApi) =>
  renderInTestApp(
    <TestApiProvider apis={[[massdriverApiRef, api]]}>
      <MassdriverThemeScope>
        <ReposListPage />
      </MassdriverThemeScope>
    </TestApiProvider>,
  );

describe('ReposListPage', () => {
  it('renders repo rows with a latest-version cell from the relay', async () => {
    const api = mockApi();
    api.query.mockResolvedValue({
      ociRepos: {
        cursor: { next: null, previous: null },
        items: [
          {
            id: 'aws-s3',
            name: 'aws-s3',
            description: 'S3 bucket bundle',
            tags: { items: [{ tag: '1.4.0' }] },
          },
        ],
      },
    });

    await renderPage(api);

    expect(
      screen.getByRole('heading', { name: 'Repositories' }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText('aws-s3')).toBeInTheDocument(),
    );
    expect(screen.getByText('S3 bucket bundle')).toBeInTheDocument();
    expect(screen.getByText('v1.4.0')).toBeInTheDocument();
  });

  it('fetches each repo brand icon through the content proxy', async () => {
    const api = mockApi();
    api.fetchText.mockResolvedValue('<svg aria-label="icon"></svg>');
    api.query.mockResolvedValue({
      ociRepos: {
        cursor: { next: null },
        items: [
          {
            id: 'aws-s3',
            name: 'aws-s3',
            icon: 'https://app.massdriver.cloud/icons/aws-s3.svg',
            tags: { items: [{ tag: '1.4.0' }] },
          },
        ],
      },
    });

    await renderPage(api);

    await waitFor(() =>
      expect(api.fetchText).toHaveBeenCalledWith(
        'https://app.massdriver.cloud/icons/aws-s3.svg',
      ),
    );
  });

  it('deep-links "New Repository" into Massdriver with the create param', async () => {
    const api = mockApi();
    api.query.mockResolvedValue({
      ociRepos: { cursor: { next: null }, items: [] },
    });

    await renderPage(api);

    const link = screen.getByRole('link', { name: /New Repository/i });
    expect(link).toHaveAttribute(
      'href',
      'https://app.massdriver.cloud/orgs/org-1/repos?createOciRepo=true',
    );
  });

  it('issues the list query named MassdriverOciReposList', async () => {
    const api = mockApi();
    api.query.mockResolvedValue({
      ociRepos: { cursor: { next: null }, items: [] },
    });

    await renderPage(api);

    await waitFor(() => expect(api.query).toHaveBeenCalled());
    expect(api.query).toHaveBeenLastCalledWith(
      expect.stringContaining('MassdriverOciReposList'),
      expect.objectContaining({ cursor: { limit: 20 } }),
    );
  });
});
