-- =============================================================================
-- STORAGE: bucket publik untuk foto profil / avatar pengguna
-- Struktur path: <user_id>/avatar-<timestamp>.webp
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 5242880,
        array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Siapa saja (termasuk pasangan atau guest) dapat melihat foto profil
drop policy if exists "Public avatar read" on storage.objects;
create policy "Public avatar read" on storage.objects
  for select to public
  using (bucket_id = 'avatars');

-- User hanya boleh mengunggah foto profil ke folder ID-nya sendiri
drop policy if exists "User can upload own avatar" on storage.objects;
create policy "User can upload own avatar" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- User hanya boleh memperbarui foto profil di folder ID-nya sendiri
drop policy if exists "User can update own avatar" on storage.objects;
create policy "User can update own avatar" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- User hanya boleh menghapus foto profil di folder ID-nya sendiri
drop policy if exists "User can delete own avatar" on storage.objects;
create policy "User can delete own avatar" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
