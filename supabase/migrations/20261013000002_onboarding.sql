-- =============================================================================
-- Onboarding: buat workspace + kategori anggaran awal + checklist dasar
-- dalam SATU transaksi. SECURITY INVOKER → semua insert tetap melewati RLS.
-- =============================================================================

-- Template checklist. Idempoten: memakai template_key + unique index,
-- sehingga dipanggil berulang kali tidak menghasilkan tugas duplikat.
create or replace function public.apply_checklist_template(p_wedding_id uuid)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_wedding public.weddings%rowtype;
  v_inserted integer;
begin
  select * into v_wedding from public.weddings where id = p_wedding_id;
  if not found then
    raise exception 'Workspace tidak ditemukan' using errcode = 'P0002';
  end if;

  with template (template_key, phase, title, offset_days, priority, needs) as (
    values
      -- Perencanaan anggaran
      ('budget_target',      'anggaran',   'Sepakati target biaya pernikahan bersama pasangan', -365, 'high',   null),
      ('budget_family',      'anggaran',   'Diskusikan kontribusi dana dari keluarga',          -350, 'high',   null),
      ('budget_categories',  'anggaran',   'Sesuaikan alokasi setiap kategori anggaran',         -340, 'high',   null),
      ('budget_saving',      'anggaran',   'Tentukan rencana menabung bulanan',                  -330, 'medium', null),
      -- Pemilihan vendor
      ('vendor_venue',       'vendor',     'Survei dan pilih venue',                             -300, 'high',   null),
      ('vendor_catering',    'vendor',     'Tes makanan dan pilih katering',                     -270, 'high',   null),
      ('vendor_photo',       'vendor',     'Pilih fotografer dan videografer',                   -240, 'medium', null),
      ('vendor_mua',         'vendor',     'Pilih MUA dan busana pengantin',                     -240, 'medium', null),
      ('vendor_decor',       'vendor',     'Pilih vendor dekorasi',                              -210, 'medium', null),
      ('vendor_contracts',   'vendor',     'Arsipkan kontrak dan jadwal pembayaran vendor',      -200, 'medium', null),
      -- Lamaran
      ('lamaran_date',       'lamaran',    'Tentukan tanggal dan konsep lamaran',                -330, 'high',   'lamaran'),
      ('lamaran_seserahan',  'lamaran',    'Siapkan seserahan lamaran',                          -315, 'medium', 'lamaran'),
      -- Administrasi pernikahan
      ('admin_documents',    'administrasi','Kumpulkan dokumen persyaratan nikah (KTP, KK, akta, pas foto)', -150, 'high', 'akad'),
      ('admin_register',     'administrasi','Daftarkan pernikahan ke KUA/Catatan Sipil setempat',  -90, 'high',   'akad'),
      ('admin_course',       'administrasi','Ikuti bimbingan perkawinan jika diwajibkan',          -60, 'medium', 'akad'),
      -- Persiapan akad
      ('akad_mahar',         'akad',       'Tentukan dan siapkan mahar',                         -90, 'high',   'akad'),
      ('akad_officiant',     'akad',       'Konfirmasi penghulu/petugas, wali, dan saksi',       -30, 'high',   'akad'),
      ('akad_rings',         'akad',       'Siapkan cincin pernikahan',                          -60, 'medium', 'akad'),
      -- Persiapan resepsi
      ('resepsi_concept',    'resepsi',    'Finalisasi konsep dan tema resepsi',                 -180, 'medium', 'resepsi'),
      ('resepsi_entertain',  'resepsi',    'Pilih hiburan atau MC',                              -120, 'low',    'resepsi'),
      ('resepsi_portion',    'resepsi',    'Finalisasi jumlah porsi katering',                   -21,  'high',   'resepsi'),
      -- Undangan dan tamu
      ('guest_list',         'tamu',       'Susun daftar tamu bersama keluarga',                 -150, 'high',   null),
      ('guest_invitation',   'tamu',       'Pesan atau desain undangan',                         -100, 'medium', null),
      ('guest_send',         'tamu',       'Kirim undangan',                                     -45,  'high',   null),
      ('guest_rsvp',         'tamu',       'Rekap konfirmasi kehadiran tamu',                    -14,  'medium', null),
      ('guest_souvenir',     'tamu',       'Pesan souvenir',                                     -60,  'low',    null),
      -- Persiapan hari H
      ('day_rundown',        'hari_h',     'Susun rundown acara',                                -30,  'high',   null),
      ('day_brief',          'hari_h',     'Briefing panitia keluarga dan vendor',               -7,   'high',   null),
      ('day_payments',       'hari_h',     'Pastikan semua pelunasan vendor selesai',            -7,   'high',   null),
      ('day_emergency',      'hari_h',     'Siapkan kotak darurat dan dana tunai kecil',         -3,   'low',    null),
      -- Pasca-pernikahan
      ('post_thanks',        'pasca',      'Ucapkan terima kasih kepada keluarga dan tamu',       7,   'low',    null),
      ('post_documents',     'pasca',      'Simpan buku nikah dan perbarui dokumen kependudukan', 30,  'medium', 'akad'),
      ('post_review',        'pasca',      'Rekap pengeluaran akhir dan tutup pembayaran',        14,  'medium', null)
  ),
  applicable as (
    select t.*, row_number() over () as rn
    from template t
    where t.needs is null
       or t.needs = any (v_wedding.event_types)
       or (t.needs in ('akad', 'resepsi') and 'akad_resepsi' = any (v_wedding.event_types))
  )
  insert into public.tasks (wedding_id, title, category, due_date, priority, sort_order, template_key)
  select
    p_wedding_id,
    a.title,
    a.phase,
    -- Tugas yang idealnya sudah lewat (mis. H-365 padahal acara 8 bulan lagi) tidak dibuat
    -- "terlambat"; dijadwalkan sebagai kejar-tayang 7 hari ke depan (maks. H-1).
    case when v_wedding.wedding_date is null then null
         when v_wedding.wedding_date + a.offset_days >= current_date then v_wedding.wedding_date + a.offset_days
         else least(current_date + 7, greatest(v_wedding.wedding_date - 1, current_date)) end,
    a.priority,
    a.rn::integer,
    a.template_key
  from applicable a
  on conflict (wedding_id, template_key) where template_key is not null do nothing;

  get diagnostics v_inserted = row_count;
  return v_inserted;
