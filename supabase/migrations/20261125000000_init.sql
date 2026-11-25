-- =============================================================================
-- Kudumbam — initial schema with Row Level Security
--
-- Access model
--   * A parent sees and edits only their own rows.
--   * Manu (admin) can read AND write every row of parents linked to him in
--     `family_links` (settings like medicines/ranges/habits, and logs entered
--     "on behalf" — those carry added_by / created_by = Manu).
--   * Parents never see each other's data, unless a parent turns on
--     `profiles.share_with_spouse` (then their spouse gets READ access).
--   * A few tables are admin-managed only: vital_ranges, family_links.
--
-- Every table has id, user_id (the parent the row belongs to), created_at,
-- updated_at. user_id references auth.users.
-- =============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Enum-like types
-- ---------------------------------------------------------------------------
create type public.user_role      as enum ('parent', 'admin');
create type public.user_space     as enum ('planner', 'reading');
create type public.location_mode  as enum ('home', 'manu_house');
create type public.dose_status    as enum ('taken_with_photo', 'taken_no_photo', 'skipped', 'missed');
create type public.proof_mode     as enum ('photo_required', 'tap_to_confirm');
create type public.reminder_style as enum ('notification', 'alarm');
create type public.vital_type     as enum ('bp', 'sugar_fasting', 'sugar_pp', 'weight', 'pulse', 'spo2');
create type public.book_status    as enum ('reading', 'finished', 'want');
create type public.note_type      as enum ('reading', 'astrology', 'student', 'general');
create type public.event_type     as enum ('semester_exam', 'mock_exam', 'paper_deadline', 'class',
                                           'hospital_shift', 'personal', 'doctor_visit');
create type public.milestone_status as enum ('todo', 'done');
create type public.paper_status   as enum ('not_started', 'drafting', 'review', 'done');
create type public.task_status    as enum ('todo', 'done', 'moved', 'cant_do');
create type public.alert_severity as enum ('info', 'warn', 'critical');

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

-- Keeps updated_at current on every UPDATE.
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- profiles (one per auth user; id = user_id = auth.users.id)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id                uuid primary key references auth.users (id) on delete cascade,
  user_id           uuid not null unique references auth.users (id) on delete cascade,
  name              text not null default '',
  role              public.user_role not null default 'parent',
  space             public.user_space,                 -- Amma = planner, Appa = reading
  language          text not null default 'ta' check (language in ('ta', 'en')),
  font_scale        text not null default 'large' check (font_scale in ('normal', 'large', 'xl')),
  location_mode     public.location_mode not null default 'home',
  phone             text,
  emergency         jsonb not null default '{}'::jsonb, -- blood_group, allergies, doctor, contacts[]
  spouse_id         uuid references auth.users (id) on delete set null,
  share_with_spouse boolean not null default false,
  quiet_start       time not null default '22:00',
  quiet_end         time not null default '06:00',
  checkin_deadline  time not null default '11:00',
  wrapup_time       time default '21:00',
  morning_plan_time time default '06:30',
  push_token        text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  check (id = user_id)
);

-- admin ↔ parent links: who can view/manage whom.
create table public.family_links (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade, -- the parent
  admin_id    uuid not null references auth.users (id) on delete cascade,
  relation    text not null default 'parent',                           -- e.g. 'mother', 'father'
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, admin_id)
);

-- Access helpers. SECURITY DEFINER so policies can consult family_links /
-- profiles without recursive RLS evaluation. search_path pinned for safety.
create or replace function public.is_admin_of(target uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.family_links fl
    where fl.user_id = target and fl.admin_id = auth.uid()
  );
$$;

create or replace function public.is_sharing_spouse(target uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = target and p.share_with_spouse and p.spouse_id = auth.uid()
  );
$$;

-- Read: self, linked admin, or spouse who was granted sharing.
create or replace function public.can_read(target uuid) returns boolean
language sql stable as $$
  select auth.uid() = target or public.is_admin_of(target) or public.is_sharing_spouse(target);
$$;

-- Write: self or linked admin.
create or replace function public.can_write(target uuid) returns boolean
language sql stable as $$
  select auth.uid() = target or public.is_admin_of(target);
