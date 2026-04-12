'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'cyberpunk' | 'zelda' | 'animal-crossing';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'kazu-games-theme';
/** Earlier Kazu Deals branding; migrate once. */
const LEGACY_KAZU_DEALS_THEME_KEY = 'kazu-deals-theme';
/** Original app name; migrate once. */
const LEGACY_CARTRIDGE_THEME_KEY = 'cartridge-vault-theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('cyberpunk');

  // Load theme from localStorage on initial load
  useEffect(() => {
    const raw =
      localStorage.getItem(THEME_STORAGE_KEY) ??
      localStorage.getItem(LEGACY_KAZU_DEALS_THEME_KEY) ??
      localStorage.getItem(LEGACY_CARTRIDGE_THEME_KEY);
    const savedTheme = raw as Theme;
    if (savedTheme && ['cyberpunk', 'zelda', 'animal-crossing'].includes(savedTheme)) {
      setThemeState(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
      if (!localStorage.getItem(THEME_STORAGE_KEY)) {
        localStorage.setItem(THEME_STORAGE_KEY, savedTheme);
        localStorage.removeItem(LEGACY_KAZU_DEALS_THEME_KEY);
        localStorage.removeItem(LEGACY_CARTRIDGE_THEME_KEY);
      }
    }
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    localStorage.removeItem(LEGACY_KAZU_DEALS_THEME_KEY);
    localStorage.removeItem(LEGACY_CARTRIDGE_THEME_KEY);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
