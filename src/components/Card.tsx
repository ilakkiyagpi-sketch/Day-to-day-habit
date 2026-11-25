/**
 * A "Today" card: title row with a read-aloud button, then content.
 * `speakText` defaults to the title; pass the full card text for read-aloud.
 */
import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { SpeakButton } from './SpeakButton';
import { usePrefs } from '../theme/PreferencesProvider';

type Props = {
  title: string;
  icon?: keyof typeof Ionicons.glyphMap;
  speakText?: string;
  tone?: 'default' | 'good' | 'warn' | 'bad';
  children?: React.ReactNode;
};

const TONE: Record<NonNullable<Props['tone']>, string> = {
  default: 'bg-surface border-line',
  good: 'bg-good-bg border-good',
  warn: 'bg-warn-bg border-warn',
  bad: 'bg-bad-bg border-bad',
};

export function Card({ title, icon, speakText, tone = 'default', children }: Props) {
  const { color } = usePrefs();
  return (
    <View className={`${TONE[tone]} border rounded-card p-4 mb-4`}>
      {/* Title on its own row so long Tamil titles never collide with the button. */}
      <View className="flex-row items-center mb-2">
        {icon ? <Ionicons name={icon} size={24} color={color('accent')} /> : null}
        <AppText variant="lead" bold className={`flex-1 ${icon ? 'ml-2' : ''}`} accessibilityRole="header">
          {title}
        </AppText>
      </View>
      {children}
      <View className="flex-row justify-end mt-1 -mb-2">
        <SpeakButton text={speakText ?? title} />
      </View>
    </View>
  );
}
