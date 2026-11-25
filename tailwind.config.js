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
        'bg': v('bg'),
        'surface': v('surface'),
        'surface-2': v('surface-2'),
        'ink': v('ink'),
        'muted': v('muted'),
        'line': v('line'),
        'primary': v('primary'),
        'primary-2': v('primary-2'),
        'on-primary': v('on-primary'),
        'primary-soft': v('primary-soft'),
        'accent': v('accent'),
        'good': v('good'),
        'warn': v('warn'),
        'bad': v('bad'),
        'good-bg': v('good-bg'),
        'warn-bg': v('warn-bg'),
        'bad-bg': v('bad-bg'),
        'green-soft': v('green-soft'),
        'green-ink': v('green-ink'),
        'amber-soft': v('amber-soft'),
        'amber-ink': v('amber-ink'),
        'blue-soft': v('blue-soft'),
        'blue-ink': v('blue-ink'),
        'rose-soft': v('rose-soft'),
        'rose-ink': v('rose-ink'),
        'violet-soft': v('violet-soft'),
        'violet-ink': v('violet-ink'),
        'teal-soft': v('teal-soft'),
        'teal-ink': v('teal-ink'),
      },
      minHeight: { tap: '56px' },
      minWidth: { tap: '56px' },
      borderRadius: { card: '24px', btn: '18px' },
    },
  },
  plugins: [],
};
