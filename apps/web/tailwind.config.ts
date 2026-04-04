import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        void: 'var(--bg-void)',
        surface: 'var(--bg-surface)',
        elevated: 'var(--bg-elevated)',
        accent: 'var(--accent)',
        'accent-secondary': 'var(--accent-secondary)',
        'neon-yellow': 'var(--neon-yellow)',
        'neon-green': 'var(--neon-green)',
        'neon-purple': 'var(--neon-purple)',
        'text-primary': 'var(--text-primary)',
        'text-muted': 'var(--text-muted)',
      },
      fontFamily: {
        /** Theme display face (Orbitron / Cinzel / Varela Round via CSS variables) */
        display: [
          'var(--font-display)',
          'ui-sans-serif',
          'system-ui',
          'sans-serif',
        ],
        orbitron: ['var(--font-orbitron)', 'sans-serif'],
        inter: ['var(--font-inter)', 'sans-serif'],
      },
      boxShadow: {
        'neon-cyan': '0 0 8px #00f3ff, 0 0 20px #00f3ff40',
        'neon-pink': '0 0 8px #ff003c, 0 0 20px #ff003c40',
        'neon-yellow': '0 0 8px #fcee0a, 0 0 20px #fcee0a40',
        'neon-green': '0 0 8px #39ff14, 0 0 20px #39ff1440',
        'glass': '0 4px 32px 0 rgba(0,243,255,0.08)',
      },
      backgroundImage: {
        'scanlines': 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.12) 2px, rgba(0,0,0,0.12) 4px)',
        'grid-cyber': 'linear-gradient(rgba(0,243,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,243,255,0.04) 1px, transparent 1px)',
      },
      animation: {
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'glitch': 'glitch 0.3s ease-in-out',
        'scanline': 'scanline 8s linear infinite',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        'glitch': {
          '0%': { transform: 'translate(0)', clipPath: 'inset(0 0 100% 0)' },
          '20%': { transform: 'translate(-2px, 2px)', clipPath: 'inset(20% 0 60% 0)' },
          '40%': { transform: 'translate(2px, -2px)', clipPath: 'inset(50% 0 30% 0)' },
          '60%': { transform: 'translate(-1px, 1px)', clipPath: 'inset(70% 0 10% 0)' },
          '80%': { transform: 'translate(1px, -1px)', clipPath: 'inset(80% 0 5% 0)' },
          '100%': { transform: 'translate(0)', clipPath: 'inset(0 0 0 0)' },
        },
        'scanline': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
