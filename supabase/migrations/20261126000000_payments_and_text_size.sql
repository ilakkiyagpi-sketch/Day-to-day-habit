-- =============================================================================
-- Payment reminders (rent, medical, LIC / insurance, other) + "small" text size
-- =============================================================================

-- Text size: add "small" and make "normal" the default.
alter table public.profiles drop constraint if exists profiles_font_scale_check;
alter table public.profiles
  add constraint profiles_font_scale_check check (font_scale in ('small', 'normal', 'large', 'xl')),
  alter column font_scale set default 'normal';

create type public.payment_category as enum ('rent', 'medical', 'lic', 'other');
create type public.payment_repeat   as enum ('once', 'monthly', 'quarterly', 'half_yearly', 'yearly');
create type public.payment_method   as enum ('cash', 'online', 'cheque');

-- One row per thing to pay. due_date is always the NEXT due date; marking it
-- paid writes a payment_logs row and moves due_date forward (or sets
-- active = false for one-time payments).
create table public.payments (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users (id) on delete cascade, -- whose payment
  created_by         uuid not null references auth.users (id),
  category           public.payment_category not null default 'other',
  title              text not null,
  amount             numeric(12, 2) check (amount is null or amount >= 0),
  pay_to             text,                              -- landlord, LIC agent, pharmacy…
  due_date           date not null,
  anchor_day         smallint not null check (anchor_day between 1 and 31),
  repeat             public.payment_repeat not null default 'monthly',
  remind_days_before smallint not null default 3 check (remind_days_before between 0 and 30),
  method             public.payment_method not null default 'cash',
  note               text,
  active             boolean not null default true,
  last_paid_on       date,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table public.payment_logs (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  payment_id      uuid not null references public.payments (id) on delete cascade,
  period_due_date date not null,
  paid_on         date not null default current_date,
  amount          numeric(12, 2),
  method          public.payment_method not null default 'cash',
  recorded_by     uuid not null references auth.users (id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (payment_id, period_due_date)
);

do $$
declare t text;
begin
  foreach t in array array['payments', 'payment_logs'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create trigger %I before update on public.%I
                    for each row execute function public.touch_updated_at()', t || '_touch', t);
    execute format('create index %I on public.%I (user_id)', t || '_user_idx', t);
    execute format('create policy %I on public.%I for select using (public.can_read(user_id))', t || '_read', t);
    execute format('create policy %I on public.%I for insert with check (public.can_write(user_id))', t || '_insert', t);
    execute format('create policy %I on public.%I for update using (public.can_write(user_id)) with check (public.can_write(user_id))', t || '_update', t);
    execute format('create policy %I on public.%I for delete using (public.can_write(user_id))', t || '_delete', t);
  end loop;
end $$;

create index payments_due_idx on public.payments (due_date) where active;

alter publication supabase_realtime add table public.payments, public.payment_logs;
