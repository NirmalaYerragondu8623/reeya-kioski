-- Run in the Supabase SQL editor, after 012_kiosk_events_indexes_and_rls.sql.
--
-- The frontend's age-group filter changed from age brackets (below_18,
-- 18_25, 26_35, 36_45, above_45) to style vibes (teens, elegant, classic) —
-- see frontend/src/lib/preferenceOptions.ts. The old CHECK constraints on
-- products.age_group and search_history.age_group still only allowed the
-- old brackets, so selecting a new value and confirming would insert
-- "teens"/"elegant"/"classic" into search_history and hit a Postgres
-- check-constraint violation (the frontend surfaced this as "failed to
-- fetch"). This swaps both constraints to the new vocabulary.
--
-- Note: products.age_group itself is still unpopulated (see schema.sql) —
-- this migration only fixes the constraint so the *filter selection* no
-- longer errors. app/routers/voice_search.py no longer hard-filters
-- products on age_group/usage for that reason (see its own comments).

alter table products drop constraint if exists products_age_group_check;
alter table products add constraint products_age_group_check
    check (age_group in ('teens', 'elegant', 'classic'));

alter table search_history drop constraint if exists search_history_age_group_check;
alter table search_history add constraint search_history_age_group_check
    check (age_group in ('teens', 'elegant', 'classic'));
