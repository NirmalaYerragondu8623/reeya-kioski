-- Run in the Supabase SQL editor.
-- Enables the pgvector extension used for storing/querying image embeddings.

create extension if not exists vector;
