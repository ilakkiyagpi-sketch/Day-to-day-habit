/**
 * Payment reminders list, grouped Overdue → Due soon → Later.
 * Amma/Appa see their own; Ilakkiya sees everyone's (with names) and can add
 * reminders for each parent. "Paid ✓" moves a repeating payment to its next
 * due date (10-second Undo).
 */
import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '../components/Screen';
import { AppText } from '../components/AppText';
import { BigButton } from '../components/BigButton';
import { PaymentCard } from '../components/PaymentCard';
import { WebReminderCard } from '../components/WebReminderCard';
import { useToast } from '../components/Toast';
import { usePayments } from '../data/payments';
import { usePrefs } from '../theme/PreferencesProvider';
import { dueStatus, formatDate, markPaid as previewPaid, type Payment } from '../lib/payments';

export function PaymentsScreen({ showBack }: { showBack?: boolean }) {
  const { t } = useTranslation();
  const { language } = usePrefs();
  const { showUndo } = useToast();
  const { payments, loading, error, nameOf, markPaid } = usePayments();

  const active = [...payments].filter((p) => p.active).sort((a, b) => a.due_date.localeCompare(b.due_date));
  const groups: { key: string; items: Payment[] }[] = [
    { key: 'overdue', items: active.filter((p) => dueStatus(p) === 'overdue') },
    { key: 'dueSoon', items: active.filter((p) => ['today', 'soon'].includes(dueStatus(p))) },
    { key: 'later', items: active.filter((p) => dueStatus(p) === 'later') },
    { key: 'paidOff', items: payments.filter((p) => !p.active) },
  ];

  const onPaid = async (p: Payment) => {
    try {
      const undo = await markPaid(p);
      const next = previewPaid(p, { recordedBy: '', logId: '' }).payment;
      showUndo(
        next.active ? t('payments.markedPaid', { date: formatDate(next.due_date, language) }) : t('payments.markedPaidDone'),
        undo,
      );
    } catch {
      showUndo(t('payments.saveFailed'));
    }
  };

  return (
    <Screen title={t('payments.title')} back={showBack}>
      <AppText className="text-muted mb-4">{t('payments.subtitle')}</AppText>
      <WebReminderCard />
      <BigButton icon="add-circle" label={t('payments.add')} onPress={() => router.push('/payment-edit')} />
      <View className="h-4" />

      {error ? <AppText className="text-warn mb-3">{t('common.offline')}</AppText> : null}
      {loading ? <AppText>{t('common.loading')}</AppText> : null}
      {!loading && payments.length === 0 ? <AppText>{t('payments.none')}</AppText> : null}

      {groups.map((g) =>
        g.items.length ? (
          <View key={g.key}>
            <AppText variant="title" accessibilityRole="header" className="mb-2">
              {t(`payments.${g.key}`)}
            </AppText>
            {g.items.map((p) => (
              <PaymentCard
                key={p.id}
                payment={p}
                who={nameOf(p.user_id)}
                onPaid={() => onPaid(p)}
                onEdit={() => router.push({ pathname: '/payment-edit', params: { id: p.id } })}
              />
            ))}
          </View>
        ) : null,
      )}
    </Screen>
  );
}
