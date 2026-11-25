/**
 * Change language / text size so the choice sticks: applied on this phone
 * immediately AND saved on the profile (otherwise the profile value would
 * overwrite it at the next app start). Ilakkiya can also change these remotely.
 */
import { useAuth } from './auth';
import { usePrefs, type Language } from '../theme/PreferencesProvider';
import { FONT_SCALES, type FontScale } from '../theme/typography';

export function useDisplaySettings() {
  const prefs = usePrefs();
  const { profile, updateProfile } = useAuth();

  const setTextSize = (font_scale: FontScale) => {
    prefs.setFontScale(font_scale);
    if (profile) updateProfile({ font_scale });
  };
  const setLanguage = (language: Language) => {
    prefs.setLanguage(language);
    if (profile) updateProfile({ language });
  };
  const step = (dir: -1 | 1) => {
    const i = FONT_SCALES.indexOf(prefs.fontScale) + dir;
    if (i >= 0 && i < FONT_SCALES.length) setTextSize(FONT_SCALES[i]);
  };

  return {
    fontScale: prefs.fontScale,
    language: prefs.language,
    setTextSize,
    setLanguage,
    smaller: () => step(-1),
    bigger: () => step(1),
    canSmaller: FONT_SCALES.indexOf(prefs.fontScale) > 0,
    canBigger: FONT_SCALES.indexOf(prefs.fontScale) < FONT_SCALES.length - 1,
  };
}
