-- Run in the Supabase SQL editor, after 006_match_products_function.sql.
--
-- The teammate's product-image API (reeyalifestyle.com) identifies products
-- with its own WordPress integer id, not a UUID. `products.id` stays our own
-- generated UUID (matches the original schema); `source_product_id` is the
-- stable natural key used to upsert against on re-runs of index_catalog.py.

alter table products add column if not exists source_product_id bigint;

create unique index if not exists products_source_product_id_key
    on products (source_product_id);
