/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        arcade: ['Orbitron', 'sans-serif'],
        sans: ['Rajdhani', 'sans-serif'],
      },
      colors: {
        cyan: {
          400: '#00f0ff',
          500: '#00d2df',
        }
      }
    },
  },
  plugins: [],
}

