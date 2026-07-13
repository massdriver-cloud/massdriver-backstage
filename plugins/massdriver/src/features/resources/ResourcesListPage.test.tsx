import {
  TestApiProvider,
  renderInTestApp,
} from '@backstage/frontend-test-utils';
import { screen, waitFor } from '@testing-library/react';
import { massdriverApiRef, MassdriverApi } from '../../api';
import { MassdriverThemeScope } from '../../theme/MassdriverThemeScope';
import { ResourcesListPage } from './ResourcesListPage';

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
        <ResourcesListPage />
      </MassdriverThemeScope>
    </TestApiProvider>,
  );

describe('ResourcesListPage', () => {
  it('renders resource rows from the relay', async () => {
    const api = mockApi();
    api.query.mockResolvedValue({
      resources: {
        cursor: { next: null, previous: null },
        items: [
          {
            id: 'r1',
            name: 'my-bucket',
            origin: 'IMPORTED',
            resourceType: { id: 'aws-s3', name: 'S3 Bucket', icon: null },
            instance: null,
          },
        ],
      },
    });

    await renderPage(api);

    expect(
      screen.getByRole('heading', { name: 'Resources' }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText('my-bucket')).toBeInTheDocument(),
    );
    expect(screen.getByText('S3 Bucket')).toBeInTheDocument();
    expect(screen.getByText('Imported')).toBeInTheDocument();
  });

  it('deep-links "Import Resource" into Massdriver', async () => {
    const api = mockApi();
    api.query.mockResolvedValue({
      resources: { cursor: { next: null }, items: [] },
    });

    await renderPage(api);

    const link = screen.getByRole('link', { name: /Import Resource/i });
    expect(link).toHaveAttribute(
      'href',
      'https://app.massdriver.cloud/orgs/org-1/resources?importResource=true',
    );
  });

  it('shows the catalog-onboarding empty state when there are no resources', async () => {
    const api = mockApi();
    api.query.mockResolvedValue({
      resources: { cursor: { next: null }, items: [] },
    });

    await renderPage(api);

    await waitFor(() =>
      expect(
        screen.getByText('Set Up Your Massdriver Catalog'),
      ).toBeInTheDocument(),
    );
    // The empty-state import affordance deep-links into Massdriver.
    const importLink = screen.getByRole('link', { name: 'Import a Resource' });
    expect(importLink).toHaveAttribute(
      'href',
      'https://app.massdriver.cloud/orgs/org-1/resources?importResource=true',
    );
    expect(
      screen.getByRole('link', { name: /Clone the Catalog/i }),
    ).toBeInTheDocument();
  });

  it('scopes the query by origin filter', async () => {
    const api = mockApi();
    api.query.mockResolvedValue({
      resources: { cursor: { next: null }, items: [] },
    });

    await renderPage(api);

    await waitFor(() => expect(api.query).toHaveBeenCalled());
    expect(api.query).toHaveBeenLastCalledWith(
      expect.stringContaining('MassdriverResourcesList'),
      expect.objectContaining({ filter: undefined }),
    );
  });
});
