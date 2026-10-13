-- =============================================================================
-- Uji peran CPP/CPW dan berkas persyaratan nikah.
-- Jalankan setelah semua migration. Semua data uji di-ROLLBACK.
--   A = pemilik workspace, P = pasangan, X = orang lain
-- =============================================================================
begin;

insert into auth.users (id, email, raw_user_meta_data, aud, role) values
  ('00000000-0000-4000-d000-00000000000a', 'da@test.local', '{"full_name":"Raka"}',  'authenticated', 'authenticated'),
  ('00000000-0000-4000-d000-0000000000bb', 'dp@test.local', '{"full_name":"Sari"}',  'authenticated', 'authenticated'),
  ('00000000-0000-4000-d000-0000000000cc', 'dx@test.local', '{"full_name":"Orang Lain"}', 'authenticated', 'authenticated');

set local role authenticated;

-- A membuat workspace dan memilih CPW; P bergabung belakangan; X punya workspace sendiri
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-d000-00000000000a","role":"authenticated"}', true);
select set_config('test.dw', public.create_wedding_workspace('Raka & Sari', 'Solo', array['akad_resepsi'], 0, 0)::text, true);
select public.set_my_side('cpw');
select set_config('test.dcode', public.create_wedding_invite(), true);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-d000-0000000000cc","role":"authenticated"}', true);
select set_config('test.dwx', public.create_wedding_workspace('X', 'Jakarta', array['resepsi'], 0, 0)::text, true);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-d000-0000000000bb","role":"authenticated"}', true);
select public.accept_wedding_invite(current_setting('test.dcode'));

do $$
declare
  w uuid := current_setting('test.dw')::uuid;
  wx uuid := current_setting('test.dwx')::uuid;
  s text;
  n integer;
begin
  -- 1. P otomatis mendapat peran yang tersisa (CPP)
  select side into s from public.wedding_members where wedding_id = w and user_id = '00000000-0000-4000-d000-0000000000bb';
  if s is distinct from 'cpp' then raise exception 'GAGAL: pasangan tidak otomatis CPP (%)', s; end if;

  -- 2. P mengganti perannya → A ikut bertukar, tetap satu CPP & satu CPW
  perform public.set_my_side('cpw');
  select side into s from public.wedding_members where wedding_id = w and user_id = '00000000-0000-4000-d000-00000000000a';
  if s is distinct from 'cpp' then raise exception 'GAGAL: peran A tidak bertukar (%)', s; end if;

  -- 3. Peran tidak valid ditolak
  begin
    perform public.set_my_side('admin');
    raise exception 'GAGAL: peran tidak valid diterima';
  exception when invalid_parameter_value then null;
  end;

  -- 4. Peran tidak bisa diubah langsung lewat tabel
  update public.wedding_members set side = 'cpp' where wedding_id = w;
  select count(*) into n from public.wedding_members where wedding_id = w and side = 'cpp';
  if n <> 1 then raise exception 'GAGAL: side diubah langsung lewat UPDATE'; end if;

  -- 5. P bisa mencentang berkas; A (anggota lain) ikut melihat di blok berikut
  insert into public.wedding_documents (wedding_id, doc_key, side, status) values (w, 'ktp', 'cpw', 'done');

  -- 6. P tidak bisa menulis berkas ke workspace X
  begin
    insert into public.wedding_documents (wedding_id, doc_key, side, status) values (wx, 'ktp', 'cpp', 'done');
    raise exception 'GAGAL: berkas ditulis ke workspace lain';
  exception when insufficient_privilege then null;
  end;

  -- 7. Kunci dokumen & status divalidasi
  begin
    insert into public.wedding_documents (wedding_id, doc_key, side, status) values (w, 'KTP; drop', 'cpp', 'done');
    raise exception 'GAGAL: doc_key tidak valid diterima';
  exception when check_violation then null;
  end;
end;
$$;

-- Sudut pandang A: melihat dan mengubah centang P
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-d000-00000000000a","role":"authenticated"}', true);
do $$
declare
  w uuid := current_setting('test.dw')::uuid;
  n integer;
begin
  select count(*) into n from public.wedding_documents where wedding_id = w;
  if n <> 1 then raise exception 'GAGAL: A tidak melihat berkas yang dicentang P'; end if;
  delete from public.wedding_documents where wedding_id = w and doc_key = 'ktp';
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'GAGAL: A tidak bisa membatalkan centang berkas'; end if;
  insert into public.wedding_documents (wedding_id, doc_key, side, status) values (w, 'akta_kelahiran', 'joint', 'na');
end;
$$;

-- Sudut pandang X: tidak melihat apa pun dari workspace A
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-d000-0000000000cc","role":"authenticated"}', true);
do $$
declare
  w uuid := current_setting('test.dw')::uuid;
  n integer;
begin
  insert into public.wedding_documents (wedding_id, doc_key, side, status)
    select current_setting('test.dwx')::uuid, 'ktp', 'cpp', 'done';
  select count(*) into n from public.wedding_documents where wedding_id = w;
  if n <> 0 then raise exception 'GAGAL: X melihat berkas workspace A'; end if;
  select count(*) into n from public.wedding_members where wedding_id = w;
  if n <> 0 then raise exception 'GAGAL: X melihat anggota workspace A'; end if;
end;
$$;

do $$ begin raise notice 'SEMUA UJI PERAN CPP/CPW & BERKAS LULUS'; end $$;

rollback;
