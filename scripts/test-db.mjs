// Uji migration + RLS secara lokal tanpa Docker/Supabase: Postgres (PGlite/WASM)
// dengan stub minimal skema `auth` & `storage` ala Supabase.
//   npm run test:db
// Ini pelengkap, bukan pengganti: tetap jalankan supabase/tests/rls_isolation.sql
// di proyek Supabase sungguhan sebelum rilis.
import { PGlite } from '@electric-sql/pglite'
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

const root = fileURLToPath(new URL('..', import.meta.url))

const stub = `
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;

create schema auth;
grant usage on schema auth to anon, authenticated;
create table auth.users (
  id uuid primary key, email text, raw_user_meta_data jsonb default '{}', aud text, role text
);
create function auth.uid() returns uuid language sql stable as $$
  select nullif(nullif(current_setting('request.jwt.claims', true), '')::json ->> 'sub', '')::uuid
$$;
grant execute on function auth.uid() to anon, authenticated;

create schema storage;
grant usage on schema storage to anon, authenticated;
create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text, owner uuid);
alter table storage.objects enable row level security;
grant all on storage.objects to authenticated;
create function storage.foldername(name text) returns text[] language sql immutable as $$
  select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1]
$$;
grant execute on function storage.foldername(text) to authenticated;
`


async function freshDb() {
  const db = new PGlite({ extensions: { pgcrypto } })
  await db.exec(stub)
  const dir = join(root, 'supabase', 'migrations')
  for (const f of readdirSync(dir).sort()) await db.exec(readFileSync(join(dir, f), 'utf8'))
  return db
}

const tests = {
  'uji isolasi antar-user': readFileSync(join(root, 'supabase', 'tests', 'rls_isolation.sql'), 'utf8'),
  'uji akun pasangan': readFileSync(join(root, 'supabase', 'tests', 'couple_access.sql'), 'utf8'),
  'uji tabungan bersama': readFileSync(join(root, 'supabase', 'tests', 'savings_access.sql'), 'utf8'),
}
let failed = false

async function runAll(db) {
  for (const [name, sql] of Object.entries(tests)) {
    try {
      await db.exec(sql)
    } catch (e) {
      return `${name}: ${e.message}`
    }
  }
  return null
}

// 1. Migration + semua uji harus lulus
{
  const error = await runAll(await freshDb())
  if (error) {
    failed = true
    console.error('✗ gagal →', error)
  } else console.log('✓ migration, uji isolasi, akun pasangan, dan tabungan bersama lulus')
}

// 2. Mutation test: kebocoran yang sengaja dibuat HARUS terdeteksi
const mutations = {
  'SELECT kategori terbuka untuk semua': `drop policy "Workspace member: select" on public.budget_categories;
     create policy leak on public.budget_categories for select to authenticated using (true);`,
  'FK komposit dihapus (transaksi lintas workspace)': `alter table public.expenses drop constraint expenses_category_fk;
     alter table public.expenses add foreign key (category_id) references public.budget_categories (id);`,
  'upload storage ke folder mana saja': `drop policy "Members can upload wedding files" on storage.objects;
     create policy leak on storage.objects for insert to authenticated with check (true);`,
  'INSERT tugas ke workspace lain': `drop policy "Workspace member: insert" on public.tasks;
     create policy leak on public.tasks for insert to authenticated with check (true);`,
  'owner_id bisa dipindah': `drop trigger weddings_prevent_owner_change on public.weddings;`,
  'hasil tes pasangan terlihat sebelum mengerjakan': `drop policy "Personality: read own or partner after finishing" on public.personality_results;
     create policy leak on public.personality_results for select to authenticated using (public.is_wedding_member(wedding_id));`,
  'jawaban deep talk terlihat sebelum menjawab': `drop policy "Deeptalk: read own or partner after answering" on public.deeptalk_answers;
     create policy leak on public.deeptalk_answers for select to authenticated using (public.is_wedding_member(wedding_id));`,
  'setoran pasangan bisa diubah': `drop policy "Savings: update own" on public.savings_entries;
     create policy leak on public.savings_entries for update to authenticated
       using (public.is_wedding_member(wedding_id)) with check (public.is_wedding_member(wedding_id));`,
  'tabungan terbaca workspace lain': `drop policy "Savings: members read" on public.savings_entries;
     create policy leak on public.savings_entries for select to authenticated using (true);`,
  'dana tidak ikut setoran': `drop trigger savings_entries_sync_funds on public.savings_entries;`,
  'profil semua user terbuka': `drop policy "Partner profile: select" on public.profiles;
     create policy leak on public.profiles for select to authenticated using (true);`,
}
for (const [name, sql] of Object.entries(mutations)) {
  const db = await freshDb()
  await db.exec(sql)
  if (await runAll(db)) console.log(`✓ kebocoran terdeteksi: ${name}`)
  else {
    failed = true
    console.error(`✗ kebocoran TIDAK terdeteksi: ${name}`)
  }
}

process.exit(failed ? 1 : 0)
