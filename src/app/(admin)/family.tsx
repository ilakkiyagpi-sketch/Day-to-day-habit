/**
 * Ilakkiya's dashboard: gradient summary header, alerts, payments due, then
 * one card per parent (medicines ✓/✗, last BP with colour, mood, check-in,
 * habits %, Amma's tasks / Appa's pages) with a call button.
 */
import React from 'react';
import { Linking, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/Screen';
import { Card } from '../../components/Card';
import { Chip } from '../../components/Chip';
import { AppText } from '../../components/AppText';
import { BigButton } from '../../components/BigButton';
import { HeroCard } from '../../components/HeroCard';
import { PaymentsDueCard } from '../../components/PaymentsDueCard';
import { useFamilyStatus, type ParentStatus } from '../../data/useFamilyStatus';
import { usePayments } from '../../data/payments';
import { useAuth } from '../../lib/auth';
import { dueSoon } from '../../lib/payments';
import { formatTime } from '../../lib/time';
import { usePrefs } from '../../theme/PreferencesProvider';
import { SHADOW } from '../../theme/palette';
import { dayPart } from '../../lib/time';

const MOOD_FACE = ['', '😔', '😕', '😐', '🙂', '😄'];
const LEVEL = { good: 'good', warn: 'warn', bad: 'bad' } as const;

export default function Family() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { parents, alerts } = useFamilyStatus();
  const { payments } = usePayments();
  const doses = parents.flatMap((p) => p.doses);
  return (
    <Screen>
      <HeroCard
        title={t(`greeting.${dayPart()}`, { name: profile?.name ?? '' })}
        stats={[
          { label: t('admin.statDoses'), value: `${doses.filter((d) => d.status === 'taken').length}/${doses.length}` },
          { label: t('admin.statAlerts'), value: String(alerts.length) },
          { label: t('admin.statDue'), value: String(dueSoon(payments, 7).length) },
        ]}
      />
      <Card title={t('admin.alerts')} icon="notifications" hue="amber" tone={alerts.length ? 'warn' : 'good'}>
        {alerts.length ? (
          alerts.map((a) => (
            <View key={a.id} className="flex-row items-start mb-1">
              <Ionicons name="alert-circle" size={20} color="#A14807" style={{ marginTop: 3 }} />
              <AppText bold className={`ml-2 flex-1 ${a.severity === 'bad' ? 'text-bad' : 'text-warn'}`}>
                {a.message}
              </AppText>
            </View>
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
  const { color } = usePrefs();
  const name = s.profile.name;
  const isAmma = s.profile.space === 'planner';
  return (
    <View className="bg-surface rounded-card p-4 mb-4" style={SHADOW.card}>
      <View className="flex-row items-center mb-3">
        <View className={`w-12 h-12 rounded-full items-center justify-center ${isAmma ? 'bg-rose-soft' : 'bg-blue-soft'}`}>
          <AppText variant="title" className={isAmma ? 'text-rose-ink' : 'text-blue-ink'}>
            {name[0]}
          </AppText>
        </View>
        <View className="flex-1 ml-3">
          <AppText variant="lead" bold accessibilityRole="header">
            {name}
          </AppText>
          <Chip tone={s.checkedIn ? 'good' : 'warn'} label={s.checkedIn ? `✓ ${t('admin.checkedIn')}` : `${t('admin.checkin')}: ${t('admin.notYet')}`} />
        </View>
      </View>

      <AppText variant="caption" bold className="text-muted mb-1">
        {t('admin.medicinesToday')}
      </AppText>
      {s.doses.map((d) => (
        <View key={d.name} className="flex-row items-center py-1">
          <Ionicons
            name={d.status === 'taken' ? 'checkmark-circle' : d.status === 'missed' ? 'close-circle' : 'time'}
            size={22}
            color={color(d.status === 'taken' ? 'good' : d.status === 'missed' ? 'bad' : 'muted')}
          />
          <AppText className="ml-2 flex-1">
            {formatTime(d.time)} · {d.name}
          </AppText>
        </View>
      ))}

      <View className="flex-row flex-wrap -mx-1 mt-3">
        <Tile label={t('admin.lastVitals')} value={s.lastBp ? `${s.lastBp.sys}/${s.lastBp.dia}` : '-'} level={s.lastBp ? LEVEL[s.lastBp.level] : undefined} />
        <Tile label={t('admin.mood')} value={s.mood ? `${MOOD_FACE[s.mood]} ${t(`moods.${s.mood}`)}` : t('admin.notYet')} />
        <Tile label={t('admin.habits')} value={`${s.habitsPct}%`} />
        <Tile
          label={s.feature.kind === 'tasks' ? t('admin.tasksDone') : t('admin.pagesRead')}
          value={s.feature.kind === 'tasks' ? `${s.feature.done} / ${s.feature.total}` : String(s.feature.pages)}
        />
      </View>

      {s.profile.phone ? (
        <View className="mt-3">
          <BigButton kind="secondary" icon="call" label={t('admin.call', { name })} onPress={() => Linking.openURL(`tel:${s.profile.phone}`)} />
        </View>
      ) : null}
    </View>
  );
}

const TILE_BG = { good: 'bg-good-bg', warn: 'bg-warn-bg', bad: 'bg-bad-bg' } as const;
const TILE_TEXT = { good: 'text-good', warn: 'text-warn', bad: 'text-bad' } as const;

function Tile({ label, value, level }: { label: string; value: string; level?: 'good' | 'warn' | 'bad' }) {
  return (
    <View className="w-1/2 p-1">
      <View className={`rounded-2xl p-3 ${level ? TILE_BG[level] : 'bg-surface-2'}`}>
        <AppText variant="caption" className="text-muted">
          {label}
        </AppText>
        <AppText variant="lead" bold className={level ? TILE_TEXT[level] : ''}>
          {value}
        </AppText>
      </View>
    </View>
  );
}
