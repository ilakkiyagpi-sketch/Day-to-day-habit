/**
 * Always-visible "A− A+" text-size buttons, so nobody has to dig into
 * Settings to make letters smaller or bigger. `onDark` styles them for the
 * green hero header.
 */
import React from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText } from './AppText';
import { useDisplaySettings } from '../lib/useDisplaySettings';

export function TextSizeControl({ onDark }: { onDark?: boolean }) {
  const { t } = useTranslation();
  const { smaller, bigger, canSmaller, canBigger, fontScale } = useDisplaySettings();
  const btn = (label: string, a11y: string, onPress: () => void, enabled: boolean) => (
    <Pressable
      onPress={onPress}
      disabled={!enabled}
      accessibilityRole="button"
      accessibilityLabel={`${a11y} (${t(`settings.font_${fontScale}`)})`}
      accessibilityState={{ disabled: !enabled }}
      className={`min-h-tap min-w-tap px-3 ml-2 rounded-2xl items-center justify-center ${onDark ? '' : 'bg-primary-soft'} ${
        enabled ? '' : 'opacity-40'
      }`}
      style={onDark ? { backgroundColor: 'rgba(255,255,255,0.18)' } : undefined}
    >
      <AppText bold className={onDark ? '' : 'text-primary'} style={onDark ? { color: '#FFFFFF' } : undefined}>
        {label}
      </AppText>
    </Pressable>
  );
  return (
    <View className="flex-row items-center">
      {btn('A−', t('settings.smaller'), smaller, canSmaller)}
      {btn('A+', t('settings.bigger'), bigger, canBigger)}
    </View>
  );
}
