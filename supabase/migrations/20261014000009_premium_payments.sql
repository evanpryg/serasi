-- =============================================================================
-- Paket Premium + pembayaran QRIS (verifikasi manual oleh admin)
-- =============================================================================
-- Alur:
--  1. Anggota workspace memanggil create_payment_order() → server menghitung nominal
--     = harga paket − kode unik (1–499). Nominal unik di antara pesanan terbuka, jadi
--     admin bisa mencocokkan dana masuk di aplikasi merchant QRIS.
--  2. Pengguna membayar lewat QRIS lalu memanggil claim_payment_order() → menunggu verifikasi.
--  3. Admin (tabel app_admins) memanggil admin_review_payment() → hak Premium aktif untuk
--     SELURUH workspace (berdua), sekali bayar, tanpa masa berlaku.
--
-- Prinsip keamanan:
--  * Status Premium TIDAK disimpan di tabel weddings (anggota boleh meng-update weddings).
--  * wedding_entitlements & payment_orders hanya bisa ditulis lewat fungsi SECURITY DEFINER.
--  * Batas paket Gratis dijaga database (trigger / kebijakan RESTRICTIVE), bukan hanya UI.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Katalog harga (ubah harga cukup lewat UPDATE di SQL editor, tanpa deploy)
-- -----------------------------------------------------------------------------
create table public.plans (
  id          text primary key check (id ~ '^[a-z_]{2,30}$'),
  name        text not null check (char_length(name) between 1 and 60),
  price       bigint not null check (price between 1000 and 100000000),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger plans_updated_at before update on public.plans
  for each row execute function public.set_updated_at();

insert into public.plans (id, name, price) values ('premium', 'Serasi Premium', 99000);

alter table public.plans enable row level security;
create policy "Plans: public read" on public.plans for select to anon, authenticated using (is_active);
revoke all on public.plans from anon, authenticated;
grant select on public.plans to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Admin aplikasi (pemilik Serasi). Tambah lewat SQL editor:
--   insert into public.app_admins (user_id) select id from auth.users where email = '...';
-- -----------------------------------------------------------------------------
create table public.app_admins (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now()
);
alter table public.app_admins enable row level security;
revoke all on public.app_admins from anon, authenticated;

create or replace function public.is_app_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.app_admins a where a.user_id = (select auth.uid()));
$$;

-- -----------------------------------------------------------------------------
-- Hak Premium per workspace
-- -----------------------------------------------------------------------------
create table public.wedding_entitlements (
  wedding_id    uuid primary key references public.weddings (id) on delete cascade,
  plan_id       text not null references public.plans (id),
  order_id      uuid,
  activated_at  timestamptz not null default now(),
  activated_by  uuid references auth.users (id) on delete set null,
  -- null = selamanya
  expires_at    timestamptz
);
alter table public.wedding_entitlements enable row level security;
create policy "Entitlements: members read" on public.wedding_entitlements
  for select to authenticated using (public.is_wedding_member(wedding_id) or public.is_app_admin());
revoke all on public.wedding_entitlements from anon, authenticated;
grant select on public.wedding_entitlements to authenticated;

create or replace function public.is_wedding_premium(target_wedding_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.wedding_entitlements e
    where e.wedding_id = target_wedding_id and (e.expires_at is null or e.expires_at > now())
  );
$$;

