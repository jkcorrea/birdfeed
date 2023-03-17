const theme = require('tailwindcss/defaultTheme')
const daisyTheme = require('daisyui/src/colors/themes')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx,jsx,js}'],
  theme: {
    extend: {
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      fontFamily: {
        sans: ['Nunito', ...theme.fontFamily.sans],
        serif: ['Nunito', ...theme.fontFamily.serif],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
    require('@tailwindcss/aspect-ratio'),
    require('@tailwindcss/line-clamp'),
    require('tailwind-scrollbar'),
    require('daisyui'),
  ],
  daisyui: {
    logs: false,
  },
}
