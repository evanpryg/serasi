-- =============================================================================
-- Tamu dibagi per pihak (CPP = pria, CPW = wanita) + kategori baku.
--   side       : 'cpp' | 'cpw' — tamu undangan dari pihak siapa
--   group_name : kategori (Saudara, Teman/Sahabat, Rekan kerja, Tetangga, ...)
-- Data lama: pihak ditebak dari nama kelompok ("Keluarga Wanita" → cpw),
-- nama kelompok lama diseragamkan ke kategori baku.
-- =============================================================================

alter table public.guests
  add column if not exists side text check (side in ('cpp', 'cpw'));

update public.guests
   set side = case when group_name ilike '%wanita%' then 'cpw' else 'cpp' end
 where side is null;

alter table public.guests
  alter column side set default 'cpp',
  alter column side set not null;

update public.guests set group_name = case
    when group_name ilike 'keluarga%' or group_name ilike 'saudara%' then 'Saudara'
    when group_name ilike '%sahabat%' or group_name ilike 'teman%' or group_name ilike 'alumni%' then 'Teman/Sahabat'
    when group_name ilike '%kolega%' or group_name ilike 'rekan%' or group_name ilike '%kantor%' then 'Rekan kerja'
    when group_name ilike 'tetangga%' then 'Tetangga'
    when group_name ilike 'vip%' or group_name ilike 'tokoh%' then 'Tokoh/VIP'
    when group_name is null or btrim(group_name) = '' then 'Lainnya'
    else group_name
  end;

create index if not exists guests_wedding_side_idx on public.guests (wedding_id, side, group_name);
