/**
 * "My Space": Amma sees her work planner sections, Appa sees reading,
 * astrology and the At home / At Manu's house toggle. Sections are filled in
 * Phase 4 (Amma) and Phase 5 (Appa). Settings and "What Manu sees" live here.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '../../components/Screen';
import { Card } from '../../components/Card';
import { AppText } from '../../components/AppText';
import { BigButton } from '../../components/BigButton';
import { ChoiceRow } from '../../components/ChoiceRow';
import { useAuth } from '../../lib/auth';
import type { LocationMode } from '../../lib/types';

export default function MySpace() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [location, setLocation] = useState<LocationMode>(profile?.location_mode ?? 'home');
  if (!profile) return null;

  const sections =
    profile.space === 'planner'
      ? ([
          { key: 'plannerTitle', icon: 'mic' },
          { key: 'calendar', icon: 'calendar' },
          { key: 'papers', icon: 'document-text' },
          { key: 'studentNotes', icon: 'school' },
        ] as const)
      : ([
          { key: 'bookshelf', icon: 'library' },
          { key: 'astrology', icon: 'planet' },
          ...(location === 'manu_house' ? ([{ key: 'grandchild', icon: 'happy' }] as const) : []),
        ] as const);

  return (
    <Screen title={t('mySpace.title')}>
      {profile.space === 'reading' ? (
        <Card title={t('mySpace.location')} icon="home">
          <ChoiceRow<LocationMode>
            label={t('mySpace.location')}
            value={location}
            onChange={setLocation}
            options={[
              { value: 'home', label: t('mySpace.atHome') },
              { value: 'manu_house', label: t('mySpace.atManus') },
            ]}
          />
        </Card>
      ) : null}

      {sections.map((s) => (
        <Card key={s.key} title={t(`mySpace.${s.key}`)} icon={s.icon}>
          <AppText className="text-muted">{t('health.comingSoon')}</AppText>
        </Card>
      ))}

      <View className="mt-2">
        <BigButton kind="secondary" icon="eye" label={t('mySpace.whatManuSees')} onPress={() => router.push('/what-manu-sees')} />
        <View className="h-3" />
        <BigButton kind="secondary" icon="settings" label={t('mySpace.settings')} onPress={() => router.push('/settings')} />
      </View>
    </Screen>
  );
}
