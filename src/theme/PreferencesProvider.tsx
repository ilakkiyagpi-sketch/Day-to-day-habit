/**
 * Per-device display preferences: language, font size, colour scheme.
 * Stored locally so they apply instantly (even offline, even before login).
 * When signed in, AuthProvider also mirrors language/font size from the profile
 * so Ilakkiya can change them remotely.
 */
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme, View } from 'react-native';
import { vars } from 'nativewind';
import i18n from '../i18n';
import { getJSON, setJSON } from '../lib/storage';
import { palettes, rgb, type PaletteName } from './palette';
import { FONT_SCALE_FACTOR, type FontScale } from './typography';

export type Language = 'en' | 'ta';
export type SchemePref = 'system' | 'light' | 'dark';

type Prefs = { language: Language; fontScale: FontScale; scheme: SchemePref };

type PrefsContext = Prefs & {
  ready: boolean;
  scale: number;
  palette: PaletteName;
  /** JS colour helper for icons etc.: color('primary') → "rgb(...)" */
  color: (name: string) => string;
  setLanguage: (l: Language) => void;
  setFontScale: (s: FontScale) => void;
  setScheme: (s: SchemePref) => void;
};

const KEY = 'prefs.v1';
const DEFAULTS: Prefs = { language: 'ta', fontScale: 'normal', scheme: 'system' };
const Ctx = createContext<PrefsContext | null>(null);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getJSON<Prefs>(KEY, DEFAULTS).then((p) => {
      const merged = { ...DEFAULTS, ...p };
      setPrefs(merged);
      i18n.changeLanguage(merged.language);
      setReady(true);
    });
  }, []);

  const update = (patch: Partial<Prefs>) =>
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      setJSON(KEY, next);
      if (patch.language) i18n.changeLanguage(patch.language);
      return next;
    });

  const palette: PaletteName =
    prefs.scheme === 'system' ? (system === 'dark' ? 'dark' : 'light') : prefs.scheme;

  const value = useMemo<PrefsContext>(
    () => ({
      ...prefs,
      ready,
      scale: FONT_SCALE_FACTOR[prefs.fontScale],
      palette,
      color: (name) => rgb(palettes[palette][name] ?? palettes[palette].ink),
      setLanguage: (language) => update({ language }),
      setFontScale: (fontScale) => update({ fontScale }),
      setScheme: (scheme) => update({ scheme }),
    }),
    [prefs, ready, palette],
  );

  // Expose the palette as CSS variables so Tailwind classes resolve per mode.
  const cssVars = useMemo(() => {
    const p = palettes[palette];
    return vars(Object.fromEntries(Object.entries(p).map(([k, val]) => [`--${k}`, val])));
  }, [palette]);

  return (
    <Ctx.Provider value={value}>
      <View style={[{ flex: 1 }, cssVars]} className="bg-bg">
        {children}
      </View>
    </Ctx.Provider>
  );
}

export function usePrefs(): PrefsContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('usePrefs must be used inside PreferencesProvider');
  return ctx;
}
