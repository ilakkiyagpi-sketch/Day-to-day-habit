/** Standard scrolling screen with safe-area padding and the offline/demo banners. */
import React from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AppText } from './AppText';
import { BigButton } from './BigButton';
import { StatusBanners } from './StatusBanners';

type Props = { title?: string; children: React.ReactNode; scroll?: boolean; back?: boolean };

export function Screen({ title, children, scroll = true, back }: Props) {
  const { t } = useTranslation();
  const body = (
    <>
      {back ? (
        <View className="self-start mb-2">
          <BigButton kind="ghost" icon="arrow-back" label={t('common.back')} onPress={() => router.back()} />
        </View>
      ) : null}
      {title ? (
        <AppText variant="display" accessibilityRole="header" className="mb-4">
          {title}
        </AppText>
      ) : null}
      {children}
    </>
  );
  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-bg">
      <StatusBanners />
      {scroll ? (
        <ScrollView contentContainerClassName="p-4 pb-12" keyboardShouldPersistTaps="handled">
          {body}
        </ScrollView>
      ) : (
        <View className="flex-1 p-4">{body}</View>
      )}
    </SafeAreaView>
  );
}
