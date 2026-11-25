-- RLS smoke test. Run after supabase_stub.sql + migrations:
--   psql -v ON_ERROR_STOP=1 -f supabase_stub.sql -f ../migrations/*.sql -f rls_test.sql
-- Raises an exception (non-zero exit) on the first failed expectation.
begin;

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000a000', 'manu@example.com', '{"name":"Manu"}'),
  ('00000000-0000-0000-0000-00000000a001', 'amma@example.com', '{"name":"Amma"}'),
  ('00000000-0000-0000-0000-00000000a002', 'appa@example.com', '{"name":"Appa"}');
update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-00000000a000';
update public.profiles set spouse_id = '00000000-0000-0000-0000-00000000a002' where id = '00000000-0000-0000-0000-00000000a001';
insert into public.family_links (user_id, admin_id) values
  ('00000000-0000-0000-0000-00000000a001', '00000000-0000-0000-0000-00000000a000'),
  ('00000000-0000-0000-0000-00000000a002', '00000000-0000-0000-0000-00000000a000');
insert into public.medicines (user_id, name) values
  ('00000000-0000-0000-0000-00000000a001', 'Amma BP'),
  ('00000000-0000-0000-0000-00000000a002', 'Appa BP');

create function pg_temp.act_as(uid text) returns void language sql as $$
  select set_config('request.jwt.claim.sub', uid, true), set_config('request.jwt.claim.role', 'authenticated', true);
$$;
create function pg_temp.expect(cond boolean, msg text) returns void language plpgsql as $$
begin if not cond then raise exception 'RLS TEST FAILED: %', msg; end if; raise notice 'ok - %', msg; end $$;

set local role authenticated;

-- Amma sees only her own medicine
select pg_temp.act_as('00000000-0000-0000-0000-00000000a001');
select pg_temp.expect((select count(*) from public.medicines) = 1, 'Amma sees 1 medicine');
select pg_temp.expect((select name from public.medicines) = 'Amma BP', 'Amma sees her own medicine');
select pg_temp.expect((select count(*) from public.profiles) = 1, 'Amma sees only her profile');

-- Appa cannot see Amma's data until she shares with spouse
select pg_temp.act_as('00000000-0000-0000-0000-00000000a002');
select pg_temp.expect((select count(*) from public.medicines where name = 'Amma BP') = 0, 'Appa cannot see Amma (no sharing)');

-- Manu sees both
select pg_temp.act_as('00000000-0000-0000-0000-00000000a000');
select pg_temp.expect((select count(*) from public.medicines) = 2, 'Manu sees both parents');

-- Manu can add a medicine for Amma; Amma cannot add one for Appa
insert into public.medicines (user_id, name) values ('00000000-0000-0000-0000-00000000a001', 'Vitamin D');
select pg_temp.act_as('00000000-0000-0000-0000-00000000a001');
do $$ begin
  insert into public.medicines (user_id, name) values ('00000000-0000-0000-0000-00000000a002', 'hack');
  raise exception 'RLS TEST FAILED: Amma inserted for Appa';
exception when insufficient_privilege then raise notice 'ok - Amma cannot write Appa''s rows';
end $$;

-- Parents cannot set their own vital ranges; Manu can
do $$ begin
  insert into public.vital_ranges (user_id, type, min, max)
  values ('00000000-0000-0000-0000-00000000a001', 'bp', '{"sys":90}', '{"sys":140}');
  raise exception 'RLS TEST FAILED: parent set own range';
exception when insufficient_privilege then raise notice 'ok - parent cannot set vital ranges';
end $$;
select pg_temp.act_as('00000000-0000-0000-0000-00000000a000');
insert into public.vital_ranges (user_id, type, min, max)
values ('00000000-0000-0000-0000-00000000a001', 'bp', '{"sys":90,"dia":60}', '{"sys":140,"dia":90}');
select pg_temp.expect(true, 'Manu sets Amma''s BP range');

-- A parent cannot promote themselves to admin
select pg_temp.act_as('00000000-0000-0000-0000-00000000a001');
do $$ begin
  update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-00000000a001';
  raise exception 'RLS TEST FAILED: parent became admin';
exception when raise_exception then
  if sqlerrm like 'RLS TEST FAILED%' then raise; end if;
  raise notice 'ok - parent cannot change role';
end $$;

-- Spouse sharing: Amma turns it on → Appa can read (not write) her data
update public.profiles set share_with_spouse = true where id = '00000000-0000-0000-0000-00000000a001';
select pg_temp.act_as('00000000-0000-0000-0000-00000000a002');
select pg_temp.expect((select count(*) from public.medicines where user_id = '00000000-0000-0000-0000-00000000a001') = 2, 'Appa reads Amma after sharing');
update public.medicines set name = 'x' where user_id = '00000000-0000-0000-0000-00000000a001';
select pg_temp.act_as('00000000-0000-0000-0000-00000000a001');
select pg_temp.expect((select count(*) from public.medicines where name = 'x') = 0, 'spouse cannot modify');

-- Storage: Appa cannot read a proof photo in Amma's folder (sharing off again)
update public.profiles set share_with_spouse = false where id = '00000000-0000-0000-0000-00000000a001';
insert into storage.objects (bucket_id, name) values ('medicine-proofs', '00000000-0000-0000-0000-00000000a001/dose1.jpg');
select pg_temp.act_as('00000000-0000-0000-0000-00000000a002');
select pg_temp.expect((select count(*) from storage.objects) = 0, 'Appa cannot see Amma''s photos');
select pg_temp.act_as('00000000-0000-0000-0000-00000000a000');
select pg_temp.expect((select count(*) from storage.objects) = 1, 'Manu can see Amma''s photos');

rollback;
