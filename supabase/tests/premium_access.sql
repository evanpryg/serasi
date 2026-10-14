-- =============================================================================
-- Uji paket Premium & pembayaran QRIS.
-- Jalankan setelah semua migration. Semua data uji di-ROLLBACK.
--   A = pemilik workspace, P = pasangan A, X = orang lain, M = admin aplikasi
-- =============================================================================
begin;

insert into auth.users (id, email, raw_user_meta_data, aud, role) values
  ('00000000-0000-4000-e000-00000000000a', 'pa@test.local', '{"full_name":"Andi"}',  'authenticated', 'authenticated'),
  ('00000000-0000-4000-e000-0000000000bb', 'pp@test.local', '{"full_name":"Putri"}', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-e000-0000000000cc', 'px@test.local', '{"full_name":"Xena"}',  'authenticated', 'authenticated'),
  ('00000000-0000-4000-e000-0000000000dd', 'pm@test.local', '{"full_name":"Admin"}', 'authenticated', 'authenticated');
insert into public.app_admins (user_id) values ('00000000-0000-4000-e000-0000000000dd');

set local role authenticated;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-e000-00000000000a","role":"authenticated"}', true);
select set_config('test.pw', public.create_wedding_workspace('Andi & Putri', 'Jember', array['akad_resepsi'], 0, 0)::text, true);
select set_config('test.pcode', public.create_wedding_invite(), true);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-e000-0000000000cc","role":"authenticated"}', true);
select set_config('test.pwx', public.create_wedding_workspace('X', 'Jakarta', array['resepsi'], 0, 0)::text, true);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-e000-0000000000bb","role":"authenticated"}', true);
select public.accept_wedding_invite(current_setting('test.pcode'));

-- ---------------------------------------------------------------- sebagai A (Gratis)
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-e000-00000000000a","role":"authenticated"}', true);
do $$
declare
  w uuid := current_setting('test.pw')::uuid;
  o public.payment_orders;
  o2 public.payment_orders;
  n integer;
  i integer;
begin
  -- 1. Tidak bisa memberi diri sendiri Premium
  begin
    insert into public.wedding_entitlements (wedding_id, plan_id) values (w, 'premium');
    raise exception 'GAGAL: entitlement ditulis langsung';
  exception when insufficient_privilege then null;
  end;
  if public.is_wedding_premium(w) then raise exception 'GAGAL: workspace baru sudah Premium'; end if;

  -- 2. Nominal dihitung server: harga − kode unik
  o := public.create_payment_order(w);
  if o.status <> 'pending' or o.amount <> 99000 - o.unique_code or o.unique_code not between 1 and 499 then
    raise exception 'GAGAL: nominal pesanan salah (%, %)', o.amount, o.unique_code;
  end if;
  perform set_config('test.porder', o.id::text, true);
  perform set_config('test.pamount', o.amount::text, true);

  -- 3. Memanggil lagi melanjutkan pesanan yang sama
  o2 := public.create_payment_order(w);
  if o2.id <> o.id then raise exception 'GAGAL: pesanan ganda untuk workspace yang sama'; end if;

  -- 4. Status pesanan tidak bisa diubah langsung
  begin
    update public.payment_orders set status = 'paid' where id = o.id;
    raise exception 'GAGAL: status pesanan diubah langsung';
  exception when insufficient_privilege then null;
  end;

  -- 5. Bukan admin → tidak bisa meninjau pembayaran / melihat daftar admin
  begin
    perform public.admin_review_payment(o.id, true);
    raise exception 'GAGAL: non-admin menyetujui pembayaran';
  exception when insufficient_privilege then null;
  end;
  begin
    perform * from public.admin_payment_orders();
    raise exception 'GAGAL: non-admin membaca daftar pesanan';
  exception when insufficient_privilege then null;
  end;

  -- 6. Batas 100 undangan untuk paket Gratis
  for i in 1..100 loop
    insert into public.guests (wedding_id, name) values (w, 'Tamu ' || i);
  end loop;
  begin
    insert into public.guests (wedding_id, name) values (w, 'Tamu 101');
    raise exception 'GAGAL: undangan ke-101 diterima di paket Gratis';
  exception when raise_exception then
    if sqlerrm not like 'Paket Gratis%' then raise; end if;
  end;

  -- 7. Deep talk: topik gratis boleh, topik Premium ditolak
  insert into public.deeptalk_answers (wedding_id, question_id, answer) values (w, 'visi_10_tahun', 'Rumah kecil yang hangat');
  begin
    insert into public.deeptalk_answers (wedding_id, question_id, answer) values (w, 'uang_kelola', 'Digabung');
    raise exception 'GAGAL: topik Premium dijawab di paket Gratis';
  exception when insufficient_privilege then null;
  end;

  -- 8. Foto item anggaran khusus Premium; file lain tetap boleh
  insert into storage.objects (bucket_id, name, owner) values ('wedding-files', w::text || '/cover-9.webp', auth.uid());
  begin
    insert into storage.objects (bucket_id, name, owner) values ('wedding-files', w::text || '/items/a.webp', auth.uid());
    raise exception 'GAGAL: foto item diunggah di paket Gratis';
  exception when insufficient_privilege then null;
  end;

  -- 9. Klaim sudah bayar
  o := public.claim_payment_order(o.id, 'ANDI W');
  if o.status <> 'awaiting_verification' or o.claimed_at is null or o.payer_name <> 'ANDI W' then
    raise exception 'GAGAL: klaim pembayaran tidak tercatat';
  end if;
end;
$$;

-- ---------------------------------------------------------------- sebagai X (orang lain)
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-e000-0000000000cc","role":"authenticated"}', true);
do $$
declare
  o public.payment_orders;
  n integer;
begin
  -- 10. Pesanan & hak workspace A tidak terlihat
  select count(*) into n from public.payment_orders where wedding_id = current_setting('test.pw')::uuid;
  if n <> 0 then raise exception 'GAGAL: X melihat pesanan A'; end if;

  -- 11. X tidak bisa membuat pesanan / mengklaim untuk workspace A
  begin
    perform public.create_payment_order(current_setting('test.pw')::uuid);
    raise exception 'GAGAL: X membuat pesanan untuk workspace A';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.claim_payment_order(current_setting('test.porder')::uuid);
    raise exception 'GAGAL: X mengklaim pesanan A';
  exception when no_data_found then null;
  end;

  -- 12. Nominal pesanan X berbeda dari pesanan A yang masih terbuka
  o := public.create_payment_order(current_setting('test.pwx')::uuid);
  if o.amount = current_setting('test.pamount')::bigint then raise exception 'GAGAL: nominal pesanan bentrok'; end if;
end;
$$;

-- ---------------------------------------------------------------- sebagai M (admin)
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-e000-0000000000dd","role":"authenticated"}', true);
do $$
declare
  o public.payment_orders;
  n integer;
begin
  select count(*) into n from public.admin_payment_orders('awaiting_verification');
  if n <> 1 then raise exception 'GAGAL: admin tidak melihat pesanan menunggu (%)', n; end if;

  o := public.admin_review_payment(current_setting('test.porder')::uuid, true, 'Dana masuk');
  if o.status <> 'paid' then raise exception 'GAGAL: pesanan tidak lunas'; end if;
  if not public.is_wedding_premium(current_setting('test.pw')::uuid) then raise exception 'GAGAL: Premium tidak aktif'; end if;
end;
$$;

-- ---------------------------------------------------------------- sebagai P (pasangan, kini Premium)
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-e000-0000000000bb","role":"authenticated"}', true);
do $$
declare
  w uuid := current_setting('test.pw')::uuid;
  n integer;
begin
  -- 13. Pasangan ikut Premium (satu pembayaran untuk berdua)
  select count(*) into n from public.wedding_entitlements where wedding_id = w;
  if n <> 1 then raise exception 'GAGAL: pasangan tidak melihat Premium'; end if;

  -- 14. Batas terbuka setelah Premium
  insert into public.guests (wedding_id, name) values (w, 'Tamu 101');
  insert into public.deeptalk_answers (wedding_id, question_id, answer) values (w, 'uang_kelola', 'Sebagian digabung');
  insert into storage.objects (bucket_id, name, owner) values ('wedding-files', w::text || '/items/b.webp', auth.uid());

  -- 15. Sudah Premium → tidak bisa membuat pesanan baru
  begin
    perform public.create_payment_order(w);
    raise exception 'GAGAL: pesanan dibuat untuk workspace Premium';
  exception when unique_violation then null;
  end;
end;
$$;

-- ---------------------------------------------------------------- sebagai X lagi
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-e000-0000000000cc","role":"authenticated"}', true);
do $$
declare n integer;
begin
  select count(*) into n from public.wedding_entitlements where wedding_id = current_setting('test.pw')::uuid;
  if n <> 0 then raise exception 'GAGAL: X melihat hak Premium A'; end if;
  if public.is_wedding_premium(current_setting('test.pwx')::uuid) then raise exception 'GAGAL: X ikut Premium'; end if;
end;
$$;

reset role;

do $$ begin raise notice 'SEMUA UJI PREMIUM & PEMBAYARAN LULUS'; end $$;

rollback;
