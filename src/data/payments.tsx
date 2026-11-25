/**
 * Payment reminders data: one shared store for the list screen, the edit
 * screen and the Today / Family cards.
 *
 * - Supabase configured: reads/writes the `payments` and `payment_logs` tables
 *   (RLS: a parent sees their own, Ilakkiya sees everyone's) and listens for
 *   realtime changes, so a payment Ilakkiya adds shows up on Amma's phone.
 *   The last list is cached on the phone so it still shows without internet.
 * - Demo mode: everything is stored on this phone only (AsyncStorage).
 *
 * After every change the phone's local reminders are rescheduled.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as Crypto from 'expo-crypto';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { getJSON, setJSON } from '../lib/storage';
import { addMonths, markPaid as computePaid, toISODate, type Payment, type PaymentLog } from '../lib/payments';
import { syncPaymentReminders } from '../lib/notifications';
import { DEMO_PROFILES } from './demo';

const DEMO_KEY = 'demo.payments.v1';
const DEMO_LOGS_KEY = 'demo.payment_logs.v1';
const CACHE_KEY = 'cache.payments.v1';

type People = { id: string; name: string }[];

type Ctx = {
  payments: Payment[]; // active and paid-off, visible to this user
  people: People; // whose payments can be managed (Ilakkiya: parents + self)
  loading: boolean;
  error: string | null;
  nameOf: (userId: string) => string | undefined;
  save: (p: Payment) => Promise<void>;
  remove: (id: string) => Promise<void>;
  /** Marks the current due as paid; resolves to an undo function. */
  markPaid: (p: Payment) => Promise<() => Promise<void>>;
  newPayment: (forUser?: string) => Payment;
  reload: () => Promise<void>;
};

const PaymentsCtx = createContext<Ctx | null>(null);

/** Sample payments for demo mode, dated relative to today. */
function demoSeed(): Payment[] {
  const today = toISODate(new Date());
  const inDays = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return toISODate(d);
  };
  const { amma, appa, ilakkiya } = DEMO_PROFILES;
  const mk = (p: Partial<Payment> & Pick<Payment, 'id' | 'user_id' | 'title' | 'due_date'>): Payment => ({
    created_by: ilakkiya.id,
    category: 'other',
    amount: null,
    pay_to: null,
    anchor_day: Number(p.due_date.slice(8, 10)),
    repeat: 'monthly',
    remind_days_before: 3,
    method: 'cash',
    note: null,
    active: true,
    last_paid_on: null,
    ...p,
  });
  return [
    mk({ id: 'demo-rent', user_id: amma.id, category: 'rent', title: 'House rent', amount: 12000, pay_to: 'House owner', due_date: inDays(2) }),
    mk({ id: 'demo-lic', user_id: appa.id, category: 'lic', title: 'LIC premium', amount: 8450, pay_to: 'LIC agent', due_date: inDays(20), repeat: 'half_yearly', remind_days_before: 7 }),
    mk({ id: 'demo-med', user_id: appa.id, category: 'medical', title: 'Pharmacy monthly bill', amount: 2300, pay_to: 'Medical shop', due_date: inDays(-1) }),
    mk({ id: 'demo-elec', user_id: amma.id, title: 'Electricity bill', amount: 1800, due_date: addMonths(today, 1), repeat: 'once' }),
  ];
}

