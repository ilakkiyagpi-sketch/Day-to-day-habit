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
import { daysUntil, formatDate, formatRupees, reminderSlots, toISODate, type Payment } from './payments';

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
  if (Platform.OS === 'web') return syncWebReminders(payments, nameOf);
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

// ---------------------------------------------------------------------------
// Web version (installed from GitHub Pages)
//
// Browsers cannot schedule a notification for next week the way the phone app
// can. So the web version: (1) when the app is opened, shows a notification for
// every payment that is inside its reminder window (once per payment per day),
// and (2) while the app stays open, sets timers for the next reminders today.
// ---------------------------------------------------------------------------

export type WebNotifyState = 'unsupported' | 'default' | 'granted' | 'denied';

export function webNotifyState(): WebNotifyState {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission as WebNotifyState;
}

/** Must be called from a button tap (browsers require a user gesture). */
export async function enableWebNotifications(): Promise<boolean> {
  if (webNotifyState() === 'unsupported') return false;
  return (await Notification.requestPermission()) === 'granted';
}

let webTimers: ReturnType<typeof setTimeout>[] = [];

async function showWeb(id: string, title: string, body: string) {
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) {
      await reg.showNotification(title, {
        body,
        tag: `pay-${id}`,
        icon: reg.scope + 'icons/icon-192.png',
        badge: reg.scope + 'icons/icon-192.png',
        data: { path: 'payments' },
      });
      return;
    }
  } catch {}
  new Notification(title, { body, tag: `pay-${id}` });
}

function seenToday(id: string): boolean {
  const key = `kudumbam.notified.${id}.${toISODate(new Date())}`;
  try {
    if (localStorage.getItem(key)) return true;
    localStorage.setItem(key, '1');
  } catch {}
  return false;
}

async function syncWebReminders(payments: Payment[], nameOf: (userId: string) => string | undefined) {
  webTimers.forEach(clearTimeout);
  webTimers = [];
  if (webNotifyState() !== 'granted') return;
  const now = new Date();

  for (const p of payments) {
    if (!p.active) continue;
    const left = daysUntil(p.due_date, now);
    // (1) Inside the reminder window right now → remind once today.
    if (left <= p.remind_days_before && !seenToday(p.id)) {
      const kind = left < 0 ? 'overdue' : left === 0 ? 'due' : 'before';
      const { title, body } = paymentMessage(p, kind, left, nameOf(p.user_id));
      await showWeb(p.id, title, body);
    }
    // (2) Later today, while the app stays open.
    for (const slot of reminderSlots(p, now)) {
      const ms = slot.at.getTime() - now.getTime();
      if (ms > 0 && ms < 12 * 3600 * 1000) {
        webTimers.push(
          setTimeout(() => {
            const { title, body } = paymentMessage(p, slot.kind, slot.daysLeft, nameOf(p.user_id));
            showWeb(p.id, title, body);
          }, ms),
        );
      }
    }
  }
}
