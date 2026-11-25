/**
 * Gradient header card at the top of the home screens: today's date, a big
 * greeting, the A−/A+ text-size buttons and a row of summary chips.
 */
import React from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from './AppText';
import { TextSizeControl } from './TextSizeControl';
import { usePrefs } from '../theme/PreferencesProvider';
import { formatLongDate } from '../lib/payments';

export type HeroStat = { label: string; value: string };

export function HeroCard({ title, stats }: { title: string; stats?: HeroStat[] }) {
  const { language } = usePrefs();
  return (
    <LinearGradient
      colors={['#0E7A62', '#0B5D4B', '#073F33']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ borderRadius: 28, padding: 20, marginBottom: 20, boxShadow: '0px 10px 24px rgba(11, 93, 75, 0.28)' }}
    >
      {/* soft decorative circle */}
      <View
        pointerEvents="none"
        style={{ position: 'absolute', right: -40, top: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.08)' }}
      />
      <View className="flex-row items-start justify-between">
        <AppText variant="caption" bold style={{ color: 'rgba(255,255,255,0.85)' }} className="flex-1 mt-2">
          {formatLongDate(new Date(), language)}
        </AppText>
        <TextSizeControl onDark />
      </View>
      <AppText variant="display" accessibilityRole="header" style={{ color: '#FFFFFF' }} className="mt-2">
        {title}
      </AppText>
      {stats?.length ? (
        <View className="flex-row flex-wrap mt-4 -mx-1">
          {stats.map((s) => (
            <View
              key={s.label}
              className="m-1 rounded-2xl px-3 py-2 flex-grow"
              style={{ backgroundColor: 'rgba(255,255,255,0.14)', minWidth: 96 }}
              accessible
              accessibilityLabel={`${s.label}: ${s.value}`}
            >
              <AppText variant="lead" bold style={{ color: '#FFFFFF' }}>
                {s.value}
              </AppText>
              <AppText variant="caption" style={{ color: 'rgba(255,255,255,0.88)' }}>
                {s.label}
              </AppText>
            </View>
          ))}
        </View>
      ) : null}
    </LinearGradient>
  );
}
