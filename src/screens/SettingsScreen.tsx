/** Settings shared by parents and Manu: language, text size, colours, disclaimer, sign out. */
import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { AppText } from '../components/AppText';
import { BigButton } from '../components/BigButton';
import { ChoiceRow } from '../components/ChoiceRow';
import { Disclaimer } from '../components/Disclaimer';
import { useAuth } from '../lib/auth';
import { confirm } from '../lib/confirm';
import { usePrefs, type Language, type SchemePref } from '../theme/PreferencesProvider';
import type { FontScale } from '../theme/typography';

export function SettingsScreen() {
  const { t } = useTranslation();
  const prefs = usePrefs();
  const { signOut } = useAuth();
  return (
    <Screen title={t('settings.title')}>
      <Card title={t('settings.language')} icon="language">
        <ChoiceRow<Language>
          label={t('settings.language')}
          value={prefs.language}
          onChange={prefs.setLanguage}
          options={[
            { value: 'ta', label: t('lang.ta') },
            { value: 'en', label: t('lang.en') },
          ]}
        />
      </Card>
      <Card title={t('settings.fontSize')} icon="text">
        <ChoiceRow<FontScale>
          label={t('settings.fontSize')}
          value={prefs.fontScale}
          onChange={prefs.setFontScale}
          options={[
            { value: 'normal', label: t('settings.fontNormal') },
            { value: 'large', label: t('settings.fontLarge') },
            { value: 'xl', label: t('settings.fontXl') },
          ]}
        />
        <AppText className="mt-3">{t('settings.sample')}</AppText>
      </Card>
      <Card title={t('settings.theme')} icon="contrast">
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
