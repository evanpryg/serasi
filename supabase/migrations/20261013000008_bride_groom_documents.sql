-- =============================================================================
-- Serasi: satu akun berdua = calon pengantin pria (CPP) + calon pengantin wanita (CPW).
--  * wedding_members.side: 'cpp' | 'cpw'. Maksimal satu CPP dan satu CPW per workspace.
--    Tema aplikasi mengikuti side user yang login (CPP biru, CPW pink).
--  * set_my_side(): user memilih perannya; pasangan otomatis mendapat peran sebaliknya.
--  * Anggota yang bergabung belakangan otomatis mendapat peran yang tersisa.
--  * wedding_documents: centang berkas persyaratan nikah KUA (PMA No. 30 Tahun 2024)
--    per CPP / CPW / bersama. Kedua anggota boleh membaca & mencentang.
-- =============================================================================

alter table public.wedding_members
  add column side text check (side in ('cpp', 'cpw'));

create unique index wedding_members_one_side
  on public.wedding_members (wedding_id, side) where side is not null;

-- Anggota baru (mis. pasangan yang menerima undangan) mendapat peran yang belum dipakai.
create or replace function public.wedding_members_default_side()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.side is null then
    select case m.side when 'cpp' then 'cpw' else 'cpp' end
      into new.side
      from public.wedding_members m
     where m.wedding_id = new.wedding_id and m.side is not null
     limit 1;
  end if;
  return new;
end;
$$;

revoke all on function public.wedding_members_default_side() from public, anon, authenticated;

create trigger wedding_members_default_side
  before insert on public.wedding_members
  for each row execute function public.wedding_members_default_side();

-- Pilih peran sendiri. Pasangan (jika sudah bergabung) otomatis mendapat peran sebaliknya,
-- sehingga satu workspace selalu berisi satu CPP dan satu CPW.
create or replace function public.set_my_side(p_side text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_wedding uuid;
begin
  if v_uid is null then
    raise exception 'Harus login' using errcode = '42501';
  end if;
  if p_side is null or p_side not in ('cpp', 'cpw') then
    raise exception 'Peran tidak valid' using errcode = '22023';
  end if;

  select wedding_id into v_wedding from public.wedding_members where user_id = v_uid;
  if v_wedding is null then
    raise exception 'Belum tergabung di workspace' using errcode = 'P0002';
  end if;

  -- Kosongkan dulu agar unique index tidak bentrok saat peran bertukar.
  update public.wedding_members set side = null where wedding_id = v_wedding;
  update public.wedding_members set side = p_side where wedding_id = v_wedding and user_id = v_uid;
  update public.wedding_members
     set side = case p_side when 'cpp' then 'cpw' else 'cpp' end
   where wedding_id = v_wedding and user_id <> v_uid;
end;
$$;

revoke all on function public.set_my_side(text) from public, anon;
grant execute on function public.set_my_side(text) to authenticated;

-- -----------------------------------------------------------------------------
-- Berkas persyaratan nikah
-- Daftar dokumen ada di kode (src/lib/kuaDocuments.ts); tabel ini hanya menyimpan
-- status per dokumen per orang:
--   todo = berlaku tapi belum siap (dipakai dokumen kondisional yang ditandai berlaku)
--   done = sudah siap, na = tidak berlaku
-- Tidak ada baris = belum siap (dokumen wajib) / tidak berlaku (dokumen kondisional).
-- -----------------------------------------------------------------------------
create table public.wedding_documents (
  wedding_id  uuid not null references public.weddings (id) on delete cascade,
  doc_key     text not null check (doc_key ~ '^[a-z0-9_]{1,60}$'),
  side        text not null check (side in ('cpp', 'cpw', 'joint')),
  status      text not null check (status in ('todo', 'done', 'na')),
  note        text check (note is null or char_length(note) <= 500),
  updated_by  uuid default auth.uid() references auth.users (id) on delete set null,
  updated_at  timestamptz not null default now(),
  primary key (wedding_id, doc_key, side)
);

create trigger wedding_documents_updated_at before update on public.wedding_documents
  for each row execute function public.set_updated_at();

alter table public.wedding_documents enable row level security;

create policy "Documents: members read" on public.wedding_documents
  for select to authenticated using (public.is_wedding_member(wedding_id));
create policy "Documents: members insert" on public.wedding_documents
  for insert to authenticated with check (public.is_wedding_member(wedding_id));
create policy "Documents: members update" on public.wedding_documents
  for update to authenticated
  using (public.is_wedding_member(wedding_id))
  with check (public.is_wedding_member(wedding_id));
create policy "Documents: members delete" on public.wedding_documents
  for delete to authenticated using (public.is_wedding_member(wedding_id));

revoke all on public.wedding_documents from anon;
