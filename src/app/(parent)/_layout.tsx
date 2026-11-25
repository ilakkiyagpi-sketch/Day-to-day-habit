/** Parent (Amma/Appa) tabs: Today · Health · My Space · Help. */
import React from 'react';
import { Tabs } from 'expo-router/tabs';
import { useTranslation } from 'react-i18next';
import { tabIcon, useTabScreenOptions } from '../../components/TabBar';

export default function ParentLayout() {
  const { t } = useTranslation();
  const options = useTabScreenOptions();
  return (
    <Tabs screenOptions={options}>
      <Tabs.Screen name="today" options={{ title: t('tabs.today'), tabBarIcon: tabIcon('sunny') }} />
      <Tabs.Screen name="health" options={{ title: t('tabs.health'), tabBarIcon: tabIcon('heart') }} />
      <Tabs.Screen name="my-space" options={{ title: t('tabs.mySpace'), tabBarIcon: tabIcon('person') }} />
      <Tabs.Screen name="help" options={{ title: t('tabs.help'), tabBarIcon: tabIcon('call') }} />
      {/* Reachable from My Space, not shown as tabs: */}
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="what-manu-sees" options={{ href: null }} />
    </Tabs>
  );
}
