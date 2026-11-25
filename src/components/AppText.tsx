/**
 * The only text component screens should use. Applies the senior-friendly
 * type scale × the user's font-size setting, and picks the Tamil font when the
 * UI language is Tamil so Tamil glyphs render correctly.
 */
import React from 'react';
import { Text, type TextProps } from 'react-native';
import { usePrefs } from '../theme/PreferencesProvider';
import { FONT_FAMILY, TEXT_SIZES, type TextVariant } from '../theme/typography';

type Props = TextProps & {
  variant?: TextVariant;
  bold?: boolean;
  className?: string;
};

/** True if the caller already chose a text colour (e.g. `text-bad`), not just alignment. */
const HAS_COLOR = /(^|\s)text-(?!center|left|right|justify)[a-z]/;

export function AppText({ variant = 'body', bold, style, className, ...rest }: Props) {
  const { scale, language } = usePrefs();
  const isHeading = variant === 'title' || variant === 'display' || variant === 'huge';
  const size = Math.round(TEXT_SIZES[variant] * scale);
  const family = FONT_FAMILY[language][bold || isHeading ? 'bold' : 'regular'];
  return (
    <Text
      // Respect the phone's own accessibility font setting too, but cap it so
      // layouts don't break when combined with our own scaling.
      maxFontSizeMultiplier={1.3}
      className={HAS_COLOR.test(className ?? '') ? className : `text-ink ${className ?? ''}`}
      style={[{ fontSize: size, lineHeight: Math.round(size * 1.45), fontFamily: family }, style]}
      {...rest}
    />
  );
}
