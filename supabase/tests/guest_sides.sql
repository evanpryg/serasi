-- =============================================================================
-- Uji pihak tamu (CPP/CPW). Semua data uji di-ROLLBACK.
-- =============================================================================
begin;

insert into auth.users (id, email, raw_user_meta_data, aud, role) values
  ('00000000-0000-4000-e000-00000000000a', 'ga@test.local', '{"full_name":"Bima"}', 'authenticated', 'authenticated');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-e000-00000000000a","role":"authenticated"}', true);
select set_config('test.gw', public.create_wedding_workspace('Bima & Laras', 'Malang', array['resepsi'], 0, 0)::text, true);

do $$
declare
  w uuid := current_setting('test.gw')::uuid;
  s text;
begin
  -- 1. Tanpa pihak → default CPP
  insert into public.guests (wedding_id, name, group_name) values (w, 'Pakde Joko', 'Saudara') returning side into s;
  if s is distinct from 'cpp' then raise exception 'GAGAL: pihak default bukan cpp (%)', s; end if;

  -- 2. Pihak CPW tersimpan
  insert into public.guests (wedding_id, name, group_name, side) values (w, 'Bulik Sri', 'Saudara', 'cpw') returning side into s;
  if s is distinct from 'cpw' then raise exception 'GAGAL: pihak cpw tidak tersimpan'; end if;

  -- 3. Nilai pihak lain ditolak
  begin
    insert into public.guests (wedding_id, name, side) values (w, 'Salah', 'joint');
    raise exception 'GAGAL: pihak tidak valid diterima';
  exception when check_violation then null;
  end;

  -- 4. Pihak tidak boleh kosong
  begin
    insert into public.guests (wedding_id, name, side) values (w, 'Kosong', null);
    raise exception 'GAGAL: pihak kosong diterima';
  exception when not_null_violation then null;
  end;
end;
$$;

do $$ begin raise notice 'SEMUA UJI PIHAK TAMU LULUS'; end $$;

rollback;