-- Versi aman untuk path storage: teks yang bukan UUID → false (bukan error).
create or replace function public.is_wedding_premium_path(folder text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when folder ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then public.is_wedding_premium(folder::uuid)
    else false
  end;
$$;

-- -----------------------------------------------------------------------------
-- Pesanan pembayaran
-- -----------------------------------------------------------------------------
create table public.payment_orders (
  id           uuid primary key default gen_random_uuid(),
  code         text not null unique check (code ~ '^SRS-[A-HJ-NP-Z2-9]{6}$'),
  wedding_id   uuid not null references public.weddings (id) on delete cascade,
  user_id      uuid not null references auth.users (id) on delete cascade,
  plan_id      text not null references public.plans (id),
  base_amount  bigint not null check (base_amount > 0),
  unique_code  integer not null check (unique_code between 1 and 499),
  amount       bigint not null check (amount > 0),
  status       text not null default 'pending'
               check (status in ('pending', 'awaiting_verification', 'paid', 'rejected', 'expired', 'cancelled')),
  payer_name   text check (char_length(payer_name) <= 80),
  claimed_at   timestamptz,
  reviewed_at  timestamptz,
  reviewed_by  uuid references auth.users (id) on delete set null,
  admin_note   text check (char_length(admin_note) <= 300),
  expires_at   timestamptz not null default now() + interval '24 hours',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint payment_orders_amount_matches check (amount = base_amount - unique_code)
);
create trigger payment_orders_updated_at before update on public.payment_orders
  for each row execute function public.set_updated_at();
create index payment_orders_wedding_idx on public.payment_orders (wedding_id, created_at desc);
-- Nominal unik selama pesanan masih terbuka → admin bisa mencocokkan dana masuk.
create unique index payment_orders_open_amount on public.payment_orders (amount)
  where status in ('pending', 'awaiting_verification');

alter table public.payment_orders enable row level security;
create policy "Orders: members read" on public.payment_orders
  for select to authenticated using (public.is_wedding_member(wedding_id) or public.is_app_admin());
revoke all on public.payment_orders from anon, authenticated;
grant select on public.payment_orders to authenticated;

-- Buat (atau lanjutkan) pesanan untuk workspace pemanggil.
create or replace function public.create_payment_order(p_wedding_id uuid, p_plan_id text default 'premium')
returns public.payment_orders
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_price bigint;
  v_order public.payment_orders;
  v_alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_bytes bytea;
  v_code text;
  v_unique integer;
  v_try integer := 0;
  v_i integer;
begin
  if v_uid is null or not public.is_wedding_member(p_wedding_id) then
    raise exception 'Bukan anggota workspace ini' using errcode = '42501';
  end if;
  if public.is_wedding_premium(p_wedding_id) then
    raise exception 'Workspace ini sudah Premium' using errcode = '23505';
  end if;
  select price into v_price from public.plans where id = p_plan_id and is_active;
  if v_price is null then
    raise exception 'Paket tidak tersedia' using errcode = 'P0002';
  end if;

  -- Bebaskan nominal dari pesanan yang kedaluwarsa (semua workspace).
  update public.payment_orders set status = 'expired'
   where status = 'pending' and expires_at <= now();

  -- Satu pesanan terbuka per workspace: lanjutkan yang sudah ada.
  select * into v_order from public.payment_orders
   where wedding_id = p_wedding_id and status in ('pending', 'awaiting_verification')
   order by created_at desc limit 1;
  if found then
    return v_order;
  end if;

  loop
    v_try := v_try + 1;
    if v_try > 40 then
      raise exception 'Sedang banyak pembayaran, coba lagi sebentar' using errcode = '55000';
    end if;
    v_bytes := decode(replace(gen_random_uuid()::text, '-', ''), 'hex');
    v_code := 'SRS-';
    foreach v_i in array array[0, 1, 2, 3, 4, 5] loop
      v_code := v_code || substr(v_alphabet, (get_byte(v_bytes, v_i) % 32) + 1, 1);
    end loop;
    v_unique := ((get_byte(v_bytes, 10) * 256 + get_byte(v_bytes, 11)) % 499) + 1;
    begin
      insert into public.payment_orders (code, wedding_id, user_id, plan_id, base_amount, unique_code, amount)
      values (v_code, p_wedding_id, v_uid, p_plan_id, v_price, v_unique, v_price - v_unique)
      returning * into v_order;
      return v_order;
    exception when unique_violation then
      -- nominal atau kode bentrok → coba angka lain
    end;
  end loop;
end;
$$;

-- Pengguna menyatakan sudah membayar.
create or replace function public.claim_payment_order(p_order_id uuid, p_payer_name text default null)
returns public.payment_orders
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.payment_orders;
begin
  select * into v_order from public.payment_orders where id = p_order_id for update;
  if not found or not public.is_wedding_member(v_order.wedding_id) then
    raise exception 'Pesanan tidak ditemukan' using errcode = 'P0002';
  end if;
  if v_order.status = 'awaiting_verification' then
    return v_order;
  end if;
  if v_order.status <> 'pending' or v_order.expires_at <= now() then
    raise exception 'Pesanan sudah tidak aktif. Buat pembayaran baru.' using errcode = '55000';
  end if;
  update public.payment_orders
     set status = 'awaiting_verification',
         claimed_at = now(),
         payer_name = nullif(left(trim(coalesce(p_payer_name, '')), 80), '')
   where id = p_order_id
  returning * into v_order;
  return v_order;
end;
$$;

-- Batalkan pesanan yang belum dibayar (misal ingin mulai ulang).
create or replace function public.cancel_payment_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_wedding uuid;
begin
  select wedding_id into v_wedding from public.payment_orders where id = p_order_id and status = 'pending';
  if v_wedding is null or not public.is_wedding_member(v_wedding) then
    raise exception 'Pesanan tidak ditemukan' using errcode = 'P0002';
  end if;
  update public.payment_orders set status = 'cancelled' where id = p_order_id;
end;
$$;

-- Daftar pesanan untuk admin (dengan nama workspace & email pemesan).
create or replace function public.admin_payment_orders(p_status text default null)
returns table (
  id uuid, code text, wedding_id uuid, wedding_title text, user_email text, user_name text,
  amount bigint, unique_code integer, status text, payer_name text,
  claimed_at timestamptz, reviewed_at timestamptz, admin_note text, expires_at timestamptz, created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_app_admin() then
    raise exception 'Khusus admin' using errcode = '42501';
  end if;
  return query
    select o.id, o.code, o.wedding_id, w.title, u.email::text, p.full_name,
           o.amount, o.unique_code,
           case when o.status = 'pending' and o.expires_at <= now() then 'expired' else o.status end,
           o.payer_name, o.claimed_at, o.reviewed_at, o.admin_note, o.expires_at, o.created_at
      from public.payment_orders o
      join public.weddings w on w.id = o.wedding_id
      left join auth.users u on u.id = o.user_id
      left join public.profiles p on p.id = o.user_id
     where p_status is null or o.status = p_status
     order by (o.status = 'awaiting_verification') desc, coalesce(o.claimed_at, o.created_at) desc
     limit 200;
end;
$$;

-- Admin menyetujui / menolak pembayaran.
create or replace function public.admin_review_payment(p_order_id uuid, p_approve boolean, p_note text default null)
returns public.payment_orders
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_order public.payment_orders;
begin
  if not public.is_app_admin() then
    raise exception 'Khusus admin' using errcode = '42501';
  end if;
  select * into v_order from public.payment_orders where id = p_order_id for update;
  if not found then
    raise exception 'Pesanan tidak ditemukan' using errcode = 'P0002';
  end if;
  if v_order.status in ('paid', 'cancelled') then
    raise exception 'Pesanan sudah %', v_order.status using errcode = '55000';
  end if;

  update public.payment_orders
     set status = case when p_approve then 'paid' else 'rejected' end,
         reviewed_at = now(),
         reviewed_by = v_uid,
         admin_note = nullif(left(trim(coalesce(p_note, '')), 300), '')
   where id = p_order_id
  returning * into v_order;

  if p_approve then
    insert into public.wedding_entitlements (wedding_id, plan_id, order_id, activated_by)
    values (v_order.wedding_id, v_order.plan_id, v_order.id, v_uid)
    on conflict (wedding_id) do update
      set plan_id = excluded.plan_id, order_id = excluded.order_id,
          activated_at = now(), activated_by = excluded.activated_by, expires_at = null;
    -- Pesanan lain milik workspace yang sama tidak perlu dibayar lagi.
    update public.payment_orders set status = 'cancelled'
     where wedding_id = v_order.wedding_id and id <> v_order.id and status in ('pending', 'awaiting_verification');
  end if;
  return v_order;
end;
$$;

-- -----------------------------------------------------------------------------
-- Batas paket Gratis (dijaga database)
-- -----------------------------------------------------------------------------
-- Ubah angka ini bersamaan dengan FREE_GUEST_LIMIT di src/lib/plans.ts.
create or replace function public.free_guest_limit()
returns integer
language sql
immutable
set search_path = ''
as $$ select 100 $$;

create or replace function public.enforce_guest_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.is_wedding_premium(new.wedding_id) then
    return new;
  end if;
  if (select count(*) from public.guests g where g.wedding_id = new.wedding_id) >= public.free_guest_limit() then
    raise exception 'Paket Gratis maksimal % undangan', public.free_guest_limit()
      using errcode = 'P0001', hint = 'premium_required';
  end if;
  return new;
end;
$$;
create trigger guests_free_limit before insert on public.guests
  for each row execute function public.enforce_guest_limit();

-- Deep talk: topik visi, iman, dan komunikasi gratis; topik lain Premium.
-- Ubah bersamaan dengan FREE_DEEPTALK_TOPICS di src/lib/plans.ts.
create or replace function public.deeptalk_question_is_free(q text)
returns boolean
language sql
immutable
set search_path = ''
as $$ select split_part(q, '_', 1) in ('visi', 'iman', 'kom') $$;

create policy "Deeptalk: premium topics" on public.deeptalk_answers
  as restrictive for insert to authenticated
  with check (public.deeptalk_question_is_free(question_id) or public.is_wedding_premium(wedding_id));
create policy "Deeptalk: premium topics (update)" on public.deeptalk_answers
  as restrictive for update to authenticated
  using (true)
  with check (public.deeptalk_question_is_free(question_id) or public.is_wedding_premium(wedding_id));

-- Foto item anggaran (<wedding>/items/…) khusus Premium. CASE menjamin urutan evaluasi.
create policy "Item photos need premium" on storage.objects
  as restrictive for insert to authenticated
  with check (
    case
      when bucket_id = 'wedding-files' and (storage.foldername(name))[2] = 'items'
        then public.is_wedding_premium_path((storage.foldername(name))[1])
      else true
    end
  );

-- -----------------------------------------------------------------------------
-- Hak eksekusi
-- -----------------------------------------------------------------------------
revoke all on function public.is_app_admin() from public, anon;
revoke all on function public.is_wedding_premium(uuid) from public, anon;
revoke all on function public.is_wedding_premium_path(text) from public, anon;
revoke all on function public.create_payment_order(uuid, text) from public, anon;
revoke all on function public.claim_payment_order(uuid, text) from public, anon;
revoke all on function public.cancel_payment_order(uuid) from public, anon;
revoke all on function public.admin_payment_orders(text) from public, anon;
revoke all on function public.admin_review_payment(uuid, boolean, text) from public, anon;
revoke all on function public.enforce_guest_limit() from public, anon, authenticated;
grant execute on function public.is_app_admin() to authenticated;
grant execute on function public.is_wedding_premium(uuid) to authenticated;
grant execute on function public.is_wedding_premium_path(text) to authenticated;
grant execute on function public.create_payment_order(uuid, text) to authenticated;
grant execute on function public.claim_payment_order(uuid, text) to authenticated;
grant execute on function public.cancel_payment_order(uuid) to authenticated;
grant execute on function public.admin_payment_orders(text) to authenticated;
grant execute on function public.admin_review_payment(uuid, boolean, text) to authenticated;
grant execute on function public.free_guest_limit() to anon, authenticated;
grant execute on function public.deeptalk_question_is_free(text) to anon, authenticated;
