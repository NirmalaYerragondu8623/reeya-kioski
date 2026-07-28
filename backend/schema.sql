-- Current schema snapshot for the Reeya Kioski image-search backend.
-- This is a reference of the live state — NOT a migration to run again.
-- The actual migration history (what to run, in order, on a fresh project)
-- lives in migrations/001..007 (or migrations/000_combined_all.sql for a
-- single-paste version). This file just documents where things stand today.
--
-- 2 tables exist: products, uploaded_images.

create extension if not exists vector;

-- ============================================================
-- Table: products
-- Catalog metadata + CLIP embeddings, populated by scripts/index_catalog.py
-- from the teammate's product-image API.
-- ============================================================
create table products (
    id                 uuid primary key default gen_random_uuid(),
    source_product_id  bigint,                 -- the teammate API's WordPress product id (upsert key)
    name               text not null,
    category           text,                    -- first category only (see project notes on this simplification)
    price              numeric,                 -- "starting from" price (lowest variation)
    image_s3_url       text not null,           -- first/featured image URL (hosted on teammate's WordPress, not our S3)
    embedding          vector(512),             -- CLIP image embedding, null until scripts/index_catalog.py runs
    embedding_model    text,                    -- e.g. 'openai/clip-vit-base-patch32' — used to detect stale embeddings
    created_at         timestamptz not null default now()
);

create unique index products_source_product_id_key on products (source_product_id);

create index products_embedding_ivfflat_idx
    on products
    using ivfflat (embedding vector_cosine_ops)
    with (lists = 100);

alter table products enable row level security;

create policy "products_public_read"
    on products
    for select
    using (true);

-- ============================================================
-- Table: uploaded_images
-- One row per user photo search, written by POST /image-search.
-- ============================================================
create table uploaded_images (
    id                    uuid primary key default gen_random_uuid(),
    user_id               uuid not null,
    s3_url                text not null,        -- the user's uploaded photo (our S3 bucket)
    matched_product_ids   uuid[] not null default '{}',
    created_at            timestamptz not null default now()
);

create index uploaded_images_user_id_idx on uploaded_images (user_id);

alter table uploaded_images enable row level security;

-- Assumes user_id corresponds to Supabase Auth's auth.uid() for any DIRECT
-- client access to Supabase (this backend itself uses the service role key
-- and bypasses RLS — these policies only matter if a frontend ever queries
-- Supabase directly).
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

-- ============================================================
-- Function: match_products
-- pgvector cosine-similarity search against products.embedding, called via
-- supabase.rpc("match_products", {...}) from POST /image-search since
-- supabase-py talks PostgREST, not raw SQL.
-- ============================================================
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
