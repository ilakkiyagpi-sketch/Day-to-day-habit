/**
 * Cash payment reminders: rent, medical (pharmacy, hospital), LIC / insurance
 * premiums and anything else with a due date.
 *
 * Pure functions only (no React, no storage) so they are easy to unit-test.
 * Dates are plain 'YYYY-MM-DD' strings in the phone's local calendar.
 */

export type PaymentCategory = 'rent' | 'medical' | 'lic' | 'other';
export type PaymentRepeat = 'once' | 'monthly' | 'quarterly' | 'half_yearly' | 'yearly';
export type PaymentMethod = 'cash' | 'online' | 'cheque';

export type Payment = {
  id: string;
  user_id: string; // whose payment it is (Amma, Appa or Ilakkiya)
  created_by: string;
  category: PaymentCategory;
  title: string;
  amount: number | null; // rupees
  pay_to: string | null; // landlord, LIC agent, pharmacy…
  due_date: string; // next due date
  anchor_day: number; // day of month it is normally due (keeps 31st → 30th → 31st right)
  repeat: PaymentRepeat;
  remind_days_before: number;
  method: PaymentMethod;
  note: string | null;
  active: boolean; // false once a one-time payment is paid
  last_paid_on: string | null;
};

export type PaymentLog = {
  id: string;
  user_id: string;
  payment_id: string;
  period_due_date: string; // which due date this payment covered
  paid_on: string;
  amount: number | null;
  method: PaymentMethod;
  recorded_by: string;
};

export const CATEGORIES: PaymentCategory[] = ['rent', 'medical', 'lic', 'other'];
export const REPEATS: PaymentRepeat[] = ['once', 'monthly', 'quarterly', 'half_yearly', 'yearly'];
export const METHODS: PaymentMethod[] = ['cash', 'online', 'cheque'];
export const REMIND_OPTIONS = [1, 3, 7] as const;

const MONTHS_PER: Record<PaymentRepeat, number> = {
  once: 0,
  monthly: 1,
  quarterly: 3,
  half_yearly: 6,
  yearly: 12,
};

// ---------------------------------------------------------------- dates

const pad = (n: number) => String(n).padStart(2, '0');

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseISODate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export const daysInMonth = (year: number, month0: number) => new Date(year, month0 + 1, 0).getDate();

/** Add whole months, using `anchorDay` and clamping to the month's last day. */
export function addMonths(iso: string, months: number, anchorDay?: number): string {
  const d = parseISODate(iso);
  const day = anchorDay ?? d.getDate();
  const total = d.getMonth() + months;
  const year = d.getFullYear() + Math.floor(total / 12);
  const month0 = ((total % 12) + 12) % 12;
  return toISODate(new Date(year, month0, Math.min(day, daysInMonth(year, month0))));
}

/** Whole days from `today` to `iso` (negative = overdue). */
export function daysUntil(iso: string, today: Date = new Date()): number {
  const a = parseISODate(toISODate(today)).getTime();
  const b = parseISODate(iso).getTime();
  return Math.round((b - a) / 86_400_000);
}

// --------------------------------------------------------------- status

export type DueStatus = 'overdue' | 'today' | 'soon' | 'later' | 'paid';

export function dueStatus(p: Payment, today: Date = new Date()): DueStatus {
  if (!p.active) return 'paid';
  const n = daysUntil(p.due_date, today);
  if (n < 0) return 'overdue';
  if (n === 0) return 'today';
  if (n <= Math.max(p.remind_days_before, 7)) return 'soon';
  return 'later';
}

/** Active payments, most urgent first. */
export function sortByDue(list: Payment[]): Payment[] {
  return [...list]
    .filter((p) => p.active)
    .sort((a, b) => a.due_date.localeCompare(b.due_date) || a.title.localeCompare(b.title));
}

/** Overdue or due within `days` days — shown on the Today screen. */
export function dueSoon(list: Payment[], days = 7, today: Date = new Date()): Payment[] {
  return sortByDue(list).filter((p) => daysUntil(p.due_date, today) <= days);
}

// ------------------------------------------------------------ mark paid

/**
 * Record that the current due was paid. Repeating payments move to the next
 * due date; one-time payments become inactive. Returns the new payment and the
 * log row (keep the old payment to support Undo).
 */
