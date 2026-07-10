import { render, screen } from '@testing-library/react';
import { MassdriverThemeScope } from '../../../theme/MassdriverThemeScope';
import { VersionsTab } from './VersionsTab';
import type { RepoHeader } from '../types';

const renderTab = (props: Record<string, unknown>) =>
  render(
    <MassdriverThemeScope>
      <VersionsTab
        repoId="aws-s3"
        version="all"
        repo={null}
        hasNoVersions={false}
        {...(props as any)}
      />
    </MassdriverThemeScope>,
  );

describe('VersionsTab', () => {
  it('renders release channels and versions with a latest chip', () => {
    const repo: RepoHeader = {
      id: 'aws-s3',
      name: 'aws-s3',
      releaseChannels: { items: [{ name: 'latest', tag: '1.2.3' }] },
      tags: {
        items: [
          { tag: '1.2.3', createdAt: '2024-06-01T00:00:00Z' },
          { tag: '1.2.2', createdAt: '2024-05-01T00:00:00Z' },
        ],
      },
    };
    renderTab({ repo });

    expect(screen.getByText('Release channels')).toBeInTheDocument();
    // "latest" appears as the channel name and as the newest-version chip.
    expect(screen.getAllByText('latest')).toHaveLength(2);
    expect(screen.getAllByText('v1.2.3').length).toBeGreaterThan(0);
    expect(screen.getByText('v1.2.2')).toBeInTheDocument();
  });

  it('renders the no-versions empty state', () => {
    renderTab({ hasNoVersions: true });
    expect(screen.getByText('No versions yet')).toBeInTheDocument();
  });

  it('renders an empty state when there are no tags', () => {
    renderTab({ repo: { id: 'x', name: 'x', tags: { items: [] } } });
    expect(screen.getByText('No published versions')).toBeInTheDocument();
  });
});
