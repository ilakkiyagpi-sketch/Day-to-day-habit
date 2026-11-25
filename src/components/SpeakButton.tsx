/**
 * "Read aloud" button shown on every card. Uses on-device text-to-speech in
 * the user's language (ta-IN / en-IN). Tapping again stops speaking.
 */
import React, { useState } from 'react';
import { Pressable } from 'react-native';
import * as Speech from 'expo-speech';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppText } from './AppText';
import { usePrefs } from '../theme/PreferencesProvider';
import { SPEECH_LOCALE } from '../i18n';

export function speak(text: string, language: 'en' | 'ta', onDone?: () => void) {
  Speech.stop();
  Speech.speak(text, { language: SPEECH_LOCALE[language], rate: 0.9, onDone, onStopped: onDone });
}

export function SpeakButton({ text }: { text: string }) {
  const { t } = useTranslation();
  const { language, color } = usePrefs();
  const [speaking, setSpeaking] = useState(false);

  const onPress = () => {
    if (speaking) {
      Speech.stop();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    speak(text, language, () => setSpeaking(false));
  };

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t('common.readAloud')}
      className="min-h-tap min-w-tap flex-row items-center px-2 rounded-xl active:opacity-70"
    >
      <Ionicons name={speaking ? 'stop-circle' : 'volume-high'} size={28} color={color('primary')} />
      <AppText variant="caption" bold className="ml-1 text-primary">
        {t('common.readAloud')}
      </AppText>
    </Pressable>
  );
}
