-- =============================================================================
-- Anggaran: rincian item per pos
-- - expenses.link_url: tautan toko (Shopee, Tokopedia, IG vendor) agar item
--   yang direncanakan bisa langsung dibuka saat mau dibeli.
-- - delete_budget_category(): hapus pos beserta itemnya dalam satu transaksi.
--   FK expenses → budget_categories sengaja NO ACTION (hapus pos tidak boleh
--   menghapus transaksi diam-diam), jadi penghapusan harus eksplisit lewat sini.
-- =============================================================================

alter table public.expenses
  add column link_url text
  check (link_url is null or (char_length(link_url) <= 2000 and link_url ~* '^https?://'));

-- SECURITY INVOKER: RLS tabel tetap berlaku untuk pemanggil (anggota workspace).
create or replace function public.delete_budget_category(p_category_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_wedding uuid;
begin
  select wedding_id into v_wedding from public.budget_categories where id = p_category_id;
  if v_wedding is null then
    raise exception 'Pos anggaran tidak ditemukan' using errcode = 'P0002';
  end if;
  delete from public.expenses where category_id = p_category_id and wedding_id = v_wedding;
  delete from public.budget_categories where id = p_category_id;
end;
$$;

revoke all on function public.delete_budget_category(uuid) from public, anon;
grant execute on function public.delete_budget_category(uuid) to authenticated;
