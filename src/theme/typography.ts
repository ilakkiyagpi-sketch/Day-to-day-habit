/**
 * Type scale (at "Normal"): body 17px, headings 21–25px.
 * Everything is multiplied by the user's text-size setting (Small → Extra large).
 */
export type FontScale = 'small' | 'normal' | 'large' | 'xl';

export const FONT_SCALES: FontScale[] = ['small', 'normal', 'large', 'xl'];

export const FONT_SCALE_FACTOR: Record<FontScale, number> = {
  small: 0.88,
  normal: 1,
  large: 1.15,
  xl: 1.3,
};

export const TEXT_SIZES = {
  caption: 15,
  body: 17,
  lead: 18,
  title: 21,
  display: 25,
  huge: 34, // big numbers (BP readings, counts)
} as const;

export type TextVariant = keyof typeof TEXT_SIZES;

/** Font families per language; Tamil needs Noto Sans Tamil for correct shaping. */
export const FONT_FAMILY = {
  en: { regular: 'NotoSans_400Regular', bold: 'NotoSans_700Bold' },
  ta: { regular: 'NotoSansTamil_400Regular', bold: 'NotoSansTamil_700Bold' },
} as const;
