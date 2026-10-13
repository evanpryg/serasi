-- =============================================================================
-- Uji isolasi antar-user (PRD §10.3). Jalankan di SQL Editor Supabase atau
--   psql "$DATABASE_URL" -f supabase/tests/rls_isolation.sql
-- Semua dijalankan dalam transaksi dan di-ROLLBACK: tidak meninggalkan data.
-- Jika ada pelanggaran, skrip berhenti dengan pesan "GAGAL: ...".
-- =============================================================================
begin;

-- Dua user uji
insert into auth.users (id, email, raw_user_meta_data, aud, role)
values
  ('00000000-0000-4000-a000-00000000000a', 'user-a@test.local', '{"full_name":"User A"}', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-a000-00000000000b', 'user-b@test.local', '{"full_name":"User B"}', 'authenticated', 'authenticated');

-- --- User B membuat workspace ------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-a000-00000000000b","role":"authenticated"}', true);
select set_config('test.wedding_b',
  public.create_wedding_workspace('B & C', 'Bandung', array['akad_resepsi'], 100000000, 20000000)::text, true);
select set_config('test.cat_b',
  (select id from public.budget_categories where wedding_id = current_setting('test.wedding_b')::uuid limit 1)::text, true);

-- --- User A membuat workspace ------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-a000-00000000000a","role":"authenticated"}', true);
select set_config('test.wedding_a',
  public.create_wedding_workspace('A & D', 'Jakarta', array['resepsi'], 50000000, 5000000)::text, true);

do $$
declare
  n integer;
  wb uuid := current_setting('test.wedding_b')::uuid;
  wa uuid := current_setting('test.wedding_a')::uuid;
  cb uuid := current_setting('test.cat_b')::uuid;
begin
  -- 1. A tidak bisa membaca data B
  select count(*) into n from public.weddings where id = wb;
  if n <> 0 then raise exception 'GAGAL: A dapat membaca wedding B'; end if;
  select count(*) into n from public.budget_categories where wedding_id = wb;
  if n <> 0 then raise exception 'GAGAL: A dapat membaca kategori B'; end if;
  select count(*) into n from public.tasks where wedding_id = wb;
  if n <> 0 then raise exception 'GAGAL: A dapat membaca tugas B'; end if;
  select count(*) into n from public.profiles where id = '00000000-0000-4000-a000-00000000000b';
  if n <> 0 then raise exception 'GAGAL: A dapat membaca profil B'; end if;

  -- 2. A tidak bisa mengubah owner_id menjadi milik B
  begin
    update public.weddings set owner_id = '00000000-0000-4000-a000-00000000000b' where id = wa;
    raise exception 'GAGAL: A dapat memindahkan owner_id ke B';
  exception when insufficient_privilege then null; -- new row violates RLS: OK
  end;

  -- 3. A tidak bisa mengubah/menghapus data B
  update public.weddings set title = 'diretas' where id = wb;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'GAGAL: A dapat mengubah wedding B'; end if;
  delete from public.budget_categories where wedding_id = wb;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'GAGAL: A dapat menghapus kategori B'; end if;

  -- 4. A tidak bisa menyisipkan record ke workspace B
  begin
    insert into public.tasks (wedding_id, title) values (wb, 'sisipan');
    raise exception 'GAGAL: A dapat menambah tugas ke workspace B';
  exception when insufficient_privilege then null;
  end;

  -- 5. A tidak bisa menghubungkan transaksi ke kategori milik B
  begin
    insert into public.expenses (wedding_id, category_id, title, amount, expense_date)
    values (wa, cb, 'lintas workspace', 1000, current_date);
    raise exception 'GAGAL: transaksi A terhubung ke kategori B';
  exception when foreign_key_violation then null;
  end;

  -- 6. Template checklist tidak terduplikasi
  select count(*) into n from public.tasks where wedding_id = wa;
  perform public.apply_checklist_template(wa);
  if (select count(*) from public.tasks where wedding_id = wa) <> n then
    raise exception 'GAGAL: template checklist terduplikasi';
  end if;

  -- 7. Alokasi otomatis = target persis
  if (select sum(planned_amount) from public.budget_categories where wedding_id = wa) <> 50000000 then
    raise exception 'GAGAL: total alokasi tidak sama dengan target';
  end if;

  -- 8. Satu akun hanya satu workspace
  begin
    perform public.create_wedding_workspace('Kedua', 'Jakarta', array['akad'], 0, 0);
    raise exception 'GAGAL: akun dapat membuat dua workspace';
  exception when unique_violation then null;
  end;
end;
$$;

-- --- Storage: A tidak bisa unggah ke folder workspace B ---------------------
do $$
declare wb uuid := current_setting('test.wedding_b')::uuid;
begin
  begin
    insert into storage.objects (bucket_id, name, owner) values ('wedding-files', wb::text || '/bukti.pdf', auth.uid());
    raise exception 'GAGAL: A dapat unggah file ke folder B';
  exception when insufficient_privilege then null;
  end;
end;
$$;

-- --- Pengguna tanpa login ----------------------------------------------------
reset role;
select set_config('request.jwt.claims', '', true);
set local role anon;
do $$
declare n integer;
begin
  begin
    select count(*) into n from public.weddings;
    if n <> 0 then raise exception 'GAGAL: anon dapat membaca weddings'; end if;
  exception when insufficient_privilege then null; -- tidak punya hak tabel: OK
  end;
  begin
    select count(*) into n from public.expenses;
    if n <> 0 then raise exception 'GAGAL: anon dapat membaca expenses'; end if;
  exception when insufficient_privilege then null;
  end;
end;
$$;

reset role;
select 'SEMUA UJI ISOLASI LULUS' as hasil;
rollback;
