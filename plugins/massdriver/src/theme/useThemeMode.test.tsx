import { createTheme, ThemeProvider } from '@mui/material/styles';
import { renderHook } from '@testing-library/react';
import { ReactNode } from 'react';
import { useThemeMode } from './useThemeMode';

const withTheme =
  (mode: 'light' | 'dark') =>
  ({ children }: { children: ReactNode }) =>
    (
      <ThemeProvider theme={createTheme({ palette: { mode } })}>
        {children}
      </ThemeProvider>
    );

describe('useThemeMode', () => {
  it('returns dark when the ambient theme is dark', () => {
    const { result } = renderHook(() => useThemeMode(), {
      wrapper: withTheme('dark'),
    });
    expect(result.current).toBe('dark');
  });

  it('returns light when the ambient theme is light', () => {
    const { result } = renderHook(() => useThemeMode(), {
      wrapper: withTheme('light'),
    });
    expect(result.current).toBe('light');
  });

  it('defaults to light without a theme provider', () => {
    const { result } = renderHook(() => useThemeMode());
    expect(result.current).toBe('light');
  });
});
