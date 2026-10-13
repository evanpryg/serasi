-- =============================================================================
-- Serasi: tabungan bersama.
-- Setiap anggota mencatat setoran tabungan nikahnya sendiri (tanggal, nominal, catatan).
--  * Kedua anggota bisa membaca semua setoran di workspace-nya.
--  * Tambah/ubah/hapus hanya untuk setoran milik sendiri.
--  * weddings.available_funds (dana terkumpul) ikut bertambah/berkurang otomatis,
--    sehingga Anggaran & Dashboard langsung memakai angka terbaru.
-- =============================================================================

create table public.savings_entries (
  id          uuid primary key default gen_random_uuid(),
  wedding_id  uuid not null,
  user_id     uuid not null default auth.uid(),
  amount      bigint not null check (amount > 0 and amount <= 100000000000),
  saved_on    date not null default current_date,
  note        text check (note is null or char_length(note) <= 200),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  -- Pencatat harus anggota workspace; keluar dari workspace → setorannya ikut terhapus.
  foreign key (wedding_id, user_id) references public.wedding_members (wedding_id, user_id) on delete cascade
);
create index savings_entries_wedding_idx on public.savings_entries (wedding_id, saved_on desc);

create trigger savings_entries_updated_at before update on public.savings_entries
  for each row execute function public.set_updated_at();

-- Setoran tidak boleh dipindah ke workspace/anggota lain lewat UPDATE.
create or replace function public.prevent_savings_owner_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.wedding_id is distinct from old.wedding_id or new.user_id is distinct from old.user_id then
    raise exception 'Pemilik setoran tidak dapat diubah' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger savings_entries_prevent_owner_change
  before update on public.savings_entries
  for each row execute function public.prevent_savings_owner_change();

-- Sinkron dana terkumpul. security definer: berjalan juga saat setoran terhapus
-- karena anggota keluar (cascade), ketika pemanggil mungkin bukan lagi anggota.
create or replace function public.sync_savings_to_funds()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_delta bigint;
  v_wedding uuid;
begin
  if tg_op = 'INSERT' then
    v_delta := new.amount;
    v_wedding := new.wedding_id;
  elsif tg_op = 'DELETE' then
    v_delta := -old.amount;
    v_wedding := old.wedding_id;
  else
    v_delta := new.amount - old.amount;
    v_wedding := new.wedding_id;
  end if;

  if v_delta <> 0 then
    update public.weddings
       set available_funds = greatest(available_funds + v_delta, 0)
     where id = v_wedding;
  end if;
  return null;
end;
$$;

revoke all on function public.sync_savings_to_funds() from public, anon, authenticated;

create trigger savings_entries_sync_funds
  after insert or update of amount or delete on public.savings_entries
  for each row execute function public.sync_savings_to_funds();

alter table public.savings_entries enable row level security;

create policy "Savings: members read" on public.savings_entries
  for select to authenticated using (public.is_wedding_member(wedding_id));
create policy "Savings: insert own" on public.savings_entries
  for insert to authenticated
  with check (user_id = (select auth.uid()) and public.is_wedding_member(wedding_id));
create policy "Savings: update own" on public.savings_entries
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and public.is_wedding_member(wedding_id));
create policy "Savings: delete own" on public.savings_entries
  for delete to authenticated using (user_id = (select auth.uid()));

revoke all on public.savings_entries from anon;