$$;

-- Create a profile automatically when Manu creates an auth user.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, user_id, name)
  values (new.id, new.id, coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Health
-- ---------------------------------------------------------------------------
create table public.medicines (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  name            text not null,
  dose            text not null default '',
  times           time[] not null default '{}',        -- e.g. {08:00,20:00}
  with_food       text check (with_food in ('before', 'after', 'any')) default 'any',
  start_date      date not null default current_date,
  end_date        date,
  stock_count     integer,
  refill_alert_at integer not null default 5,          -- warn when stock ≤ N days of doses
  proof_mode      public.proof_mode not null default 'photo_required',
  image_path      text,                                -- pill/strip photo uploaded by Manu
  active          boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table public.medicine_logs (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  medicine_id     uuid not null references public.medicines (id) on delete cascade,
  scheduled_time  timestamptz not null,
  status          public.dose_status,                  -- null while still ringing/pending
  taken_at        timestamptz,
  photo_url       text,
  photo_hash      text,
  snooze_count    smallint not null default 0 check (snooze_count between 0 and 2),
  reason          text,
  retake_requested boolean not null default false,     -- Manu: "Not clear — please retake"
  added_by        uuid references auth.users (id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (medicine_id, scheduled_time)
);
-- The same proof photo can never be reused for another dose.
create unique index medicine_logs_photo_hash_uniq on public.medicine_logs (user_id, photo_hash)
  where photo_hash is not null;

create table public.vitals (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  type        public.vital_type not null,
  values      jsonb not null,                          -- bp: {sys,dia}; others: {value}
  unit        text not null default '',
  note        text,
  measured_at timestamptz not null default now(),
  added_by    uuid references auth.users (id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.vital_ranges (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  type       public.vital_type not null,
  min        jsonb not null,                           -- bp: {sys,dia}; others: {value}
  max        jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, type)
);

create table public.mood_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  date       date not null default current_date,
  mood       smallint not null check (mood between 1 and 5),
  note       text,
  audio_url  text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);

create table public.checkins (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  date       date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);

create table public.appointments (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  doctor      text not null,
  purpose     text,
  starts_at   timestamptz not null,
  notes       text,
  report_path text,
  added_by    uuid references auth.users (id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.documents (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  kind       text not null default 'report' check (kind in ('report', 'prescription', 'other')),
  title      text,
  file_path  text not null,
  doc_date   date not null default current_date,
  tags       text[] not null default '{}',
  added_by   uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Habits & reminders
-- ---------------------------------------------------------------------------
create table public.habits (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  title         jsonb not null,                        -- {"en": "...", "ta": "..."}
  icon          text,
  days_of_week  smallint[] not null default '{0,1,2,3,4,5,6}', -- 0 = Sunday
  window_start  time,
  window_end    time,
  location_mode public.location_mode,                  -- null = everywhere
  priority      smallint not null default 5,           -- busy-day mode keeps top 3
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table public.habit_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  habit_id   uuid not null references public.habits (id) on delete cascade,
  date       date not null default current_date,
  done       boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (habit_id, date)
);

create table public.reminders (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade, -- for_user
  created_by        uuid not null references auth.users (id),
  title             text not null,
  schedule          jsonb not null,                    -- {once: ts} | {rrule: "...", time: "HH:MM"}
  style             public.reminder_style not null default 'notification',
  voice_message_url text,
  active            boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table public.plan_templates (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade, -- owner (Manu)
  created_by uuid not null references auth.users (id),
  name       text not null,
  tasks      jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Amma: planner, calendar, papers
-- ---------------------------------------------------------------------------
create table public.day_plans (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  date           date not null,
  raw_transcript text,
  audio_url      text,
  created_by     uuid references auth.users (id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (user_id, date)
);

create table public.tasks (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  day_plan_id       uuid references public.day_plans (id) on delete cascade,
  date              date not null,
  title             text not null,
  time              time,
  category          text check (category in ('hospital', 'teaching', 'exam_prep', 'home', 'family', 'health', 'other')),
  status            public.task_status not null default 'todo',
  carried_from_date date,
  carry_count       smallint not null default 0,
  milestone_id      uuid,                              -- FK added below
  created_by        uuid references auth.users (id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table public.events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  title       text not null,
  type        public.event_type not null,
  starts_at   timestamptz not null,
  ends_at     timestamptz,
  subject     text,
  batch       text,
  created_by  uuid references auth.users (id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.milestones (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  event_id    uuid not null references public.events (id) on delete cascade,
  title       text not null,
  due_date    date not null,
  status      public.milestone_status not null default 'todo',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.tasks
  add constraint tasks_milestone_fk foreign key (milestone_id) references public.milestones (id) on delete set null;

create table public.question_papers (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users (id) on delete cascade,
  subject               text not null,
  batch                 text,
  exam_event_id         uuid references public.events (id) on delete set null,
  units                 text[] not null default '{}',
  status                public.paper_status not null default 'not_started',
  question_count_target integer not null default 0,
  question_count_done   integer not null default 0 check (question_count_done >= 0),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Appa: books, notes, grandchild routine
-- ---------------------------------------------------------------------------
create table public.books (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  title       text not null,
  author      text,
  total_pages integer check (total_pages > 0),
  cover_path  text,
  status      public.book_status not null default 'want',
  started_at  date,
  finished_at date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.reading_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  book_id    uuid not null references public.books (id) on delete cascade,
  date       date not null default current_date,
  pages_read integer not null default 0 check (pages_read >= 0),
  minutes    integer check (minutes >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  type       public.note_type not null default 'general',
  linked_id  uuid,                                     -- book id, student batch id, ...
  text       text,
  audio_url  text,
  tags       text[] not null default '{}',
  is_quote   boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index notes_search_idx on public.notes using gin (to_tsvector('simple', coalesce(text, '')));
create index notes_tags_idx on public.notes using gin (tags);

create table public.kid_routine (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade, -- Appa
  title      jsonb not null,                           -- {"en","ta"}
  time       time not null,
  date       date,                                     -- null = template row; dated = that day's tick
  done       boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Alerts for Manu
-- ---------------------------------------------------------------------------
create table public.alerts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade, -- the parent concerned
  type       text not null,                            -- missed_dose, vitals_red, no_checkin, low_mood, refill, appointment, cant_take_photo, snooze, cant_do_task
  severity   public.alert_severity not null default 'warn',
  message    text not null,
  data       jsonb not null default '{}'::jsonb,
  resolved   boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Common indexes, updated_at triggers and RLS for every table
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
  -- tables a parent may write themselves (plus their linked admin)
  parent_writable text[] := array[
    'medicines', 'medicine_logs', 'vitals', 'mood_logs', 'checkins', 'appointments',
    'documents', 'habits', 'habit_logs', 'reminders', 'day_plans', 'tasks', 'events',
    'milestones', 'question_papers', 'books', 'reading_logs', 'notes', 'kid_routine'
  ];
  -- tables only the linked admin may write (parents read only)
  admin_only text[] := array['vital_ranges', 'plan_templates'];
begin
  foreach t in array parent_writable || admin_only || array['profiles', 'family_links', 'alerts'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create trigger %I before update on public.%I
                    for each row execute function public.touch_updated_at()', t || '_touch', t);
    if t <> 'profiles' then
      execute format('create index if not exists %I on public.%I (user_id)', t || '_user_idx', t);
    end if;
  end loop;

  foreach t in array parent_writable loop
    execute format('create policy %I on public.%I for select using (public.can_read(user_id))', t || '_read', t);
    execute format('create policy %I on public.%I for insert with check (public.can_write(user_id))', t || '_insert', t);
    execute format('create policy %I on public.%I for update using (public.can_write(user_id)) with check (public.can_write(user_id))', t || '_update', t);
    execute format('create policy %I on public.%I for delete using (public.can_write(user_id))', t || '_delete', t);
  end loop;

end $$;

-- vital_ranges: parent reads; only the linked admin (Manu) sets them.
create policy vital_ranges_read   on public.vital_ranges for select using (public.can_read(user_id));
create policy vital_ranges_insert on public.vital_ranges for insert with check (public.is_admin_of(user_id));
create policy vital_ranges_update on public.vital_ranges for update using (public.is_admin_of(user_id)) with check (public.is_admin_of(user_id));
create policy vital_ranges_delete on public.vital_ranges for delete using (public.is_admin_of(user_id));

-- plan_templates belong to Manu himself (user_id = Manu).
create policy plan_templates_all on public.plan_templates for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id and created_by = auth.uid());

-- profiles: read self/admin/spouse-if-shared; update self or linked admin.
create policy profiles_read   on public.profiles for select using (public.can_read(id));
create policy profiles_update on public.profiles for update using (public.can_write(id)) with check (public.can_write(id));

-- Nobody can change their own (or anyone's) role from the app; only the
-- service role / SQL editor can. Stops a parent account becoming "admin".
create or replace function public.protect_profile_role() returns trigger
language plpgsql as $$
begin
  if new.role is distinct from old.role and coalesce(auth.role(), '') <> 'service_role'
     and current_user not in ('postgres', 'supabase_admin') then
    raise exception 'role can only be changed by an administrator';
  end if;
  return new;
end $$;
create trigger profiles_protect_role before update on public.profiles
  for each row execute function public.protect_profile_role();

-- family_links: visible to both sides; created only via SQL editor / service role.
create policy family_links_read on public.family_links for select
  using (user_id = auth.uid() or admin_id = auth.uid());

-- alerts: parent's app may raise alerts about themselves (e.g. "can't take
-- photo"); Manu reads and resolves them.
create policy alerts_read   on public.alerts for select using (public.can_read(user_id));
create policy alerts_insert on public.alerts for insert with check (public.can_write(user_id));
create policy alerts_update on public.alerts for update using (public.is_admin_of(user_id)) with check (public.is_admin_of(user_id));
create policy alerts_delete on public.alerts for delete using (public.is_admin_of(user_id));

-- ---------------------------------------------------------------------------
-- Realtime: changes Manu makes reach the parent's phone instantly (and v.v.)
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table
  public.medicines, public.medicine_logs, public.reminders, public.day_plans, public.tasks,
  public.habits, public.habit_logs, public.vitals, public.mood_logs, public.checkins,
  public.alerts, public.kid_routine, public.profiles, public.milestones;

-- ---------------------------------------------------------------------------
-- Storage: private buckets. Files live under "<parent user_id>/...".
-- Only that parent and their linked admin can read/write them.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public) values
  ('medicine-proofs', 'medicine-proofs', false),  -- live photos for doses (auto-deleted after 90 days)
  ('medicine-images', 'medicine-images', false),  -- pill/strip pictures uploaded by Manu
  ('documents',       'documents',       false),  -- lab reports, prescriptions
  ('voice',           'voice',           false),  -- voice notes, day-plan audio, Manu's voice reminders
  ('family-photos',   'family-photos',   false)   -- grandchild photos for the home screen
on conflict (id) do nothing;

-- First path segment as uuid, or null if it isn't one (never throws).
create or replace function public.storage_owner(object_name text) returns uuid
language plpgsql immutable as $$
begin
  return (storage.foldername(object_name))[1]::uuid;
exception when others then
  return null;
end $$;

create policy kudumbam_storage_read on storage.objects for select
  using (bucket_id in ('medicine-proofs', 'medicine-images', 'documents', 'voice', 'family-photos')
         and public.can_read(public.storage_owner(name)));
create policy kudumbam_storage_insert on storage.objects for insert
  with check (bucket_id in ('medicine-proofs', 'medicine-images', 'documents', 'voice', 'family-photos')
              and public.can_write(public.storage_owner(name)));
create policy kudumbam_storage_update on storage.objects for update
  using (bucket_id in ('medicine-proofs', 'medicine-images', 'documents', 'voice', 'family-photos')
         and public.can_write(public.storage_owner(name)));
create policy kudumbam_storage_delete on storage.objects for delete
  using (bucket_id in ('medicine-proofs', 'medicine-images', 'documents', 'voice', 'family-photos')
         and public.can_write(public.storage_owner(name)));
