/**
 * Big on-screen number pad (keys ≥ 72px) with 4 PIN dots. Every key is a
 * labelled button; "Delete" is a word, not just a symbol.
 */
import React from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText } from './AppText';
import { SHADOW } from '../theme/palette';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

export function PinPad({ value, onChange, length = 4 }: { value: string; onChange: (v: string) => void; length?: number }) {
  const { t } = useTranslation();
  const press = (k: string) => {
    if (k === 'del') onChange(value.slice(0, -1));
    else if (value.length < length) onChange(value + k);
  };
  return (
    <View>
      <View
        className="flex-row justify-center my-6"
        accessible
        accessibilityLabel={`${value.length} / ${length}`}
      >
        {Array.from({ length }).map((_, i) => (
          <View
            key={i}
            className={`w-5 h-5 rounded-full mx-3 ${i < value.length ? 'bg-primary' : 'bg-line'}`}
          />
        ))}
      </View>
      <View className="flex-row flex-wrap justify-center">
        {KEYS.map((k, i) =>
          k === '' ? (
            <View key={i} className="w-[30%] m-[1.5%] h-[72px]" />
          ) : (
            <Pressable
              key={i}
              onPress={() => press(k)}
              accessibilityRole="button"
              accessibilityLabel={k === 'del' ? t('pin.delete') : k}
              className="w-[30%] m-[1.5%] h-[72px] rounded-card bg-surface items-center justify-center active:bg-primary-soft"
              style={SHADOW.card}
            >
              <AppText variant={k === 'del' ? 'body' : 'display'} bold className={k === 'del' ? 'text-muted' : ''}>
                {k === 'del' ? `⌫ ${t('pin.delete')}` : k}
              </AppText>
            </Pressable>
          ),
        )}
      </View>
    </View>
  );
}
