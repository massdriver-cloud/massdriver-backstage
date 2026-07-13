import { render, screen } from '@testing-library/react';
import { MassdriverThemeScope } from '../../theme/MassdriverThemeScope';
import { OriginChip } from './OriginChip';

const renderChip = (element: React.ReactElement) =>
  render(<MassdriverThemeScope>{element}</MassdriverThemeScope>);

describe('OriginChip', () => {
  it('labels a provisioned resource', () => {
    renderChip(<OriginChip origin="PROVISIONED" />);
    expect(screen.getByText('Provisioned')).toBeInTheDocument();
  });

  it('labels an imported resource', () => {
    renderChip(<OriginChip origin="IMPORTED" />);
    expect(screen.getByText('Imported')).toBeInTheDocument();
  });

  it('passes an unknown origin through', () => {
    renderChip(<OriginChip origin="WEIRD" />);
    expect(screen.getByText('WEIRD')).toBeInTheDocument();
  });
});
