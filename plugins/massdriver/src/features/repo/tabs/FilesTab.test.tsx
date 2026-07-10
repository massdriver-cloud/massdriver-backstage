import {
  TestApiProvider,
  renderInTestApp,
} from '@backstage/frontend-test-utils';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { massdriverApiRef, MassdriverApi } from '../../../api';
import { MassdriverThemeScope } from '../../../theme/MassdriverThemeScope';
import { FilesTab } from './FilesTab';
import type { RepoHeader } from '../types';

const mockApi = (): jest.Mocked<MassdriverApi> => ({
  appUrl: 'https://app.massdriver.cloud',
  organizationId: 'org-1',
  query: jest.fn(),
  fetchText: jest.fn(),
  subscribe: jest.fn().mockResolvedValue(undefined),
});

const repo: RepoHeader = {
  id: 'aws-s3',
  name: 'aws-s3',
  tags: { items: [{ tag: '1.2.3' }] },
};

const renderTab = (api: MassdriverApi, props: Record<string, unknown> = {}) =>
  renderInTestApp(
    <TestApiProvider apis={[[massdriverApiRef, api]]}>
      <MassdriverThemeScope>
        <FilesTab
          repoId="aws-s3"
          version="all"
          repo={repo}
          hasNoVersions={false}
          {...(props as any)}
        />
      </MassdriverThemeScope>
    </TestApiProvider>,
  );

const filesResult = (items: Array<{ name: string; url?: string }>) => ({
  ociRepo: {
    id: 'aws-s3',
    tags: {
      items: [{ tag: '1.2.3', files: { cursor: { next: null }, items } }],
    },
  },
});

describe('FilesTab', () => {
  it('fetches and renders the real file contents when a file is selected', async () => {
    const api = mockApi();
    api.query.mockResolvedValue(
      filesResult([
        { name: 'README.md', url: 'https://app.massdriver.cloud/f/readme' },
      ]),
    );
    api.fetchText.mockResolvedValue('Bundle readme body');

    await renderTab(api);

    await waitFor(() =>
      expect(screen.getByText('README.md')).toBeInTheDocument(),
    );

    await userEvent.click(screen.getByRole('button', { name: 'README.md' }));

    await waitFor(() =>
      expect(api.fetchText).toHaveBeenCalledWith(
        'https://app.massdriver.cloud/f/readme',
      ),
    );
    // Markdown is rendered inline via GuideMarkdown (not a metadata pane).
    await waitFor(() =>
      expect(screen.getByText(/Bundle readme body/)).toBeInTheDocument(),
    );
  });

  it('resolves the all-versions view to the latest tag when querying', async () => {
    const api = mockApi();
    api.query.mockResolvedValue(filesResult([]));

    await renderTab(api);

    await waitFor(() => expect(api.query).toHaveBeenCalled());
    expect(api.query).toHaveBeenCalledWith(
      expect.stringContaining('MassdriverRepoTagFiles'),
      expect.objectContaining({ repoId: 'aws-s3', version: '1.2.3' }),
    );
  });

  it('renders the no-versions empty state', async () => {
    const api = mockApi();
    await renderTab(api, { hasNoVersions: true });
    expect(screen.getByText('No versions yet')).toBeInTheDocument();
    expect(api.query).not.toHaveBeenCalled();
  });
});
