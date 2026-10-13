-- =============================================================================
-- Uji akses akun pasangan, undangan, tes kepribadian, dan deep talk.
-- Jalankan setelah semua migration. Semua data uji di-ROLLBACK.
--   A = pemilik workspace, P = pasangan (diundang), X = orang lain
-- =============================================================================
begin;

insert into auth.users (id, email, raw_user_meta_data, aud, role) values
  ('00000000-0000-4000-b000-00000000000a', 'a@test.local', '{"full_name":"Rina"}',  'authenticated', 'authenticated'),
  ('00000000-0000-4000-b000-0000000000bb', 'p@test.local', '{"full_name":"Dimas"}', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-b000-0000000000cc', 'x@test.local', '{"full_name":"Orang Lain"}', 'authenticated', 'authenticated');

set local role authenticated;

-- A membuat workspace dan kode undangan
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-b000-00000000000a","role":"authenticated"}', true);
select set_config('test.w', public.create_wedding_workspace('Rina & Dimas', 'Bandung', array['akad_resepsi'], 100000000, 10000000)::text, true);
select set_config('test.code', public.create_wedding_invite(), true);

-- X membuat workspace sendiri
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-b000-0000000000cc","role":"authenticated"}', true);
select set_config('test.wx', public.create_wedding_workspace('X', 'Jakarta', array['resepsi'], 0, 0)::text, true);

-- P melihat pratinjau lalu menerima undangan
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-b000-0000000000bb","role":"authenticated"}', true);

do $$
declare
  w uuid := current_setting('test.w')::uuid;
  wx uuid := current_setting('test.wx')::uuid;
  code text := current_setting('test.code');
  n integer;
begin
  -- 1. Sebelum bergabung, P tidak bisa membaca workspace A
  select count(*) into n from public.weddings where id = w;
  if n <> 0 then raise exception 'GAGAL: P membaca workspace sebelum bergabung'; end if;

  -- 2. Pratinjau undangan & terima (kode tidak peka huruf besar/kecil)
  select count(*) into n from public.get_invite_preview(lower(code));
  if n <> 1 then raise exception 'GAGAL: pratinjau undangan tidak ditemukan'; end if;
  if public.accept_wedding_invite(lower(code)) <> w then raise exception 'GAGAL: undangan tidak mengarah ke workspace A'; end if;

  -- 3. P kini membaca & mengubah data bersama
  select count(*) into n from public.weddings where id = w;
  if n <> 1 then raise exception 'GAGAL: P tidak bisa membaca workspace bersama'; end if;
  select count(*) into n from public.budget_categories where wedding_id = w;
  if n <> 14 then raise exception 'GAGAL: P tidak melihat kategori bersama'; end if;
  update public.tasks set status = 'done' where wedding_id = w and template_key = 'budget_target';
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'GAGAL: P tidak bisa memperbarui tugas bersama'; end if;
  update public.weddings set title = 'Rina & Dimas ❤' where id = w;
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'GAGAL: P tidak bisa mengubah profil pernikahan'; end if;

  -- 4. P tidak bisa mengambil alih kepemilikan
  begin
    update public.weddings set owner_id = '00000000-0000-4000-b000-0000000000bb' where id = w;
    raise exception 'GAGAL: P mengubah owner_id';
  exception when insufficient_privilege then null;
  end;

  -- 5. P tidak bisa membuat workspace kedua
  begin
    perform public.create_wedding_workspace('P sendiri', 'Bandung', array['akad'], 0, 0);
    raise exception 'GAGAL: partner bisa membuat workspace lain';
  exception when unique_violation then null;
  end;

  -- 6. Kode yang sudah dipakai tidak bisa dipakai lagi
  begin
    perform public.accept_wedding_invite(code);
    raise exception 'GAGAL: kode undangan dipakai dua kali';
  exception when no_data_found then null;
  end;

  -- 7. P bisa membaca profil A, tapi tidak profil X
  select count(*) into n from public.profiles where id = '00000000-0000-4000-b000-00000000000a';
  if n <> 1 then raise exception 'GAGAL: P tidak bisa melihat profil pasangan'; end if;
  select count(*) into n from public.profiles where id = '00000000-0000-4000-b000-0000000000cc';
  if n <> 0 then raise exception 'GAGAL: P melihat profil orang lain'; end if;

  -- 8. P tidak bisa membaca workspace X
  select count(*) into n from public.weddings where id = wx;
  if n <> 0 then raise exception 'GAGAL: P membaca workspace X'; end if;

  -- 9. Kepribadian: P menyelesaikan tes
  insert into public.personality_results (wedding_id, type_code, scores, answers)
  values (w, 'ENFP', '{"E":70,"S":30,"T":35,"J":40}', '[]');
  -- P tidak bisa menulis hasil atas nama A
  begin
    insert into public.personality_results (wedding_id, user_id, type_code, scores, answers)
    values (w, '00000000-0000-4000-b000-00000000000a', 'ISTJ', '{}', '[]');
    raise exception 'GAGAL: P menulis hasil tes atas nama A';
  exception when insufficient_privilege then null;
  end;

  -- 10. Deep talk: P menjawab q_visi
  insert into public.deeptalk_answers (wedding_id, question_id, answer) values (w, 'visi_10_tahun', 'Jawaban P');
end;
$$;

-- Sudut pandang A
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-b000-00000000000a","role":"authenticated"}', true);
do $$
declare
  w uuid := current_setting('test.w')::uuid;
  n integer;
begin
  -- 11. Hasil P tersembunyi sampai A menyelesaikan tes
  select count(*) into n from public.personality_results where wedding_id = w;
  if n <> 0 then raise exception 'GAGAL: A melihat hasil P sebelum mengerjakan tes'; end if;
  -- ...tetapi A tahu P sudah selesai (tanpa melihat isinya)
  select count(*) into n from public.personality_progress(w);
  if n <> 1 then raise exception 'GAGAL: progres tes pasangan tidak terlihat'; end if;
  select count(*) into n from public.deeptalk_progress(w);
  if n <> 1 then raise exception 'GAGAL: progres deep talk pasangan tidak terlihat'; end if;
  insert into public.personality_results (wedding_id, type_code, scores, answers)
  values (w, 'ISTJ', '{"E":30,"S":70,"T":65,"J":80}', '[]');
  select count(*) into n from public.personality_results where wedding_id = w;
  if n <> 2 then raise exception 'GAGAL: A tidak melihat hasil P setelah selesai'; end if;

  -- 12. Jawaban deep talk P tersembunyi sampai A menjawab pertanyaan yang sama
  select count(*) into n from public.deeptalk_answers where wedding_id = w;
  if n <> 0 then raise exception 'GAGAL: A melihat jawaban P sebelum menjawab'; end if;
  insert into public.deeptalk_answers (wedding_id, question_id, answer) values (w, 'visi_10_tahun', 'Jawaban A');
  select count(*) into n from public.deeptalk_answers where wedding_id = w;
  if n <> 2 then raise exception 'GAGAL: A tidak melihat jawaban P setelah menjawab'; end if;
  -- A tidak bisa mengubah jawaban P
  update public.deeptalk_answers set answer = 'diubah' where wedding_id = w and user_id = '00000000-0000-4000-b000-0000000000bb';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'GAGAL: A mengubah jawaban P'; end if;

  -- 13. Workspace sudah lengkap: tidak bisa membuat undangan baru
  begin
    perform public.create_wedding_invite();
    raise exception 'GAGAL: undangan dibuat padahal pasangan sudah bergabung';
  exception when unique_violation then null;
  end;
end;
$$;

-- Sudut pandang X (orang lain)
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-b000-0000000000cc","role":"authenticated"}', true);
do $$
declare
  w uuid := current_setting('test.w')::uuid;
  n integer;
begin
  select count(*) into n from public.personality_results where wedding_id = w;
  if n <> 0 then raise exception 'GAGAL: X melihat hasil kepribadian pasangan lain'; end if;
  select count(*) into n from public.deeptalk_answers where wedding_id = w;
  if n <> 0 then raise exception 'GAGAL: X melihat deep talk pasangan lain'; end if;
  select count(*) into n from public.wedding_members where wedding_id = w;
  if n <> 0 then raise exception 'GAGAL: X melihat anggota workspace lain'; end if;
  select count(*) into n from public.deeptalk_progress(w);
  if n <> 0 then raise exception 'GAGAL: X melihat progres deep talk pasangan lain'; end if;
  begin
    insert into storage.objects (bucket_id, name, owner) values ('wedding-files', w::text || '/x.jpg', auth.uid());
    raise exception 'GAGAL: X unggah ke folder pasangan lain';
  exception when insufficient_privilege then null;
  end;
  -- X tidak bisa memasukkan dirinya ke workspace A lewat jawaban/hasil tes
  begin
    insert into public.deeptalk_answers (wedding_id, question_id, answer) values (w, 'visi_10_tahun', 'x');
    raise exception 'GAGAL: X menulis deep talk di workspace A';
  exception when insufficient_privilege then null;
  end;
end;
$$;

-- P: unggah foto sampul, lalu keluar dari workspace
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-b000-0000000000bb","role":"authenticated"}', true);
do $$
declare
  w uuid := current_setting('test.w')::uuid;
  n integer;
begin
  insert into storage.objects (bucket_id, name, owner) values ('wedding-files', w::text || '/cover-1.webp', auth.uid());
  update public.weddings set cover_photo_path = w::text || '/cover-1.webp' where id = w;
  begin
    update public.weddings set cover_photo_path = 'folder-lain/cover.webp' where id = w;
    raise exception 'GAGAL: path sampul di luar folder workspace diterima';
  exception when check_violation then null;
  end;

  -- 14. P keluar → kehilangan akses
  delete from public.wedding_members where wedding_id = w and user_id = auth.uid();
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'GAGAL: partner tidak bisa keluar'; end if;
  select count(*) into n from public.weddings where id = w;
  if n <> 0 then raise exception 'GAGAL: P masih bisa membaca setelah keluar'; end if;
end;
$$;

reset role;
select 'SEMUA UJI AKUN PASANGAN LULUS' as hasil;
rollback;
