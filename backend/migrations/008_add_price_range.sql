-- Run in the Supabase SQL editor, after 007_add_source_product_id.sql.
--
-- price_range is a generated column, computed automatically from `price` —
-- it can never drift out of sync when index_catalog.py updates prices later,
-- and needs no app code changes. Bands match the frontend's "Price Band"
-- filter UI exactly (Below 10K / 10K-25K / 25K-50K / 50K-1L / Above 1L), so
-- the values line up 1:1 with what the filter sends. Distribution across the
-- 607 currently-priced products: Below 10K 177 (29%), 10K-25K 99 (16%),
-- 25K-50K 104 (17%), 50K-1L 92 (15%), Above 1L 135 (22%). The remaining 393
-- products have no price set at all (price is null or 0) and fall into
-- 'Unknown' — not shown in the frontend's optional filter, but needed so
-- unpriced items aren't misclassified as "Below 10K".

alter table products add column price_range text generated always as (
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
