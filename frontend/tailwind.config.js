/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#213448',  // primary deep
          50: '#f0f3f6',
          100: '#dde3e8',
          200: '#bcc7d2',
          300: '#94a8b9',
          400: '#6d8a9f',
          500: '#547792',  // secondary
          600: '#425d75',
          700: '#354c5f',
          800: '#2b3e4f',
          900: '#213448',  // primary deep
        },
        accent: {
          DEFAULT: '#94B4C1',  // accent
          50: '#f4f8f9',
          100: '#e8eff2',
          200: '#d5e3e8',
          300: '#bdd4dc',
          400: '#a8c4cf',
          500: '#94B4C1',  // accent
          600: '#7699ab',
          700: '#5f7f8e',
          800: '#4d6673',
          900: '#3f535d',
        },
        background: {
          DEFAULT: '#ECEFCA',  // light background
          light: '#f7f9e8',
          dark: '#e5e8bd',
        },
      },
    },
  },
  plugins: [],
}
