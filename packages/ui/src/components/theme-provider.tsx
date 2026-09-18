'use client';

import * as React from 'react';

export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined);

export interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  enableSystem?: boolean;
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'ruang-digital-theme',
  enableSystem = true,
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>(() => {
    if (typeof window === 'undefined') return defaultTheme;
    try {
      const stored = localStorage.getItem(storageKey) as Theme | null;
      return stored || defaultTheme;
    } catch {
      return defaultTheme;
    }
  });

  const [resolvedTheme, setResolvedTheme] = React.useState<ResolvedTheme>(() => {
    if (typeof window === 'undefined') return defaultTheme === 'dark' ? 'dark' : 'light';
    try {
      const stored = (localStorage.getItem(storageKey) as Theme | null) || defaultTheme;
      if (stored === 'system' && enableSystem) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return stored === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  const applyTheme = React.useCallback(
    (targetTheme: Theme) => {
      const root = document.documentElement;
      let effectiveTheme: ResolvedTheme = 'light';

      if (targetTheme === 'system' && enableSystem) {
        effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      } else {
        effectiveTheme = targetTheme === 'dark' ? 'dark' : 'light';
      }

      if (effectiveTheme === 'dark') {
        root.classList.add('dark');
        root.style.colorScheme = 'dark';
      } else {
        root.classList.remove('dark');
        root.style.colorScheme = 'light';
      }

      setResolvedTheme(effectiveTheme);
    },
    [enableSystem]
  );

  const setTheme = React.useCallback(
    (newTheme: Theme) => {
      setThemeState(newTheme);
      try {
        localStorage.setItem(storageKey, newTheme);
      } catch (err) {
        console.warn('Gagal menyimpan preferensi tema ke localStorage:', err);
      }
      applyTheme(newTheme);
    },
    [storageKey, applyTheme]
  );

  const toggleTheme = React.useCallback(() => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  }, [resolvedTheme, setTheme]);

  // Initial apply & system preference listener
  React.useEffect(() => {
    applyTheme(theme);

    if (theme === 'system' && enableSystem) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        applyTheme('system');
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme, enableSystem, applyTheme]);

  // Sync with storage changes across tabs
  React.useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === storageKey && e.newValue) {
        const newTheme = e.newValue as Theme;
        setThemeState(newTheme);
        applyTheme(newTheme);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [storageKey, applyTheme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export function ThemeScript({
  storageKey = 'ruang-digital-theme',
  defaultTheme = 'system',
}: {
  storageKey?: string;
  defaultTheme?: string;
}) {
  const scriptContent = `
    (function() {
      try {
        var key = '${storageKey}';
        var stored = localStorage.getItem(key);
        var theme = stored || '${defaultTheme}';
        var resolved = theme;
        if (theme === 'system') {
          resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        var root = document.documentElement;
        if (resolved === 'dark') {
          root.classList.add('dark');
          root.style.colorScheme = 'dark';
        } else {
          root.classList.remove('dark');
          root.style.colorScheme = 'light';
        }
      } catch (e) {}
    })();
  `;

  return (
    <script
      dangerouslySetInnerHTML={{
        __html: scriptContent,
      }}
    />
  );
}
