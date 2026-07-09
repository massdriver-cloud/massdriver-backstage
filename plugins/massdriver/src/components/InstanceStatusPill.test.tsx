import { render, screen } from '@testing-library/react';
import { MassdriverThemeScope } from '../theme/MassdriverThemeScope';
import InstanceStatusPill from './InstanceStatusPill';

// The pill's styled chip reads Massdriver theme keys, so render it in the same
// theme scope the app uses (defaults to light mode without a ThemeModeProvider).
const renderPill = (element: React.ReactElement) =>
  render(<MassdriverThemeScope>{element}</MassdriverThemeScope>);

describe('InstanceStatusPill', () => {
  it.each([
    ['INITIALIZED', 'Initialized'],
    ['PROVISIONED', 'Provisioned'],
    ['DECOMMISSIONED', 'Decommissioned'],
    ['EXTERNAL', 'Remote Reference'],
    ['FAILED', 'Deployment Failed'],
  ])('renders the human label for %s', (status, label) => {
    renderPill(<InstanceStatusPill status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it('renders an em dash for an unknown status', () => {
    renderPill(<InstanceStatusPill status="RUNNING" />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('renders an em dash when the status is missing', () => {
    renderPill(<InstanceStatusPill status={null} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
