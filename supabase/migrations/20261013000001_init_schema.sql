-- =============================================================================
-- Wedding Planner Indonesia — skema awal, RLS, dan integritas lintas workspace
-- =============================================================================
-- Prinsip:
--  * Semua nominal rupiah = BIGINT (bukan float), selalu >= 0.
--  * Satu pemilik per workspace (MVP). Satu workspace per akun (unique owner_id).
--  * Tabel anak memakai FOREIGN KEY KOMPOSIT (id, wedding_id) sehingga record dari
--    workspace berbeda TIDAK BISA saling terhubung, bahkan jika RLS keliru.
--  * RLS aktif di semua tabel; tiap tabel privat punya kebijakan SELECT/INSERT/UPDATE/DELETE
--    sendiri yang memverifikasi kepemilikan workspace.
-- =============================================================================

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Utilitas
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- profiles
-- -----------------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text check (char_length(full_name) <= 120),
  avatar_url  text check (char_length(avatar_url) <= 2048),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Profil dibuat oleh server saat user baru terdaftar (email maupun Google),
-- sehingga browser tidak pernah mengirim user ID sebagai bukti kepemilikan.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'), 120),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- weddings (workspace)
-- -----------------------------------------------------------------------------
create table public.weddings (
  id               uuid primary key default gen_random_uuid(),
  owner_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title            text not null check (char_length(title) between 1 and 120),
  partner_names    text check (char_length(partner_names) <= 160),
  wedding_date     date,
  city             text not null check (char_length(city) between 1 and 80),
  event_types      text[] not null default '{}'
                   check (event_types <@ array['lamaran','akad','resepsi','akad_resepsi','keluarga']::text[]),
  guest_estimate   integer check (guest_estimate is null or guest_estimate between 0 and 100000),
  budget_target    bigint not null default 0 check (budget_target >= 0),
  available_funds  bigint not null default 0 check (available_funds >= 0),
  wedding_style    text check (char_length(wedding_style) <= 60),
  tradition        text check (char_length(tradition) <= 60),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint weddings_one_per_owner unique (owner_id)
);

create trigger weddings_updated_at before update on public.weddings
  for each row execute function public.set_updated_at();

-- Helper kepemilikan. SECURITY DEFINER agar bisa dipakai di kebijakan tabel anak
-- tanpa rekursi RLS; hanya mengembalikan boolean untuk auth.uid() pemanggil.
create or replace function public.is_wedding_owner(target_wedding_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.weddings w
    where w.id = target_wedding_id
      and w.owner_id = (select auth.uid())
  );
$$;

