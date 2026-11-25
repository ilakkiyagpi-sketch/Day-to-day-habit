/**
 * Add / edit a payment reminder. Big choices instead of typing where possible:
 * type (Rent, Medical, LIC, Other), date with − / + buttons, how often, when
 * to remind, how to pay. Ilakkiya also picks whom it is for.
 */
import React, { useState } from 'react';
import { TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '../components/Screen';
import { AppText } from '../components/AppText';
import { BigButton } from '../components/BigButton';
import { ChoiceRow } from '../components/ChoiceRow';
import { DateStepper } from '../components/DateStepper';
import { usePayments } from '../data/payments';
import { useAuth } from '../lib/auth';
import { confirm } from '../lib/confirm';
import { usePrefs } from '../theme/PreferencesProvider';
import { TEXT_SIZES } from '../theme/typography';
import {
  CATEGORIES,
  METHODS,
  REMIND_OPTIONS,
  REPEATS,
  parseISODate,
  type Payment,
  type PaymentCategory,
  type PaymentMethod,
  type PaymentRepeat,
} from '../lib/payments';

function Label({ children }: { children: string }) {
  return (
    <AppText bold className="mt-4 mb-2">
      {children}
    </AppText>
  );
}

export function PaymentEditScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { profile } = useAuth();
  const { scale, color } = usePrefs();
  const { payments, people, save, remove, newPayment } = usePayments();
  const existing = id ? payments.find((p) => p.id === id) : undefined;
  const isAdmin = profile?.role === 'admin';

  // Ilakkiya most often adds payments for a parent, so default to the first parent.
  const defaultFor = isAdmin ? (people.find((p) => p.id !== profile?.id)?.id ?? profile?.id) : profile?.id;
  const [p, setP] = useState<Payment>(() => existing ?? newPayment(defaultFor));
  const [amountText, setAmountText] = useState(p.amount != null ? String(p.amount) : '');
  const [titleTouched, setTitleTouched] = useState(!!existing);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (patch: Partial<Payment>) => setP((prev) => ({ ...prev, ...patch }));
  const shownTitle = titleTouched ? p.title : p.title || t(`payments.defTitle_${p.category}`);

  const input = (props: React.ComponentProps<typeof TextInput>) => (
    <TextInput
      {...props}
      placeholderTextColor={color('muted')}
      className="bg-surface border-2 border-line rounded-card px-4 min-h-tap mb-4"
      style={{ fontSize: TEXT_SIZES.body * scale, color: color('ink') }}
    />
  );

  const onSave = async () => {
    const title = shownTitle.trim();
    if (!title) return setError(t('payments.nameRequired'));
    const amount = amountText.trim() ? Number(amountText.replace(/[^0-9.]/g, '')) : null;
    setBusy(true);
    try {
      await save({
        ...p,
        title,
        amount: amount != null && !Number.isNaN(amount) ? amount : null,
        pay_to: p.pay_to?.trim() || null,
        note: p.note?.trim() || null,
        anchor_day: parseISODate(p.due_date).getDate(),
        active: true,
      });
      router.back();
    } catch {
      setError(t('payments.saveFailed'));
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async () => {
    if (!existing) return;
    if (await confirm(t('payments.delete'), t('payments.deleteConfirm'), t('common.yes'), t('common.no'))) {
      await remove(existing.id);
      router.back();
    }
  };

  return (
    <Screen title={existing ? t('payments.editTitle') : t('payments.newTitle')} back>
      {isAdmin && people.length > 1 ? (
        <>
          <Label>{t('payments.forWhom')}</Label>
          <ChoiceRow<string>
            label={t('payments.forWhom')}
            value={p.user_id}
            onChange={(user_id) => set({ user_id })}
            options={people.map((x) => ({ value: x.id, label: x.id === profile?.id ? t('payments.me') : x.name }))}
          />
        </>
      ) : null}

      <Label>{t('payments.category')}</Label>
      <ChoiceRow<PaymentCategory>
        label={t('payments.category')}
        value={p.category}
        onChange={(category) => set({ category })}
        options={CATEGORIES.map((c) => ({ value: c, label: t(`payments.cat_${c}`) }))}
      />

      <Label>{t('payments.name')}</Label>
      {input({
        value: shownTitle,
        onChangeText: (title) => {
          setTitleTouched(true);
          set({ title });
        },
        accessibilityLabel: t('payments.name'),
      })}

      <AppText bold className="mb-2">
        {t('payments.amount')}
      </AppText>
      {input({
        value: amountText,
        onChangeText: setAmountText,
        keyboardType: 'numeric',
        placeholder: '0',
        accessibilityLabel: t('payments.amount'),
      })}

      <Label>{t('payments.dueDate')}</Label>
      <DateStepper value={p.due_date} onChange={(due_date) => set({ due_date })} />

      <Label>{t('payments.repeat')}</Label>
      <ChoiceRow<PaymentRepeat>
        label={t('payments.repeat')}
        value={p.repeat}
        onChange={(repeat) => set({ repeat })}
        options={REPEATS.map((r) => ({ value: r, label: t(`payments.rep_${r}`) }))}
      />

      <Label>{t('payments.remind')}</Label>
      <ChoiceRow<string>
        label={t('payments.remind')}
        value={String(p.remind_days_before)}
        onChange={(v) => set({ remind_days_before: Number(v) })}
        options={REMIND_OPTIONS.map((n) => ({ value: String(n), label: t('payments.remind', { count: n }) }))}
      />

      <Label>{t('payments.method')}</Label>
      <ChoiceRow<PaymentMethod>
        label={t('payments.method')}
        value={p.method}
        onChange={(method) => set({ method })}
        options={METHODS.map((m) => ({ value: m, label: t(`payments.method_${m}`) }))}
      />

      <Label>{t('payments.payTo')}</Label>
      {input({
        value: p.pay_to ?? '',
        onChangeText: (pay_to) => set({ pay_to }),
        placeholder: t('payments.payToHint'),
        accessibilityLabel: t('payments.payTo'),
      })}

      <AppText bold className="mb-2">
        {t('payments.note')}
      </AppText>
      {input({
        value: p.note ?? '',
        onChangeText: (note) => set({ note }),
        multiline: true,
        accessibilityLabel: t('payments.note'),
      })}

      {error ? (
        <AppText bold className="text-bad mb-3" accessibilityLiveRegion="assertive">
          {error}
        </AppText>
      ) : null}
      <BigButton icon="checkmark-circle" label={t('payments.save')} onPress={onSave} loading={busy} />
      {existing ? (
        <View className="mt-3">
          <BigButton kind="secondary" icon="trash" label={t('payments.delete')} onPress={onDelete} />
        </View>
      ) : null}
    </Screen>
  );
}
