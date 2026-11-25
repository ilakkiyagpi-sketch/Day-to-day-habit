/** Health hub. The sections are laid out now; Phase 2 fills them in. */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Screen } from '../../components/Screen';
import { ListGroup, ListRow } from '../../components/ListRow';
import { Chip } from '../../components/Chip';

export default function Health() {
  const { t } = useTranslation();
  const soon = <Chip label={t('common.soon')} />;
  return (
    <Screen title={t('health.title')} subtitle={t('health.subtitle')}>
      <ListGroup>
        <ListRow icon="medkit" hue="rose" title={t('health.medicines')} subtitle={t('health.medicinesHint')} right={soon} />
        <ListRow icon="pulse" hue="blue" title={t('health.vitals')} subtitle={t('health.vitalsHint')} right={soon} />
        <ListRow icon="calendar" hue="violet" title={t('health.appointments')} subtitle={t('health.appointmentsHint')} right={soon} />
        <ListRow icon="document-text" hue="amber" title={t('health.documents')} subtitle={t('health.documentsHint')} right={soon} />
      </ListGroup>
    </Screen>
  );
}
