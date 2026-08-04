-- ============================================================
-- Product Images Storage (Supabase Storage)
-- Bucket: products-images (public read, authorized write/delete)
-- ============================================================

-- Create the bucket (public so images are serveable without auth)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'products-images',
  'products-images',
  true,
  5242880,  -- 5 MB per file
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']::text[]
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ============================================================
-- Storage policies for bucket products-images
-- Reuse is_authorized_user() so only Boss + AI account can write/delete
-- ============================================================

-- Public read: anyone (even anonymous) can read product images
create policy "Public can read product images"
  on storage.objects
  for select
  using ( bucket_id = 'products-images' );

-- Authorized users can upload
create policy "Authorized users can upload product images"
  on storage.objects
  for insert
  with check (
    bucket_id = 'products-images'
    and public.is_authorized_user()
  );

-- Authorized users can update (overwrite) their objects
create policy "Authorized users can update product images"
  on storage.objects
  for update
  using (
    bucket_id = 'products-images'
    and public.is_authorized_user()
  );

-- Authorized users can delete
create policy "Authorized users can delete product images"
  on storage.objects
  for delete
  using (
    bucket_id = 'products-images'
    and public.is_authorized_user()
  );
