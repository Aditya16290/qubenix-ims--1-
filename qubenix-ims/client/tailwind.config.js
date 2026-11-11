/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Manrope', 'system-ui', 'sans-serif'] },
      colors: {
        ink: { 900: '#0F1B2D', 800: '#16263D', 700: '#22365A', 500: '#5C6B84', 300: '#A9B3C4', 100: '#E6E9EF', 50: '#F5F6F8' },
        volt: { 600: '#4B36F0', 500: '#5B47FB', 100: '#E9E6FF' },
      },
    },
  },
  plugins: [],
};
