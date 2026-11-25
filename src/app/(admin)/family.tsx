/**
 * Ilakkiya's dashboard: one status card per parent (medicines ✓/✗, last BP with
 * colour, mood, check-in, habits %, Amma's tasks / Appa's pages) + alerts.
 */
import React from 'react';
import { Linking, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Screen } from '../../components/Screen';
import { Card } from '../../components/Card';
import { AppText } from '../../components/AppText';
import { BigButton } from '../../components/BigButton';
import { TextSizeControl } from '../../components/TextSizeControl';
import { PaymentsDueCard } from '../../components/PaymentsDueCard';
import { useFamilyStatus, type ParentStatus } from '../../data/useFamilyStatus';
import { formatTime } from '../../lib/time';

const MOOD_FACE = ['', '😔', '😕', '😐', '🙂', '😄'];
const DOSE_ICON = { taken: '✅', missed: '❌', pending: '⏳' } as const;
const LEVEL_CLASS = { good: 'text-good', warn: 'text-warn', bad: 'text-bad' } as const;

export default function Family() {
  const { t } = useTranslation();
  const { parents, alerts } = useFamilyStatus();
  return (
    <Screen title={t('admin.familyToday')}>
      <TextSizeControl />
      <Card title={t('admin.alerts')} icon="notifications" tone={alerts.length ? 'warn' : 'good'}>
        {alerts.length ? (
          alerts.map((a) => (
            <AppText key={a.id} bold className={a.severity === 'bad' ? 'text-bad' : 'text-warn'}>
              • {a.message}
            </AppText>
          ))
        ) : (
          <AppText>{t('admin.noAlerts')}</AppText>
        )}
      </Card>
      <PaymentsDueCard />
      {parents.map((p) => (
        <ParentCard key={p.profile.id} status={p} />
      ))}
    </Screen>
  );
}

function ParentCard({ status: s }: { status: ParentStatus }) {
  const { t } = useTranslation();
  const name = s.profile.name;
  return (
    <Card title={name} icon="person-circle">
      <Stat label={t('admin.medicinesToday')}>
        {s.doses.map((d) => (
          <AppText key={d.name}>
            {DOSE_ICON[d.status]} {formatTime(d.time)} · {d.name}
          </AppText>
        ))}
      </Stat>
      <View className="flex-row flex-wrap">
        <Stat label={t('admin.lastVitals')} half>
          {s.lastBp ? (
            <AppText variant="title" className={LEVEL_CLASS[s.lastBp.level]}>
              {s.lastBp.sys}/{s.lastBp.dia}
            </AppText>
          ) : (
            <AppText>-</AppText>
          )}
        </Stat>
        <Stat label={t('admin.mood')} half>
          <AppText variant="title">{s.mood ? `${MOOD_FACE[s.mood]} ${t(`moods.${s.mood}`)}` : t('admin.notYet')}</AppText>
        </Stat>
        <Stat label={t('admin.checkin')} half>
          <AppText bold className={s.checkedIn ? 'text-good' : 'text-warn'}>
            {s.checkedIn ? `✓ ${t('admin.checkedIn')}` : t('admin.notYet')}
          </AppText>
        </Stat>
        <Stat label={t('admin.habits')} half>
          <AppText bold>{s.habitsPct}%</AppText>
        </Stat>
        <Stat label={s.feature.kind === 'tasks' ? t('admin.tasksDone') : t('admin.pagesRead')} half>
          <AppText bold>
            {s.feature.kind === 'tasks' ? `${s.feature.done} / ${s.feature.total}` : s.feature.pages}
          </AppText>
        </Stat>
      </View>
      {s.profile.phone ? (
        <View className="mt-3">
          <BigButton
            kind="secondary"
            icon="call"
            label={t('admin.call', { name })}
            onPress={() => Linking.openURL(`tel:${s.profile.phone}`)}
          />
        </View>
      ) : null}
    </Card>
  );
}

function Stat({ label, children, half }: { label: string; children: React.ReactNode; half?: boolean }) {
  return (
    <View className={`mt-3 ${half ? 'w-1/2 pr-2' : 'w-full'}`}>
      <AppText variant="caption" bold className="text-muted">
        {label}
      </AppText>
      {children}
    </View>
  );
}
