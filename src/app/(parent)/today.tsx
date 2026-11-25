/**
 * Parent home: the "Today" card stack (max 6 big cards):
 *   next medicine · today's checklist · mood · feature card (Amma: day plan,
 *   Appa: reading) · "I'm okay" check-in · thought for today (Thirukkural).
 * Every card has a read-aloud button.
 */
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/Screen';
import { Card } from '../../components/Card';
import { AppText } from '../../components/AppText';
import { BigButton } from '../../components/BigButton';
import { useToast } from '../../components/Toast';
import { TextSizeControl } from '../../components/TextSizeControl';
import { PaymentsDueCard } from '../../components/PaymentsDueCard';
import { useAuth } from '../../lib/auth';
import { usePrefs } from '../../theme/PreferencesProvider';
import { dayPart, formatTime, nextByTime } from '../../lib/time';
import { useToday } from '../../data/useToday';
import { DEMO_KURAL } from '../../data/demo';

const MOODS = ['😔', '😕', '😐', '🙂', '😄']; // index + 1 = mood score (1–5)

export default function Today() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { language, color } = usePrefs();
  const { showUndo } = useToast();
  const { medicines, habits } = useToday();

  // Phase 1 keeps these in memory; Phase 2 persists them (offline-first).
  const [doneHabits, setDoneHabits] = useState<Set<string>>(new Set());
  const [mood, setMood] = useState<number | null>(null);
  const [checkedIn, setCheckedIn] = useState(false);

  if (!profile) return null;
  const next = nextByTime(medicines);

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
      <TextSizeControl />
      <AppText variant="display" accessibilityRole="header" className="mb-4">
        {t(`greeting.${dayPart()}`, { name: profile.name })}
      </AppText>

      {/* 1. Next medicine */}
      <Card title={t('today.nextMedicine')} icon="medkit" speakText={medText} tone={next ? 'default' : 'good'}>
        {next ? (
          <View>
            <AppText variant="title">{next.name}</AppText>
            <AppText>{next.dose}</AppText>
            <AppText bold className="text-accent">
              {t('today.at', { time: formatTime(next.time) })}
            </AppText>
          </View>
        ) : (
          <AppText>{t('today.allMedsDone')}</AppText>
        )}
      </Card>

      {/* 2. Today's checklist (habits) */}
      <Card
        title={t('today.checklist')}
        icon="checkbox"
        speakText={`${t('today.checklist')}. ${habits.map((h) => h[language]).join('. ')}`}
      >
        <AppText className="text-muted mb-2">
          {t('today.checklistProgress', { done: doneHabits.size, total: habits.length })}
        </AppText>
        {habits.map((h) => {
          const done = doneHabits.has(h.id);
          return (
            <Pressable
              key={h.id}
              onPress={() => toggleHabit(h.id, h[language])}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: done }}
              accessibilityLabel={h[language]}
              className={`flex-row items-center min-h-tap px-3 py-2 mb-2 rounded-xl border-2 ${
                done ? 'bg-good-bg border-good' : 'bg-bg border-line'
              }`}
            >
              <Ionicons name={done ? 'checkbox' : 'square-outline'} size={36} color={color(done ? 'good' : 'ink')} />
              <AppText className={`ml-3 flex-1 ${done ? 'line-through' : ''}`}>{h[language]}</AppText>
            </Pressable>
          );
        })}
      </Card>

      {/* 3. Mood check-in */}
      <Card title={t('today.mood')} icon="happy">
        <View className="flex-row justify-between">
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
                className={`flex-1 mx-0.5 items-center rounded-xl px-1 py-2 min-h-tap border-2 ${
                  selected ? 'border-primary bg-good-bg' : 'border-transparent'
                }`}
              >
                <AppText style={{ fontSize: 32, lineHeight: 42 }}>{face}</AppText>
                <AppText variant="caption" className="text-center">
                  {t(`moods.${score}`)}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </Card>

      {/* 4. Feature card: Amma = day plan, Appa = reading */}
      {profile.space === 'planner' ? (
        <Card title={t('today.dayPlan')} icon="list">
          <BigButton icon="mic" label={t('today.planMyDay')} onPress={() => router.push('/my-space')} />
        </Card>
      ) : (
        <Card title={t('today.reading')} icon="book">
          <AppText className="mb-3">{t('today.pagesOf', { page: 120, total: 320 })}</AppText>
          <View className="h-4 bg-bg rounded-full border border-line mb-4 overflow-hidden">
            <View className="h-full bg-primary" style={{ width: `${(120 / 320) * 100}%` }} />
          </View>
          <BigButton icon="add-circle" label={t('today.addPages')} onPress={() => router.push('/my-space')} />
        </Card>
      )}

      {/* Payment reminders (only when something is due this week) */}
      <PaymentsDueCard hideWhenEmpty />

      {/* 5. Daily "I'm okay" check-in */}
      {checkedIn ? (
        <Card title={t('today.checkedIn')} icon="checkmark-circle" tone="good" />
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
        icon="sparkles"
        speakText={language === 'ta' ? `${DEMO_KURAL.ta}. ${DEMO_KURAL.meaning_ta}` : DEMO_KURAL.meaning_en}
      >
        <AppText bold style={{ fontFamily: 'NotoSansTamil_700Bold' }}>
          {DEMO_KURAL.ta}
        </AppText>
        <AppText className="mt-2 text-muted">
          {language === 'ta' ? DEMO_KURAL.meaning_ta : DEMO_KURAL.meaning_en}
        </AppText>
        <AppText variant="caption" className="mt-1 text-muted">
          — திருக்குறள் {DEMO_KURAL.number}
        </AppText>
      </Card>
    </Screen>
  );
}
