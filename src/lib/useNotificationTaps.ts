/** Tapping a reminder notification opens the screen it is about (e.g. /payments). */
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { initNotifications } from './notifications';

export function useNotificationTaps() {
  useEffect(() => {
    if (Platform.OS === 'web') return;
    initNotifications();
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const url = response.notification.request.content.data?.url;
      if (typeof url === 'string') router.push(url as '/payments');
    });
    return () => sub.remove();
  }, []);
}
