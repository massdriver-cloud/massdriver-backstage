import { render, screen } from '@testing-library/react';
import { MassdriverThemeScope } from '../theme/MassdriverThemeScope';
import { ConditionsCell } from './ConditionsCell';

const renderCell = (element: React.ReactElement) =>
  render(<MassdriverThemeScope>{element}</MassdriverThemeScope>);

describe('ConditionsCell', () => {
  it('renders the wildcard label for "*" conditions', () => {
    renderCell(<ConditionsCell conditions="*" />);
    expect(screen.getByText('Applies to everything')).toBeInTheDocument();
  });

  it('renders scalar conditions as key = value', () => {
    renderCell(<ConditionsCell conditions='{"md-env":"prod"}' />);
    expect(screen.getByText('md-env')).toBeInTheDocument();
    expect(screen.getByText('=')).toBeInTheDocument();
    expect(screen.getByText('prod')).toBeInTheDocument();
  });

  it('renders array conditions with the membership glyph', () => {
    renderCell(<ConditionsCell conditions='{"team":["core","infra"]}' />);
    expect(screen.getByText('∈')).toBeInTheDocument();
    expect(screen.getByText('[core, infra]')).toBeInTheDocument();
  });
});
