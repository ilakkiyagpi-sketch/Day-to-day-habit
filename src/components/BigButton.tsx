/**
 * Large, labelled button (min 56px tall). Every button has text; an icon is
 * optional and always beside a label.
 *   primary   – filled brand green with a soft glow (the main action)
 *   secondary – soft green tint (other actions)
 *   danger    – red gradient (SOS)
 *   ghost     – text only (back, change email…)
 */
import React from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from './AppText';
import { usePrefs } from '../theme/PreferencesProvider';
import { SHADOW } from '../theme/palette';
import type { IconName } from './IconBadge';

type Kind = 'primary' | 'secondary' | 'danger' | 'ghost';

type Props = {
  label: string;
  onPress: () => void;
  kind?: Kind;
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  /** Extra-tall variant for the main action of a screen (e.g. SOS). */
  size?: 'normal' | 'huge';
  accessibilityHint?: string;
};

const TEXT: Record<Kind, string> = {
  primary: 'text-on-primary',
  secondary: 'text-primary',
  danger: 'text-white',
  ghost: 'text-primary',
};

export function BigButton({ label, onPress, kind = 'primary', icon, disabled, loading, size = 'normal', accessibilityHint }: Props) {
  const { color } = usePrefs();
  const iconColor = kind === 'danger' ? '#ffffff' : kind === 'primary' ? color('on-primary') : color('primary');
  const huge = size === 'huge';

  const content = loading ? (
    <ActivityIndicator color={iconColor} />
  ) : (
    <View className="flex-row items-center py-3 flex-shrink">
      {icon ? <Ionicons name={icon} size={huge ? 30 : 22} color={iconColor} /> : null}
      <AppText variant={huge ? 'title' : 'lead'} bold className={`${TEXT[kind]} ${icon ? 'ml-2.5' : ''} text-center flex-shrink`}>
        {label}
      </AppText>
    </View>
  );

  const box = `rounded-btn px-5 flex-row items-center justify-center overflow-hidden ${huge ? 'min-h-[80px]' : 'min-h-tap'}`;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled, busy: !!loading }}
      className={`${disabled ? 'opacity-50' : ''} active:opacity-85`}
      style={[{ borderRadius: 18 }, kind === 'primary' ? SHADOW.raised : kind === 'danger' ? { boxShadow: '0px 6px 18px rgba(190, 18, 60, 0.3)' } : undefined]}
    >
      {kind === 'danger' ? (
        <LinearGradient colors={['#E11D48', '#BE123C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 18 }}>
          <View className={box}>{content}</View>
        </LinearGradient>
      ) : (
        <View className={`${box} ${kind === 'primary' ? 'bg-primary' : kind === 'secondary' ? 'bg-primary-soft' : 'bg-transparent'}`}>
          {content}
        </View>
      )}
    </Pressable>
  );
}
