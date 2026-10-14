-- =============================================================================
-- Migration: Konfigurasi Admin evanpray2242@gmail.com & Manajemen User Premium
-- =============================================================================

-- 1. Pastikan tabel app_admins ada
create table if not exists public.app_admins (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now()
);
alter table public.app_admins enable row level security;
revoke all on public.app_admins from anon, authenticated;

-- 2. Daftarkan evanpray2242@gmail.com sebagai admin jika akun sudah ada di auth.users
insert into public.app_admins (user_id)
select id from auth.users
 where lower(trim(email)) = 'evanpray2242@gmail.com'
on conflict (user_id) do nothing;

-- 3. Fungsi is_app_admin yang memverifikasi apakah pemanggil adalah admin aplikasi
create or replace function public.is_app_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.app_admins a where a.user_id = (select auth.uid())
  ) or exists (
    select 1 from auth.users u
     where u.id = (select auth.uid())
       and lower(trim(u.email)) = 'evanpray2242@gmail.com'
  ) or (
    lower(coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb->>'email', '')) = 'evanpray2242@gmail.com'
  );
$$;

-- 4. Trigger auto-daftar admin saat evanpray2242@gmail.com baru mendaftar
create or replace function public.handle_admin_user_signup()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if lower(trim(new.email)) = 'evanpray2242@gmail.com' then
    insert into public.app_admins (user_id)
    values (new.id)
    on conflict (user_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_admin_user_created on auth.users;
create trigger on_admin_user_created
  after insert on auth.users
  for each row execute function public.handle_admin_user_signup();

-- 5. RPC untuk admin: Menampilkan daftar seluruh workspace pernikahan & status Premium
create or replace function public.admin_list_workspaces(p_search text default null)
returns table (
  wedding_id uuid,
  title text,
  owner_name text,
  owner_email text,
  partner_name text,
  partner_email text,
  is_premium boolean,
  plan_id text,
  activated_at timestamptz,
  created_at timestamptz
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
  select
    w.id as wedding_id,
    w.title,
    po.full_name as owner_name,
    uo.email::text as owner_email,
    pp.full_name as partner_name,
    up.email::text as partner_email,
    (e.wedding_id is not null and (e.expires_at is null or e.expires_at > now())) as is_premium,
    e.plan_id,
    e.activated_at,
    w.created_at
  from public.weddings w
  left join public.wedding_members mo on mo.wedding_id = w.id and mo.role = 'owner'
  left join auth.users uo on uo.id = mo.user_id
  left join public.profiles po on po.id = mo.user_id
  left join public.wedding_members mp on mp.wedding_id = w.id and mp.role = 'partner'
  left join auth.users up on up.id = mp.user_id
  left join public.profiles pp on pp.id = mp.user_id
  left join public.wedding_entitlements e on e.wedding_id = w.id
  where p_search is null
     or p_search = ''
     or w.title ilike '%' || p_search || '%'
     or uo.email ilike '%' || p_search || '%'
     or po.full_name ilike '%' || p_search || '%'
     or up.email ilike '%' || p_search || '%'
     or pp.full_name ilike '%' || p_search || '%'
  order by (e.wedding_id is not null) desc, w.created_at desc
  limit 100;
end;
$$;

-- 6. RPC untuk admin: Langsung mengaktifkan atau menonaktifkan status Premium suatu workspace
create or replace function public.admin_set_wedding_premium(
  p_wedding_id uuid,
  p_is_premium boolean,
  p_note text default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if not public.is_app_admin() then
    raise exception 'Khusus admin' using errcode = '42501';
  end if;

  if p_is_premium then
    insert into public.wedding_entitlements (wedding_id, plan_id, activated_at, activated_by, expires_at)
    values (p_wedding_id, 'premium', now(), v_uid, null)
    on conflict (wedding_id) do update
      set plan_id = 'premium', activated_at = now(), activated_by = v_uid, expires_at = null;
  else
    delete from public.wedding_entitlements where wedding_id = p_wedding_id;
  end if;

  return true;
end;
$$;

-- Izin akses RPC untuk authenticated user (tetap dilindungi is_app_admin di dalam fungsi)
revoke all on function public.admin_list_workspaces(text) from public, anon;
grant execute on function public.admin_list_workspaces(text) to authenticated;

revoke all on function public.admin_set_wedding_premium(uuid, boolean, text) from public, anon;
grant execute on function public.admin_set_wedding_premium(uuid, boolean, text) to authenticated;
