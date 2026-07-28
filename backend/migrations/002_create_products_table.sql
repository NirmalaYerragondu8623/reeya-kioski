-- Run in the Supabase SQL editor, after 001_enable_pgvector.sql.

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
