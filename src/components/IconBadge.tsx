/** Rounded, softly tinted square holding an icon — the visual anchor of cards and rows. */
import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePrefs } from '../theme/PreferencesProvider';
import type { Hue } from '../theme/palette';

// Full class names (Tailwind only generates classes it can see in the source).
const BG: Record<Hue, string> = {
  green: 'bg-green-soft',
  amber: 'bg-amber-soft',
  blue: 'bg-blue-soft',
  rose: 'bg-rose-soft',
  violet: 'bg-violet-soft',
  teal: 'bg-teal-soft',
};

export type IconName = keyof typeof Ionicons.glyphMap;

export function IconBadge({ icon, hue = 'teal', size = 44, onTint }: { icon: IconName; hue?: Hue; size?: number; onTint?: boolean }) {
  const { color } = usePrefs();
  return (
    <View
      className={`${onTint ? 'bg-surface' : BG[hue]} items-center justify-center`}
      style={{ width: size, height: size, borderRadius: size * 0.32 }}
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      <Ionicons name={icon} size={Math.round(size * 0.52)} color={color(`${hue}-ink`)} />
    </View>
  );
}
