-- =============================================================================
-- Anggaran per acara + realisasi (aktual) per item
--
-- Lamaran, prewedding, wedding, dan honeymoon terjadi di hari berbeda dan
-- masing-masing punya pos sendiri (Make up lamaran ≠ Make up wedding).
-- Struktur: budget_events (acara) → budget_categories (pos) → expenses (item).
--
-- - budget_events: acara milik workspace, bisa ditambah/ubah/hapus (CRUD).
--   Hapus acara TIDAK menghapus pos: pos menjadi "tanpa acara" (event_id null).
-- - budget_categories.event_id: FK komposit (id, wedding_id) agar pos tidak
--   bisa ditautkan ke acara workspace lain.
-- - expenses.actual_amount: nominal yang benar-benar dibayar. `amount` tetap
--   harga rencana/anggaran item. Item lunas dihitung memakai
--   coalesce(actual_amount, amount).
-- - Workspace baru otomatis mendapat 4 acara bawaan; pos template dari
--   create_wedding_workspace masuk ke acara "Wedding".
-- =============================================================================

create table public.budget_events (
  id            uuid primary key default gen_random_uuid(),
  wedding_id    uuid not null references public.weddings (id) on delete cascade,
  name          text not null check (char_length(trim(name)) between 1 and 60),
  icon          text not null default 'sparkles' check (icon ~ '^[a-z-]{1,30}$'),
  event_date    date,
  sort_order    integer not null default 0,
  template_key  text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint budget_events_id_wedding unique (id, wedding_id)
);
create unique index budget_events_template_uniq
  on public.budget_events (wedding_id, template_key) where template_key is not null;
create index budget_events_wedding_idx on public.budget_events (wedding_id, sort_order);

create trigger budget_events_updated_at before update on public.budget_events
  for each row execute function public.set_updated_at();

alter table public.budget_events enable row level security;

create policy "Workspace member: select" on public.budget_events
  for select to authenticated using (public.is_wedding_member(wedding_id));
create policy "Workspace member: insert" on public.budget_events
  for insert to authenticated with check (public.is_wedding_member(wedding_id));
create policy "Workspace member: update" on public.budget_events
  for update to authenticated
  using (public.is_wedding_member(wedding_id))
  with check (public.is_wedding_member(wedding_id));
create policy "Workspace member: delete" on public.budget_events
  for delete to authenticated using (public.is_wedding_member(wedding_id));

revoke all on public.budget_events from anon;

-- Pos → acara (workspace yang sama)
alter table public.budget_categories add column event_id uuid;
alter table public.budget_categories
  add constraint budget_categories_event_fk foreign key (event_id, wedding_id)
  references public.budget_events (id, wedding_id) on delete set null (event_id);
create index budget_categories_event_idx on public.budget_categories (event_id);

-- Realisasi item
alter table public.expenses
  add column actual_amount bigint
  constraint expenses_actual_amount_check check (actual_amount is null or actual_amount >= 0);

-- -----------------------------------------------------------------------------
-- Acara bawaan
-- -----------------------------------------------------------------------------
create or replace function public.seed_budget_events(p_wedding_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.budget_events (wedding_id, name, icon, sort_order, template_key)
  values
    (p_wedding_id, 'Lamaran',    'heart-handshake', 1, 'lamaran'),
    (p_wedding_id, 'Prewedding', 'camera',          2, 'prewedding'),
    (p_wedding_id, 'Wedding',    'gem',             3, 'wedding'),
    (p_wedding_id, 'Honeymoon',  'plane',           4, 'honeymoon')
  on conflict (wedding_id, template_key) where template_key is not null do nothing;
$$;
revoke all on function public.seed_budget_events(uuid) from public, anon, authenticated;

create or replace function public.weddings_seed_budget_events()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.seed_budget_events(new.id);
  return null;
end;
$$;
revoke all on function public.weddings_seed_budget_events() from public, anon, authenticated;

create trigger weddings_seed_budget_events
  after insert on public.weddings
  for each row execute function public.weddings_seed_budget_events();

-- Pos template (dibuat saat onboarding) otomatis masuk acara "Wedding".
create or replace function public.budget_categories_default_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.event_id is null and new.template_key is not null then
    select e.id into new.event_id
      from public.budget_events e
     where e.wedding_id = new.wedding_id and e.template_key = 'wedding';
  end if;
  return new;
end;
$$;
revoke all on function public.budget_categories_default_event() from public, anon, authenticated;

create trigger budget_categories_default_event
  before insert on public.budget_categories
  for each row execute function public.budget_categories_default_event();

-- -----------------------------------------------------------------------------
-- Data lama: buat acara bawaan lalu kelompokkan pos yang sudah ada.
-- -----------------------------------------------------------------------------
do $$
declare
  w record;
begin
  for w in select id from public.weddings loop
    perform public.seed_budget_events(w.id);
  end loop;
end;
$$;

update public.budget_categories c
   set event_id = e.id
  from public.budget_events e
 where c.event_id is null
   and e.wedding_id = c.wedding_id
   and e.template_key = case
         when c.name ~* 'honeymoon|bulan madu' then 'honeymoon'
         when c.name ~* 'prewed|pre-wed|pra ?nikah' then 'prewedding'
         when c.name ~* 'lamaran|tunangan|khitbah' then 'lamaran'
         else 'wedding'
       end;
