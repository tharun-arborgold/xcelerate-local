/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/**/*.{tsx,ts,html}'],
  theme: {
    extend: {
      colors: {
        bg:       '#0d0d1a',
        surface:  '#13132a',
        surface2: '#1e1e3f',
        border:   '#2a2a50',
        muted:    '#7070a0',
        accent:   '#6366f1',
        accent2:  '#4f46e5',
      },
    },
  },
  plugins: [],
}
