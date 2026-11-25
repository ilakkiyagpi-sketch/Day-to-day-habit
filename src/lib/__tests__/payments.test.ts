import {
  addMonths,
  daysUntil,
  dueSoon,
  dueStatus,
  formatDate,
  formatRupees,
  markPaid,
  reminderSlots,
  type Payment,
} from '../payments';

const base: Payment = {
  id: 'p1',
  user_id: 'amma',
  created_by: 'ilakkiya',
  category: 'rent',
  title: 'House rent',
  amount: 12000,
  pay_to: 'Owner',
  due_date: '2026-12-05',
  anchor_day: 5,
  repeat: 'monthly',
  remind_days_before: 3,
  method: 'cash',
  note: null,
  active: true,
  last_paid_on: null,
};
const day = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h);

describe('addMonths', () => {
  it('adds months normally', () => expect(addMonths('2026-12-05', 1)).toBe('2027-01-05'));
  it('clamps to month end', () => expect(addMonths('2027-01-31', 1)).toBe('2027-02-28'));
  it('returns to the anchor day after a short month', () =>
    expect(addMonths('2027-02-28', 1, 31)).toBe('2027-03-31'));
  it('handles leap years', () => expect(addMonths('2028-01-31', 1)).toBe('2028-02-29'));
  it('quarterly / yearly', () => {
    expect(addMonths('2026-11-20', 3)).toBe('2027-02-20');
    expect(addMonths('2026-03-28', 12)).toBe('2027-03-28');
  });
});

describe('due status', () => {
  it('daysUntil', () => {
    expect(daysUntil('2026-12-05', day(2026, 12, 1))).toBe(4);
    expect(daysUntil('2026-12-05', day(2026, 12, 7))).toBe(-2);
  });
  it('classifies', () => {
    expect(dueStatus(base, day(2026, 12, 7))).toBe('overdue');
    expect(dueStatus(base, day(2026, 12, 5))).toBe('today');
    expect(dueStatus(base, day(2026, 12, 1))).toBe('soon');
    expect(dueStatus(base, day(2026, 11, 1))).toBe('later');
    expect(dueStatus({ ...base, active: false }, day(2026, 12, 1))).toBe('paid');
  });
  it('dueSoon sorts and filters', () => {
    const lic = { ...base, id: 'p2', title: 'LIC', due_date: '2026-12-02' };
    const far = { ...base, id: 'p3', title: 'Far', due_date: '2027-03-01' };
    expect(dueSoon([base, far, lic], 7, day(2026, 11, 30)).map((p) => p.id)).toEqual(['p2', 'p1']);
  });
});

describe('markPaid', () => {
  it('moves a monthly payment to next month and logs it', () => {
    const { payment, log } = markPaid(base, { paidOn: '2026-12-04', recordedBy: 'amma', logId: 'l1' });
    expect(payment.due_date).toBe('2027-01-05');
    expect(payment.active).toBe(true);
    expect(payment.last_paid_on).toBe('2026-12-04');
    expect(log).toMatchObject({ period_due_date: '2026-12-05', amount: 12000, method: 'cash' });
  });
  it('closes a one-time payment', () => {
    const { payment } = markPaid({ ...base, repeat: 'once' }, { recordedBy: 'x', logId: 'l' });
    expect(payment.active).toBe(false);
    expect(payment.due_date).toBe('2026-12-05');
  });
  it('yearly LIC premium keeps its anchor day', () => {
    const lic = { ...base, repeat: 'half_yearly' as const, due_date: '2026-08-31', anchor_day: 31 };
    expect(markPaid(lic, { recordedBy: 'x', logId: 'l' }).payment.due_date).toBe('2027-02-28');
  });
});

describe('reminderSlots', () => {
  it('reminds N days before, the day before and on the day at 9am', () => {
    const s = reminderSlots(base, day(2026, 11, 25));
    expect(s.map((x) => [x.at.getDate(), x.at.getHours(), x.kind])).toEqual([
      [2, 9, 'before'],
      [4, 9, 'before'],
      [5, 9, 'due'],
    ]);
  });
  it('skips past slots', () => {
    expect(reminderSlots(base, day(2026, 12, 4, 10)).map((x) => x.kind)).toEqual(['due']);
  });
  it('nudges next morning when overdue', () => {
    const s = reminderSlots(base, day(2026, 12, 8, 15));
    expect(s).toHaveLength(1);
    expect(s[0].kind).toBe('overdue');
    expect(s[0].at.getDate()).toBe(9);
  });
  it('nothing for paid one-time payments', () =>
    expect(reminderSlots({ ...base, active: false }, day(2026, 11, 1))).toEqual([]));
});

describe('formatting', () => {
  it('rupees with Indian grouping', () => {
    expect(formatRupees(12000)).toBe('₹12,000');
    expect(formatRupees(125000)).toBe('₹1,25,000');
    expect(formatRupees(10050000.5)).toBe('₹1,00,50,000.50');
    expect(formatRupees(500)).toBe('₹500');
  });
  it('dates in both languages', () => {
    expect(formatDate('2026-12-15', 'en')).toBe('15 Dec 2026');
    expect(formatDate('2026-12-15', 'ta')).toBe('15 டிசம்பர் 2026');
  });
});
