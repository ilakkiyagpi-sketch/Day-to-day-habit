/**
 * Date chooser made of three big "− value +" rows (day, month, year).
 * No tiny calendar grid, no scrolling wheels — just tap − or +.
 */
import React from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText } from './AppText';
import { usePrefs } from '../theme/PreferencesProvider';
import { daysInMonth, formatDate, monthName, parseISODate, toISODate } from '../lib/payments';

export function DateStepper({ value, onChange }: { value: string; onChange: (iso: string) => void }) {
  const { t } = useTranslation();
  const { language } = usePrefs();
  const d = parseISODate(value);
  const y = d.getFullYear();
  const m = d.getMonth();
  const day = d.getDate();

  const set = (year: number, month0: number, dd: number) => {
    const total = year * 12 + month0;
    const ny = Math.floor(total / 12);
    const nm = ((total % 12) + 12) % 12;
    onChange(toISODate(new Date(ny, nm, Math.min(Math.max(dd, 1), daysInMonth(ny, nm)))));
  };

  const rows: { label: string; shown: string; dec: () => void; inc: () => void }[] = [
    {
      label: t('payments.day'),
      shown: String(day),
      dec: () => set(y, m, day === 1 ? daysInMonth(y, m) : day - 1),
      inc: () => set(y, m, day === daysInMonth(y, m) ? 1 : day + 1),
    },
    { label: t('payments.month'), shown: monthName(m, language), dec: () => set(y, m - 1, day), inc: () => set(y, m + 1, day) },
    { label: t('payments.year'), shown: String(y), dec: () => set(y - 1, m, day), inc: () => set(y + 1, m, day) },
  ];

  return (
    <View>
      <AppText variant="title" className="text-center mb-2" accessibilityLiveRegion="polite">
        {formatDate(value, language)}
      </AppText>
      {rows.map((r) => (
        <View key={r.label} className="flex-row items-center mb-2">
          <AppText bold className="w-24">
            {r.label}
          </AppText>
          <StepButton label="−" a11y={`${r.label} ${t('payments.earlier')}`} onPress={r.dec} />
          <AppText bold className="flex-1 text-center">
            {r.shown}
          </AppText>
          <StepButton label="+" a11y={`${r.label} ${t('payments.laterBtn')}`} onPress={r.inc} />
        </View>
      ))}
    </View>
  );
}

function StepButton({ label, a11y, onPress }: { label: string; a11y: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      className="min-h-tap min-w-tap rounded-xl bg-surface border-2 border-primary items-center justify-center active:opacity-70"
    >
      <AppText variant="title" className="text-primary">
        {label}
      </AppText>
    </Pressable>
  );
}
