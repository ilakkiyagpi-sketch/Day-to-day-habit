/** Transparency screen: exactly what Ilakkiya can and cannot see (§6). */
import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '../../components/Screen';
import { Card } from '../../components/Card';
import { AppText } from '../../components/AppText';
import { BigButton } from '../../components/BigButton';

export default function WhatAdminSees() {
  const { t } = useTranslation();
  const items = t('adminSees.items').split('\n');
  return (
    <Screen title={t('adminSees.title')}>
      <Card title={t('adminSees.intro')} icon="eye" speakText={`${t('adminSees.intro')} ${items.join('. ')}`}>
        {items.map((i) => (
          <AppText key={i} className="mb-2">
            • {i}
          </AppText>
        ))}
      </Card>
      <Card title={t('adminSees.notSeen')} icon="lock-closed" tone="good" />
      <View className="mt-2">
        <BigButton kind="secondary" icon="arrow-back" label={t('common.back')} onPress={() => router.back()} />
      </View>
    </Screen>
  );
}
