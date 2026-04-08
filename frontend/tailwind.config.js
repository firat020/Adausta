/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FF6B35',
        dark: '#1a1a2e',
        navy: '#16213e',
      }
    },
  },
  plugins: [],
}

