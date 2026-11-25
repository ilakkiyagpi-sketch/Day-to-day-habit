#!/usr/bin/env bash
# Applies the migrations + seed to a throwaway local Postgres database and runs
# the RLS smoke tests. Usage: supabase/tests/run.sh   (needs psql + a local server)
set -euo pipefail
cd "$(dirname "$0")/.."
DB=${DB:-kudumbam_test}
dropdb --if-exists "$DB" && createdb "$DB"
psql -qtA -v ON_ERROR_STOP=1 -d "$DB" -f tests/supabase_stub.sql
for f in migrations/*.sql; do psql -qtA -v ON_ERROR_STOP=1 -d "$DB" -f "$f"; done
out=$(psql -qtA -v ON_ERROR_STOP=1 -d "$DB" -f tests/rls_test.sql 2>&1) || { echo "$out"; echo "RLS TESTS FAILED"; exit 1; }
echo "$out" | grep -E 'ok -'
# Seed check: create the three users, then run seed.sql
psql -qtA -v ON_ERROR_STOP=1 -d "$DB" -c "insert into auth.users (id,email) values
  (gen_random_uuid(),'manu@example.com'),(gen_random_uuid(),'amma@example.com'),(gen_random_uuid(),'appa@example.com')"
psql -qtA -v ON_ERROR_STOP=1 -d "$DB" -f seed.sql
psql -qtA -v ON_ERROR_STOP=1 -d "$DB" -f seed.sql   # idempotent
echo "seed ok: $(psql -qtA -d "$DB" -c 'select count(*) from public.medicines') medicines, $(psql -qtA -d "$DB" -c 'select count(*) from public.habits') habits"
