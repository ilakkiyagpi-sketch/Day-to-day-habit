/** Small status pill, e.g. "Due in 2 days" or "✓ Checked in". */
import React from 'react';
import { View } from 'react-native';
import { AppText } from './AppText';

export type ChipTone = 'good' | 'warn' | 'bad' | 'neutral' | 'brand';

const BOX: Record<ChipTone, string> = {
  good: 'bg-good-bg',
  warn: 'bg-warn-bg',
  bad: 'bg-bad-bg',
  neutral: 'bg-surface-2 border border-line',
  brand: 'bg-primary-soft',
};
const TEXT: Record<ChipTone, string> = {
  good: 'text-good',
  warn: 'text-warn',
  bad: 'text-bad',
  neutral: 'text-muted',
  brand: 'text-primary',
};

export function Chip({ label, tone = 'neutral' }: { label: string; tone?: ChipTone }) {
  return (
    <View className={`${BOX[tone]} self-start rounded-full px-3 py-1`}>
      <AppText variant="caption" bold className={TEXT[tone]}>
        {label}
      </AppText>
    </View>
  );
}
