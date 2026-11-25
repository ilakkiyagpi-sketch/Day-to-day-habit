// Tailwind theme for Kudumbam. Colours are CSS variables (set in
// src/theme/ThemeProvider.tsx) so light and dark mode share class names,
// e.g. `bg-surface text-ink`. Both palettes meet WCAG AA contrast.
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        bg: v('bg'),
        surface: v('surface'),
        ink: v('ink'), // main text
        muted: v('muted'), // secondary text (still AA contrast, never light grey)
        line: v('line'),
        primary: v('primary'),
        'on-primary': v('on-primary'),
        accent: v('accent'),
        good: v('good'),
        warn: v('warn'),
        bad: v('bad'),
        'good-bg': v('good-bg'),
        'warn-bg': v('warn-bg'),
        'bad-bg': v('bad-bg'),
      },
      minHeight: { tap: '56px' },
      minWidth: { tap: '56px' },
      borderRadius: { card: '20px' },
    },
  },
  plugins: [],
};
