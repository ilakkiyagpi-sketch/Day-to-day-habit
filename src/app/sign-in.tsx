/**
 * Sign-in: choose language, then email → 6-digit code. Done once; after that
 * the PIN reopens the app for months. In demo mode, pick a sample person.
 */
import React, { useState } from 'react';
import { TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Screen } from '../components/Screen';
import { AppText } from '../components/AppText';
import { BigButton } from '../components/BigButton';
import { ChoiceRow } from '../components/ChoiceRow';
import { Disclaimer } from '../components/Disclaimer';
import { BrandHeader } from '../components/BrandHeader';
import { SHADOW } from '../theme/palette';
import { useAuth } from '../lib/auth';
import { usePrefs, type Language } from '../theme/PreferencesProvider';
import { TEXT_SIZES } from '../theme/typography';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignIn() {
  const { t } = useTranslation();
  const { language, setLanguage, scale, color } = usePrefs();
  const { isDemo, sendCode, verifyCode, signInDemo } = useAuth();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const inputStyle = {
    fontSize: TEXT_SIZES.lead * scale,
    color: color('ink'),
  };

  const onSend = async () => {
    setError(null);
    if (!EMAIL_RE.test(email.trim())) return setError(t('auth.invalidEmail'));
    setBusy(true);
    const res = await sendCode(email.trim());
    setBusy(false);
    if (res.error) return setError(res.error);
    setStep('code');
  };

  const onVerify = async () => {
    setError(null);
    setBusy(true);
    const res = await verifyCode(email.trim(), code.trim());
    setBusy(false);
    if (res.error) setError(t('auth.invalidCode'));
  };

  return (
    <Screen>
      <BrandHeader />

      <View className="bg-surface rounded-card p-4 mb-5" style={SHADOW.card}>
      <AppText bold className="mb-2">
        {t('auth.chooseLanguage')}
      </AppText>
      <ChoiceRow<Language>
        label={t('auth.chooseLanguage')}
        value={language}
        onChange={setLanguage}
        options={[
          { value: 'ta', label: t('lang.ta') },
          { value: 'en', label: t('lang.en') },
        ]}
      />
      </View>

      {isDemo ? (
        <View>
          <AppText variant="lead" bold className="mb-3 ml-1">
            {t('auth.demoTitle')}
          </AppText>
          {(['amma', 'appa', 'ilakkiya'] as const).map((who) => (
            <View key={who} className="mb-3">
              <BigButton
                kind={who === 'ilakkiya' ? 'secondary' : 'primary'}
                icon={who === 'ilakkiya' ? 'people' : 'person'}
                label={t('auth.demoAs', { name: who[0].toUpperCase() + who.slice(1) })}
                onPress={() => signInDemo(who)}
              />
            </View>
          ))}
        </View>
      ) : step === 'email' ? (
        <View>
          <AppText bold>{t('auth.emailLabel')}</AppText>
          <AppText variant="caption" className="text-muted mb-2">
            {t('auth.emailHint')}
          </AppText>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            accessibilityLabel={t('auth.emailLabel')}
            className="bg-surface border border-line rounded-2xl px-4 min-h-tap mb-4"
            style={inputStyle}
          />
          <BigButton label={t('auth.sendCode')} icon="mail" onPress={onSend} loading={busy} />
        </View>
      ) : (
        <View>
          <AppText className="mb-3">{t('auth.codeSent', { email })}</AppText>
          <AppText bold className="mb-2">
            {t('auth.codeLabel')}
          </AppText>
          <TextInput
            value={code}
            onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
            keyboardType="number-pad"
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            accessibilityLabel={t('auth.codeLabel')}
            className="bg-surface border border-line rounded-2xl px-4 min-h-tap mb-4 text-center"
            style={[inputStyle, { letterSpacing: 8 }]}
          />
          <BigButton
            label={t('auth.verify')}
            icon="lock-open"
            onPress={onVerify}
            loading={busy}
            disabled={code.length !== 6}
          />
          <View className="h-3" />
          <BigButton kind="ghost" label={t('auth.changeEmail')} onPress={() => setStep('email')} />
        </View>
      )}

      {error ? (
        <AppText bold className="text-bad mt-4" accessibilityLiveRegion="assertive">
          {error}
        </AppText>
      ) : null}

      <View className="h-8" />
      <Disclaimer />
    </Screen>
  );
}
