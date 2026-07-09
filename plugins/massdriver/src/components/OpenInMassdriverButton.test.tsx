import { render, screen } from '@testing-library/react';
import { OpenInMassdriverButton } from './OpenInMassdriverButton';

describe('OpenInMassdriverButton', () => {
  it('renders an anchor pointing at the given url that opens in a new tab', () => {
    render(
      <OpenInMassdriverButton url="https://app.massdriver.cloud/orgs/org-1/projects" />,
    );

    const link = screen.getByRole('link', { name: /open in massdriver/i });
    expect(link).toHaveAttribute(
      'href',
      'https://app.massdriver.cloud/orgs/org-1/projects',
    );
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders custom label content', () => {
    render(
      <OpenInMassdriverButton url="https://app.massdriver.cloud">
        View instance
      </OpenInMassdriverButton>,
    );

    expect(
      screen.getByRole('link', { name: /view instance/i }),
    ).toHaveAttribute('href', 'https://app.massdriver.cloud');
  });
});
