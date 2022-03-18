module.exports = {
  content: [],
  theme: {
    extend: {
      colors: { magenta: '#ff00ff' }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),],
  content: ['./src/**/*.{html,js,svelte,ts,md}'],
}
