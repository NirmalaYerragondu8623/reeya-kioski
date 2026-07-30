# Image Search Backend (Jewelry Shopping App)

FastAPI backend that lets a user upload a photo and find visually similar
products in the catalog (Gemini Embedding 2, hosted, + pgvector similarity
search), search by voice (transcript → LLM filter extraction → structured
product query — transcription itself happens client-side in the browser,
not here), and log kiosk analytics events — all against Supabase (Postgres).
See `ANALYTICS.md` for the analytics event catalog and example queries.

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
    voice_search.py         POST /voice-search, GET /search-history
    events.py               POST /events (kiosk analytics, see ANALYTICS.md)
  services/
    supabase.py            Supabase client (service role key)
    s3.py                   boto3 S3 client, presign + public URL helpers
    embeddings.py           get_image_embedding() — the swappable embedding backend
    extract_filters.py      extract_search_filters() — the swappable filter-extraction backend
    filter_constants.py     shared category/price-band/age-group/usage vocabularies
migrations/               SQL files to run in the Supabase SQL editor, in order
scripts/
  index_catalog.py         Batch job: embed the whole catalog (safe to re-run)
```

## Setup

1. **Env vars** — copy `.env.example` to `.env` and fill in:
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — from Supabase project settings.
     The service role key bypasses Row Level Security, so keep it server-side only.
   - `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `S3_BUCKET_NAME`
   - `EMBEDDING_MODEL_NAME` — defaults to `gemini-embedding-2-preview`
   - `GEMINI_API_KEY` — from [Google AI Studio](https://aistudio.google.com/apikey);
     used by `app/services/embeddings.py`
   - `PRESIGN_EXPIRY_SECONDS` — how long a presigned upload URL stays valid (default 300s)
   - `PRODUCT_API_URL` — your teammate's product-image API (see `scripts/index_catalog.py`)
   - `OPENAI_API_KEY` — used by `app/services/extract_filters.py` (structured
     filter extraction from a transcript). Voice transcription itself happens
     client-side (browser Web Speech API), not in this backend.

2. **Install dependencies:**
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # or .venv\Scripts\activate on Windows
   pip install -r requirements.txt
   ```
   No heavy ML dependencies (`torch`/`transformers`) — embeddings are hosted
   via the Gemini API, so this installs quickly and runs comfortably even on
   small/free-tier deployment instances.

3. **Run the SQL migrations** in the Supabase SQL editor, **in order**:
   - `001_enable_pgvector.sql`
   - `002_create_products_table.sql`
   - `003_create_uploaded_images_table.sql`
   - `004_create_indexes.sql`
   - `005_row_level_security.sql`
   - `006_match_products_function.sql`
   - `007_add_source_product_id.sql`
   - `008_add_price_range.sql`
   - `009_add_voice_search.sql`
   - `010_fix_match_products_category_filter.sql`
   - `011_create_kiosk_events_table.sql`
   - `012_kiosk_events_indexes_and_rls.sql`

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
   `category` is matched via case-insensitive regex (`CATEGORY_PATTERNS`),
   not exact equality — real category data is messy free text ("Bali
   Earrings", "Catelog studs") that's never literally equal to a clean label
   like `"Earrings"`; see migration 010's comments for why this was a real
   bug that needed fixing, not just a style choice.

## Voice search flow (end to end)

Voice transcription happens **client-side**, not in this backend — the
frontend uses the browser's native Web Speech API to turn speech into text
directly, with no audio ever uploaded anywhere. This backend only receives
the resulting transcript text.

1. Client calls `POST /voice-search` with `{ transcript, user_id }`.
2. Backend extracts structured filters from the transcript via
   `extract_filters.extract_search_filters()` — an LLM call constrained to a
   strict JSON schema, returning `{category, price_band, age_group, usage}`,
   each `null` if not mentioned. Fixed vocabularies for all four live in
   `app/services/filter_constants.py`.
3. Backend queries `products`, applying only the non-null extracted filters:
   - `category` — matched against the real `products.category` text via a
     best-effort regex (`CATEGORY_PATTERNS`), since the actual catalog data
     is inconsistent free text (e.g. "Bali Earrings", "Catelog studs") that
     never exactly equals a clean value like `"earrings"`. Same technique now
     also used by `/image-search`'s category filter (migration 010).
     Categories with no type signal in their name (e.g. "Diamond", "Solitaire
     Collection") won't match any of the 6 buckets and are excluded — a real
     limit of the underlying category data, not a bug.
   - `price_band` — mapped to a numeric `(min, max)` via `PRICE_BAND_RANGES`
     and applied against the raw `price` column, **not** the `price_range`
     generated column added in migration 008 — the two use different label
     spellings for the same underlying numeric ranges (voice search uses
     `snake_case` like `25k_50k`, matching the extraction schema; the
     frontend's Price Band filter uses `25K-50K`). Keeping them as numeric
     ranges avoids needing the two label vocabularies to match.
   - `age_group` / `usage` — exact match against `products.age_group` /
     `products.usage`. **These columns exist but are currently unpopulated
     for every product** (see migration 009's comments — no source data was
     available to derive them from, same conclusion reached for image
     search). A voice search that extracts either filter will currently
     return zero matches until something populates these columns.
4. Backend inserts a row into `search_history` (transcript + extracted
   filters), and returns `{search_history_id, transcript, extracted_filters, matches}`.

`GET /search-history?user_id=...` returns that user's past searches, most
recent first — for a future "search history" screen.

## Swapping the embedding backend later

Everything that calls embeddings goes through
`app.services.embeddings.get_image_embedding(image_bytes: bytes) -> list[float]`.
This originally ran CLIP locally via `torch`/`transformers`, but that was
swapped out for the hosted Gemini Embedding 2 API specifically because the
in-process model was crashing the deployed backend (Render OOM at the free
tier's 512MB limit) — running embeddings as a hosted API call removes that
memory footprint entirely. To swap providers again later (e.g. Replicate):

1. Rewrite the body of `get_image_embedding` in `app/services/embeddings.py`
   to call the new provider instead.
2. Update `EMBEDDING_MODEL_NAME` (used to tag rows and detect staleness in
   `index_catalog.py`) to reflect the new model/version.
3. Re-run `python -m scripts.index_catalog` — every existing row will be
   detected as stale (`embedding_model` mismatch) and re-embedded
   automatically.

No changes are needed in `routers/image_search.py` or `scripts/index_catalog.py`
— they only depend on the function signature, not the implementation.

## Swapping the filter-extraction backend later

`app.services.extract_filters.extract_search_filters(transcript: str) -> dict`
currently calls OpenAI with structured outputs (strict JSON schema). To swap
in Claude (Anthropic's tool-use API) or another model, rewrite the body
only — keep the same fixed vocabularies from `filter_constants.py` in
whatever schema/tool definition the new provider needs. `routers/voice_search.py`
only depends on the function signature, not the implementation, so this
doesn't touch the router.

(There used to be a `stt.py` module here for server-side Whisper
transcription, built when `/voice-search` accepted raw audio uploads. It was
removed once the actual frontend turned out to do transcription client-side
via the browser's Web Speech API and send this backend a transcript
directly — see git history if server-side transcription is ever needed
again, e.g. for a client that can't do it locally.)

## Notes for teammates integrating this later

- The product-image API is treated as an external dependency
  (`PRODUCT_API_URL` + `fetch_products_from_teammate_api()`); nothing here
  assumes how it's implemented.
- Row Level Security policies in `005_row_level_security.sql` (and
  `009_add_voice_search.sql` for `search_history`) assume `user_id` columns
  correspond to Supabase Auth's `auth.uid()` for any *direct* client access
  to Supabase — this backend itself uses the service role key and bypasses
  RLS. Adjust if your auth model differs. `kiosk_events` is different: it has
  no `user_id`/`auth.uid()` concept (anonymous shared-kiosk sessions), so RLS
  is enabled with zero policies attached, denying direct client access
  entirely — everything goes through `POST /events`.
- All request/response shapes are Pydantic models in `app/models/schemas.py`,
  so this can be merged into a larger FastAPI app by mounting
  `app.routers.uploads.router` / `app.routers.image_search.router` on an
  existing app instance instead of using `app/main.py` directly.
- **Migration numbering note:** `ANALYTICS.md` originally referenced
  `migrations/008_create_kiosk_events_table.sql` and
  `009_kiosk_events_indexes_and_rls.sql`, but this project's real `008`/`009`
  were already built and run against live Supabase for other features
  (price bands, voice search) before that doc was written. The kiosk_events
  migrations were implemented as `011`/`012` instead — if you're
  cross-referencing `ANALYTICS.md` against the actual `migrations/` folder,
  that's why the numbers don't match what the doc originally said.

## Deployment (Render)

`render.yaml` at the repo root is a Render Blueprint — `New -> Blueprint` in
the Render dashboard, connect this repo, it reads the file automatically.
Set `rootDir: backend` (already in the file) since this is a monorepo.

Notes specific to this project:
- **Plan size:** embeddings are a hosted API call (Gemini), not an in-process
  model, so this no longer needs `standard`-tier RAM the way the old
  local-CLIP setup did — the Free tier's 512MB is enough. (This project
  previously crashed on Render's free tier with OOM errors under
  `torch`/`transformers`; that's specifically what this swap fixed.)
- **Env vars:** everything in `.env.example` must be set in the Render
  dashboard (marked `sync: false` in `render.yaml` so they're never
  committed). Include `ALLOWED_ORIGINS` with your deployed frontend's exact
  URL once you know it, and `GEMINI_API_KEY` (see `app/main.py`'s CORS
  middleware and `app/services/embeddings.py`).
- **Health check:** `/health` is already wired up; Render uses
  `healthCheckPath` from the blueprint for zero-downtime deploys.
