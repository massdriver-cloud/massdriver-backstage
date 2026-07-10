import { render, screen } from '@testing-library/react';
import { MassdriverThemeScope } from '../../theme/MassdriverThemeScope';
import { RepoNoVersionsState } from './RepoNoVersionsState';

const renderState = (element: React.ReactElement) =>
  render(<MassdriverThemeScope>{element}</MassdriverThemeScope>);

describe('RepoNoVersionsState', () => {
  it('renders a tab-specific description', () => {
    renderState(<RepoNoVersionsState tabLabel="instances" />);
    expect(screen.getByText('No versions yet')).toBeInTheDocument();
    expect(
      screen.getByText('Publish your first version to see instances here.'),
    ).toBeInTheDocument();
  });

  it('falls back to a generic label', () => {
    renderState(<RepoNoVersionsState />);
    expect(
      screen.getByText('Publish your first version to see content here.'),
    ).toBeInTheDocument();
  });

  it('links the CTA to the publishing docs', () => {
    renderState(<RepoNoVersionsState />);
    const link = screen.getByRole('link', { name: /view publishing docs/i });
    expect(link).toHaveAttribute(
      'href',
      'https://docs.massdriver.cloud/bundle-development/publishing/versioning',
    );
    expect(link).toHaveAttribute('target', '_blank');
  });
});
