/** App logo + name, used on the sign-in and PIN screens. */
import React from 'react';
import { Image, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText } from './AppText';

export function BrandHeader({ compact }: { compact?: boolean }) {
  const { t } = useTranslation();
  const size = compact ? 64 : 88;
  return (
    <View className="items-center mt-4 mb-6">
      <Image
        source={require('../../assets/icon.png')}
        style={{ width: size, height: size, borderRadius: size * 0.28, boxShadow: '0px 8px 20px rgba(11, 93, 75, 0.3)' }}
        accessibilityIgnoresInvertColors
        accessible={false}
      />
      <AppText variant={compact ? 'title' : 'display'} className="mt-4" accessibilityRole="header">
        {t('appName')}
      </AppText>
      {!compact ? <AppText className="text-muted mt-1">{t('tagline')}</AppText> : null}
    </View>
  );
}