end;
$$;

create or replace function public.create_wedding_workspace(
  p_title            text,
  p_city             text,
  p_event_types      text[],
  p_budget_target    bigint,
  p_available_funds  bigint,
  p_partner_names    text    default null,
  p_wedding_date     date    default null,
  p_guest_estimate   integer default null,
  p_wedding_style    text    default null,
  p_tradition        text    default null,
  p_auto_allocate    boolean default true
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_wedding_id uuid;
  v_allocated bigint;
begin
  if v_uid is null then
    raise exception 'Harus login' using errcode = '42501';
  end if;
  if coalesce(array_length(p_event_types, 1), 0) = 0 then
    raise exception 'Pilih minimal satu jenis acara' using errcode = '22023';
  end if;

  insert into public.weddings (
    owner_id, title, partner_names, wedding_date, city, event_types,
    guest_estimate, budget_target, available_funds, wedding_style, tradition
  ) values (
    v_uid, trim(p_title), nullif(trim(p_partner_names), ''), p_wedding_date, trim(p_city), p_event_types,
    p_guest_estimate, greatest(p_budget_target, 0), greatest(p_available_funds, 0),
    nullif(trim(p_wedding_style), ''), nullif(trim(p_tradition), '')
  )
  returning id into v_wedding_id;

  -- Kategori awal + saran alokasi (persen dari target, bisa diubah pengguna).
  insert into public.budget_categories (wedding_id, name, planned_amount, is_reserve, sort_order, template_key)
  select
    v_wedding_id, c.name,
    case when p_auto_allocate then (p_budget_target * c.pct / 100) else 0 end,
    c.is_reserve, c.ord, c.key
  from (values
    ('venue',        'Venue dan sewa tempat',                      15, false,  1),
    ('katering',     'Katering dan konsumsi',                      30, false,  2),
    ('dekorasi',     'Dekorasi',                                   10, false,  3),
    ('mua_busana',   'MUA dan busana',                              8, false,  4),
    ('foto_video',   'Fotografi dan videografi',                    7, false,  5),
    ('undangan',     'Undangan dan souvenir',                       5, false,  6),
    ('mahar',        'Mahar dan seserahan',                         6, false,  7),
    ('administrasi', 'Administrasi dan dokumen',                    1, false,  8),
    ('adat',         'Prosesi adat dan acara keluarga',             4, false,  9),
    ('hiburan',      'Hiburan dan perlengkapan acara',              3, false, 10),
    ('transportasi', 'Transportasi dan akomodasi',                  2, false, 11),
    ('dokumentasi',  'Dokumentasi tambahan atau kebutuhan khusus',  1, false, 12),
    ('lainnya',      'Lain-lain',                                   3, false, 13),
    ('cadangan',     'Dana cadangan',                               5, true,  14)
  ) as c(key, name, pct, is_reserve, ord);

  -- Sisa pembulatan masuk ke dana cadangan agar total = target persis.
  if p_auto_allocate then
    select coalesce(sum(planned_amount), 0) into v_allocated
    from public.budget_categories where wedding_id = v_wedding_id;

    update public.budget_categories
       set planned_amount = planned_amount + (p_budget_target - v_allocated)
     where wedding_id = v_wedding_id and template_key = 'cadangan';
  end if;

  perform public.apply_checklist_template(v_wedding_id);

  return v_wedding_id;
end;
$$;

revoke all on function public.apply_checklist_template(uuid) from public, anon;
revoke all on function public.create_wedding_workspace(text, text, text[], bigint, bigint, text, date, integer, text, text, boolean) from public, anon;
grant execute on function public.apply_checklist_template(uuid) to authenticated;
grant execute on function public.create_wedding_workspace(text, text, text[], bigint, bigint, text, date, integer, text, text, boolean) to authenticated;
