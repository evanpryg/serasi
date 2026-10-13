-- =============================================================================
-- Serasi: akun pasangan (2 anggota per workspace), undangan pasangan, foto sampul,
-- tes kepribadian, dan deep talk.
--
-- Perubahan model akses: dari "pemilik" menjadi "anggota workspace".
--  * wedding_members: maksimal 1 owner + 1 partner per workspace (dijaga unique index),
--    dan satu akun hanya bisa tergabung di satu workspace.
--  * Semua kebijakan tabel anak diganti dari is_wedding_owner → is_wedding_member.
--  * owner_id tidak bisa diubah oleh siapa pun lewat API (trigger).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Anggota workspace
-- -----------------------------------------------------------------------------
create table public.wedding_members (
  wedding_id  uuid not null references public.weddings (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  role        text not null check (role in ('owner', 'partner')),
  joined_at   timestamptz not null default now(),
  primary key (wedding_id, user_id),
  constraint wedding_members_one_workspace_per_user unique (user_id)
);
create unique index wedding_members_one_owner on public.wedding_members (wedding_id) where role = 'owner';
create unique index wedding_members_one_partner on public.wedding_members (wedding_id) where role = 'partner';

-- Pemilik workspace yang sudah ada menjadi anggota
insert into public.wedding_members (wedding_id, user_id, role)
select id, owner_id, 'owner' from public.weddings
on conflict do nothing;

-- Workspace baru → pembuatnya otomatis menjadi owner
create or replace function public.add_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.wedding_members (wedding_id, user_id, role) values (new.id, new.owner_id, 'owner');
  return new;
end;
$$;

create trigger weddings_add_owner_membership
  after insert on public.weddings
  for each row execute function public.add_owner_membership();

-- owner_id tidak boleh berpindah tangan lewat API
create or replace function public.prevent_owner_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.owner_id is distinct from old.owner_id then
    raise exception 'Pemilik workspace tidak dapat diubah' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger weddings_prevent_owner_change
  before update on public.weddings
  for each row execute function public.prevent_owner_change();

create or replace function public.is_wedding_member(target_wedding_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.wedding_members m
    where m.wedding_id = target_wedding_id
      and m.user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_wedding_member(uuid) from public, anon;
grant execute on function public.is_wedding_member(uuid) to authenticated;

/** true jika user pemanggil dan `other_user` berada di workspace yang sama. */
create or replace function public.shares_wedding_with(other_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.wedding_members mine
    join public.wedding_members theirs on theirs.wedding_id = mine.wedding_id
    where mine.user_id = (select auth.uid()) and theirs.user_id = other_user
  );
$$;

revoke all on function public.shares_wedding_with(uuid) from public, anon;
grant execute on function public.shares_wedding_with(uuid) to authenticated;

alter table public.wedding_members enable row level security;

create policy "Members can read members" on public.wedding_members
  for select to authenticated using (public.is_wedding_member(wedding_id));
-- INSERT hanya lewat trigger/fungsi server. DELETE: owner mengeluarkan partner, atau partner keluar.
create policy "Owner removes partner or partner leaves" on public.wedding_members
  for delete to authenticated
  using (role = 'partner' and (public.is_wedding_owner(wedding_id) or user_id = (select auth.uid())));

-- Pasangan dapat melihat nama/foto profil satu sama lain
create policy "Partner profile: select" on public.profiles
  for select to authenticated using (public.shares_wedding_with(id));

-- -----------------------------------------------------------------------------
-- weddings: akses anggota (hapus tetap hanya owner)
-- -----------------------------------------------------------------------------
drop policy "Owner can read wedding" on public.weddings;
drop policy "Owner can update wedding" on public.weddings;

-- owner_id = auth.uid() diperlukan untuk INSERT ... RETURNING: kebijakan SELECT dicek
-- sebelum trigger AFTER INSERT menambahkan owner sebagai anggota.
create policy "Members can read wedding" on public.weddings
  for select to authenticated using (owner_id = (select auth.uid()) or public.is_wedding_member(id));
create policy "Members can update wedding" on public.weddings
  for update to authenticated
  using (public.is_wedding_member(id)) with check (public.is_wedding_member(id));

alter table public.weddings
  add column cover_photo_path text
  constraint weddings_cover_in_own_folder check (cover_photo_path is null or cover_photo_path like id::text || '/%');

-- -----------------------------------------------------------------------------
-- Tabel anak: ganti kebijakan owner → member
-- -----------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'budget_categories','wedding_vendors','expenses','payments','tasks','guests','rundown_items'
  ] loop
    execute format('drop policy "Workspace owner: select" on public.%I', t);
    execute format('drop policy "Workspace owner: insert" on public.%I', t);
    execute format('drop policy "Workspace owner: update" on public.%I', t);
    execute format('drop policy "Workspace owner: delete" on public.%I', t);
    execute format(
      'create policy "Workspace member: select" on public.%I for select to authenticated
         using (public.is_wedding_member(wedding_id))', t);
    execute format(
      'create policy "Workspace member: insert" on public.%I for insert to authenticated
         with check (public.is_wedding_member(wedding_id))', t);
    execute format(
      'create policy "Workspace member: update" on public.%I for update to authenticated
         using (public.is_wedding_member(wedding_id))
         with check (public.is_wedding_member(wedding_id))', t);
    execute format(
      'create policy "Workspace member: delete" on public.%I for delete to authenticated
         using (public.is_wedding_member(wedding_id))', t);
  end loop;
end;
$$;

-- -----------------------------------------------------------------------------
-- Storage: akses anggota ke folder <wedding_id>/
-- -----------------------------------------------------------------------------
drop policy "Owner can read wedding files" on storage.objects;
drop policy "Owner can upload wedding files" on storage.objects;
drop policy "Owner can update wedding files" on storage.objects;
drop policy "Owner can delete wedding files" on storage.objects;

create policy "Members can read wedding files" on storage.objects
  for select to authenticated
  using (bucket_id = 'wedding-files' and exists (
    select 1 from public.wedding_members m
    where m.wedding_id::text = (storage.foldername(name))[1] and m.user_id = (select auth.uid())));

create policy "Members can upload wedding files" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'wedding-files' and exists (
    select 1 from public.wedding_members m
    where m.wedding_id::text = (storage.foldername(name))[1] and m.user_id = (select auth.uid())));

create policy "Members can update wedding files" on storage.objects
  for update to authenticated
  using (bucket_id = 'wedding-files' and exists (
    select 1 from public.wedding_members m
    where m.wedding_id::text = (storage.foldername(name))[1] and m.user_id = (select auth.uid())))
  with check (bucket_id = 'wedding-files' and exists (
    select 1 from public.wedding_members m
    where m.wedding_id::text = (storage.foldername(name))[1] and m.user_id = (select auth.uid())));

create policy "Members can delete wedding files" on storage.objects
  for delete to authenticated
  using (bucket_id = 'wedding-files' and exists (
    select 1 from public.wedding_members m
    where m.wedding_id::text = (storage.foldername(name))[1] and m.user_id = (select auth.uid())));

-- -----------------------------------------------------------------------------
-- Undangan pasangan
-- -----------------------------------------------------------------------------
create table public.wedding_invites (
  id           uuid primary key default gen_random_uuid(),
  wedding_id   uuid not null references public.weddings (id) on delete cascade,
  code         text not null unique check (code ~ '^[A-HJ-NP-Z2-9]{8}$'),
  created_by   uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at   timestamptz not null default now(),
  expires_at   timestamptz not null default now() + interval '14 days',
  accepted_by  uuid references auth.users (id) on delete set null,
  accepted_at  timestamptz,
  revoked_at   timestamptz
);
create index wedding_invites_wedding_idx on public.wedding_invites (wedding_id, created_at desc);

alter table public.wedding_invites enable row level security;

create policy "Members read invites" on public.wedding_invites
  for select to authenticated using (public.is_wedding_member(wedding_id));
create policy "Members revoke invites" on public.wedding_invites
  for update to authenticated
  using (public.is_wedding_member(wedding_id)) with check (public.is_wedding_member(wedding_id));
-- INSERT hanya lewat create_wedding_invite() agar kode dibuat acak di server.

/** Buat kode undangan baru (kode lama yang belum dipakai dicabut). */
create or replace function public.create_wedding_invite()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_wedding uuid;
  v_alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- tanpa 0/O/1/I
  v_bytes bytea;
  v_code text;
  v_i integer;
begin
  select wedding_id into v_wedding from public.wedding_members where user_id = v_uid;
  if v_wedding is null then
    raise exception 'Kamu belum memiliki workspace' using errcode = 'P0002';
  end if;
  if exists (select 1 from public.wedding_members where wedding_id = v_wedding and role = 'partner') then
    raise exception 'Pasanganmu sudah bergabung' using errcode = '23505';
  end if;

  update public.wedding_invites set revoked_at = now()
   where wedding_id = v_wedding and accepted_at is null and revoked_at is null;

  loop
    -- gen_random_uuid() (inti Postgres, CSPRNG) sebagai sumber byte acak; hanya byte
    -- yang sepenuhnya acak dipakai (byte 6 & 8 berisi bit versi/varian UUID).
    v_bytes := decode(replace(gen_random_uuid()::text, '-', ''), 'hex');
    v_code := '';
    foreach v_i in array array[0, 1, 2, 3, 4, 5, 10, 11] loop
      v_code := v_code || substr(v_alphabet, (get_byte(v_bytes, v_i) % 32) + 1, 1);
    end loop;
    exit when not exists (select 1 from public.wedding_invites where code = v_code);
  end loop;

  insert into public.wedding_invites (wedding_id, code, created_by) values (v_wedding, v_code, v_uid);
  return v_code;
end;
$$;

/** Info undangan sebelum diterima (hanya untuk user yang sudah login). */
create or replace function public.get_invite_preview(p_code text)
returns table (wedding_title text, wedding_date date, inviter_name text)
language sql
stable
security definer
set search_path = ''
as $$
  select w.title, w.wedding_date, p.full_name
  from public.wedding_invites i
  join public.weddings w on w.id = i.wedding_id
  left join public.profiles p on p.id = i.created_by
  where i.code = upper(trim(p_code))
    and i.accepted_at is null and i.revoked_at is null and i.expires_at > now()
    and (select auth.uid()) is not null;
$$;

/** Terima undangan: user menjadi partner di workspace pasangannya. */
create or replace function public.accept_wedding_invite(p_code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_invite public.wedding_invites%rowtype;
begin
  if v_uid is null then
    raise exception 'Harus login' using errcode = '42501';
  end if;

  select * into v_invite from public.wedding_invites
   where code = upper(trim(p_code))
     and accepted_at is null and revoked_at is null and expires_at > now()
   for update;
  if not found then
    raise exception 'Kode undangan tidak valid atau sudah kedaluwarsa' using errcode = 'P0002';
  end if;
  if exists (select 1 from public.wedding_members where user_id = v_uid) then
    raise exception 'Akun ini sudah tergabung di workspace lain' using errcode = '23505';
  end if;
  if exists (select 1 from public.wedding_members where wedding_id = v_invite.wedding_id and role = 'partner') then
    raise exception 'Workspace ini sudah memiliki dua anggota' using errcode = '23505';
  end if;

  insert into public.wedding_members (wedding_id, user_id, role) values (v_invite.wedding_id, v_uid, 'partner');
  update public.wedding_invites set accepted_by = v_uid, accepted_at = now() where id = v_invite.id;
  return v_invite.wedding_id;
end;
$$;

revoke all on function public.create_wedding_invite() from public, anon;
revoke all on function public.get_invite_preview(text) from public, anon;
revoke all on function public.accept_wedding_invite(text) from public, anon;
grant execute on function public.create_wedding_invite() to authenticated;
grant execute on function public.get_invite_preview(text) to authenticated;
grant execute on function public.accept_wedding_invite(text) to authenticated;

-- -----------------------------------------------------------------------------
-- Tes kepribadian
-- Hasil pasangan baru terlihat setelah kamu sendiri menyelesaikan tes,
-- agar jawaban tidak terpengaruh hasil pasangan.
-- -----------------------------------------------------------------------------
create table public.personality_results (
  wedding_id    uuid not null,
  user_id       uuid not null default auth.uid(),
  type_code     text not null check (type_code ~ '^[EI][SN][TF][JP]$'),
  scores        jsonb not null,
  answers       jsonb not null,
  completed_at  timestamptz not null default now(),
  primary key (wedding_id, user_id),
  foreign key (wedding_id, user_id) references public.wedding_members (wedding_id, user_id) on delete cascade
);

create or replace function public.has_personality_result(target_wedding_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.personality_results r
    where r.wedding_id = target_wedding_id and r.user_id = (select auth.uid())
  );
$$;

alter table public.personality_results enable row level security;

create policy "Personality: read own or partner after finishing" on public.personality_results
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or (public.is_wedding_member(wedding_id) and public.has_personality_result(wedding_id))
  );
create policy "Personality: insert own" on public.personality_results
  for insert to authenticated
  with check (user_id = (select auth.uid()) and public.is_wedding_member(wedding_id));
create policy "Personality: update own" on public.personality_results
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and public.is_wedding_member(wedding_id));
create policy "Personality: delete own" on public.personality_results
  for delete to authenticated using (user_id = (select auth.uid()));

-- -----------------------------------------------------------------------------
-- Deep talk
-- Jawaban pasangan untuk sebuah pertanyaan terbuka setelah kamu menjawab
-- pertanyaan yang sama.
-- -----------------------------------------------------------------------------
create table public.deeptalk_answers (
  wedding_id   uuid not null,
  user_id      uuid not null default auth.uid(),
  question_id  text not null check (question_id ~ '^[a-z0-9_]{2,40}$'),
  answer       text not null check (char_length(trim(answer)) between 1 and 2000),
  alignment    text check (alignment in ('sejalan', 'perlu_dibahas', 'berbeda')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  primary key (wedding_id, user_id, question_id),
  foreign key (wedding_id, user_id) references public.wedding_members (wedding_id, user_id) on delete cascade
);

create trigger deeptalk_answers_updated_at before update on public.deeptalk_answers
  for each row execute function public.set_updated_at();

create or replace function public.has_answered_deeptalk(target_wedding_id uuid, target_question text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.deeptalk_answers a
    where a.wedding_id = target_wedding_id and a.question_id = target_question
      and a.user_id = (select auth.uid())
  );
$$;

alter table public.deeptalk_answers enable row level security;

create policy "Deeptalk: read own or partner after answering" on public.deeptalk_answers
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or (public.is_wedding_member(wedding_id) and public.has_answered_deeptalk(wedding_id, question_id))
  );
create policy "Deeptalk: insert own" on public.deeptalk_answers
  for insert to authenticated
  with check (user_id = (select auth.uid()) and public.is_wedding_member(wedding_id));
create policy "Deeptalk: update own" on public.deeptalk_answers
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and public.is_wedding_member(wedding_id));
create policy "Deeptalk: delete own" on public.deeptalk_answers
  for delete to authenticated using (user_id = (select auth.uid()));

revoke all on function public.has_personality_result(uuid) from public, anon;
revoke all on function public.has_answered_deeptalk(uuid, text) from public, anon;
grant execute on function public.has_personality_result(uuid) to authenticated;
grant execute on function public.has_answered_deeptalk(uuid, text) to authenticated;

revoke all on public.wedding_members, public.wedding_invites, public.personality_results, public.deeptalk_answers from anon;

-- -----------------------------------------------------------------------------
-- Progres tanpa membuka isi: siapa yang sudah menyelesaikan tes / menjawab
-- pertanyaan, agar bisa memberi ajakan "pasanganmu sudah menjawab".
-- -----------------------------------------------------------------------------
create or replace function public.personality_progress(p_wedding_id uuid)
returns table (user_id uuid, completed_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select r.user_id, r.completed_at
  from public.personality_results r
  where r.wedding_id = p_wedding_id and public.is_wedding_member(p_wedding_id);
$$;

create or replace function public.deeptalk_progress(p_wedding_id uuid)
returns table (user_id uuid, question_id text)
language sql
stable
security definer
set search_path = ''
as $$
  select a.user_id, a.question_id
  from public.deeptalk_answers a
  where a.wedding_id = p_wedding_id and public.is_wedding_member(p_wedding_id);
$$;

revoke all on function public.personality_progress(uuid) from public, anon;
revoke all on function public.deeptalk_progress(uuid) from public, anon;
grant execute on function public.personality_progress(uuid) to authenticated;
grant execute on function public.deeptalk_progress(uuid) to authenticated;
