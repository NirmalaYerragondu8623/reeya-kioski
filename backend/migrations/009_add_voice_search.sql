-- Run in the Supabase SQL editor, after 008_add_price_range.sql.
--
-- Adds the columns/table needed for voice search:
--   - products.usage / products.age_group: not populated by anything yet
--     (deliberately skipped earlier — no source data exists). Columns exist
--     so the schema/feature works structurally; voice searches that extract
--     a usage/age_group filter will return no matches until these are
--     populated by some future process.
--   - search_history: one row per voice search, storing the transcript and
--     whatever filters were extracted from it.

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

-- Users can only see/create their own search history. Assumes user_id maps
-- to Supabase Auth's auth.uid() for direct client access, same as
-- uploaded_images — this backend itself uses the service role key and
-- bypasses RLS.
create policy "search_history_owner_select"
    on search_history
    for select
    using (auth.uid() = user_id);

create policy "search_history_owner_insert"
    on search_history
    for insert
    with check (auth.uid() = user_id);
