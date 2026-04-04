'use client';

import React from 'react';
import { useTheme } from '@/lib/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="relative inline-block">
      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value as any)}
        className="appearance-none bg-surface border border-accent/30 text-text-primary text-xs font-display py-1.5 px-3 pr-8 rounded-md cursor-pointer hover:border-accent transition-colors focus:outline-none focus:ring-1 focus:ring-accent"
      >
        <option value="cyberpunk">Cyberpunk</option>
        <option value="zelda">Zelda</option>
        <option value="animal-crossing">Animal Crossing</option>
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-accent">
        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
        </svg>
      </div>
    </div>
  );
};

export default ThemeToggle;
