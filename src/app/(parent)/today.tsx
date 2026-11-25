/**
 * Parent home ("Today"): gradient header with date, greeting and a summary,
 * then up to six cards — next medicine · today's checklist · mood · day plan
 * (Amma) or reading (Appa) · payments due · "I'm okay" · thought for today.
 * Every card has a read-aloud button.
 */
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/Screen';
import { Card } from '../../components/Card';
import { Chip } from '../../components/Chip';
import { AppText } from '../../components/AppText';
import { BigButton } from '../../components/BigButton';
import { HeroCard } from '../../components/HeroCard';
import { useToast } from '../../components/Toast';
import { PaymentsDueCard } from '../../components/PaymentsDueCard';
import { WebReminderCard } from '../../components/WebReminderCard';
import { useAuth } from '../../lib/auth';
import { usePrefs } from '../../theme/PreferencesProvider';
import { dayPart, formatTime, nextByTime } from '../../lib/time';
import { useToday } from '../../data/useToday';
import { usePayments } from '../../data/payments';
import { dueSoon } from '../../lib/payments';
import { DEMO_KURAL } from '../../data/demo';

const MOODS = ['😔', '😕', '😐', '🙂', '😄']; // index + 1 = mood score (1–5)

export default function Today() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { language, color } = usePrefs();
  const { showUndo } = useToast();
  const { medicines, habits } = useToday();
  const { payments } = usePayments();

  // Phase 1 keeps these in memory; Phase 2 persists them (offline-first).
  const [doneHabits, setDoneHabits] = useState<Set<string>>(new Set());
  const [mood, setMood] = useState<number | null>(null);
  const [checkedIn, setCheckedIn] = useState(false);

  if (!profile) return null;
  const next = nextByTime(medicines);
  const due = dueSoon(payments, 7);

  const toggleHabit = (id: string, label: string) => {
    const wasDone = doneHabits.has(id);
    const apply = (done: boolean) =>
      setDoneHabits((prev) => {
        const s = new Set(prev);
        if (done) s.add(id);
        else s.delete(id);
        return s;
      });
    apply(!wasDone);
    showUndo(`${wasDone ? '↩' : '✓'} ${label}`, () => apply(wasDone));
  };

  const medText = next
    ? `${t('today.nextMedicine')}: ${next.name}, ${next.dose}, ${t('today.at', { time: formatTime(next.time) })}`
    : t('today.allMedsDone');

  return (
    <Screen>
      <HeroCard
        title={t(`greeting.${dayPart()}`, { name: profile.name })}
        stats={[
          { label: t('today.statMedicine'), value: next ? formatTime(next.time) : '✓' },
          { label: t('today.statHabits'), value: `${doneHabits.size}/${habits.length}` },
          { label: t('today.statPayments'), value: String(due.length) },
        ]}
      />

      <WebReminderCard hideWhenBlocked />

      {/* 1. Next medicine */}
      <Card
        title={t('today.nextMedicine')}
        icon="medkit"
        hue="rose"
        speakText={medText}
        tone={next ? 'default' : 'good'}
        right={next ? <Chip tone="brand" label={formatTime(next.time)} /> : null}
      >
        {next ? (
          <View>
            <AppText variant="title">{next.name}</AppText>
            <AppText className="text-muted">{next.dose}</AppText>
          </View>
        ) : (
          <AppText>{t('today.allMedsDone')}</AppText>
        )}
      </Card>

      {/* 2. Today's checklist (habits) */}
      <Card
        title={t('today.checklist')}
        subtitle={t('today.checklistProgress', { done: doneHabits.size, total: habits.length })}
        icon="checkmark-done"
        hue="green"
        speakText={`${t('today.checklist')}. ${habits.map((h) => h[language]).join('. ')}`}
      >
        <View className="h-2 bg-surface-2 rounded-full overflow-hidden mb-3">
          <View className="h-full bg-good rounded-full" style={{ width: `${habits.length ? (doneHabits.size / habits.length) * 100 : 0}%` }} />
        </View>
        {habits.map((h) => {
          const done = doneHabits.has(h.id);
          return (
            <Pressable
              key={h.id}
              onPress={() => toggleHabit(h.id, h[language])}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: done }}
              accessibilityLabel={h[language]}
              className={`flex-row items-center min-h-tap px-3 py-2 mb-2 rounded-2xl ${done ? 'bg-good-bg' : 'bg-surface-2'}`}
            >
              <Ionicons name={done ? 'checkmark-circle' : 'ellipse-outline'} size={30} color={color(done ? 'good' : 'muted')} />
              <AppText className={`ml-3 flex-1 ${done ? 'text-muted line-through' : ''}`}>{h[language]}</AppText>
            </Pressable>
          );
        })}
      </Card>

      {/* 3. Mood check-in */}
      <Card title={t('today.mood')} icon="happy" hue="amber">
        <View className="flex-row -mx-0.5">
          {MOODS.map((face, i) => {
            const score = i + 1;
            const selected = mood === score;
            return (
              <Pressable
                key={score}
                onPress={() => {
                  const prev = mood;
                  setMood(score);
                  showUndo(t('today.moodSaved'), () => setMood(prev));
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={t(`moods.${score}`)}
                className={`flex-1 mx-0.5 items-center rounded-2xl px-1 py-2 min-h-tap ${selected ? 'bg-amber-soft' : 'bg-surface-2'}`}
                style={selected ? { borderWidth: 2, borderColor: color('amber-ink') } : undefined}
              >
                <AppText style={{ fontSize: 30, lineHeight: 40 }}>{face}</AppText>
                <AppText variant="caption" className={`text-center ${selected ? 'text-amber-ink' : 'text-muted'}`}>
                  {t(`moods.${score}`)}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </Card>

      {/* 4. Feature card: Amma = day plan, Appa = reading */}
      {profile.space === 'planner' ? (
        <Card title={t('today.dayPlan')} subtitle={t('today.dayPlanHint')} icon="mic" hue="violet">
          <BigButton icon="mic" label={t('today.planMyDay')} onPress={() => router.push('/my-space')} />
        </Card>
      ) : (
        <Card title={t('today.reading')} subtitle={t('today.pagesOf', { page: 120, total: 320 })} icon="book" hue="blue">
          <View className="h-2.5 bg-surface-2 rounded-full mb-4 overflow-hidden">
            <View className="h-full bg-primary rounded-full" style={{ width: `${(120 / 320) * 100}%` }} />
          </View>
          <BigButton icon="add-circle" label={t('today.addPages')} onPress={() => router.push('/my-space')} />
        </Card>
      )}

      {/* Payment reminders (only when something is due this week) */}
      <PaymentsDueCard hideWhenEmpty />

      {/* 5. Daily "I'm okay" check-in */}
      {checkedIn ? (
        <Card title={t('today.checkedIn')} icon="checkmark-circle" hue="green" tone="good" />
      ) : (
        <View className="mb-4">
          <BigButton
            size="huge"
            icon="hand-left"
            label={t('today.imOkay')}
            onPress={() => {
              setCheckedIn(true);
              showUndo(t('today.checkedIn'), () => setCheckedIn(false));
            }}
          />
        </View>
      )}

      {/* 6. Thought for today */}
      <Card
        title={t('today.quote')}
        subtitle={`திருக்குறள் ${DEMO_KURAL.number}`}
        icon="sparkles"
        hue="teal"
        speakText={language === 'ta' ? `${DEMO_KURAL.ta}. ${DEMO_KURAL.meaning_ta}` : DEMO_KURAL.meaning_en}
      >
        <View className="bg-surface-2 rounded-2xl p-4">
          <AppText bold style={{ fontFamily: 'NotoSansTamil_700Bold' }}>
            {DEMO_KURAL.ta}
          </AppText>
          <AppText className="mt-2 text-muted">{language === 'ta' ? DEMO_KURAL.meaning_ta : DEMO_KURAL.meaning_en}</AppText>
        </View>
      </Card>
    </Screen>
  );
}
