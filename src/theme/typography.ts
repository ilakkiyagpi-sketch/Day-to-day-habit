/**
 * Type scale. Base body text is 18px (never smaller), headings 24–28px.
 * Everything is multiplied by the user's font-size setting.
 */
export type FontScale = 'normal' | 'large' | 'xl';

export const FONT_SCALE_FACTOR: Record<FontScale, number> = {
  normal: 1,
  large: 1.2,
  xl: 1.4,
};

export const TEXT_SIZES = {
  caption: 18, // smallest text allowed anywhere
  body: 20,
  lead: 22,
  title: 26,
  display: 32,
  huge: 44, // big numbers (BP readings, counts)
} as const;

export type TextVariant = keyof typeof TEXT_SIZES;

/** Font families per language; Tamil needs Noto Sans Tamil for correct shaping. */
export const FONT_FAMILY = {
  en: { regular: 'NotoSans_400Regular', bold: 'NotoSans_700Bold' },
  ta: { regular: 'NotoSansTamil_400Regular', bold: 'NotoSansTamil_700Bold' },
} as const;
