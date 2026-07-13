import {
  TestApiProvider,
  renderInTestApp,
} from '@backstage/frontend-test-utils';
import { screen, waitFor } from '@testing-library/react';
import { massdriverApiRef, MassdriverApi } from '../../../api';
import { MassdriverThemeScope } from '../../../theme/MassdriverThemeScope';
import { OverviewTab } from './OverviewTab';

const mockApi = (): jest.Mocked<MassdriverApi> => ({
  appUrl: 'https://app.massdriver.cloud',
  organizationId: 'org-1',
  query: jest.fn(),
  fetchText: jest.fn(),
  subscribe: jest.fn().mockResolvedValue(undefined),
});

const renderTab = (api: MassdriverApi, props: Record<string, unknown>) =>
  renderInTestApp(
    <TestApiProvider apis={[[massdriverApiRef, api]]}>
      <MassdriverThemeScope>
        <OverviewTab
          repoId="aws-s3"
          version="all"
          repo={null}
          hasNoVersions={false}
          {...(props as any)}
        />
      </MassdriverThemeScope>
    </TestApiProvider>,
  );

describe('OverviewTab', () => {
  it('renders the bundle README', async () => {
    const api = mockApi();
    api.query.mockResolvedValue({
      bundle: { id: 'aws-s3@1.0.0', readme: 'Bundle overview content' },
    });

    await renderTab(api, {});

    await waitFor(() =>
      expect(screen.getByText(/Bundle overview content/)).toBeInTheDocument(),
    );
    expect(api.query).toHaveBeenCalledWith(
      expect.stringContaining('MassdriverBundle'),
      { id: 'aws-s3@latest' },
    );
  });

  it('shows a README empty state with a source link when there is no readme', async () => {
    const api = mockApi();
    api.query.mockResolvedValue({
      bundle: { id: 'aws-s3@1.0.0', readme: null, sourceUrl: 'https://git' },
    });

    await renderTab(api, {});

    await waitFor(() =>
      expect(screen.getByText(/has no README/i)).toBeInTheDocument(),
    );
    expect(
      screen.getByRole('link', { name: /open source repository/i }),
    ).toHaveAttribute('href', 'https://git');
  });

  it('renders the no-versions empty state', async () => {
    const api = mockApi();
    await renderTab(api, { hasNoVersions: true });
    expect(screen.getByText('No versions yet')).toBeInTheDocument();
    expect(api.query).not.toHaveBeenCalled();
  });
});
