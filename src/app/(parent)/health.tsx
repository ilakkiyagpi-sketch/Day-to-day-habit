/** Health hub. Phase 1 lays out the sections; Phase 2 fills them in. */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Screen } from '../../components/Screen';
import { Card } from '../../components/Card';
import { AppText } from '../../components/AppText';

export default function Health() {
  const { t } = useTranslation();
  const sections = [
    { key: 'medicines', icon: 'medkit' },
    { key: 'vitals', icon: 'pulse' },
    { key: 'appointments', icon: 'calendar' },
    { key: 'documents', icon: 'document-text' },
  ] as const;
  return (
    <Screen title={t('health.title')}>
      {sections.map((s) => (
        <Card key={s.key} title={t(`health.${s.key}`)} icon={s.icon}>
          <AppText className="text-muted">{t('health.comingSoon')}</AppText>
        </Card>
      ))}
    </Screen>
  );
}
