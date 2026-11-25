/**
 * Kudumbam design tokens (RGB triplets so Tailwind can apply alpha).
 *
 * Look: warm off-white background, white cards with soft shadows, a deep
 * green brand colour with an amber accent (from the app icon), and soft
 * tinted badges to tell sections apart at a glance.
 *
 * Contrast: `ink` and `muted` on `bg`/`surface`, `on-primary` on `primary`, and
 * each `*-ink` colour on its `*-soft` tint are all ≥ 4.5:1 (WCAG AA) in both
 * modes. Tints/`line` are decorative only — never use them for text.
 */
export type PaletteName = 'light' | 'dark';

export const palettes: Record<PaletteName, Record<string, string>> = {
  light: {
    bg: '246 244 239',
    surface: '255 255 255',
    'surface-2': '250 249 246',
    ink: '28 25 23',
    muted: '87 83 78',
    line: '231 229 228',
    primary: '11 93 75',
    'primary-2': '6 70 56', // gradient end
    'on-primary': '255 255 255',
    'primary-soft': '223 241 235',
    accent: '217 119 6', // icon/decoration only
    good: '21 128 61',
    warn: '161 72 7',
    bad: '190 18 60',
    'good-bg': '220 252 231',
    'warn-bg': '254 243 199',
    'bad-bg': '255 228 230',
    // badge tints + their readable ink
    'green-soft': '220 252 231',
    'green-ink': '21 101 52',
    'amber-soft': '254 243 199',
    'amber-ink': '146 64 14',
    'blue-soft': '219 234 254',
    'blue-ink': '30 64 175',
    'rose-soft': '255 228 230',
    'rose-ink': '159 18 57',
    'violet-soft': '237 233 254',
    'violet-ink': '91 33 182',
    'teal-soft': '204 251 241',
    'teal-ink': '17 94 89',
  },
  dark: {
    bg: '17 17 16',
    surface: '30 30 28',
    'surface-2': '38 38 35',
    ink: '245 245 244',
    muted: '214 211 209',
    line: '60 58 55',
    primary: '94 234 212',
    'primary-2': '45 212 191',
    'on-primary': '10 30 26',
    'primary-soft': '19 61 52',
    accent: '251 191 36',
    good: '134 239 172',
    warn: '253 224 71',
    bad: '253 164 175',
    'good-bg': '20 54 33',
    'warn-bg': '62 46 10',
    'bad-bg': '76 20 32',
    'green-soft': '20 54 33',
    'green-ink': '134 239 172',
    'amber-soft': '62 46 10',
    'amber-ink': '253 224 71',
    'blue-soft': '23 37 84',
    'blue-ink': '147 197 253',
    'rose-soft': '76 20 32',
    'rose-ink': '253 164 175',
    'violet-soft': '46 16 101',
    'violet-ink': '196 181 253',
    'teal-soft': '19 61 52',
    'teal-ink': '94 234 212',
  },
};

/** Convert "r g b" to "rgb(r,g,b)" for places that need a JS colour (icons). */
export const rgb = (triplet: string) => `rgb(${triplet.split(' ').join(',')})`;

/** Badge colour families used by cards, list rows and chips. */
export type Hue = 'green' | 'amber' | 'blue' | 'rose' | 'violet' | 'teal';

/** Soft card shadow that works on Android, iOS and web. */
export const SHADOW = {
  card: { boxShadow: '0px 2px 10px rgba(28, 25, 23, 0.07)' },
  raised: { boxShadow: '0px 6px 20px rgba(11, 93, 75, 0.25)' },
} as const;