revoke all on function public.is_wedding_owner(uuid) from public, anon;
grant execute on function public.is_wedding_owner(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- budget_categories
-- -----------------------------------------------------------------------------
create table public.budget_categories (
  id              uuid primary key default gen_random_uuid(),
  wedding_id      uuid not null references public.weddings (id) on delete cascade,
  name            text not null check (char_length(name) between 1 and 80),
  planned_amount  bigint not null default 0 check (planned_amount >= 0),
  is_reserve      boolean not null default false,
  is_archived     boolean not null default false,
  sort_order      integer not null default 0,
  notes           text check (char_length(notes) <= 2000),
  template_key    text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint budget_categories_id_wedding unique (id, wedding_id)
);
create unique index budget_categories_template_uniq
  on public.budget_categories (wedding_id, template_key) where template_key is not null;
create index budget_categories_wedding_idx on public.budget_categories (wedding_id, sort_order);

create trigger budget_categories_updated_at before update on public.budget_categories
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- vendors (direktori publik — hanya dikelola pengelola direktori, bukan user)
-- -----------------------------------------------------------------------------
create table public.vendors (
  id                   uuid primary key default gen_random_uuid(),
  name                 text not null check (char_length(name) between 1 and 120),
  category             text not null check (category in (
                         'venue','katering','dekorasi','mua','busana','foto_video',
                         'undangan','souvenir','hiburan','wedding_organizer','lainnya')),
  city                 text not null,
  service_areas        text[] not null default '{}',
  description          text,
  services             text[] not null default '{}',
  capacity_note        text,
  price_min            bigint check (price_min is null or price_min >= 0),
  price_max            bigint check (price_max is null or price_max >= 0),
  price_is_estimate    boolean not null default true,
  price_updated_at     timestamptz,
  contact_url          text,
  website_url          text,
  instagram_url        text,
  verification_status  text not null default 'unverified'
                       check (verification_status in ('unverified','verified')),
  is_published         boolean not null default false,
  info_updated_at      timestamptz not null default now(),
  created_at           timestamptz not null default now(),
  constraint vendors_price_range check (price_min is null or price_max is null or price_min <= price_max)
);
create index vendors_directory_idx on public.vendors (is_published, category, city);

-- -----------------------------------------------------------------------------
-- wedding_vendors (vendor tersimpan / vendor pribadi milik workspace)
-- -----------------------------------------------------------------------------
create table public.wedding_vendors (
  id                uuid primary key default gen_random_uuid(),
  wedding_id        uuid not null references public.weddings (id) on delete cascade,
  vendor_id         uuid references public.vendors (id) on delete set null,
  category_id       uuid,
  custom_name       text check (char_length(custom_name) <= 120),
  vendor_category   text,
  status            text not null default 'kandidat'
                    check (status in ('kandidat','dihubungi','dipertimbangkan','dipilih','dibatalkan')),
  quoted_amount     bigint check (quoted_amount is null or quoted_amount >= 0),
  contract_amount   bigint check (contract_amount is null or contract_amount >= 0),
  service_scope     text check (char_length(service_scope) <= 4000),
  extra_costs_note  text check (char_length(extra_costs_note) <= 2000),
  contact_note      text check (char_length(contact_note) <= 500),
  notes             text check (char_length(notes) <= 4000),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint wedding_vendors_identity check (vendor_id is not null or nullif(trim(custom_name), '') is not null),
  constraint wedding_vendors_id_wedding unique (id, wedding_id),
  -- kategori anggaran harus milik workspace yang sama
  constraint wedding_vendors_category_fk foreign key (category_id, wedding_id)
    references public.budget_categories (id, wedding_id) on delete set null (category_id)
);
create index wedding_vendors_wedding_idx on public.wedding_vendors (wedding_id, status);

create trigger wedding_vendors_updated_at before update on public.wedding_vendors
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- expenses (pengeluaran langsung, di luar pembayaran kontrak vendor)
-- -----------------------------------------------------------------------------
-- Aturan anti-hitung-ganda: pembayaran atas kontrak vendor (DP, termin, pelunasan)
-- dicatat di tabel `payments`. Tabel `expenses` hanya untuk pengeluaran yang tidak
-- berupa kontrak vendor. Karena itu expenses TIDAK punya relasi ke wedding_vendors.
-- -----------------------------------------------------------------------------
create table public.expenses (
  id             uuid primary key default gen_random_uuid(),
  wedding_id     uuid not null references public.weddings (id) on delete cascade,
  category_id    uuid not null,
  vendor_id      uuid references public.vendors (id) on delete set null, -- referensi direktori saja
  title          text not null check (char_length(title) between 1 and 120),
  amount         bigint not null check (amount >= 0),
  expense_date   date,
  status         text not null default 'paid' check (status in ('planned','paid','cancelled')),
  fund_source    text check (char_length(fund_source) <= 80),
  proof_path     text,
  notes          text check (char_length(notes) <= 2000),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  -- NO ACTION (bukan RESTRICT) agar cascade dari weddings tetap berjalan;
  -- kategori yang masih punya transaksi tidak bisa dihapus → arsipkan.
  constraint expenses_category_fk foreign key (category_id, wedding_id)
    references public.budget_categories (id, wedding_id) on delete no action,
  constraint expenses_paid_has_date check (status <> 'paid' or expense_date is not null)
);
create index expenses_wedding_idx on public.expenses (wedding_id, expense_date desc);

create trigger expenses_updated_at before update on public.expenses
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- payments (jadwal & realisasi pembayaran kontrak vendor)
-- -----------------------------------------------------------------------------
create table public.payments (
  id                 uuid primary key default gen_random_uuid(),
  wedding_id         uuid not null references public.weddings (id) on delete cascade,
  wedding_vendor_id  uuid,
  amount             bigint not null check (amount > 0),
  payment_date       date,
  due_date           date,
  status             text not null default 'scheduled' check (status in ('scheduled','paid','cancelled')),
  payment_type       text not null default 'dp' check (payment_type in ('dp','termin','pelunasan','lainnya')),
  fund_source        text check (char_length(fund_source) <= 80),
  proof_path         text,
  notes              text check (char_length(notes) <= 2000),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint payments_vendor_fk foreign key (wedding_vendor_id, wedding_id)
    references public.wedding_vendors (id, wedding_id) on delete no action, -- riwayat pembayaran tidak boleh hilang diam-diam
  constraint payments_paid_has_date check (status <> 'paid' or payment_date is not null)
);
create index payments_wedding_idx on public.payments (wedding_id, status, due_date);

create trigger payments_updated_at before update on public.payments
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- tasks (checklist & timeline)
-- -----------------------------------------------------------------------------
create table public.tasks (
  id            uuid primary key default gen_random_uuid(),
  wedding_id    uuid not null references public.weddings (id) on delete cascade,
  title         text not null check (char_length(title) between 1 and 160),
  category      text not null default 'lainnya',
  due_date      date,
  status        text not null default 'todo' check (status in ('todo','in_progress','done')),
  priority      text not null default 'medium' check (priority in ('low','medium','high')),
  assignee      text check (char_length(assignee) <= 80),
  notes         text check (char_length(notes) <= 2000),
  is_archived   boolean not null default false,
  sort_order    integer not null default 0,
  template_key  text,
  completed_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
-- Template checklist tidak pernah terduplikasi per workspace
create unique index tasks_template_uniq on public.tasks (wedding_id, template_key) where template_key is not null;
create index tasks_wedding_idx on public.tasks (wedding_id, status, due_date);

create trigger tasks_updated_at before update on public.tasks
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- guests
-- -----------------------------------------------------------------------------
create table public.guests (
  id                 uuid primary key default gen_random_uuid(),
  wedding_id         uuid not null references public.weddings (id) on delete cascade,
  name               text not null check (char_length(name) between 1 and 160),
  group_name         text check (char_length(group_name) <= 80),
  guest_count        integer not null default 1 check (guest_count between 1 and 1000),
  invitation_status  text not null default 'belum' check (invitation_status in ('belum','terkirim')),
  rsvp_status        text not null default 'menunggu' check (rsvp_status in ('menunggu','hadir','tidak_hadir')),
  notes              text check (char_length(notes) <= 1000),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index guests_wedding_idx on public.guests (wedding_id, name);

create trigger guests_updated_at before update on public.guests
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- rundown_items
-- -----------------------------------------------------------------------------
create table public.rundown_items (
  id                uuid primary key default gen_random_uuid(),
  wedding_id        uuid not null references public.weddings (id) on delete cascade,
  title             text not null check (char_length(title) between 1 and 160),
  starts_at         timestamptz,
  ends_at           timestamptz,
  location          text check (char_length(location) <= 160),
  person_in_charge  text check (char_length(person_in_charge) <= 80),
  sort_order        integer not null default 0,
  notes             text check (char_length(notes) <= 2000),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint rundown_time_order check (starts_at is null or ends_at is null or ends_at >= starts_at)
);
create index rundown_wedding_idx on public.rundown_items (wedding_id, sort_order);

create trigger rundown_items_updated_at before update on public.rundown_items
  for each row execute function public.set_updated_at();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
alter table public.profiles         enable row level security;
alter table public.weddings         enable row level security;
alter table public.budget_categories enable row level security;
alter table public.vendors          enable row level security;
alter table public.wedding_vendors  enable row level security;
alter table public.expenses         enable row level security;
alter table public.payments         enable row level security;
alter table public.tasks            enable row level security;
alter table public.guests           enable row level security;
alter table public.rundown_items    enable row level security;

-- profiles: hanya pemilik. INSERT dilakukan trigger server, bukan browser.
create policy "Own profile: select" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "Own profile: update" on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- weddings
create policy "Owner can read wedding" on public.weddings
  for select to authenticated using (owner_id = (select auth.uid()));
create policy "Owner can create wedding" on public.weddings
  for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "Owner can update wedding" on public.weddings
  for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "Owner can delete wedding" on public.weddings
  for delete to authenticated using (owner_id = (select auth.uid()));

-- Tabel anak: kebijakan eksplisit per tabel & per perintah, masing-masing
-- memverifikasi kepemilikan workspace lewat wedding_id.
do $$
declare
  t text;
begin
  foreach t in array array[
    'budget_categories','wedding_vendors','expenses','payments','tasks','guests','rundown_items'
  ] loop
    execute format(
      'create policy "Workspace owner: select" on public.%I for select to authenticated
         using (public.is_wedding_owner(wedding_id))', t);
    execute format(
      'create policy "Workspace owner: insert" on public.%I for insert to authenticated
         with check (public.is_wedding_owner(wedding_id))', t);
    execute format(
      'create policy "Workspace owner: update" on public.%I for update to authenticated
         using (public.is_wedding_owner(wedding_id))
         with check (public.is_wedding_owner(wedding_id))', t);
    execute format(
      'create policy "Workspace owner: delete" on public.%I for delete to authenticated
         using (public.is_wedding_owner(wedding_id))', t);
  end loop;
end;
$$;

-- vendors: publik hanya bisa membaca vendor yang dipublikasikan. Tidak ada kebijakan
-- INSERT/UPDATE/DELETE → hanya service role (pengelola direktori) yang bisa mengubah.
create policy "Published vendors are public" on public.vendors
  for select to anon, authenticated using (is_published = true);

-- Hak tabel: anon hanya boleh membaca direktori vendor.
revoke all on all tables in schema public from anon;
grant select on public.vendors to anon;

-- =============================================================================
-- STORAGE: bukti pembayaran & kontrak (bucket privat)
-- Struktur path wajib: <wedding_id>/<nama-file>
-- =============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('wedding-files', 'wedding-files', false, 5242880,
        array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do nothing;

create policy "Owner can read wedding files" on storage.objects
  for select to authenticated
  using (bucket_id = 'wedding-files' and exists (
    select 1 from public.weddings w
    where w.id::text = (storage.foldername(name))[1] and w.owner_id = (select auth.uid())));

create policy "Owner can upload wedding files" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'wedding-files' and exists (
    select 1 from public.weddings w
    where w.id::text = (storage.foldername(name))[1] and w.owner_id = (select auth.uid())));

create policy "Owner can update wedding files" on storage.objects
  for update to authenticated
  using (bucket_id = 'wedding-files' and exists (
    select 1 from public.weddings w
    where w.id::text = (storage.foldername(name))[1] and w.owner_id = (select auth.uid())))
  with check (bucket_id = 'wedding-files' and exists (
    select 1 from public.weddings w
    where w.id::text = (storage.foldername(name))[1] and w.owner_id = (select auth.uid())));

create policy "Owner can delete wedding files" on storage.objects
  for delete to authenticated
  using (bucket_id = 'wedding-files' and exists (
    select 1 from public.weddings w
    where w.id::text = (storage.foldername(name))[1] and w.owner_id = (select auth.uid())));
