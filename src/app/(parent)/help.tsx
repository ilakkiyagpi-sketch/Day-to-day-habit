/**
 * SOS / Help: big red "Call Ilakkiya" and "Ambulance 108", then quick actions
 * (share location, nearest hospital), other contacts, and the Medical ID card
 * readable by anyone in an emergency.
 */
import React, { useState } from 'react';
import { ActivityIndicator, Linking, Platform, View } from 'react-native';
import * as Location from 'expo-location';
import { useTranslation } from 'react-i18next';
import { Screen } from '../../components/Screen';
import { Card } from '../../components/Card';
import { AppText } from '../../components/AppText';
import { BigButton } from '../../components/BigButton';
import { ListGroup, ListRow } from '../../components/ListRow';
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
    Linking.openURL(Platform.OS === 'android' ? `geo:0,0?q=${q}` : `https://www.google.com/maps/search/${q}`);
  };

  return (
    <Screen title={t('help.title')} subtitle={t('help.subtitle')}>
      {adminPhone ? <BigButton size="huge" kind="danger" icon="call" label={t('help.callAdmin')} onPress={() => call(adminPhone)} /> : null}
      <View className="h-3" />
      <BigButton size="huge" kind="danger" icon="medical" label={t('help.call108')} onPress={() => call('108')} />
      <View className="h-6" />

      <ListGroup title={t('help.quick')}>
        <ListRow
          icon="location"
          hue="blue"
          title={t('help.shareLocation')}
          subtitle={t('help.shareLocationHint')}
          onPress={shareLocation}
          right={sharing ? <ActivityIndicator /> : undefined}
        />
        <ListRow icon="business" hue="violet" title={t('help.nearestHospital')} onPress={openHospitals} />
      </ListGroup>
      {error ? <AppText bold className="text-bad -mt-3 mb-4">{error}</AppText> : null}

      {contacts.length > 1 || e.doctor_phone ? (
        <ListGroup title={t('help.otherContacts')}>
          {contacts.slice(1).map((c) => (
            <ListRow key={c.phone} icon="person" hue="teal" title={c.name} subtitle={c.phone} onPress={() => call(c.phone)} />
          ))}
          {e.doctor_phone ? (
            <ListRow icon="medkit" hue="rose" title={e.doctor_name ?? t('help.doctor')} subtitle={t('help.doctor')} onPress={() => call(e.doctor_phone!)} />
          ) : null}
        </ListGroup>
      ) : null}

      <Card
        title={t('help.medicalId')}
        subtitle={profile.name}
        icon="id-card"
        hue="rose"
        speakText={`${t('help.medicalId')}. ${profile.name}. ${t('help.bloodGroup')}: ${e.blood_group ?? '-'}. ${t('help.allergies')}: ${e.allergies || t('help.none')}.`}
      >
        <View className="flex-row -mx-1 mb-1">
          <IdTile label={t('help.bloodGroup')} value={e.blood_group || '-'} />
          <IdTile label={t('help.allergies')} value={e.allergies || t('help.none')} />
        </View>
        <IdRow label={t('help.currentMeds')} value={meds.length ? meds.join(', ') : '-'} />
        <IdRow label={t('help.doctor')} value={[e.doctor_name, e.doctor_phone].filter(Boolean).join(' · ') || '-'} />
      </Card>
    </Screen>
  );
}

function IdTile({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 mx-1 bg-surface-2 rounded-2xl p-3">
      <AppText variant="caption" className="text-muted">
        {label}
      </AppText>
      <AppText variant="title">{value}</AppText>
    </View>
  );
}

function IdRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="mt-3">
      <AppText variant="caption" className="text-muted">
        {label}
      </AppText>
      <AppText>{value}</AppText>
    </View>
  );
}
