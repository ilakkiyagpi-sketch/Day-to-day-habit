/**
 * PIN screen. Two modes driven by auth state:
 *  - needs_setup: choose a PIN, then confirm it.
 *  - locked: enter the PIN (or use fingerprint/face if the phone supports it).
 */
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Screen } from '../components/Screen';
import { AppText } from '../components/AppText';
import { BigButton } from '../components/BigButton';
import { PinPad } from '../components/PinPad';
import { useAuth } from '../lib/auth';
import { biometricAvailable, checkPin, setPin, unlockWithBiometric } from '../lib/pin';

export default function PinScreen() {
  const { t } = useTranslation();
  const { profile, session, pinState, markUnlocked, signOut } = useAuth();
  const userId = profile?.id ?? session?.user.id ?? '';
  const [pin, setPinValue] = useState('');
  const [firstPin, setFirstPin] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bio, setBio] = useState(false);

  const setup = pinState === 'needs_setup';

  const tryBiometric = async () => {
    if (await unlockWithBiometric(t('pin.fingerprintPrompt'), t('common.cancel'))) markUnlocked();
  };

  useEffect(() => {
    if (setup) return;
    biometricAvailable().then((ok) => {
      setBio(ok);
      if (ok) tryBiometric(); // offer it straight away; PIN pad stays as fallback
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setup]);

  // Act automatically when 4 digits are entered — no extra "OK" button needed.
  useEffect(() => {
    if (pin.length !== 4) return;
    (async () => {
      if (setup) {
        if (firstPin == null) {
          setFirstPin(pin);
          setPinValue('');
          setError(null);
        } else if (firstPin === pin) {
          await setPin(userId, pin);
          markUnlocked();
        } else {
          setFirstPin(null);
          setPinValue('');
          setError(t('pin.mismatch'));
        }
      } else if (await checkPin(userId, pin)) {
        markUnlocked();
      } else {
        setPinValue('');
        setError(t('pin.wrong'));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  const title = setup ? (firstPin == null ? t('pin.setTitle') : t('pin.confirmTitle')) : t('pin.enterTitle');

  return (
    <Screen>
      <AppText variant="title" accessibilityRole="header" className="text-center mt-4">
        {profile?.name ? `${profile.name} — ` : ''}
        {title}
      </AppText>
      {setup ? <AppText className="text-center text-muted mt-2">{t('pin.setHint')}</AppText> : null}
      <PinPad value={pin} onChange={setPinValue} />
      {error ? (
        <AppText bold className="text-bad text-center mt-2" accessibilityLiveRegion="assertive">
          {error}
        </AppText>
      ) : null}
      <View className="h-6" />
      {!setup && bio ? <BigButton kind="secondary" icon="finger-print" label={t('pin.useFingerprint')} onPress={tryBiometric} /> : null}
      {!setup ? (
        <View className="mt-3">
          <BigButton kind="ghost" label={t('pin.forgot')} onPress={signOut} />
        </View>
      ) : null}
    </Screen>
  );
}
