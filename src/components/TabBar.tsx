/**
 * Shared tab-bar options: a tall bar (≥ 80px) with big icons AND text labels.
 * Max 4 tabs per role (design rule: no hamburger menus).
 */
import React from 'react';
import { Text, type ColorValue } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePrefs } from '../theme/PreferencesProvider';
import { FONT_FAMILY } from '../theme/typography';

export function useTabScreenOptions() {
  const { color, scale, language } = usePrefs();
  const insets = useSafeAreaInsets();
  return {
    headerShown: false,
    tabBarActiveTintColor: color('primary'),
    tabBarInactiveTintColor: color('muted'),
    tabBarStyle: {
      height: 88 + insets.bottom,
      paddingTop: 8,
      paddingBottom: 8 + insets.bottom,
      backgroundColor: color('surface'),
      borderTopColor: color('line'),
      borderTopWidth: 1,
    },
    // Custom label: up to 2 lines so Tamil words like "என் பகுதி" are never cut off.
    tabBarLabel: ({ color: c, children }: { color: ColorValue; children: string }) => (
      <Text
        numberOfLines={2}
        maxFontSizeMultiplier={1}
        style={{
          color: c,
          fontSize: Math.min(15 * scale, 18), // capped so 4 labels always fit
          lineHeight: Math.min(15 * scale, 18) * 1.3,
          fontFamily: FONT_FAMILY[language].bold,
          textAlign: 'center',
        }}
      >
        {children}
      </Text>
    ),
    tabBarItemStyle: { minHeight: 64 },
  };
}

export function tabIcon(name: keyof typeof Ionicons.glyphMap) {
  return function TabIcon({ color }: { color: ColorValue }) {
    return <Ionicons name={name} size={28} color={color as string} />;
  };
}
