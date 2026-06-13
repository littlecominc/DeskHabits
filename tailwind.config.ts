import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0f0f13',         // --bg
        panel: '#1a1a24',       // --surface
        panel2: '#22222f',      // --surface2
        border: '#2e2e40',
        accent: '#6c63ff',      // indigo (prototype primary)
        muted: '#8888aa',
        text: '#e8e8f0',
        green: '#4ade80',
        yellow: '#fbbf24',
        red: '#f87171',
      },
      borderRadius: {
        xl2: '16px',
      },
      fontFamily: {
        // Prototype uses a system stack for everything; map both so any
        // lingering font-serif/font-sans utilities match the prototype.
        serif: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
