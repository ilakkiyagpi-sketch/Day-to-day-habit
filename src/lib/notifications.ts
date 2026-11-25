/**
 * Local (on-phone) notifications. They work without internet because the phone
 * itself schedules them.
 *
 * Payment reminders: every time the payment list changes, all payment
 * notifications are cancelled and scheduled again from the current list, so
 * edits, "Paid" taps and changes made by Ilakkiya from another phone are always
 * reflected. (The strict medicine alarm in Phase 2 uses a separate system.)
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import i18n from '../i18n';
import { formatDate, formatRupees, reminderSlots, type Payment } from './payments';

const PAYMENT_CHANNEL = 'payments';
const KIND = 'payment';
// iOS keeps at most 64 pending notifications per app; stay well below.
const MAX_SCHEDULED = 50;

let initialised = false;

export async function initNotifications() {
  if (initialised || Platform.OS === 'web') return;
  initialised = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(PAYMENT_CHANNEL, {
      name: 'Payment reminders',
      // eslint-disable-next-line import/namespace -- exported at runtime via `export *`
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 300, 200, 300],
    });
  }
}

async function ensurePermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  return (await Notifications.requestPermissionsAsync()).granted;
}

/** Notification text in the user's language. `who` is set on Ilakkiya's phone. */
export function paymentMessage(p: Payment, kind: 'before' | 'due' | 'overdue', daysLeft: number, who?: string) {
  const lang = (i18n.language === 'en' ? 'en' : 'ta') as 'en' | 'ta';
  const t = i18n.getFixedT(lang);
  const amount = p.amount != null ? ` — ${formatRupees(p.amount)}` : '';
  const title = `💰 ${who ? `${who}: ` : ''}${p.title}${amount}`;
  const date = formatDate(p.due_date, lang);
  const when =
    kind === 'before'
      ? t('payments.notifyBefore', { count: daysLeft, date })
      : kind === 'due'
        ? t('payments.notifyToday')
        : t('payments.notifyOverdue', { date });
  const how = t(`payments.method_${p.method}`) + (p.pay_to ? ` · ${p.pay_to}` : '');
  return { title, body: `${when} ${how}.` };
}

/**
 * Replace all scheduled payment reminders with ones built from `payments`.
 * `nameOf(user_id)` returns a person's name when the list holds payments of
 * several people (Ilakkiya's phone), or undefined for one's own.
 */
export async function syncPaymentReminders(payments: Payment[], nameOf: (userId: string) => string | undefined) {
  if (Platform.OS === 'web') return;
  await initNotifications();

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.content.data?.kind === KIND)
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );

  const now = new Date();
  const slots = payments
    .flatMap((p) => reminderSlots(p, now).map((s) => ({ p, s })))
    .sort((a, b) => a.s.at.getTime() - b.s.at.getTime())
    .slice(0, MAX_SCHEDULED);
  if (slots.length === 0 || !(await ensurePermission())) return;

  for (const { p, s } of slots) {
    const { title, body } = paymentMessage(p, s.kind, s.daysLeft, nameOf(p.user_id));
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: 'default', data: { kind: KIND, paymentId: p.id, url: '/payments' } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: s.at, channelId: PAYMENT_CHANNEL },
    });
  }
}
