-- =============================================================================
-- Kudumbam — family setup seed (Phase 1)
--
-- 1. In Supabase → Authentication → Users, click "Add user" three times and
--    create Ilakkiya, Amma and Appa with their real email addresses.
-- 2. Replace the three emails below, then run this whole file in
--    Supabase → SQL Editor.
--
-- It is safe to run more than once. Sample logs (2 weeks of data for charts)
-- will be added by the full seed in a later phase.
-- =============================================================================

do $$
declare
  ilakkiya uuid := (select id from auth.users where email = 'ilakkiya@example.com');
  amma uuid := (select id from auth.users where email = 'amma@example.com');
  appa uuid := (select id from auth.users where email = 'appa@example.com');
begin
  if ilakkiya is null or amma is null or appa is null then
    raise exception 'Create the three users in Authentication first and fix the emails at the top of seed.sql';
  end if;

  -- Profiles (rows are created automatically when the users are created)
  update public.profiles set name = 'Ilakkiya', role = 'admin', language = 'en', font_scale = 'normal'
    where id = ilakkiya;
  update public.profiles set name = 'Amma', role = 'parent', space = 'planner', language = 'ta',
         spouse_id = appa,
         emergency = jsonb_build_object(
           'blood_group', 'B+', 'allergies', '', 'doctor_name', 'Doctor', 'doctor_phone', '',
           'contacts', jsonb_build_array(jsonb_build_object('name', 'Ilakkiya', 'phone', '+910000000000')))
    where id = amma;
  update public.profiles set name = 'Appa', role = 'parent', space = 'reading', language = 'ta',
         spouse_id = amma,
         emergency = jsonb_build_object(
           'blood_group', 'O+', 'allergies', '', 'doctor_name', 'Doctor', 'doctor_phone', '',
           'contacts', jsonb_build_array(jsonb_build_object('name', 'Ilakkiya', 'phone', '+910000000000')))
    where id = appa;

  -- Ilakkiya can see and manage both parents
  insert into public.family_links (user_id, admin_id, relation) values
    (amma, ilakkiya, 'mother'), (appa, ilakkiya, 'father')
  on conflict (user_id, admin_id) do nothing;

  -- Two medicines each (edit to match the real prescriptions)
  if not exists (select 1 from public.medicines where user_id in (amma, appa)) then
    insert into public.medicines (user_id, name, dose, times, with_food, stock_count, proof_mode) values
      (amma, 'Amlodipine 5mg (BP)', '1 tablet', '{08:00}', 'after', 30, 'photo_required'),
      (amma, 'Metformin 500mg',     '1 tablet', '{20:00}', 'after', 30, 'photo_required'),
      (appa, 'Telmisartan 40mg (BP)', '1 tablet', '{07:30}', 'before', 30, 'photo_required'),
      (appa, 'Vitamin D3',            '1 capsule', '{13:00}', 'any', 15, 'tap_to_confirm');
  end if;

  -- BP / sugar ranges (set these from the doctor's advice)
  insert into public.vital_ranges (user_id, type, min, max) values
    (amma, 'bp', '{"sys":90,"dia":60}', '{"sys":140,"dia":90}'),
    (amma, 'sugar_fasting', '{"value":70}', '{"value":130}'),
    (amma, 'sugar_pp', '{"value":70}', '{"value":180}'),
    (appa, 'bp', '{"sys":90,"dia":60}', '{"sys":140,"dia":90}'),
    (appa, 'sugar_fasting', '{"value":70}', '{"value":130}'),
    (appa, 'sugar_pp', '{"value":70}', '{"value":180}')
  on conflict (user_id, type) do nothing;

  -- Five habits each
  if not exists (select 1 from public.habits where user_id in (amma, appa)) then
    insert into public.habits (user_id, title, icon, priority) values
      (amma, '{"en":"Morning walk","ta":"காலை நடை"}', 'walk', 1),
      (amma, '{"en":"Prayer / yoga","ta":"பிரார்த்தனை / யோகா"}', 'flower', 3),
      (amma, '{"en":"8 glasses of water","ta":"8 டம்ளர் தண்ணீர்"}', 'water', 2),
      (amma, '{"en":"Meals on time","ta":"நேரத்துக்குச் சாப்பாடு"}', 'restaurant', 4),
      (amma, '{"en":"10 min rest","ta":"10 நிமிடம் ஓய்வு"}', 'bed', 5),
      (appa, '{"en":"Evening walk","ta":"மாலை நடை"}', 'walk', 1),
      (appa, '{"en":"Prayer","ta":"பிரார்த்தனை"}', 'flower', 3),
      (appa, '{"en":"8 glasses of water","ta":"8 டம்ளர் தண்ணீர்"}', 'water', 2),
      (appa, '{"en":"15 min sunlight","ta":"15 நிமிடம் வெயில்"}', 'sunny', 4),
      (appa, '{"en":"Read 20 pages","ta":"20 பக்கம் வாசிப்பு"}', 'book', 5);
  end if;

  -- Example payment reminders (edit amounts and dates, or delete in the app)
  if not exists (select 1 from public.payments where user_id in (amma, appa)) then
    insert into public.payments (user_id, created_by, category, title, amount, pay_to, due_date, anchor_day, repeat, remind_days_before, method) values
      (amma, ilakkiya, 'rent',    'House rent',             12000, 'House owner', date_trunc('month', current_date + interval '1 month')::date + 4, 5, 'monthly', 3, 'cash'),
      (appa, ilakkiya, 'lic',     'LIC premium',             8450, 'LIC agent',   current_date + 20, extract(day from current_date + 20)::int, 'half_yearly', 7, 'cash'),
      (appa, ilakkiya, 'medical', 'Pharmacy monthly bill',   2300, 'Medical shop', current_date + 6, extract(day from current_date + 6)::int, 'monthly', 3, 'cash');
  end if;
end $$;
