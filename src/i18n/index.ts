/**
 * i18n setup (i18next + react-i18next). All user-facing strings live in
 * en.json / ta.json — never hard-code text in components.
 * The active language is set by PreferencesProvider.
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import ta from './ta.json';

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, ta: { translation: ta } },
  lng: 'ta',
  fallbackLng: 'en',
  interpolation: { escapeValue: false }, // React already escapes
  returnNull: false,
});

/** BCP-47 tags for speech (TTS now, speech recognition in Phase 4). */
export const SPEECH_LOCALE = { en: 'en-IN', ta: 'ta-IN' } as const;

export default i18n;
