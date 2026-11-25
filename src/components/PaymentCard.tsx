/** One payment: what, how much, when, how — with big "Paid ✓" and "Edit" buttons. */
import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card } from './Card';
import { AppText } from './AppText';
import { BigButton } from './BigButton';
import { usePrefs } from '../theme/PreferencesProvider';
import { daysUntil, dueStatus, formatDate, formatRupees, type Payment, type PaymentCategory } from '../lib/payments';

export const CATEGORY_ICON: Record<PaymentCategory, 'home' | 'medkit' | 'shield-checkmark' | 'wallet'> = {
  rent: 'home',
  medical: 'medkit',
  lic: 'shield-checkmark',
  other: 'wallet',
};

const TONE = { overdue: 'bad', today: 'warn', soon: 'warn', later: 'default', paid: 'good' } as const;
const WHEN_CLASS = { overdue: 'text-bad', today: 'text-warn', soon: 'text-warn', later: 'text-ink', paid: 'text-good' } as const;

/** "Due in 3 days" / "Due today" / "2 days late". */
export function useDueLabel() {
  const { t } = useTranslation();
  return (p: Payment) => {
    const n = daysUntil(p.due_date);
    if (n === 0) return t('payments.dueToday');
    return n > 0 ? t('payments.inDays', { count: n }) : t('payments.lateDays', { count: -n });
  };
}

type Props = {
  payment: Payment;
  who?: string; // person's name, on Ilakkiya's phone
  onPaid?: () => void;
  onEdit?: () => void;
  compact?: boolean; // Today card: no buttons
};

export function PaymentCard({ payment: p, who, onPaid, onEdit, compact }: Props) {
  const { t } = useTranslation();
  const { language } = usePrefs();
  const dueLabel = useDueLabel();
  const status = dueStatus(p);
  const amount = formatRupees(p.amount);
  const how = [t(`payments.method_${p.method}`), p.pay_to].filter(Boolean).join(' · ');
  const when = status === 'paid' ? t('payments.paidOff') : dueLabel(p);
  const title = `${who ? `${who}: ` : ''}${p.title}`;
  const speak = [title, amount, when, t('payments.dueOn', { date: formatDate(p.due_date, language) }), how].filter(Boolean).join('. ');

  const body = (
    <>
      <View className="flex-row flex-wrap items-baseline justify-between">
        {amount ? <AppText variant="title">{amount}</AppText> : null}
        <AppText bold className={WHEN_CLASS[status]}>
          {when}
        </AppText>
      </View>
      <AppText className="text-muted">{t('payments.dueOn', { date: formatDate(p.due_date, language) })}</AppText>
      <AppText>{how}</AppText>
      {p.note ? <AppText className="text-muted">{p.note}</AppText> : null}
      {p.last_paid_on ? (
        <AppText variant="caption" className="text-muted">
          {t('payments.lastPaid', { date: formatDate(p.last_paid_on, language) })}
        </AppText>
      ) : null}
      {!compact && (onPaid || onEdit) ? (
        <View className="flex-row mt-3 -mx-1">
          {onPaid && p.active ? (
            <View className="flex-1 mx-1">
              <BigButton label={t('payments.paid')} onPress={onPaid} />
            </View>
          ) : null}
          {onEdit ? (
            <View className="flex-1 mx-1">
              <BigButton kind="secondary" icon="create" label={t('payments.edit')} onPress={onEdit} />
            </View>
          ) : null}
        </View>
      ) : null}
    </>
  );

  return (
    <Card title={title} icon={CATEGORY_ICON[p.category]} tone={TONE[status]} speakText={speak}>
      {body}
    </Card>
  );
}
