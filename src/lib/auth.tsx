/**
 * Authentication state for the whole app.
 *
 * Flow:  signed out → (email code) → signed in → set PIN once → unlocked.
 * Later app opens:  locked → PIN / fingerprint → unlocked. Never asks for the
 * email again unless the user signs out or forgets the PIN.
 *
 * The app locks again when it has been in the background for LOCK_AFTER_MS.
 * In demo mode a local sample profile stands in for a Supabase session.
 */
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import { isDemoMode, supabase } from './supabase';
import { getJSON, remove, setJSON } from './storage';
import { clearPin, hasPin } from './pin';
import type { Profile } from './types';
import { DEMO_PROFILES } from '../data/demo';

const LOCK_AFTER_MS = 5 * 60 * 1000;
const DEMO_KEY = 'demo.profile';

export type PinState = 'unknown' | 'needs_setup' | 'locked' | 'unlocked';

type AuthContext = {
  loading: boolean;
  session: Session | null;
  profile: Profile | null;
  pinState: PinState;
  isDemo: boolean;
  sendCode: (email: string) => Promise<{ error?: string }>;
  verifyCode: (email: string, code: string) => Promise<{ error?: string }>;
  signInDemo: (who: keyof typeof DEMO_PROFILES) => Promise<void>;
  markUnlocked: () => void;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  /** Change own/linked profile fields (saved to Supabase; in-memory in demo mode). */
  updateProfile: (patch: Partial<Profile>) => Promise<void>;
};

const Ctx = createContext<AuthContext | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [pinState, setPinState] = useState<PinState>('unknown');
  const backgroundedAt = useRef<number | null>(null);

  /** After we know who the user is, decide whether a PIN must be set or entered. */
  const resolvePin = useCallback(async (userId: string) => {
    setPinState((await hasPin(userId)) ? 'locked' : 'needs_setup');
  }, []);

  const loadProfile = useCallback(async (userId: string) => {
    if (!supabase) return;
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    setProfile((data as Profile) ?? null);
  }, []);

  // Initial load + subscribe to Supabase auth changes.
  useEffect(() => {
    let unsub: (() => void) | undefined;
    (async () => {
      if (isDemoMode || !supabase) {
        const who = await getJSON<keyof typeof DEMO_PROFILES | null>(DEMO_KEY, null);
        if (who) {
          setProfile(DEMO_PROFILES[who]);
          await resolvePin(DEMO_PROFILES[who].id);
        }
        setLoading(false);
        return;
      }
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      if (data.session) {
        await Promise.all([loadProfile(data.session.user.id), resolvePin(data.session.user.id)]);
      }
      setLoading(false);
      const sub = supabase.auth.onAuthStateChange((_event, s) => {
        setSession(s);
        if (!s) {
          setProfile(null);
          setPinState('unknown');
        }
      });
      unsub = () => sub.data.subscription.unsubscribe();
    })();
    return () => unsub?.();
  }, [loadProfile, resolvePin]);

  // Auto-lock after time in background.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background') backgroundedAt.current = Date.now();
      if (state === 'active' && backgroundedAt.current) {
        const away = Date.now() - backgroundedAt.current;
        backgroundedAt.current = null;
        setPinState((p) => (p === 'unlocked' && away > LOCK_AFTER_MS ? 'locked' : p));
      }
    });
    return () => sub.remove();
  }, []);

  const sendCode: AuthContext['sendCode'] = async (email) => {
    if (!supabase) return { error: 'demo' };
    const { error } = await supabase.auth.signInWithOtp({
      email,
      // Accounts are created by Ilakkiya (see README), not by self sign-up.
      options: { shouldCreateUser: false },
    });
    return error ? { error: error.message } : {};
  };

  const verifyCode: AuthContext['verifyCode'] = async (email, code) => {
    if (!supabase) return { error: 'demo' };
    const { data, error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' });
    if (error || !data.session) return { error: error?.message ?? 'invalid' };
    setSession(data.session);
    await Promise.all([loadProfile(data.session.user.id), resolvePin(data.session.user.id)]);
    return {};
  };

  const signInDemo: AuthContext['signInDemo'] = async (who) => {
    await setJSON(DEMO_KEY, who);
    setProfile(DEMO_PROFILES[who]);
    await resolvePin(DEMO_PROFILES[who].id);
  };

  const signOut = async () => {
    if (profile) await clearPin(profile.id);
    if (supabase) await supabase.auth.signOut();
    await remove(DEMO_KEY);
    setSession(null);
    setProfile(null);
    setPinState('unknown');
  };

  const refreshProfile = async () => {
    if (session) await loadProfile(session.user.id);
  };

  const updateProfile: AuthContext['updateProfile'] = async (patch) => {
    if (!profile) return;
    setProfile({ ...profile, ...patch });
    if (supabase) await supabase.from('profiles').update(patch).eq('id', profile.id);
  };

  return (
    <Ctx.Provider
      value={{
        loading,
        session,
        profile,
        pinState,
        isDemo: isDemoMode,
        sendCode,
        verifyCode,
        signInDemo,
        markUnlocked: () => setPinState('unlocked'),
        signOut,
        refreshProfile,
        updateProfile,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth(): AuthContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
