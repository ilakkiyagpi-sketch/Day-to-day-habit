/**
 * Root layout: loads fonts, sets up providers (preferences/theme, i18n, auth,
 * undo toasts) and guards routes by auth state and role:
 *
 *   signed out              → /sign-in
 *   signed in, PIN not set  → /pin   (setup)
 *   signed in, locked       → /pin   (enter)
 *   unlocked parent         → (parent) tabs: Today · Health · My Space · Help
 *   unlocked admin (Manu)   → (admin) tabs:  Family · Plans · Settings
 */
import '../../global.css';
import '../i18n';
import React, { useEffect } from 'react';
import { Stack, SplashScreen } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NotoSans_400Regular } from '@expo-google-fonts/noto-sans/400Regular';
import { NotoSans_700Bold } from '@expo-google-fonts/noto-sans/700Bold';
import { NotoSansTamil_400Regular } from '@expo-google-fonts/noto-sans-tamil/400Regular';
import { NotoSansTamil_700Bold } from '@expo-google-fonts/noto-sans-tamil/700Bold';
import { PreferencesProvider, usePrefs } from '../theme/PreferencesProvider';
import { AuthProvider, useAuth } from '../lib/auth';
import { ToastProvider } from '../components/Toast';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    NotoSans_400Regular,
    NotoSans_700Bold,
    NotoSansTamil_400Regular,
    NotoSansTamil_700Bold,
  });
  return (
    <SafeAreaProvider>
      <PreferencesProvider>
        <AuthProvider>
          <ToastProvider>
            <Guarded fontsLoaded={fontsLoaded} />
          </ToastProvider>
        </AuthProvider>
      </PreferencesProvider>
    </SafeAreaProvider>
  );
}

function Guarded({ fontsLoaded }: { fontsLoaded: boolean }) {
  const prefs = usePrefs();
  const { loading, session, profile, pinState, isDemo } = useAuth();
  const ready = fontsLoaded && prefs.ready && !loading;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  // Language and text size are managed by Manu on the profile; apply them.
  useEffect(() => {
    if (!profile) return;
    if (profile.language !== prefs.language) prefs.setLanguage(profile.language);
    if (profile.font_scale !== prefs.fontScale) prefs.setFontScale(profile.font_scale);
    // Only when a (new) profile loads — later local changes win until next sync.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id, profile?.language, profile?.font_scale]);

  if (!ready) return null;

  const signedIn = isDemo ? !!profile : !!session;
  const needsPin = signedIn && (pinState === 'needs_setup' || pinState === 'locked');
  const unlocked = signedIn && pinState === 'unlocked';

  return (
    <>
      <StatusBar style={prefs.palette === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="sign-in" />
        </Stack.Protected>
        <Stack.Protected guard={needsPin}>
          <Stack.Screen name="pin" />
        </Stack.Protected>
        <Stack.Protected guard={unlocked && !profile}>
          <Stack.Screen name="no-profile" />
        </Stack.Protected>
        <Stack.Protected guard={unlocked && profile?.role === 'parent'}>
          <Stack.Screen name="(parent)" />
        </Stack.Protected>
        <Stack.Protected guard={unlocked && profile?.role === 'admin'}>
          <Stack.Screen name="(admin)" />
        </Stack.Protected>
      </Stack>
    </>
  );
}
