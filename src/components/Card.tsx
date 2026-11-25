/**
 * White card with a soft shadow: tinted icon badge + title (+ optional
 * subtitle), content, and a small "Read aloud" pill. `tone` tints the whole
 * card for status (overdue = rose, due soon = amber, done = green).
 */
import React from 'react';
import { View } from 'react-native';
import { AppText } from './AppText';
import { SpeakButton } from './SpeakButton';
import { IconBadge, type IconName } from './IconBadge';
import { SHADOW, type Hue } from '../theme/palette';

type Props = {
  title: string;
  subtitle?: string;
  icon?: IconName;
  hue?: Hue;
  speakText?: string;
  tone?: 'default' | 'good' | 'warn' | 'bad';
  right?: React.ReactNode; // e.g. a status chip next to the title
  children?: React.ReactNode;
};

const TONE: Record<NonNullable<Props['tone']>, string> = {
  default: 'bg-surface',
  good: 'bg-good-bg',
  warn: 'bg-warn-bg',
  bad: 'bg-bad-bg',
};

export function Card({ title, subtitle, icon, hue = 'teal', speakText, tone = 'default', right, children }: Props) {
  return (
    <View className={`${TONE[tone]} rounded-card p-4 mb-4`} style={tone === 'default' ? SHADOW.card : undefined}>
      <View className="flex-row items-center">
        {icon ? <IconBadge icon={icon} hue={hue} onTint={tone !== 'default'} /> : null}
        <View className={`flex-1 ${icon ? 'ml-3' : ''}`}>
          <AppText variant="lead" bold accessibilityRole="header">
            {title}
          </AppText>
          {subtitle ? (
            <AppText variant="caption" className="text-muted">
              {subtitle}
            </AppText>
          ) : null}
        </View>
        {right ? <View className="ml-2">{right}</View> : null}
      </View>
      {children ? <View className="mt-3">{children}</View> : null}
      <View className="flex-row justify-end mt-2 -mb-1">
        <SpeakButton text={speakText ?? [title, subtitle].filter(Boolean).join('. ')} />
      </View>
    </View>
  );
}