export function markPaid(
  p: Payment,
  opts: { paidOn?: string; amount?: number | null; method?: PaymentMethod; recordedBy: string; logId: string },
): { payment: Payment; log: PaymentLog } {
  const paidOn = opts.paidOn ?? toISODate(new Date());
  const log: PaymentLog = {
    id: opts.logId,
    user_id: p.user_id,
    payment_id: p.id,
    period_due_date: p.due_date,
    paid_on: paidOn,
    amount: opts.amount === undefined ? p.amount : opts.amount,
    method: opts.method ?? p.method,
    recorded_by: opts.recordedBy,
  };
  const months = MONTHS_PER[p.repeat];
  const payment: Payment =
    months === 0
      ? { ...p, active: false, last_paid_on: paidOn }
      : { ...p, due_date: addMonths(p.due_date, months, p.anchor_day), last_paid_on: paidOn };
  return { payment, log };
}

// ------------------------------------------------------------ reminders

export type ReminderSlot = { at: Date; kind: 'before' | 'due' | 'overdue'; daysLeft: number };

/**
 * When to remind for the current due date (at `hour`:00 local time):
 * `remind_days_before` days before, the day before, and on the due day.
 * If already overdue, one nudge on the next morning. Past slots are skipped.
 */
export function reminderSlots(p: Payment, now: Date = new Date(), hour = 9): ReminderSlot[] {
  if (!p.active) return [];
  const due = parseISODate(p.due_date);
  const at = (daysBefore: number) => {
    const d = new Date(due);
    d.setDate(d.getDate() - daysBefore);
    d.setHours(hour, 0, 0, 0);
    return d;
  };
  const befores = Array.from(new Set([p.remind_days_before, 1])).filter((n) => n > 0);
  const slots: ReminderSlot[] = [
    ...befores.map((n) => ({ at: at(n), kind: 'before' as const, daysLeft: n })),
    { at: at(0), kind: 'due' as const, daysLeft: 0 },
  ].filter((s) => s.at.getTime() > now.getTime());

  if (slots.length === 0 && daysUntil(p.due_date, now) <= 0) {
    const next = new Date(now);
    if (next.getHours() >= hour) next.setDate(next.getDate() + 1);
    next.setHours(hour, 0, 0, 0);
    return [{ at: next, kind: 'overdue', daysLeft: daysUntil(p.due_date, now) }];
  }
  return slots.sort((a, b) => a.at.getTime() - b.at.getTime());
}

// ----------------------------------------------------------- formatting

/** ₹ with Indian digit grouping: 125000 → "₹1,25,000". */
export function formatRupees(amount: number | null): string {
  if (amount == null) return '';
  const [int, dec] = Math.abs(amount).toFixed(2).split('.');
  const last3 = int.slice(-3);
  const rest = int.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  const grouped = rest ? `${rest},${last3}` : last3;
  return `${amount < 0 ? '-' : ''}₹${grouped}${dec === '00' ? '' : `.${dec}`}`;
}

const MONTHS = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  ta: ['ஜனவரி', 'பிப்ரவரி', 'மார்ச்', 'ஏப்ரல்', 'மே', 'ஜூன்', 'ஜூலை', 'ஆகஸ்ட்', 'செப்டம்பர்', 'அக்டோபர்', 'நவம்பர்', 'டிசம்பர்'],
};

/** '2026-12-15' → "15 Dec 2026" / "15 டிசம்பர் 2026". */
export function formatDate(iso: string, lang: 'en' | 'ta'): string {
  const d = parseISODate(iso);
  return `${d.getDate()} ${MONTHS[lang][d.getMonth()]} ${d.getFullYear()}`;
}

export const monthName = (month0: number, lang: 'en' | 'ta') => MONTHS[lang][month0];

const WEEKDAYS = {
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  ta: ['ஞாயிறு', 'திங்கள்', 'செவ்வாய்', 'புதன்', 'வியாழன்', 'வெள்ளி', 'சனி'],
};

/** "Wednesday, 25 Nov 2026" / "புதன், 25 நவம்பர் 2026". */
export function formatLongDate(d: Date, lang: 'en' | 'ta'): string {
  return `${WEEKDAYS[lang][d.getDay()]}, ${formatDate(toISODate(d), lang)}`;
}
