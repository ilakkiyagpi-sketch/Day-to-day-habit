/**
 * 4-digit PIN used to reopen the app. Only a salted SHA-256 hash is stored,
 * in the device's secure keystore (expo-secure-store). On web (Manu's laptop
 * dashboard) SecureStore is unavailable, so we fall back to AsyncStorage —
 * acceptable because the PIN is a convenience lock, not the security boundary
 * (Supabase Auth + RLS are).
 */
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';
import { getJSON, remove, setJSON } from './storage';

/** SecureStore keys may only contain letters, digits, ".", "-" and "_". */
const keyFor = (userId: string) => `pin_${userId.replace(/[^A-Za-z0-9._-]/g, '')}`;

async function read(key: string): Promise<string | null> {
  if (Platform.OS === 'web') return getJSON<string | null>(key, null);
  return SecureStore.getItemAsync(key);
}

async function write(key: string, value: string) {
  if (Platform.OS === 'web') return setJSON(key, value);
  return SecureStore.setItemAsync(key, value);
}

async function hash(pin: string, salt: string) {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${pin}`);
}

export const isValidPin = (pin: string) => /^\d{4}$/.test(pin);

export async function hasPin(userId: string): Promise<boolean> {
  return (await read(keyFor(userId))) != null;
}

export async function setPin(userId: string, pin: string): Promise<void> {
  if (!isValidPin(pin)) throw new Error('PIN must be 4 digits');
  const salt = Crypto.randomUUID();
  await write(keyFor(userId), `${salt}$${await hash(pin, salt)}`);
}

export async function checkPin(userId: string, pin: string): Promise<boolean> {
  const stored = await read(keyFor(userId));
  if (!stored) return false;
  const [salt, digest] = stored.split('$');
  return (await hash(pin, salt)) === digest;
}

export async function clearPin(userId: string): Promise<void> {
  if (Platform.OS === 'web') return remove(keyFor(userId));
  await SecureStore.deleteItemAsync(keyFor(userId));
}

/** True if the phone has fingerprint/face unlock set up. */
export async function biometricAvailable(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  return (await LocalAuthentication.hasHardwareAsync()) && (await LocalAuthentication.isEnrolledAsync());
}

export async function unlockWithBiometric(prompt: string, cancel: string): Promise<boolean> {
  const res = await LocalAuthentication.authenticateAsync({
    promptMessage: prompt,
    cancelLabel: cancel,
    disableDeviceFallback: false,
  });
  return res.success;
}
