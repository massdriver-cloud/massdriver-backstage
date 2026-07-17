import { useTheme } from '@mui/material/styles';

export type ThemeMode = 'light' | 'dark';

export const useThemeMode = (): ThemeMode =>
  useTheme().palette.mode === 'dark' ? 'dark' : 'light';
