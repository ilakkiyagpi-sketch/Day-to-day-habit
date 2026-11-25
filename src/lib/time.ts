/** Small date/time helpers (pure functions, unit-testable). */

export type DayPart = 'morning' | 'afternoon' | 'evening';

export function dayPart(date: Date = new Date()): DayPart {
  const h = date.getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

/** "08:00" → minutes since midnight. */
export function hhmmToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/** Friendly 12-hour time, e.g. "8:00 AM". */
export function formatTime(hhmm: string): string {
  const mins = hhmmToMinutes(hhmm);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

/** The first item whose time (HH:MM) is at or after `now`, or null. */
export function nextByTime<T extends { time: string }>(items: T[], now: Date = new Date()): T | null {
  const cur = now.getHours() * 60 + now.getMinutes();
  const upcoming = [...items].sort((a, b) => hhmmToMinutes(a.time) - hhmmToMinutes(b.time));
  return upcoming.find((i) => hhmmToMinutes(i.time) >= cur) ?? null;
}
