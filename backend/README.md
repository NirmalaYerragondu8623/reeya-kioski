# Image Search Backend (Jewelry Shopping App)

FastAPI backend that lets a user upload a photo and find visually similar
products in the catalog, using CLIP image embeddings + pgvector similarity
search in Supabase (Postgres).

## Project structure

```
app/
  main.py               FastAPI app, router wiring
  config.py             Settings loaded from env vars
  models/
    schemas.py           Pydantic request/response models
  routers/
    uploads.py            POST /uploads/presign
    image_search.py        POST /image-search
  services/
    supabase.py            Supabase client (service role key)
    s3.py                   boto3 S3 client, presign + public URL helpers
    embeddings.py           get_image_embedding() — the swappable embedding backend
migrations/               SQL files to run in the Supabase SQL editor, in order
scripts/
  index_catalog.py         Batch job: embed the whole catalog (safe to re-run)
```

## Setup

1. **Env vars** — copy `.env.example` to `.env` and fill in:
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — from Supabase project settings.
     The service role key bypasses Row Level Security, so keep it server-side only.
   - `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `S3_BUCKET_NAME`
   - `EMBEDDING_MODEL_NAME` — defaults to `openai/clip-vit-base-patch32`
   - `PRESIGN_EXPIRY_SECONDS` — how long a presigned upload URL stays valid (default 300s)
   - `PRODUCT_API_URL` — your teammate's product-image API (see `scripts/index_catalog.py`)

2. **Install dependencies:**
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # or .venv\Scripts\activate on Windows
   pip install -r requirements.txt
   ```
   `torch` is CPU-only by default via the pinned version on PyPI; if you need
   GPU acceleration, install the appropriate CUDA build from
   https://pytorch.org/get-started/locally/ instead before running `pip install -r requirements.txt`.

3. **Run the SQL migrations** in the Supabase SQL editor, **in order**:
   - `001_enable_pgvector.sql`
   - `002_create_products_table.sql`
   - `003_create_uploaded_images_table.sql`
   - `004_create_indexes.sql`
   - `005_row_level_security.sql`
   - `006_match_products_function.sql`
   - `007_add_source_product_id.sql`

   These aren't wired into a migration runner (e.g. Alembic/Supabase CLI
   migrations) — paste each file's contents into the SQL editor and run it.
   If you later adopt the Supabase CLI's migration workflow, these files can
   be dropped into `supabase/migrations/` largely as-is.

4. **Run the API:**
   ```bash
   uvicorn app.main:app --reload
   ```
   Health check: `GET /health`.

## Indexing the catalog

```bash
python -m scripts.index_catalog
```

This:
1. Calls the teammate's product-image API (`PRODUCT_API_URL` + `PRODUCT_API_KEY`,
   sent as an `X-API-Key` header) and upserts product metadata (name,
   category, price, image_s3_url) into `products`, keyed on
   `source_product_id` (their WordPress product id — kept separate from our
   own generated `id` uuid).
2. Finds every product row where `embedding` is null or `embedding_model`
   doesn't match the currently configured model, downloads its image,
   generates an embedding, and writes it back.

### Teammate product API contract

- Base URL: `https://reeyalifestyle.com/wp-json/reeya-kiosk/v1`
- Auth: `X-API-Key` header (or `?api_key=` query param)
- `GET /categories` — all categories (id, name, slug, count, image)
- `GET /products?page=1&per_page=100` (max `per_page` is 100) — paginated,
  response includes `total` / `total_pages`. Each product has `id`,
  `name`, `jewellery_type`, `categories[]`, `images[]` (full-size URLs,
  featured + gallery), `price` (lowest variation price, "starting from"),
  `variations[]` ({ variation_id, purity, diamond_quality, price }).
- This project stores only the **first** category and **first** (featured)
  image per product, matching the single-category/single-image schema —
  `jewellery_type` and `variations` aren't currently persisted.
- **Recommended polling cadence: every 15 minutes** (no webhook/push exists;
  gold/diamond rates don't move faster than that) — schedule
  `python -m scripts.index_catalog` via cron / Task Scheduler at that
  interval to keep the catalog fresh.
- **Do not** request internal cost breakdown (diamond/gold cost, making
  charge, tax) be added to this API — it's deliberately excluded as margin
  data. Only the final customer-facing `price` is exposed.
- A product missing from the feed is usually toggled off via "Show in
  kiosk" on their end, not a bug in this indexing script.

It's safe to re-run any time (e.g. after the teammate's API adds new
products, or after you swap the embedding model): metadata upserts don't
touch existing embeddings, and only rows needing an embedding get
(re)processed. Per-row failures (bad URL, download error, etc.) are logged
and skipped rather than aborting the whole batch — check the log output for
a `failed=` count at the end.

After the first bulk load, consider running `analyze products;` in the SQL
editor so the ivfflat index's query planner stats are accurate.

## Presigned upload flow (end to end)

1. Client calls `POST /uploads/presign` with `{ user_id, filename, content_type }`.
2. Backend returns `{ upload_url, object_key, public_url }`, where `upload_url`
   is a short-lived presigned S3 `PUT` URL scoped to
   `uploads/{user_id}/{filename}`.
3. Client `PUT`s the raw image bytes directly to `upload_url` (no backend
   involvement, no file passing through the API server).
4. Client calls `POST /image-search` with `{ s3_url: public_url, user_id }`
   (optionally `?category=...` to pre-filter).
5. Backend downloads the image from `s3_url`, embeds it, runs a pgvector
   cosine-similarity search against `products.embedding` via the
   `match_products` Postgres RPC function, inserts a row into
   `uploaded_images` recording the match, and returns the top 20 matches.

## Swapping the embedding backend later

Everything that calls embeddings goes through
`app.services.embeddings.get_image_embedding(image_bytes: bytes) -> list[float]`.
To swap CLIP-running-locally for a hosted API (e.g. Replicate):

1. Rewrite the body of `get_image_embedding` in `app/services/embeddings.py`
   to call the hosted API instead of running the local model.
2. Update `EMBEDDING_MODEL_NAME` (used to tag rows and detect staleness in
   `index_catalog.py`) to reflect the new model/version.
3. Re-run `python -m scripts.index_catalog` — every existing row will be
   detected as stale (`embedding_model` mismatch) and re-embedded
   automatically.

No changes are needed in `routers/image_search.py` or `scripts/index_catalog.py`
— they only depend on the function signature, not the implementation.

## Notes for teammates integrating this later

- The product-image API is treated as an external dependency
  (`PRODUCT_API_URL` + `fetch_products_from_teammate_api()`); nothing here
  assumes how it's implemented.
- Row Level Security policies in `005_row_level_security.sql` assume
  `uploaded_images.user_id` corresponds to Supabase Auth's `auth.uid()` for
  any *direct* client access to Supabase — this backend itself uses the
  service role key and bypasses RLS. Adjust if your auth model differs.
- All request/response shapes are Pydantic models in `app/models/schemas.py`,
  so this can be merged into a larger FastAPI app by mounting
  `app.routers.uploads.router` / `app.routers.image_search.router` on an
  existing app instance instead of using `app/main.py` directly.
