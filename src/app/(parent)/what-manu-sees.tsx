/** Transparency screen: exactly what Manu can and cannot see (§6). */
import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '../../components/Screen';
import { Card } from '../../components/Card';
import { AppText } from '../../components/AppText';
import { BigButton } from '../../components/BigButton';

export default function WhatManuSees() {
  const { t } = useTranslation();
  const items = t('manuSees.items').split('\n');
  return (
    <Screen title={t('manuSees.title')}>
      <Card title={t('manuSees.intro')} icon="eye" speakText={`${t('manuSees.intro')} ${items.join('. ')}`}>
        {items.map((i) => (
          <AppText key={i} className="mb-2">
            • {i}
          </AppText>
        ))}
      </Card>
      <Card title={t('manuSees.notSeen')} icon="lock-closed" tone="good" />
      <View className="mt-2">
        <BigButton kind="secondary" icon="arrow-back" label={t('common.back')} onPress={() => router.back()} />
      </View>
    </Screen>
  );
}
