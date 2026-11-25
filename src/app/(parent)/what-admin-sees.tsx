/** Transparency screen: exactly what Ilakkiya can and cannot see (§6). */
import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Screen } from '../../components/Screen';
import { Card } from '../../components/Card';
import { AppText } from '../../components/AppText';
import { Ionicons } from '@expo/vector-icons';
import { usePrefs } from '../../theme/PreferencesProvider';

export default function WhatAdminSees() {
  const { t } = useTranslation();
  const { color } = usePrefs();
  const items = t('adminSees.items').split('\n');
  return (
    <Screen title={t('adminSees.title')} back>
      <Card title={t('adminSees.intro')} icon="eye" hue="teal" speakText={`${t('adminSees.intro')} ${items.join('. ')}`}>
        {items.map((i) => (
          <View key={i} className="flex-row items-start mb-2">
            <Ionicons name="checkmark-circle" size={22} color={color('good')} style={{ marginTop: 2 }} />
            <AppText className="ml-2 flex-1">{i}</AppText>
          </View>
        ))}
      </Card>
      <Card title={t('adminSees.notSeen')} icon="lock-closed" hue="green" tone="good" />
    </Screen>
  );
}
