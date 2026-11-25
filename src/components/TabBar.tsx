/**
 * Shared tab-bar options: white bar with a soft top shadow; the active tab's
 * icon sits in a green pill. Icons always have text labels (max 4 tabs).
 */
import React from 'react';
import { Text, View, type ColorValue } from 'react-native';
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
      height: 92 + insets.bottom,
      paddingTop: 10,
      paddingBottom: 8 + insets.bottom,
      backgroundColor: color('surface'),
      borderTopWidth: 0,
      boxShadow: '0px -2px 12px rgba(28, 25, 23, 0.06)',
    },
    // Up to 2 lines so Tamil words like "என் பகுதி" are never cut off.
    tabBarLabel: ({ color: c, focused, children }: { color: ColorValue; focused: boolean; children: string }) => (
      <Text
        numberOfLines={2}
        maxFontSizeMultiplier={1}
        style={{
          color: c,
          fontSize: Math.min(14 * scale, 17),
          lineHeight: Math.min(14 * scale, 17) * 1.3,
          fontFamily: FONT_FAMILY[language][focused ? 'bold' : 'regular'],
          textAlign: 'center',
          marginTop: 2,
        }}
      >
        {children}
      </Text>
    ),
    tabBarItemStyle: { minHeight: 64 },
  };
}

export function tabIcon(name: keyof typeof Ionicons.glyphMap) {
  return function TabIcon({ color, focused }: { color: ColorValue; focused: boolean }) {
    return (
      <View className={`rounded-full px-4 py-1 ${focused ? 'bg-primary-soft' : ''}`}>
        <Ionicons
          name={(focused ? name : `${name}-outline`) as keyof typeof Ionicons.glyphMap}
          size={24}
          color={color as string}
        />
      </View>
    );
  };
}
