/** Shared domain types. Mirrors supabase/migrations/0001_init.sql. */

export type Role = 'parent' | 'admin';
/** Which personal space a parent gets: Amma = work planner, Appa = reading. */
export type Space = 'planner' | 'reading' | null;
export type LocationMode = 'home' | 'child_house';

export type EmergencyInfo = {
  blood_group?: string;
  allergies?: string;
  doctor_name?: string;
  doctor_phone?: string;
  contacts?: { name: string; phone: string }[];
};

export type Profile = {
  id: string;
  user_id: string;
  name: string;
  role: Role;
  space: Space;
  language: 'en' | 'ta';
  font_scale: 'small' | 'normal' | 'large' | 'xl';
  location_mode: LocationMode;
  phone: string | null;
  emergency: EmergencyInfo;
  share_with_spouse: boolean;
};
