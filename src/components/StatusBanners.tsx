/**
 * Clear, friendly banners for offline state and demo mode.
 * ("Saved on phone, will sync when internet returns.")
 */
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useTranslation } from 'react-i18next';
import { AppText } from './AppText';
import { isDemoMode } from '../lib/supabase';

export function useOnline(): boolean {
  const [online, setOnline] = useState(true);
  useEffect(
    () => NetInfo.addEventListener((s) => setOnline(s.isConnected !== false && s.isInternetReachable !== false)),
    [],
  );
  return online;
}

export function StatusBanners() {
  const { t } = useTranslation();
  const online = useOnline();
  return (
    <View>
      {!online ? (
        <View className="bg-warn-bg border-b-2 border-warn px-4 py-2" accessibilityLiveRegion="polite">
          <AppText variant="caption" bold className="text-warn">
            {t('common.offline')}
          </AppText>
        </View>
      ) : null}
      {isDemoMode ? (
        <View className="bg-surface border-b border-line px-4 py-1">
          <AppText variant="caption" className="text-muted">
            {t('common.demoMode')}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}
