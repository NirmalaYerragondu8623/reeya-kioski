-- Run in the Supabase SQL editor, after 013_update_age_group_vocabulary.sql.
--
-- Persists the embedding computed for each user-uploaded search photo,
-- instead of discarding it after the search completes (it was previously
-- only used transiently for the match_products query, never saved). Same
-- pgvector column type as products.embedding — no new database/service
-- needed, everything stays in Supabase.

alter table uploaded_images add column if not exists embedding vector(512);
