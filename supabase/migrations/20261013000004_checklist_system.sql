-- =============================================================================
-- Migration: 20261013000004_checklist_system.sql
-- Checklist Persiapan Pernikahan Bertingkat, Seserahan, Dokumen, dan Anggaran
-- =============================================================================

alter table public.tasks
  add column if not exists event text not null default 'pernikahan',
  add column if not exists subcategory text,
  add column if not exists estimated_cost bigint check (estimated_cost is null or estimated_cost >= 0),
  add column if not exists actual_cost bigint check (actual_cost is null or actual_cost >= 0),
  add column if not exists quantity integer check (quantity is null or quantity >= 0),
  add column if not exists unit text,
  add column if not exists product_url text,
  add column if not exists vendor_store_name text,
  add column if not exists item_status text,
  add column if not exists is_custom boolean not null default false;

create index if not exists tasks_event_category_idx on public.tasks (wedding_id, event, category);
create index if not exists tasks_due_priority_idx on public.tasks (wedding_id, due_date, priority);
