-- Run in the Supabase SQL editor, after 004_create_indexes.sql.
--
-- Assumes `uploaded_images.user_id` corresponds to Supabase Auth's
-- auth.uid() (i.e. the client queries Supabase directly using the user's
-- session JWT, not the service role key). The FastAPI backend itself uses
-- the service role key, which bypasses RLS entirely — these policies only
-- constrain direct client-side access to Supabase.

alter table products enable row level security;
alter table uploaded_images enable row level security;

-- Products: publicly readable, writes only via the backend's service role key.
create policy "products_public_read"
    on products
    for select
    using (true);

-- Uploaded images: owner-only read/write.
create policy "uploaded_images_owner_select"
    on uploaded_images
    for select
    using (auth.uid() = user_id);

create policy "uploaded_images_owner_insert"
    on uploaded_images
    for insert
    with check (auth.uid() = user_id);

create policy "uploaded_images_owner_update"
    on uploaded_images
    for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "uploaded_images_owner_delete"
    on uploaded_images
    for delete
    using (auth.uid() = user_id);
