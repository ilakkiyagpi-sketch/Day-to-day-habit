/** Ilakkiya's planning hub — reminders, medical logs and day plans arrive in Phase 3. */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Screen } from '../../components/Screen';
import { Card } from '../../components/Card';
import { AppText } from '../../components/AppText';

export default function Plans() {
  const { t } = useTranslation();
  return (
    <Screen title={t('admin.plansTitle')}>
      <Card title={t('admin.plansTitle')} icon="calendar" hue="violet">
        <AppText className="text-muted">{t('admin.plansSoon')}</AppText>
      </Card>
    </Screen>
  );
}
