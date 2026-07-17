import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MassdriverThemeScope } from '../theme/MassdriverThemeScope';
import VersionBadge from './VersionBadge';

const renderBadge = (element: React.ReactElement) =>
  render(<MassdriverThemeScope>{element}</MassdriverThemeScope>);

describe('VersionBadge', () => {
  it('prefixes a pinned semver with "v"', () => {
    renderBadge(<VersionBadge version="1.2.3" />);
    expect(screen.getByText('v1.2.3')).toBeInTheDocument();
  });

  it('renders a release-channel name unchanged', () => {
    renderBadge(<VersionBadge version="latest" />);
    expect(screen.getByText('latest')).toBeInTheDocument();
  });

  it('shows the pinned-version warning tooltip on hover when requested', async () => {
    const user = userEvent.setup();
    renderBadge(<VersionBadge version="1.2.3" showPinnedWarning />);

    await user.hover(screen.getByText('v1.2.3'));

    expect(
      await screen.findByRole('tooltip', {
        name: /version is pinned and won't update automatically/i,
      }),
    ).toBeInTheDocument();
  });

  it('shows no warning tooltip for a release-channel version even when requested', async () => {
    const user = userEvent.setup();
    renderBadge(<VersionBadge version="latest" showPinnedWarning />);

    await user.hover(screen.getByText('latest'));

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});