export function PaymentsProvider({ children }: { children: React.ReactNode }) {
  const { profile, isDemo } = useAuth();
  const [all, setAll] = useState<Payment[]>([]);
  const [people, setPeople] = useState<People>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = profile?.role === 'admin';

  // Only what this person may see (demo mode keeps everyone's on one phone).
  const visible = useMemo(
    () => (!profile ? [] : isAdmin ? all : all.filter((p) => p.user_id === profile.id)),
    [all, profile, isAdmin],
  );

  const nameOf = useCallback(
    (userId: string) => (isAdmin ? people.find((p) => p.id === userId)?.name : undefined),
    [people, isAdmin],
  );

  const reload = useCallback(async () => {
    if (!profile) return;
    // (No setState before the first await: this runs from an effect.)
    if (isDemo || !supabase) {
      let list = await getJSON<Payment[] | null>(DEMO_KEY, null);
      setError(null);
      if (!list) {
        list = demoSeed();
        await setJSON(DEMO_KEY, list);
      }
      setAll(list);
      const { amma, appa, ilakkiya } = DEMO_PROFILES;
      setPeople([amma, appa, ilakkiya].map(({ id, name }) => ({ id, name })));
      setLoading(false);
      return;
    }
    const [pay, prof] = await Promise.all([
      supabase.from('payments').select('*').order('due_date'),
      supabase.from('profiles').select('id, name, role'),
    ]);
    setError(null);
    if (pay.error) {
      // Offline or server problem: show the last list saved on the phone.
      setError(pay.error.message);
      setAll(await getJSON<Payment[]>(CACHE_KEY, []));
    } else {
      const list = (pay.data as Payment[]).map((p) => ({ ...p, amount: p.amount == null ? null : Number(p.amount) }));
      setAll(list);
      setJSON(CACHE_KEY, list);
    }
    if (prof.data) setPeople(prof.data.map(({ id, name }) => ({ id, name })));
    setLoading(false);
  }, [profile, isDemo]);

  // Fetch from storage/server (an external system) whenever the user changes.
  useEffect(() => {
    void Promise.resolve().then(reload);
  }, [reload]);

  // Realtime: pick up changes made on another phone.
  useEffect(() => {
    if (!supabase || isDemo || !profile) return;
    const client = supabase;
    const channel = client
      .channel('payments-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => reload())
      .subscribe();
    return () => {
      client.removeChannel(channel);
    };
  }, [isDemo, profile, reload]);

  // Keep the phone's scheduled reminders in step with the list.
  useEffect(() => {
    if (loading) return;
    syncPaymentReminders(visible, nameOf).catch(() => {});
  }, [visible, nameOf, loading]);

  /** Apply a local change in demo mode and persist it. */
  const writeDemo = async (fn: (list: Payment[]) => Payment[]) => {
    setAll((prev) => {
      const next = fn(prev);
      setJSON(DEMO_KEY, next);
      return next;
    });
  };

  const save: Ctx['save'] = async (p) => {
    if (isDemo || !supabase) {
      return writeDemo((list) => (list.some((x) => x.id === p.id) ? list.map((x) => (x.id === p.id ? p : x)) : [...list, p]));
    }
    const { error: e } = await supabase.from('payments').upsert(p);
    if (e) throw new Error(e.message);
    await reload();
  };

  const remove: Ctx['remove'] = async (id) => {
    if (isDemo || !supabase) return writeDemo((list) => list.filter((x) => x.id !== id));
    const { error: e } = await supabase.from('payments').delete().eq('id', id);
    if (e) throw new Error(e.message);
    await reload();
  };

  const markPaid: Ctx['markPaid'] = async (p) => {
    const { payment, log } = computePaid(p, { recordedBy: profile!.id, logId: Crypto.randomUUID() });
    if (isDemo || !supabase) {
      await writeDemo((list) => list.map((x) => (x.id === p.id ? payment : x)));
      const logs = await getJSON<PaymentLog[]>(DEMO_LOGS_KEY, []);
      await setJSON(DEMO_LOGS_KEY, [...logs, log]);
      return async () => {
        await writeDemo((list) => list.map((x) => (x.id === p.id ? p : x)));
        await setJSON(DEMO_LOGS_KEY, logs);
      };
    }
    const { error: e1 } = await supabase.from('payment_logs').insert(log);
    if (e1) throw new Error(e1.message);
    const { error: e2 } = await supabase.from('payments').update(payment).eq('id', p.id);
    if (e2) throw new Error(e2.message);
    await reload();
    return async () => {
      await supabase!.from('payments').update(p).eq('id', p.id);
      await supabase!.from('payment_logs').delete().eq('id', log.id);
      await reload();
    };
  };

  const newPayment: Ctx['newPayment'] = (forUser) => {
    const due = new Date();
    due.setDate(due.getDate() + 7);
    return {
      id: Crypto.randomUUID(),
      user_id: forUser ?? profile!.id,
      created_by: profile!.id,
      category: 'rent',
      title: '',
      amount: null,
      pay_to: null,
      due_date: toISODate(due),
      anchor_day: due.getDate(),
      repeat: 'monthly',
      remind_days_before: 3,
      method: 'cash',
      note: null,
      active: true,
      last_paid_on: null,
    };
  };

  return (
    <PaymentsCtx.Provider
      value={{ payments: visible, people, loading, error, nameOf, save, remove, markPaid, newPayment, reload }}
    >
      {children}
    </PaymentsCtx.Provider>
  );
}

export function usePayments(): Ctx {
  const ctx = useContext(PaymentsCtx);
  if (!ctx) throw new Error('usePayments must be used inside PaymentsProvider');
  return ctx;
}
