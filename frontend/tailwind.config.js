/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mint: {
          50: '#f4faf6',
          100: '#e8f5ed',
          200: '#d4ebdc',
          300: '#B5D8BF',  // Base Mint Green
          400: '#9ACC9F',
          500: '#88B494',  // Darker untuk tombol/highlight
          600: '#6fa87d',
          700: '#5a8f6a',
          800: '#467252',
          900: '#355842',
        },
        peach: {
          50: '#fef8f5',
          100: '#fdeee8',
          200: '#fbd9cc',
          300: '#F4A896',  // Soft Coral/Peach aksen
          400: '#f18f77',
          500: '#ed7457',
          600: '#d85839',
          700: '#b4412c',
          800: '#923527',
          900: '#782d24',
        },
        dark: {
          50: '#f7f8f7',
          100: '#e8eae9',
          200: '#d1d5d3',
          300: '#2F4F3F',  // Dark Green untuk teks
          400: '#334',    // Charcoal
          500: '#2a3f32',
          600: '#1f2e24',
          700: '#1a251f',
          800: '#141d18',
          900: '#0f1612',
        },
      },
    },
  },
  plugins: [],
}
