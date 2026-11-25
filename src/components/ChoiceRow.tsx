/** Row of big selectable options (language, text size, repeat…). Radio semantics. */
import React from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { usePrefs } from '../theme/PreferencesProvider';

type Option<T extends string> = { value: T; label: string };

export function ChoiceRow<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  const { color } = usePrefs();
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} className="flex-row flex-wrap -m-1">
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={o.label}
            className={`m-1 min-h-tap px-4 rounded-2xl flex-row items-center justify-center flex-grow ${
              selected ? 'bg-primary' : 'bg-surface-2 border border-line'
            }`}
          >
            {selected ? <Ionicons name="checkmark-circle" size={20} color={color('on-primary')} /> : null}
            <AppText bold className={`${selected ? 'text-on-primary ml-1.5' : 'text-ink'}`}>
              {o.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
