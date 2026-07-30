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

-- ===== 008_add_price_range.sql =====
alter table products add column if not exists price_range text generated always as (
    case
        when price is null or price = 0 then 'Unknown'
        when price < 10000 then 'Below 10K'
        when price < 25000 then '10K-25K'
        when price < 50000 then '25K-50K'
        when price < 100000 then '50K-1L'
        else 'Above 1L'
    end
) stored;

create index if not exists products_price_range_idx on products (price_range);

-- ===== 009_add_voice_search.sql =====
alter table products add column if not exists usage text
    check (usage in ('daily_wear', 'office_wear', 'party_wear', 'festive', 'bridal'));

alter table products add column if not exists age_group text
    check (age_group in ('below_18', '18_25', '26_35', '36_45', 'above_45'));

create table if not exists search_history (
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

create index if not exists search_history_user_id_idx on search_history (user_id);

alter table search_history enable row level security;

drop policy if exists "search_history_owner_select" on search_history;
create policy "search_history_owner_select"
    on search_history
    for select
    using (auth.uid() = user_id);

drop policy if exists "search_history_owner_insert" on search_history;
create policy "search_history_owner_insert"
    on search_history
    for insert
    with check (auth.uid() = user_id);

-- ===== 010_fix_match_products_category_filter.sql =====
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

-- ===== 011_create_kiosk_events_table.sql =====
create table if not exists kiosk_events (
    id           uuid primary key default gen_random_uuid(),
    session_id   uuid not null,
    event_name   text not null,
    occurred_at  timestamptz not null,
    payload      jsonb not null default '{}'::jsonb,
    created_at   timestamptz not null default now()
);

-- ===== 012_kiosk_events_indexes_and_rls.sql =====
create index if not exists kiosk_events_session_id_idx on kiosk_events (session_id);
create index if not exists kiosk_events_event_name_idx on kiosk_events (event_name);
create index if not exists kiosk_events_occurred_at_idx on kiosk_events (occurred_at);
create index if not exists kiosk_events_payload_gin_idx on kiosk_events using gin (payload);

alter table kiosk_events enable row level security;

-- ===== 013_update_age_group_vocabulary.sql =====
alter table products drop constraint if exists products_age_group_check;
alter table products add constraint products_age_group_check
    check (age_group in ('teens', 'elegant', 'classic'));

alter table search_history drop constraint if exists search_history_age_group_check;
alter table search_history add constraint search_history_age_group_check
    check (age_group in ('teens', 'elegant', 'classic'));

-- ===== 014_add_uploaded_images_embedding.sql =====
alter table uploaded_images add column if not exists embedding vector(512);
