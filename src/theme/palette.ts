/**
 * Senior-friendly colour palettes (RGB triplets so Tailwind can apply alpha).
 * Contrast of `ink`/`muted` on `bg`/`surface` and `on-primary` on `primary`
 * is ≥ 4.5:1 (WCAG AA) in both modes. Do not add light-grey text colours.
 */
export type PaletteName = 'light' | 'dark';

export const palettes: Record<PaletteName, Record<string, string>> = {
  light: {
    bg: '255 248 239', // warm cream
    surface: '255 255 255',
    ink: '23 23 23',
    muted: '68 64 60', // stone-700, 9.7:1 on white
    line: '168 162 158',
    primary: '11 93 75', // deep green, 7.4:1 with white
    'on-primary': '255 255 255',
    accent: '154 52 18', // burnt orange
    good: '22 101 52',
    warn: '146 64 14',
    bad: '185 28 28',
    'good-bg': '220 252 231',
    'warn-bg': '254 243 199',
    'bad-bg': '254 226 226',
  },
  dark: {
    bg: '12 12 12',
    surface: '31 31 31',
    ink: '250 250 250',
    muted: '214 211 209',
    line: '120 113 108',
    primary: '94 234 212', // light teal, used with dark text
    'on-primary': '12 12 12',
    accent: '253 186 116',
    good: '134 239 172',
    warn: '253 224 71',
    bad: '252 165 165',
    'good-bg': '20 60 35',
    'warn-bg': '66 50 10',
    'bad-bg': '80 20 20',
  },
};

/** Convert "r g b" to "rgb(r,g,b)" for places that need a JS colour (icons). */
export const rgb = (triplet: string) => `rgb(${triplet.split(' ').join(',')})`;
