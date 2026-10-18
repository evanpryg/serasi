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
  'uji rincian anggaran': readFileSync(join(root, 'supabase', 'tests', 'budget_items.sql'), 'utf8'),
  'uji peran CPP/CPW & berkas': readFileSync(join(root, 'supabase', 'tests', 'couple_sides.sql'), 'utf8'),
  'uji Premium & pembayaran': readFileSync(join(root, 'supabase', 'tests', 'premium_access.sql'), 'utf8'),
  'uji pihak tamu': readFileSync(join(root, 'supabase', 'tests', 'guest_sides.sql'), 'utf8'),
  'uji acara anggaran': readFileSync(join(root, 'supabase', 'tests', 'budget_events.sql'), 'utf8'),
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
  } else console.log('✓ migration, uji isolasi, akun pasangan, tabungan bersama, rincian anggaran, peran CPP/CPW + berkas, Premium + pembayaran, pihak tamu, dan acara anggaran lulus')
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
  'hapus pos lewati RLS (SECURITY DEFINER)': `alter function public.delete_budget_category(uuid) security definer;`,
  'link item tanpa validasi': `alter table public.expenses drop constraint expenses_link_url_check;`,
  'berkas terbaca workspace lain': `drop policy "Documents: members read" on public.wedding_documents;
     create policy leak on public.wedding_documents for select to authenticated using (true);`,
  'pasangan tidak mendapat peran sisa': `drop trigger wedding_members_default_side on public.wedding_members;`,
  'profil semua user terbuka': `drop policy "Partner profile: select" on public.profiles;
     create policy leak on public.profiles for select to authenticated using (true);`,
  'Premium bisa ditulis sendiri': `grant insert on public.wedding_entitlements to authenticated;
     create policy leak on public.wedding_entitlements for insert to authenticated with check (true);`,
  'status pesanan bisa diubah sendiri': `grant update on public.payment_orders to authenticated;
     create policy leak on public.payment_orders for update to authenticated using (true) with check (true);`,
  'pesanan terbaca workspace lain': `drop policy "Orders: members read" on public.payment_orders;
     create policy leak on public.payment_orders for select to authenticated using (true);`,
  'cek admin dilewati': `create or replace function public.is_app_admin() returns boolean language sql stable as $$ select true $$;`,
  'batas tamu Gratis dihapus': `drop trigger guests_free_limit on public.guests;`,
  'acara terbaca workspace lain': `drop policy "Workspace member: select" on public.budget_events;
     create policy leak on public.budget_events for select to authenticated using (true);`,
  'pos tertaut acara lintas workspace': `alter table public.budget_categories drop constraint budget_categories_event_fk;
     alter table public.budget_categories add foreign key (event_id) references public.budget_events (id) on delete set null;`,
  'hapus acara ikut menghapus pos': `alter table public.budget_categories drop constraint budget_categories_event_fk;
     alter table public.budget_categories add constraint budget_categories_event_fk foreign key (event_id, wedding_id)
       references public.budget_events (id, wedding_id) on delete cascade;`,
  'topik deep talk Premium terbuka': `drop policy "Deeptalk: premium topics" on public.deeptalk_answers;`,
  'foto item tanpa Premium': `drop policy "Item photos need premium" on storage.objects;`,
  'nominal pesanan tidak unik': `drop index public.payment_orders_open_amount;
     create or replace function public.create_payment_order(p_wedding_id uuid, p_plan_id text default 'premium')
     returns public.payment_orders language plpgsql security definer set search_path = '' as $f$
     declare v public.payment_orders;
     begin
       if not public.is_wedding_member(p_wedding_id) then raise exception 'x' using errcode = '42501'; end if;
       if public.is_wedding_premium(p_wedding_id) then raise exception 'x' using errcode = '23505'; end if;
       select * into v from public.payment_orders where wedding_id = p_wedding_id and status in ('pending','awaiting_verification');
       if found then return v; end if;
       insert into public.payment_orders (code, wedding_id, user_id, plan_id, base_amount, unique_code, amount)
       values ('SRS-AAAAA' || chr(65 + (select count(*)::int from public.payment_orders)),
               p_wedding_id, auth.uid(), p_plan_id, 99000, 1, 98999) returning * into v;
       return v;
     end $f$;`,
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
