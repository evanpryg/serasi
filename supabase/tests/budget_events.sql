-- =============================================================================
-- Uji anggaran per acara + realisasi item.
-- Jalankan setelah semua migration. Semua data uji di-ROLLBACK.
--   A = pemilik workspace, P = pasangan, X = orang lain (workspace sendiri)
-- =============================================================================
begin;

insert into auth.users (id, email, raw_user_meta_data, aud, role) values
  ('00000000-0000-4000-e000-00000000000a', 'ea@test.local', '{"full_name":"Sari"}',  'authenticated', 'authenticated'),
  ('00000000-0000-4000-e000-0000000000bb', 'ep@test.local', '{"full_name":"Bima"}',  'authenticated', 'authenticated'),
  ('00000000-0000-4000-e000-0000000000cc', 'ex@test.local', '{"full_name":"Orang Lain"}', 'authenticated', 'authenticated');

set local role authenticated;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-e000-00000000000a","role":"authenticated"}', true);
select set_config('test.ew', public.create_wedding_workspace('Sari & Bima', 'Solo', array['akad_resepsi'], 100000000, 10000000)::text, true);
select set_config('test.ecode', public.create_wedding_invite(), true);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-e000-0000000000bb","role":"authenticated"}', true);
select public.accept_wedding_invite(current_setting('test.ecode'));

select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-e000-0000000000cc","role":"authenticated"}', true);
select set_config('test.xw', public.create_wedding_workspace('Orang Lain', 'Medan', array['akad'], 50000000, 0)::text, true);
select set_config('test.xev', (select id from public.budget_events where wedding_id = current_setting('test.xw')::uuid limit 1)::text, true);

-- Sudut pandang A
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-e000-00000000000a","role":"authenticated"}', true);
do $$
declare
  w uuid := current_setting('test.ew')::uuid;
  n integer;
  ev_wedding uuid;
  ev_lamaran uuid;
  c uuid;
begin
  -- 1. Workspace baru mendapat 4 acara bawaan
  select count(*) into n from public.budget_events where wedding_id = w;
  if n <> 4 then raise exception 'GAGAL: acara bawaan % (harus 4)', n; end if;

  -- 2. Semua pos template masuk acara Wedding
  select id into ev_wedding from public.budget_events where wedding_id = w and template_key = 'wedding';
  select count(*) into n from public.budget_categories where wedding_id = w and event_id is distinct from ev_wedding;
  if n <> 0 then raise exception 'GAGAL: % pos template tidak masuk acara Wedding', n; end if;

  -- 3. Pos dengan nama sama boleh ada di acara berbeda
  select id into ev_lamaran from public.budget_events where wedding_id = w and template_key = 'lamaran';
  insert into public.budget_categories (wedding_id, name, planned_amount, event_id) values (w, 'Dekorasi', 1000000, ev_lamaran) returning id into c;
  perform set_config('test.ec', c::text, false);
  perform set_config('test.elam', ev_lamaran::text, false);

  -- 4. Acara kustom (CRUD)
  insert into public.budget_events (wedding_id, name, icon, sort_order) values (w, 'Siraman', 'sparkles', 5);
  update public.budget_events set name = 'Siraman & Pengajian', event_date = '2026-12-01' where wedding_id = w and name = 'Siraman';

  -- 5. Ikon harus kunci sederhana (bukan teks bebas)
  begin
    insert into public.budget_events (wedding_id, name, icon) values (w, 'Jahat', '<svg onload=x>');
    raise exception 'GAGAL: ikon bebas diterima';
  exception when check_violation then null;
  end;

  -- 6. Realisasi: aktual tidak boleh negatif, boleh beda dari harga rencana
  insert into public.expenses (wedding_id, category_id, title, amount, actual_amount, status, expense_date)
    values (w, c, 'Dekor lamaran', 1000000, 900000, 'paid', '2026-10-18');
  begin
    insert into public.expenses (wedding_id, category_id, title, amount, actual_amount, status)
      values (w, c, 'Minus', 1, -5, 'planned');
    raise exception 'GAGAL: aktual negatif diterima';
  exception when check_violation then null;
  end;

  -- 7. Pos tidak boleh ditautkan ke acara workspace lain
  begin
    update public.budget_categories set event_id = current_setting('test.xev')::uuid where id = c;
    raise exception 'GAGAL: pos tertaut ke acara workspace lain';
  exception when foreign_key_violation then null;
  end;
end;
$$;

-- Sudut pandang X: tidak melihat & tidak bisa mengubah acara A
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-e000-0000000000cc","role":"authenticated"}', true);
do $$
declare
  n integer;
begin
  select count(*) into n from public.budget_events where wedding_id = current_setting('test.ew')::uuid;
  if n <> 0 then raise exception 'GAGAL: X melihat % acara milik A', n; end if;
  update public.budget_events set name = 'Diretas' where wedding_id = current_setting('test.ew')::uuid;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'GAGAL: X mengubah acara A'; end if;
  begin
    insert into public.budget_events (wedding_id, name) values (current_setting('test.ew')::uuid, 'Sisipan');
    raise exception 'GAGAL: X menambah acara ke workspace A';
  exception when insufficient_privilege then null;
  end;
end;
$$;

-- Sudut pandang P: pasangan bisa menghapus acara; pos tetap ada tanpa acara
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-e000-0000000000bb","role":"authenticated"}', true);
do $$
declare
  n integer;
  ev uuid;
begin
  delete from public.budget_events where id = current_setting('test.elam')::uuid;
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'GAGAL: pasangan tidak bisa menghapus acara'; end if;
  select event_id into ev from public.budget_categories where id = current_setting('test.ec')::uuid;
  if not found then raise exception 'GAGAL: pos ikut terhapus bersama acara'; end if;
  if ev is not null then raise exception 'GAGAL: pos masih menunjuk acara yang dihapus'; end if;
end;
$$;

reset role;
select 'SEMUA UJI ACARA ANGGARAN LULUS' as hasil;
rollback;
