import { createContext, useContext, useState, useMemo, useCallback } from 'react';
import type { ReactNode } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { cockpitTheme } from './theme';
import { cockpitThemeLight } from './themeLight';

type ThemeMode = 'dark' | 'light';

interface ThemeToggleContextValue {
  mode: ThemeMode;
  toggleTheme: () => void;
}

const ThemeToggleContext = createContext<ThemeToggleContextValue>({
  mode: 'light',
  toggleTheme: () => undefined,
});

export const useThemeToggle = () => useContext(ThemeToggleContext);

const STORAGE_KEY = 'cockpit-ebv-theme';

function getSavedMode(): ThemeMode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    return 'light';
  } catch {
    return 'light';
  }
}

export function ThemeToggleProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(getSavedMode);

  const toggleTheme = useCallback(() => {
    setMode((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem(STORAGE_KEY, next); } catch { /* noop */ }
      return next;
    });
  }, []);

  const theme = useMemo(() => (mode === 'dark' ? cockpitTheme : cockpitThemeLight), [mode]);

  const value = useMemo(() => ({ mode, toggleTheme }), [mode, toggleTheme]);

  return (
    <ThemeToggleContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeToggleContext.Provider>
  );
}
