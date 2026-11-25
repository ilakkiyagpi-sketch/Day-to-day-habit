/**
 * Menu row: tinted icon badge, title, optional subtitle and a chevron.
 * Whole row is one big tap target. Group rows inside <ListGroup>.
 */
import React from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { IconBadge, type IconName } from './IconBadge';
import { usePrefs } from '../theme/PreferencesProvider';
import { SHADOW, type Hue } from '../theme/palette';

export function ListGroup({ title, children }: { title?: string; children: React.ReactNode }) {
  const rows = React.Children.toArray(children).filter(Boolean);
  return (
    <View className="mb-5">
      {title ? <SectionTitle>{title}</SectionTitle> : null}
      <View className="bg-surface rounded-card overflow-hidden" style={SHADOW.card}>
        {rows.map((row, i) => (
          <View key={i} className={i > 0 ? 'border-t border-line' : ''}>
            {row}
          </View>
        ))}
      </View>
    </View>
  );
}

export function SectionTitle({ children }: { children: string }) {
  return (
    <AppText variant="body" bold className="text-muted mb-2 ml-1" accessibilityRole="header">
      {children}
    </AppText>
  );
}

type Props = {
  title: string;
  subtitle?: string;
  icon: IconName;
  hue?: Hue;
  onPress?: () => void;
  right?: React.ReactNode;
};

export function ListRow({ title, subtitle, icon, hue = 'teal', onPress, right }: Props) {
  const { color } = usePrefs();
  const body = (
    <View className="flex-row items-center px-4 py-3 min-h-[72px]">
      <IconBadge icon={icon} hue={hue} />
      <View className="flex-1 ml-3">
        <AppText bold>{title}</AppText>
        {subtitle ? (
          <AppText variant="caption" className="text-muted">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {right}
      {onPress ? <Ionicons name="chevron-forward" size={22} color={color('muted')} /> : null}
    </View>
  );
  return onPress ? (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={[title, subtitle].filter(Boolean).join(', ')} className="active:bg-surface-2">
      {body}
    </Pressable>
  ) : (
    body
  );
}
