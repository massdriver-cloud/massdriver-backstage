import { createTheme, ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { MassdriverThemeScope } from './MassdriverThemeScope';
import { useThemeMode } from './useThemeMode';

const ModeProbe = () => <span>mode:{useThemeMode()}</span>;

describe('MassdriverThemeScope', () => {
  it('applies the dark Massdriver theme when Backstage is dark', () => {
    render(
      <ThemeProvider theme={createTheme({ palette: { mode: 'dark' } })}>
        <MassdriverThemeScope>
          <ModeProbe />
        </MassdriverThemeScope>
      </ThemeProvider>,
    );
    expect(screen.getByText('mode:dark')).toBeInTheDocument();
  });

  it('applies the light Massdriver theme when Backstage is light', () => {
    render(
      <ThemeProvider theme={createTheme({ palette: { mode: 'light' } })}>
        <MassdriverThemeScope>
          <ModeProbe />
        </MassdriverThemeScope>
      </ThemeProvider>,
    );
    expect(screen.getByText('mode:light')).toBeInTheDocument();
  });
});
