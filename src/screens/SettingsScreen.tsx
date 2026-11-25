/** Settings shared by parents and Ilakkiya: language, text size, colours, disclaimer, sign out. */
import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { AppText } from '../components/AppText';
import { BigButton } from '../components/BigButton';
import { ChoiceRow } from '../components/ChoiceRow';
import { Disclaimer } from '../components/Disclaimer';
import { WebReminderCard } from '../components/WebReminderCard';
import { useAuth } from '../lib/auth';
import { confirm } from '../lib/confirm';
import { usePrefs, type Language, type SchemePref } from '../theme/PreferencesProvider';
import { FONT_SCALES, type FontScale } from '../theme/typography';
import { useDisplaySettings } from '../lib/useDisplaySettings';

export function SettingsScreen() {
  const { t } = useTranslation();
  const prefs = usePrefs();
  const display = useDisplaySettings();
  const { signOut } = useAuth();
  return (
    <Screen title={t('settings.title')}>
      <Card title={t('settings.language')} icon="language" hue="blue">
        <ChoiceRow<Language>
          label={t('settings.language')}
          value={display.language}
          onChange={display.setLanguage}
          options={[
            { value: 'ta', label: t('lang.ta') },
            { value: 'en', label: t('lang.en') },
          ]}
        />
      </Card>
      <Card title={t('settings.fontSize')} icon="text" hue="violet">
        <ChoiceRow<FontScale>
          label={t('settings.fontSize')}
          value={display.fontScale}
          onChange={display.setTextSize}
          options={FONT_SCALES.map((value) => ({ value, label: t(`settings.font_${value}`) }))}
        />
        <View className="mt-3 bg-surface-2 rounded-2xl p-3">
          <AppText>{t('settings.sample')}</AppText>
        </View>
      </Card>
      <Card title={t('settings.theme')} icon="contrast" hue="teal">
        <ChoiceRow<SchemePref>
          label={t('settings.theme')}
          value={prefs.scheme}
          onChange={prefs.setScheme}
          options={[
            { value: 'system', label: t('settings.themeSystem') },
            { value: 'light', label: t('settings.themeLight') },
            { value: 'dark', label: t('settings.themeDark') },
          ]}
        />
      </Card>
      <WebReminderCard />
      <Disclaimer />
      <View className="mt-2">
        <BigButton kind="secondary" icon="log-out" label={t('auth.signOut')} onPress={async () => {
            if (await confirm(t('auth.signOut'), t('auth.signOutConfirm'), t('common.yes'), t('common.no'))) signOut();
          }}
        />
      </View>
    </Screen>
  );
}
