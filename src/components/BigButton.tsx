/**
 * Large, labelled button (min 56px tall, full width by default).
 * Every button has text; an icon is optional and always beside a label.
 */
import React from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { usePrefs } from '../theme/PreferencesProvider';

type Kind = 'primary' | 'secondary' | 'danger' | 'ghost';

type Props = {
  label: string;
  onPress: () => void;
  kind?: Kind;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  loading?: boolean;
  /** Extra-tall variant for the main action of a screen (e.g. SOS). */
  size?: 'normal' | 'huge';
  accessibilityHint?: string;
};

const KIND_CLASSES: Record<Kind, { box: string; text: string; icon: string }> = {
  primary: { box: 'bg-primary', text: 'text-on-primary', icon: 'on-primary' },
  secondary: { box: 'bg-surface border-2 border-primary', text: 'text-primary', icon: 'primary' },
  danger: { box: 'bg-bad', text: 'text-white', icon: '' },
  ghost: { box: 'bg-transparent', text: 'text-primary underline', icon: 'primary' },
};

export function BigButton({
  label,
  onPress,
  kind = 'primary',
  icon,
  disabled,
  loading,
  size = 'normal',
  accessibilityHint,
}: Props) {
  const { color } = usePrefs();
  const k = KIND_CLASSES[kind];
  const iconColor = kind === 'danger' ? '#ffffff' : color(k.icon);
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled, busy: !!loading }}
      className={`${k.box} rounded-card px-5 flex-row items-center justify-center ${
        size === 'huge' ? 'min-h-[80px]' : 'min-h-tap'
      } ${disabled ? 'opacity-50' : ''} active:opacity-80`}
    >
      {loading ? (
        <ActivityIndicator color={iconColor} />
      ) : (
        <View className="flex-row items-center py-3 flex-shrink">
          {icon ? <Ionicons name={icon} size={size === 'huge' ? 30 : 24} color={iconColor} /> : null}
          <AppText
            variant={size === 'huge' ? 'title' : 'lead'}
            bold
            className={`${k.text} ${icon ? 'ml-3' : ''} text-center flex-shrink`}
          >
            {label}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}
