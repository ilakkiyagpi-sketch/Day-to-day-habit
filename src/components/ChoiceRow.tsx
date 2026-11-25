/** Row of big selectable options (e.g. language, font size). Radio semantics. */
import React from 'react';
import { Pressable, View } from 'react-native';
import { AppText } from './AppText';

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
            className={`m-1 min-h-tap px-4 rounded-card border-2 items-center justify-center flex-grow ${
              selected ? 'bg-primary border-primary' : 'bg-surface border-line'
            }`}
          >
            <AppText bold className={selected ? 'text-on-primary' : 'text-ink'}>
              {selected ? '✓ ' : ''}
              {o.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
