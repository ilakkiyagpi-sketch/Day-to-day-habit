/** Home-screen card: payments overdue or due within 7 days (max 3 shown). */
import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Card } from './Card';
import { AppText } from './AppText';
import { BigButton } from './BigButton';
import { useDueLabel } from './PaymentCard';
import { usePayments } from '../data/payments';
import { daysUntil, dueSoon, formatRupees } from '../lib/payments';

export function PaymentsDueCard({ hideWhenEmpty }: { hideWhenEmpty?: boolean }) {
  const { t } = useTranslation();
  const { payments, nameOf } = usePayments();
  const dueLabel = useDueLabel();
  const due = dueSoon(payments, 7);
  if (!due.length && hideWhenEmpty) return null;

  const line = (p: (typeof due)[number]) =>
    [nameOf(p.user_id), p.title, formatRupees(p.amount), dueLabel(p)].filter(Boolean).join(' · ');

  return (
    <Card
      title={t('payments.dueCard')}
      icon="wallet"
      tone={due.some((p) => daysUntil(p.due_date) < 0) ? 'bad' : due.length ? 'warn' : 'good'}
      speakText={[t('payments.dueCard'), ...due.slice(0, 3).map(line)].join('. ') || t('payments.noneDue')}
    >
      {due.length ? (
        due.slice(0, 3).map((p) => (
          <AppText key={p.id} bold className="mb-1">
            • {line(p)}
          </AppText>
        ))
      ) : (
        <AppText>{t('payments.noneDue')}</AppText>
      )}
      <View className="mt-3">
        <BigButton kind="secondary" icon="list" label={t('payments.seeAll')} onPress={() => router.push('/payments')} />
      </View>
    </Card>
  );
}
