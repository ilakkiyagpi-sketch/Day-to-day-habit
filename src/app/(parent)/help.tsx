/**
 * SOS / Help: giant "Call Ilakkiya", ambulance 108, other contacts, nearest
 * hospital (opens maps), "Share my location" (SMS with a maps link), and the
 * Medical ID card readable by anyone in an emergency.
 */
import React, { useState } from 'react';
import { Linking, Platform, View } from 'react-native';
import * as Location from 'expo-location';
import { useTranslation } from 'react-i18next';
import { Screen } from '../../components/Screen';
import { Card } from '../../components/Card';
import { AppText } from '../../components/AppText';
import { BigButton } from '../../components/BigButton';
import { useAuth } from '../../lib/auth';
import { DEMO_ADMIN_PHONE, DEMO_MEDICINES } from '../../data/demo';

const call = (phone: string) => Linking.openURL(`tel:${phone}`);

export default function Help() {
  const { t } = useTranslation();
  const { profile, isDemo } = useAuth();
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!profile) return null;

  const e = profile.emergency ?? {};
  const contacts = e.contacts ?? [];
  // Ilakkiya is stored as the first emergency contact when the profile is set up.
  const adminPhone = contacts[0]?.phone ?? (isDemo ? DEMO_ADMIN_PHONE : '');
  const meds = isDemo ? (DEMO_MEDICINES[profile.id] ?? []).map((m) => m.name) : [];

  const shareLocation = async () => {
    setError(null);
    setSharing(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError(t('help.locationDenied'));
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const url = `https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`;
      const body = encodeURIComponent(t('help.locationMessage', { url }));
      // iOS uses "&body=", Android "?body=".
      await Linking.openURL(`sms:${adminPhone}${Platform.OS === 'ios' ? '&' : '?'}body=${body}`);
    } finally {
      setSharing(false);
    }
  };

  const openHospitals = () => {
    const q = encodeURIComponent('hospital near me');
    Linking.openURL(
      Platform.OS === 'android' ? `geo:0,0?q=${q}` : `https://www.google.com/maps/search/${q}`,
    );
  };

  return (
    <Screen title={t('help.title')}>
      {adminPhone ? (
        <BigButton size="huge" kind="danger" icon="call" label={t('help.callAdmin')} onPress={() => call(adminPhone)} />
      ) : null}
      <View className="h-3" />
      <BigButton size="huge" kind="danger" icon="medical" label={t('help.call108')} onPress={() => call('108')} />
      <View className="h-3" />
      <BigButton kind="secondary" icon="location" label={t('help.shareLocation')} onPress={shareLocation} loading={sharing} />
      {error ? <AppText bold className="text-bad mt-2">{error}</AppText> : null}
      <View className="h-3" />
      <BigButton kind="secondary" icon="business" label={t('help.nearestHospital')} onPress={openHospitals} />

      {contacts.length > 1 || e.doctor_phone ? (
        <View className="mt-6">
          <AppText variant="title" className="mb-3">
            {t('help.otherContacts')}
          </AppText>
          {contacts.slice(1).map((c) => (
            <View key={c.phone} className="mb-3">
              <BigButton kind="secondary" icon="call" label={c.name} onPress={() => call(c.phone)} />
            </View>
          ))}
          {e.doctor_phone ? (
            <BigButton kind="secondary" icon="call" label={e.doctor_name ?? t('help.doctor')} onPress={() => call(e.doctor_phone!)} />
          ) : null}
        </View>
      ) : null}

      <View className="h-6" />
      <Card
        title={t('help.medicalId')}
        icon="id-card"
        speakText={`${t('help.medicalId')}. ${profile.name}. ${t('help.bloodGroup')}: ${e.blood_group ?? '-'}. ${t('help.allergies')}: ${e.allergies || t('help.none')}.`}
      >
        <AppText variant="title">{profile.name}</AppText>
        <Row label={t('help.bloodGroup')} value={e.blood_group || '-'} />
        <Row label={t('help.allergies')} value={e.allergies || t('help.none')} />
        <Row label={t('help.currentMeds')} value={meds.length ? meds.join(', ') : '-'} />
        <Row label={t('help.doctor')} value={[e.doctor_name, e.doctor_phone].filter(Boolean).join(' · ') || '-'} />
      </Card>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="mt-2">
      <AppText variant="caption" bold className="text-muted">
        {label}
      </AppText>
      <AppText>{value}</AppText>
    </View>
  );
}
