-- Run in the Supabase SQL editor, after 009_add_voice_search.sql.
--
-- Fixes a real bug: match_products previously did an EXACT match
-- (`products.category = filter_category`), but the frontend sends clean
-- labels like "Earrings" while the real category data is messy free text
-- ("DailyWear Studs", "Bali Earrings", etc.) that's never literally equal
-- to "Earrings". This made /image-search's category filter return almost
-- nothing. Switched to a case-insensitive regex match (`~*`), matching the
-- same technique already used and verified for voice search's category
-- filtering (see app/services/filter_constants.py's CATEGORY_PATTERNS) —
-- the router now passes a regex pattern (e.g. "earring|stud") instead of
-- the raw category name.

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
