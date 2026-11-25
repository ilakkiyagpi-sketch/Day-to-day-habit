/**
 * "Read aloud" pill shown on every card. Uses on-device text-to-speech in
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
      // 56px tall touch area, visually a slim pill
      hitSlop={{ top: 10, bottom: 10 }}
      className="flex-row items-center px-3 py-1.5 rounded-full bg-primary-soft active:opacity-70"
    >
      <Ionicons name={speaking ? 'stop-circle' : 'volume-high'} size={18} color={color('primary')} />
      <AppText variant="caption" bold className="ml-1.5 text-primary">
        {t('common.readAloud')}
      </AppText>
    </Pressable>
  );
}
