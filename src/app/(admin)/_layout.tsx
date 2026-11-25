/** Manu's (admin) tabs: Family dashboard · Plans · Settings. */
import React from 'react';
import { Tabs } from 'expo-router/tabs';
import { useTranslation } from 'react-i18next';
import { tabIcon, useTabScreenOptions } from '../../components/TabBar';

export default function AdminLayout() {
  const { t } = useTranslation();
  const options = useTabScreenOptions();
  return (
    <Tabs screenOptions={options}>
      <Tabs.Screen name="family" options={{ title: t('tabs.dashboard'), tabBarIcon: tabIcon('people') }} />
      <Tabs.Screen name="plans" options={{ title: t('tabs.plans'), tabBarIcon: tabIcon('calendar') }} />
      <Tabs.Screen name="admin-settings" options={{ title: t('tabs.settings'), tabBarIcon: tabIcon('settings') }} />
    </Tabs>
  );
}
