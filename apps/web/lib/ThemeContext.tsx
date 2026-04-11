'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'cyberpunk' | 'zelda' | 'animal-crossing';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'kazu-deals-theme';
/** Pre-rebrand key; read once to migrate saved theme. */
const LEGACY_THEME_STORAGE_KEY = 'cartridge-vault-theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('cyberpunk');

  // Load theme from localStorage on initial load
  useEffect(() => {
    const raw =
      localStorage.getItem(THEME_STORAGE_KEY) ?? localStorage.getItem(LEGACY_THEME_STORAGE_KEY);
    const savedTheme = raw as Theme;
    if (savedTheme && ['cyberpunk', 'zelda', 'animal-crossing'].includes(savedTheme)) {
      setThemeState(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
      if (!localStorage.getItem(THEME_STORAGE_KEY)) {
        localStorage.setItem(THEME_STORAGE_KEY, savedTheme);
        localStorage.removeItem(LEGACY_THEME_STORAGE_KEY);
      }
    }
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    localStorage.removeItem(LEGACY_THEME_STORAGE_KEY);
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
