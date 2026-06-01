/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"DM Sans"', 'sans-serif'],
      },
      colors: {
        surface: {
          base: '#0c0c0e',
          card: '#141416',
          elevated: '#1c1c20',
          border: '#222228',
        },
        ink: {
          DEFAULT: '#f0f0f2',
          muted: '#888893',
          faint: '#444450',
        },
        accent: {
          tech: '#00d4ff',
          sports: '#ff6b35',
          football: '#4ade80',
          entertainment: '#f59e0b',
          news: '#a78bfa',
        },
      },
    },
  },
  plugins: [],
};
