/**
 * Always-visible "Text size  A−  A+" control for the home screens, so nobody
 * has to dig into Settings to make letters smaller or bigger.
 */
import React from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText } from './AppText';
import { useDisplaySettings } from '../lib/useDisplaySettings';

export function TextSizeControl() {
  const { t } = useTranslation();
  const { smaller, bigger, canSmaller, canBigger, fontScale } = useDisplaySettings();
  const btn = (label: string, a11y: string, onPress: () => void, enabled: boolean) => (
    <Pressable
      onPress={onPress}
      disabled={!enabled}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      accessibilityState={{ disabled: !enabled }}
      className={`min-h-tap min-w-tap px-3 ml-2 rounded-xl border-2 border-primary bg-surface items-center justify-center ${
        enabled ? '' : 'opacity-40'
      }`}
    >
      <AppText bold className="text-primary">
        {label}
      </AppText>
    </Pressable>
  );
  return (
    <View className="flex-row items-center justify-end mb-2">
      <AppText variant="caption" className="text-muted">
        {t('settings.fontSize')}: {t(`settings.font_${fontScale}`)}
      </AppText>
      {btn('A−', t('settings.smaller'), smaller, canSmaller)}
      {btn('A+', t('settings.bigger'), bigger, canBigger)}
    </View>
  );
}
