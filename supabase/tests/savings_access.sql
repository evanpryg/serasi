-- =============================================================================
-- Uji tabungan bersama: akses, kepemilikan setoran, dan sinkron dana terkumpul.
-- Jalankan setelah semua migration. Semua data uji di-ROLLBACK.
--   A = pemilik workspace, P = pasangan, X = orang lain
-- =============================================================================
begin;

insert into auth.users (id, email, raw_user_meta_data, aud, role) values
  ('00000000-0000-4000-c000-00000000000a', 'sa@test.local', '{"full_name":"Rina"}',  'authenticated', 'authenticated'),
  ('00000000-0000-4000-c000-0000000000bb', 'sp@test.local', '{"full_name":"Dimas"}', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-c000-0000000000cc', 'sx@test.local', '{"full_name":"Orang Lain"}', 'authenticated', 'authenticated');

set local role authenticated;

-- A membuat workspace (dana awal 10 jt) dan undangan; P bergabung; X punya workspace sendiri
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-c000-00000000000a","role":"authenticated"}', true);
select set_config('test.sw', public.create_wedding_workspace('Rina & Dimas', 'Bandung', array['akad_resepsi'], 100000000, 10000000)::text, true);
select set_config('test.scode', public.create_wedding_invite(), true);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-c000-0000000000cc","role":"authenticated"}', true);
select set_config('test.swx', public.create_wedding_workspace('X', 'Jakarta', array['resepsi'], 0, 0)::text, true);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-c000-0000000000bb","role":"authenticated"}', true);
select public.accept_wedding_invite(current_setting('test.scode'));

-- Sudut pandang A
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-c000-00000000000a","role":"authenticated"}', true);
do $$
declare
  w uuid := current_setting('test.sw')::uuid;
  wx uuid := current_setting('test.swx')::uuid;
  funds bigint;
  n integer;
begin
  -- 1. A menabung 2 jt → dana terkumpul jadi 12 jt
  insert into public.savings_entries (wedding_id, amount, saved_on, note) values (w, 2000000, '2026-10-01', 'Gaji Oktober');
  select available_funds into funds from public.weddings where id = w;
  if funds <> 12000000 then raise exception 'GAGAL: dana tidak bertambah setelah setoran (%), ', funds; end if;

  -- 2. Ubah nominal 2 jt → 3 jt: dana ikut menyesuaikan
  update public.savings_entries set amount = 3000000 where wedding_id = w;
  select available_funds into funds from public.weddings where id = w;
  if funds <> 13000000 then raise exception 'GAGAL: dana tidak menyesuaikan perubahan nominal (%)', funds; end if;

  -- 3. Nominal harus positif
  begin
    insert into public.savings_entries (wedding_id, amount) values (w, 0);
    raise exception 'GAGAL: setoran Rp 0 diterima';
  exception when check_violation then null;
  end;

  -- 4. A tidak bisa mencatat atas nama P, atau ke workspace X
  begin
    insert into public.savings_entries (wedding_id, user_id, amount) values (w, '00000000-0000-4000-c000-0000000000bb', 1000);
    raise exception 'GAGAL: A mencatat setoran atas nama P';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.savings_entries (wedding_id, amount) values (wx, 1000);
    raise exception 'GAGAL: A mencatat setoran di workspace X';
  exception when insufficient_privilege or foreign_key_violation then null;
  end;
end;
$$;

-- Sudut pandang P
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-c000-0000000000bb","role":"authenticated"}', true);
do $$
declare
  w uuid := current_setting('test.sw')::uuid;
  funds bigint;
  n integer;
begin
  -- 5. P melihat setoran A dan bisa menabung sendiri
  select count(*) into n from public.savings_entries where wedding_id = w;
  if n <> 1 then raise exception 'GAGAL: P tidak melihat setoran A'; end if;
  insert into public.savings_entries (wedding_id, amount, note) values (w, 1500000, 'Bonus');

  -- 6. P tidak bisa mengubah atau menghapus setoran A
  update public.savings_entries set amount = 1 where wedding_id = w and user_id = '00000000-0000-4000-c000-00000000000a';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'GAGAL: P mengubah setoran A'; end if;
  delete from public.savings_entries where wedding_id = w and user_id = '00000000-0000-4000-c000-00000000000a';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'GAGAL: P menghapus setoran A'; end if;

  -- 7. Setoran tidak bisa dipindah ke anggota lain
  begin
    update public.savings_entries set user_id = '00000000-0000-4000-c000-00000000000a' where wedding_id = w and user_id = auth.uid();
    raise exception 'GAGAL: pemilik setoran berpindah';
  exception when insufficient_privilege then null;
  end;

  select available_funds into funds from public.weddings where id = w;
  if funds <> 14500000 then raise exception 'GAGAL: dana bersama salah (%)', funds; end if;
end;
$$;

-- Sudut pandang X
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-c000-0000000000cc","role":"authenticated"}', true);
do $$
declare
  w uuid := current_setting('test.sw')::uuid;
  n integer;
begin
  select count(*) into n from public.savings_entries where wedding_id = w;
  if n <> 0 then raise exception 'GAGAL: X melihat tabungan pasangan lain'; end if;
  begin
    insert into public.savings_entries (wedding_id, amount) values (w, 1000);
    raise exception 'GAGAL: X mencatat setoran di workspace A';
  exception when insufficient_privilege or foreign_key_violation then null;
  end;
end;
$$;

-- P menghapus setorannya sendiri, menabung lagi, lalu keluar dari workspace
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-c000-0000000000bb","role":"authenticated"}', true);
do $$
declare
  w uuid := current_setting('test.sw')::uuid;
  n integer;
begin
  delete from public.savings_entries where wedding_id = w and user_id = auth.uid();
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'GAGAL: P tidak bisa menghapus setorannya sendiri'; end if;
  insert into public.savings_entries (wedding_id, amount) values (w, 500000);
  delete from public.wedding_members where wedding_id = w and user_id = auth.uid();
end;
$$;

-- A: setoran P ikut terhapus saat P keluar, dana kembali ke 13 jt (10 jt awal + 3 jt A)
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-c000-00000000000a","role":"authenticated"}', true);
do $$
declare
  w uuid := current_setting('test.sw')::uuid;
  funds bigint;
  n integer;
begin
  select count(*) into n from public.savings_entries where wedding_id = w;
  if n <> 1 then raise exception 'GAGAL: setoran anggota yang keluar masih ada (%)', n; end if;
  select available_funds into funds from public.weddings where id = w;
  if funds <> 13000000 then raise exception 'GAGAL: dana tidak dikurangi setelah anggota keluar (%)', funds; end if;
end;
$$;

reset role;
select 'SEMUA UJI TABUNGAN BERSAMA LULUS' as hasil;
rollback;
