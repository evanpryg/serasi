-- =============================================================================
-- Uji rincian anggaran: link toko pada item dan hapus pos beserta itemnya.
-- Jalankan setelah semua migration. Semua data uji di-ROLLBACK.
--   A = pemilik workspace, P = pasangan, X = orang lain
-- =============================================================================
begin;

insert into auth.users (id, email, raw_user_meta_data, aud, role) values
  ('00000000-0000-4000-d000-00000000000a', 'ba@test.local', '{"full_name":"Rina"}',  'authenticated', 'authenticated'),
  ('00000000-0000-4000-d000-0000000000bb', 'bp@test.local', '{"full_name":"Dimas"}', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-d000-0000000000cc', 'bx@test.local', '{"full_name":"Orang Lain"}', 'authenticated', 'authenticated');

set local role authenticated;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-d000-00000000000a","role":"authenticated"}', true);
select set_config('test.bw', public.create_wedding_workspace('Rina & Dimas', 'Bandung', array['akad_resepsi'], 100000000, 10000000)::text, true);
select set_config('test.bcode', public.create_wedding_invite(), true);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-d000-0000000000bb","role":"authenticated"}', true);
select public.accept_wedding_invite(current_setting('test.bcode'));

-- Sudut pandang A: buat pos Seserahan + dua item
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-d000-00000000000a","role":"authenticated"}', true);
do $$
declare
  w uuid := current_setting('test.bw')::uuid;
  c uuid;
begin
  insert into public.budget_categories (wedding_id, name, planned_amount) values (w, 'Seserahan', 5000000) returning id into c;
  perform set_config('test.bc', c::text, false);
  insert into public.expenses (wedding_id, category_id, title, amount, status, link_url)
    values (w, c, 'Set skincare', 750000, 'planned', 'https://shopee.co.id/produk-123');
  insert into public.expenses (wedding_id, category_id, title, amount, status, expense_date)
    values (w, c, 'Sepatu', 400000, 'paid', '2026-10-13');

  -- 1. Link harus http(s)
  begin
    insert into public.expenses (wedding_id, category_id, title, amount, status, link_url)
      values (w, c, 'Jahat', 1, 'planned', 'javascript:alert(1)');
    raise exception 'GAGAL: link non-http diterima';
  exception when check_violation then null;
  end;

  -- 2. Hapus pos biasa tetap ditolak selama masih ada item (FK NO ACTION)
  begin
    delete from public.budget_categories where id = c;
    raise exception 'GAGAL: pos dengan item terhapus tanpa fungsi';
  exception when foreign_key_violation then null;
  end;
end;
$$;

-- Sudut pandang X: tidak bisa menghapus pos A lewat fungsi
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-d000-0000000000cc","role":"authenticated"}', true);
do $$
begin
  begin
    perform public.delete_budget_category(current_setting('test.bc')::uuid);
    raise exception 'GAGAL: X menghapus pos milik workspace lain';
  exception when no_data_found then null;
  end;
end;
$$;

-- Sudut pandang P: pasangan bisa menghapus pos beserta itemnya
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-d000-0000000000bb","role":"authenticated"}', true);
do $$
declare
  n integer;
begin
  perform public.delete_budget_category(current_setting('test.bc')::uuid);
  select count(*) into n from public.expenses where category_id = current_setting('test.bc')::uuid;
  if n <> 0 then raise exception 'GAGAL: item pos masih tersisa (%)', n; end if;
  select count(*) into n from public.budget_categories where id = current_setting('test.bc')::uuid;
  if n <> 0 then raise exception 'GAGAL: pos tidak terhapus'; end if;
end;
$$;

reset role;
select 'SEMUA UJI RINCIAN ANGGARAN LULUS' as hasil;
rollback;
