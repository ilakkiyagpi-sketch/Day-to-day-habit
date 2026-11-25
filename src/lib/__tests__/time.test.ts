import { dayPart, formatTime, hhmmToMinutes, nextByTime } from '../time';

describe('time helpers', () => {
  it('dayPart', () => {
    expect(dayPart(new Date(2026, 0, 1, 7))).toBe('morning');
    expect(dayPart(new Date(2026, 0, 1, 13))).toBe('afternoon');
    expect(dayPart(new Date(2026, 0, 1, 20))).toBe('evening');
  });
  it('formatTime', () => {
    expect(formatTime('08:00')).toBe('8:00 AM');
    expect(formatTime('00:05')).toBe('12:05 AM');
    expect(formatTime('20:30')).toBe('8:30 PM');
  });
  it('hhmmToMinutes', () => expect(hhmmToMinutes('13:45')).toBe(825));
  it('nextByTime', () => {
    const items = [{ time: '20:00' }, { time: '08:00' }];
    expect(nextByTime(items, new Date(2026, 0, 1, 9))?.time).toBe('20:00');
    expect(nextByTime(items, new Date(2026, 0, 1, 6))?.time).toBe('08:00');
    expect(nextByTime(items, new Date(2026, 0, 1, 21))).toBeNull();
  });
});
