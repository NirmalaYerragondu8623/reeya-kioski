-- Run in the Supabase SQL editor, after 003_create_uploaded_images_table.sql.
--
-- ivfflat requires the table to have data (or at least an estimated row count)
-- to pick good list sizes; it's fine to create this before the catalog is
-- indexed, but re-run `analyze products;` after the initial bulk load so the
-- planner has accurate statistics.

create index if not exists products_embedding_ivfflat_idx
    on products
    using ivfflat (embedding vector_cosine_ops)
    with (lists = 100);

create index if not exists uploaded_images_user_id_idx
    on uploaded_images (user_id);
