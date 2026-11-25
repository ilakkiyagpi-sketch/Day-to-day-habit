/**
 * Demo-mode sample data (used when Supabase isn't configured).
 * The real database seed is supabase/seed.sql.
 */
import type { Profile } from '../lib/types';

const base = {
  font_scale: 'normal' as const,
  location_mode: 'home' as const,
  share_with_spouse: false,
};

export const DEMO_ADMIN_PHONE = '+910000000000';

export const DEMO_PROFILES: Record<'amma' | 'appa' | 'ilakkiya', Profile> = {
  amma: {
    ...base,
    id: '00000000-0000-0000-0000-00000000a001',
    user_id: '00000000-0000-0000-0000-00000000a001',
    name: 'Amma',
    role: 'parent',
    space: 'planner',
    language: 'ta',
    phone: '+910000000011',
    emergency: {
      blood_group: 'B+',
      allergies: 'Penicillin',
      doctor_name: 'Dr. Lakshmi',
      doctor_phone: '+910000000001',
      contacts: [{ name: 'Ilakkiya', phone: DEMO_ADMIN_PHONE }],
    },
  },
  appa: {
    ...base,
    id: '00000000-0000-0000-0000-00000000a002',
    user_id: '00000000-0000-0000-0000-00000000a002',
    name: 'Appa',
    role: 'parent',
    space: 'reading',
    language: 'ta',
    phone: '+910000000012',
    emergency: {
      blood_group: 'O+',
      allergies: '',
      doctor_name: 'Dr. Raman',
      doctor_phone: '+910000000002',
      contacts: [{ name: 'Ilakkiya', phone: DEMO_ADMIN_PHONE }],
    },
  },
  ilakkiya: {
    ...base,
    id: '00000000-0000-0000-0000-00000000a000',
    user_id: '00000000-0000-0000-0000-00000000a000',
    name: 'Ilakkiya',
    role: 'admin',
    space: null,
    language: 'en',
    phone: DEMO_ADMIN_PHONE,
    emergency: {},
  },
};

export type DemoMedicine = { name: string; dose: string; time: string };

export const DEMO_MEDICINES: Record<string, DemoMedicine[]> = {
  [DEMO_PROFILES.amma.id]: [
    { name: 'Amlodipine 5mg (BP)', dose: '1 tablet after food', time: '08:00' },
    { name: 'Metformin 500mg', dose: '1 tablet after food', time: '20:00' },
  ],
  [DEMO_PROFILES.appa.id]: [
    { name: 'Telmisartan 40mg (BP)', dose: '1 tablet before food', time: '07:30' },
    { name: 'Vitamin D3', dose: '1 capsule', time: '13:00' },
  ],
};

export type DemoHabit = { id: string; en: string; ta: string };

export const DEMO_HABITS: Record<string, DemoHabit[]> = {
  [DEMO_PROFILES.amma.id]: [
    { id: 'walk', en: 'Morning walk', ta: 'காலை நடை' },
    { id: 'prayer', en: 'Prayer / yoga', ta: 'பிரார்த்தனை / யோகா' },
    { id: 'water', en: '8 glasses of water', ta: '8 டம்ளர் தண்ணீர்' },
    { id: 'meals', en: 'Meals on time', ta: 'நேரத்துக்குச் சாப்பாடு' },
    { id: 'rest', en: '10 min rest', ta: '10 நிமிடம் ஓய்வு' },
  ],
  [DEMO_PROFILES.appa.id]: [
    { id: 'walk', en: 'Evening walk', ta: 'மாலை நடை' },
    { id: 'prayer', en: 'Prayer', ta: 'பிரார்த்தனை' },
    { id: 'water', en: '8 glasses of water', ta: '8 டம்ளர் தண்ணீர்' },
    { id: 'sun', en: '15 min sunlight', ta: '15 நிமிடம் வெயில்' },
    { id: 'read', en: 'Read 20 pages', ta: '20 பக்கம் வாசிப்பு' },
  ],
};

/** One Thirukkural for the quote card (daily rotation arrives in Phase 6). */
export const DEMO_KURAL = {
  number: 1,
  ta: 'அகர முதல எழுத்தெல்லாம் ஆதி\nபகவன் முதற்றே உலகு',
  meaning_ta: 'எழுத்துகளுக்கு எல்லாம் அகரம் முதல்; அதுபோல உலகத்துக்கு இறைவனே முதல்.',
  meaning_en: 'As the letter A is the first of all letters, so God is the first of the world.',
};
