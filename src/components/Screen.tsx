/** Standard scrolling screen: safe-area padding, banners, optional back button, title and subtitle. */
import React from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AppText } from './AppText';
import { BigButton } from './BigButton';
import { StatusBanners } from './StatusBanners';

type Props = { title?: string; subtitle?: string; children: React.ReactNode; scroll?: boolean; back?: boolean };

export function Screen({ title, subtitle, children, scroll = true, back }: Props) {
  const { t } = useTranslation();
  const body = (
    <>
      {back ? (
        <View className="self-start -ml-3 mb-1">
          <BigButton kind="ghost" icon="arrow-back" label={t('common.back')} onPress={() => router.back()} />
        </View>
      ) : null}
      {title ? (
        <View className="mb-5 mt-1">
          <AppText variant="display" accessibilityRole="header">
            {title}
          </AppText>
          {subtitle ? <AppText className="text-muted mt-1">{subtitle}</AppText> : null}
        </View>
      ) : null}
      {children}
    </>
  );
  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-bg">
      <StatusBanners />
      {scroll ? (
        <ScrollView contentContainerClassName="px-4 pt-3 pb-12" keyboardShouldPersistTaps="handled">
          {body}
        </ScrollView>
      ) : (
        <View className="flex-1 px-4 pt-3">{body}</View>
      )}
    </SafeAreaView>
  );
}
