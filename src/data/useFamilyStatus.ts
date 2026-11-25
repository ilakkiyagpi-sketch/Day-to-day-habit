/**
 * Today's status for each linked parent, for Manu's dashboard.
 * Phase 1: demo values (or an empty list with Supabase configured).
 * Phase 3 replaces this with live queries + realtime subscriptions.
 */
import { useAuth } from '../lib/auth';
import { DEMO_MEDICINES, DEMO_PROFILES } from './demo';
import type { Profile } from '../lib/types';

export type ParentStatus = {
  profile: Profile;
  doses: { name: string; time: string; status: 'taken' | 'missed' | 'pending' }[];
  lastBp: { sys: number; dia: number; level: 'good' | 'warn' | 'bad' } | null;
  mood: number | null;
  checkedIn: boolean;
  habitsPct: number;
  feature: { kind: 'tasks'; done: number; total: number } | { kind: 'pages'; pages: number };
};

export function useFamilyStatus(): { parents: ParentStatus[]; alerts: { id: string; message: string; severity: 'warn' | 'bad' }[] } {
  const { isDemo } = useAuth();
  if (!isDemo) return { parents: [], alerts: [] };
  const { amma, appa } = DEMO_PROFILES;
  return {
    parents: [
      {
        profile: amma,
        doses: DEMO_MEDICINES[amma.id].map((m, i) => ({ ...m, status: i === 0 ? 'taken' : 'pending' })),
        lastBp: { sys: 128, dia: 82, level: 'good' },
        mood: 4,
        checkedIn: true,
        habitsPct: 60,
        feature: { kind: 'tasks', done: 5, total: 8 },
      },
      {
        profile: appa,
        doses: DEMO_MEDICINES[appa.id].map((m, i) => ({ ...m, status: i === 0 ? 'taken' : 'missed' })),
        lastBp: { sys: 146, dia: 92, level: 'warn' },
        mood: null,
        checkedIn: false,
        habitsPct: 40,
        feature: { kind: 'pages', pages: 24 },
      },
    ],
    alerts: [{ id: 'a1', severity: 'warn', message: 'Appa: Vitamin D3 (1:00 PM) — no response' }],
  };
}
