/** Medical disclaimer shown on first use (sign-in) and in Settings (§7). */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from './Card';
import { AppText } from './AppText';

export function Disclaimer() {
  const { t } = useTranslation();
  return (
    <Card title={t('disclaimer.title')} icon="information-circle" hue="amber" tone="warn" speakText={t('disclaimer.body')}>
      <AppText>{t('disclaimer.body')}</AppText>
    </Card>
  );
}
