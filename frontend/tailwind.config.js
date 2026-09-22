/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'den-yellow': '#FFE500',
        'den-bg': '#0A0A0A',
        'den-card': '#141414',
        'den-border': '#242424',
        'den-text': '#FAFAF7',
        'den-muted': '#666666',
        'den-success': '#2ED573',
        'den-danger': '#FF4757',
      },
      fontFamily: {
        grotesk: ['Space Grotesk', 'sans-serif'],
        syne: ['Syne', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
