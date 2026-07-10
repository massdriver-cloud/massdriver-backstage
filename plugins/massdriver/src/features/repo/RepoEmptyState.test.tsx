import { render, screen } from '@testing-library/react';
import ExtensionIcon from '@massdriver/ui/icons/ExtensionIcon';
import { MassdriverThemeScope } from '../../theme/MassdriverThemeScope';
import { RepoEmptyState } from './RepoEmptyState';

const renderState = (element: React.ReactElement) =>
  render(<MassdriverThemeScope>{element}</MassdriverThemeScope>);

describe('RepoEmptyState', () => {
  it('renders the prominent icon, title, and description', () => {
    renderState(
      <RepoEmptyState
        icon={<ExtensionIcon data-testid="empty-icon" />}
        title="No instances"
        description="Nothing to show."
      />,
    );
    expect(screen.getByTestId('empty-icon')).toBeInTheDocument();
    expect(screen.getByText('No instances')).toBeInTheDocument();
    expect(screen.getByText('Nothing to show.')).toBeInTheDocument();
  });

  it('renders only an italic caption in inline variant', () => {
    renderState(
      <RepoEmptyState
        variant="inline"
        icon={<ExtensionIcon data-testid="empty-icon" />}
        description="Compact message."
      />,
    );
    expect(screen.getByText('Compact message.')).toBeInTheDocument();
    expect(screen.queryByTestId('empty-icon')).not.toBeInTheDocument();
  });
});
