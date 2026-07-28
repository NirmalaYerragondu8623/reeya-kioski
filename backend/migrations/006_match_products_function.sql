-- Run in the Supabase SQL editor, after 005_row_level_security.sql.
--
-- The Python backend talks to Supabase via PostgREST (supabase-py), which
-- can't run arbitrary SQL. This RPC function exposes the pgvector cosine
-- similarity search as a callable, e.g.:
--   supabase.rpc("match_products", {
--       "query_embedding": [...512 floats...],
--       "match_count": 20,
--       "filter_category": None,
--   }).execute()

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
