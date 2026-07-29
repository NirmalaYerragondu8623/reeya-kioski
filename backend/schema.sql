-- Current schema snapshot for the Reeya Kioski image-search backend.
-- This is a reference of the live state — NOT a migration to run again.
-- The actual migration history (what to run, in order, on a fresh project)
-- lives in migrations/001..007 (or migrations/000_combined_all.sql for a
-- single-paste version). This file just documents where things stand today.
--
-- 4 tables exist: products, uploaded_images, search_history, kiosk_events.
-- (products.usage / products.age_group columns exist but are unpopulated —
-- no source data exists for either; see project notes. Voice searches that
-- extract a usage/age_group filter currently return no matches as a result.)

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
    created_at         timestamptz not null default now(),
    price_range        text generated always as (  -- derived from price, matches frontend's Price Band filter exactly
        case
            when price is null or price = 0 then 'Unknown'
            when price < 10000 then 'Below 10K'
            when price < 25000 then '10K-25K'
            when price < 50000 then '25K-50K'
            when price < 100000 then '50K-1L'
            else 'Above 1L'
        end
    ) stored,
    usage              text check (usage in ('daily_wear', 'office_wear', 'party_wear', 'festive', 'bridal')),      -- unpopulated, see notes
    age_group          text check (age_group in ('below_18', '18_25', '26_35', '36_45', 'above_45'))                -- unpopulated, see notes
);

create unique index products_source_product_id_key on products (source_product_id);
create index products_price_range_idx on products (price_range);

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
-- supabase-py talks PostgREST, not raw SQL. filter_category is a
-- case-insensitive REGEX pattern (e.g. "earring|stud"), not an exact string
-- — real category data is messy free text that's never literally equal to
-- a clean label like "Earrings" (see migration 010's notes).
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
        and (filter_category is null or products.category ~* filter_category)
    order by products.embedding <=> query_embedding
    limit match_count;
$$;

-- ============================================================
-- Table: search_history
-- One row per voice search, written by POST /voice-search.
-- ============================================================
create table search_history (
    id           uuid primary key default gen_random_uuid(),
    user_id      uuid not null,
    transcript   text not null,
    category     text check (category in ('earrings', 'pendants', 'necklace', 'rings', 'bangles', 'bracelets')),
    price_band   text check (price_band in ('below_10k', '10k_25k', '25k_50k', '50k_1l', 'above_1l')),
    age_group    text check (age_group in ('below_18', '18_25', '26_35', '36_45', 'above_45')),
    usage        text check (usage in ('daily_wear', 'office_wear', 'party_wear', 'festive', 'bridal')),
    search_type  text not null default 'voice',
    created_at   timestamptz not null default now()
);

create index search_history_user_id_idx on search_history (user_id);

alter table search_history enable row level security;

create policy "search_history_owner_select"
    on search_history
    for select
    using (auth.uid() = user_id);

create policy "search_history_owner_insert"
    on search_history
    for insert
    with check (auth.uid() = user_id);

-- ============================================================
-- Table: kiosk_events
-- Append-only analytics event log, written by POST /events. See
-- ANALYTICS.md for the full event catalog and example analytics queries.
-- No user_id / auth.uid() concept — sessions are anonymous, tied to a
-- shared kiosk device, not a logged-in user. RLS is enabled with zero
-- policies (denies direct client access entirely); all writes go through
-- this backend's service-role-authenticated POST /events.
-- ============================================================
create table kiosk_events (
    id           uuid primary key default gen_random_uuid(),
    session_id   uuid not null,
    event_name   text not null,           -- free-form, not a DB enum — frontend can add event types without a migration
    occurred_at  timestamptz not null,     -- client-supplied event time
    payload      jsonb not null default '{}'::jsonb,
    created_at   timestamptz not null default now()  -- server insert time
);

create index kiosk_events_session_id_idx on kiosk_events (session_id);
create index kiosk_events_event_name_idx on kiosk_events (event_name);
create index kiosk_events_occurred_at_idx on kiosk_events (occurred_at);
create index kiosk_events_payload_gin_idx on kiosk_events using gin (payload);

alter table kiosk_events enable row level security;
