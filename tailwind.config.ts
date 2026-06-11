import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0f1424',        // page background
        panel: '#161d33',      // card / panel background
        panel2: '#1d2640',      // raised panel
        border: '#2a3354',
        accent: '#e8d9b5',      // cream/gold accent (Classic Indigo "brick" tone)
        muted: '#8a93b8',
        text: '#eef1fb',
        green: '#4ade80',
        yellow: '#fbbf24',
        red: '#f87171',
      },
      borderRadius: {
        xl2: '20px',
      },
    },
  },
  plugins: [],
};
export default config;
