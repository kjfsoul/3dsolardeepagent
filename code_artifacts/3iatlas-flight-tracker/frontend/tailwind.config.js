
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'atlas-green': '#00ff88',
        'atlas-blue': '#00aaff',
        'atlas-dark': '#0a0a0a',
      },
    },
  },
  plugins: [],
}
