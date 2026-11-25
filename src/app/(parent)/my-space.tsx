/**
 * "My Space": Amma sees her work planner sections, Appa sees reading,
 * astrology and the At home / At Ilakkiya's house switch. Sections are filled
 * in Phase 4 (Amma) and Phase 5 (Appa). Payments, "What Ilakkiya sees" and
 * Settings live here too.
 */
import React, { useState } from 'react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '../../components/Screen';
import { Card } from '../../components/Card';
import { Chip } from '../../components/Chip';
import { ChoiceRow } from '../../components/ChoiceRow';
import { ListGroup, ListRow } from '../../components/ListRow';
import { useAuth } from '../../lib/auth';
import { usePayments } from '../../data/payments';
import { dueSoon } from '../../lib/payments';
import type { LocationMode } from '../../lib/types';

export default function MySpace() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { payments } = usePayments();
  const [location, setLocation] = useState<LocationMode>(profile?.location_mode ?? 'home');
  if (!profile) return null;
  const soon = <Chip label={t('common.soon')} />;
  const dueCount = dueSoon(payments, 7).length;

  return (
    <Screen title={t('mySpace.title')}>
      {profile.space === 'reading' ? (
        <Card title={t('mySpace.location')} icon="home" hue="teal">
          <ChoiceRow<LocationMode>
            label={t('mySpace.location')}
            value={location}
            onChange={setLocation}
            options={[
              { value: 'home', label: t('mySpace.atHome') },
              { value: 'child_house', label: t('mySpace.atChildHouse') },
            ]}
          />
        </Card>
      ) : null}

      {profile.space === 'planner' ? (
        <ListGroup title={t('mySpace.plannerTitle')}>
          <ListRow icon="mic" hue="violet" title={t('mySpace.plannerTitle')} subtitle={t('today.dayPlanHint')} right={soon} />
          <ListRow icon="calendar" hue="blue" title={t('mySpace.calendar')} right={soon} />
          <ListRow icon="document-text" hue="amber" title={t('mySpace.papers')} right={soon} />
          <ListRow icon="school" hue="green" title={t('mySpace.studentNotes')} right={soon} />
        </ListGroup>
      ) : (
        <ListGroup title={t('mySpace.readingTitle')}>
          <ListRow icon="library" hue="blue" title={t('mySpace.bookshelf')} right={soon} />
          <ListRow icon="planet" hue="violet" title={t('mySpace.astrology')} right={soon} />
          {location === 'child_house' ? <ListRow icon="happy" hue="amber" title={t('mySpace.grandchild')} right={soon} /> : null}
        </ListGroup>
      )}

      <ListGroup title={t('mySpace.more')}>
        <ListRow
          icon="wallet"
          hue="amber"
          title={t('mySpace.payments')}
          subtitle={t('payments.subtitle')}
          right={dueCount ? <Chip tone="warn" label={String(dueCount)} /> : undefined}
          onPress={() => router.push('/payments')}
        />
        <ListRow icon="eye" hue="teal" title={t('mySpace.whatAdminSees')} onPress={() => router.push('/what-admin-sees')} />
        <ListRow icon="settings" hue="blue" title={t('mySpace.settings')} subtitle={t('mySpace.settingsHint')} onPress={() => router.push('/settings')} />
      </ListGroup>
    </Screen>
  );
}
