-- Combined migration: run this whole file once in the Supabase SQL editor.
-- Equivalent to running 001..007 in order. Safe to re-run (all statements
-- are idempotent: create if not exists / create or replace).

-- ===== 001_enable_pgvector.sql =====
create extension if not exists vector;

-- ===== 002_create_products_table.sql =====
create table if not exists products (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    category text,
    price numeric,
    image_s3_url text not null,
    embedding vector(512),
    embedding_model text,
    created_at timestamptz not null default now()
);

-- ===== 003_create_uploaded_images_table.sql =====
create table if not exists uploaded_images (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null,
    s3_url text not null,
    matched_product_ids uuid[] not null default '{}',
    created_at timestamptz not null default now()
);

-- ===== 004_create_indexes.sql =====
create index if not exists products_embedding_ivfflat_idx
    on products
    using ivfflat (embedding vector_cosine_ops)
    with (lists = 100);

create index if not exists uploaded_images_user_id_idx
    on uploaded_images (user_id);

-- ===== 005_row_level_security.sql =====
alter table products enable row level security;
alter table uploaded_images enable row level security;

drop policy if exists "products_public_read" on products;
create policy "products_public_read"
    on products
    for select
    using (true);

drop policy if exists "uploaded_images_owner_select" on uploaded_images;
create policy "uploaded_images_owner_select"
    on uploaded_images
    for select
    using (auth.uid() = user_id);

drop policy if exists "uploaded_images_owner_insert" on uploaded_images;
create policy "uploaded_images_owner_insert"
    on uploaded_images
    for insert
    with check (auth.uid() = user_id);

drop policy if exists "uploaded_images_owner_update" on uploaded_images;
create policy "uploaded_images_owner_update"
    on uploaded_images
    for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

drop policy if exists "uploaded_images_owner_delete" on uploaded_images;
create policy "uploaded_images_owner_delete"
    on uploaded_images
    for delete
    using (auth.uid() = user_id);

-- ===== 006_match_products_function.sql =====
create or replace function match_products(
    query_embedding vector(512),
    match_count int default 20,
    filter_category text default null
)
returns table (
    id uuid,
    name text,
    image_s3_url text,
    similarity float
)
language sql
stable
as $$
    select
        products.id,
        products.name,
        products.image_s3_url,
        1 - (products.embedding <=> query_embedding) as similarity
    from products
    where
        products.embedding is not null
        and (filter_category is null or products.category = filter_category)
    order by products.embedding <=> query_embedding
    limit match_count;
$$;

-- ===== 007_add_source_product_id.sql =====
alter table products add column if not exists source_product_id bigint;

create unique index if not exists products_source_product_id_key
    on products (source_product_id);
