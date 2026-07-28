-- Run in the Supabase SQL editor, after 002_create_products_table.sql.

create table if not exists uploaded_images (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null,
    s3_url text not null,
    matched_product_ids uuid[] not null default '{}',
    created_at timestamptz not null default now()
);
