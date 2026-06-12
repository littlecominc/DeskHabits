import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#f9f6f0',         // page background (cream)
        panel: '#ffffff',       // card / panel background
        panel2: '#f3ede2',      // raised / secondary panel
        border: '#e6ded2',
        accent: '#3a8aab',      // ocean blue (ValuePiece primary)
        muted: '#6f7585',
        text: '#20242f',
        green: '#16a34a',
        yellow: '#c8862b',
        red: '#dc2626',
      },
      borderRadius: {
        xl2: '20px',
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'serif'],
        sans: ['"DM Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
