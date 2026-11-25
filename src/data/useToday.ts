/**
 * Data for the parent's "Today" screen.
 *
 * Phase 1: demo data in demo mode; with Supabase configured it returns empty
 * lists until the health tables are wired up in Phase 2 (medicines, habits,
 * mood and check-ins with offline sync).
 */
import { useAuth } from '../lib/auth';
import { DEMO_HABITS, DEMO_MEDICINES, type DemoHabit, type DemoMedicine } from './demo';

export function useToday(): { medicines: DemoMedicine[]; habits: DemoHabit[] } {
  const { profile, isDemo } = useAuth();
  if (!profile || !isDemo) return { medicines: [], habits: [] };
  return {
    medicines: DEMO_MEDICINES[profile.id] ?? [],
    habits: DEMO_HABITS[profile.id] ?? [],
  };
}
