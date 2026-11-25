/** Shown if someone signs in but Ilakkiya hasn't created their profile yet. */
import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Screen } from '../components/Screen';
import { AppText } from '../components/AppText';
import { BigButton } from '../components/BigButton';
import { useAuth } from '../lib/auth';

export default function NoProfile() {
  const { t } = useTranslation();
  const { signOut, refreshProfile } = useAuth();
  return (
    <Screen title={t('auth.welcome')}>
      <AppText className="mb-6">{t('auth.notLinked')}</AppText>
      <BigButton label={t('common.retry')} icon="refresh" onPress={refreshProfile} kind="secondary" />
      <View className="h-3" />
      <BigButton label={t('auth.signOut')} onPress={signOut} kind="ghost" />
    </Screen>
  );
}
