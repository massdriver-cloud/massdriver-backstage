import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'massdriver-theme-mode';

const getInitialMode = (): ThemeMode => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') {
      return stored;
    }
  } catch {
    // localStorage unavailable (SSR / restricted) — fall through to default.
  }
  return 'light';
};

const ThemeModeContext = createContext<{
  mode: ThemeMode;
  toggleMode: () => void;
}>({ mode: 'light', toggleMode: () => {} });

/**
 * Owns the Massdriver light/dark mode for the in-Backstage views. Independent
 * of Backstage's own theme; persisted to localStorage (mirrors the web app's
 * `useThemeModeState`).
 */
export const ThemeModeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<ThemeMode>(getInitialMode);

  const toggleMode = useCallback(() => {
    setMode(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // ignore persistence failures
      }
      return next;
    });
  }, []);

  const value = useMemo(() => ({ mode, toggleMode }), [mode, toggleMode]);

  return (
    <ThemeModeContext.Provider value={value}>
      {children}
    </ThemeModeContext.Provider>
  );
};

export const useThemeMode = () => useContext(ThemeModeContext);
