# Kiosk analytics — schema & API contract

For the backend developer picking this up: this is the storage format and
API contract the frontend already sends events in.

**Status:** implemented — `app/routers/events.py` exists and is wired into
`app/main.py`. **Migration numbering differs from what's shown below**: this
project's real `008`/`009` were already built and run against live Supabase
for other features (price bands, voice search) before this doc was written,
so the kiosk_events migrations were implemented as `011`/`012` instead of
`008`/`009`. See `migrations/011_create_kiosk_events_table.sql` and
`migrations/012_kiosk_events_indexes_and_rls.sql` for the actual files.

## Storage: one table, append-only

```sql
create table kiosk_events (
    id uuid primary key default gen_random_uuid(),
    session_id uuid not null,
    event_name text not null,
    occurred_at timestamptz not null,  -- client-supplied event time
    payload jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()  -- server insert time
);
```

Full DDL with indexes and RLS: `migrations/011_create_kiosk_events_table.sql`
and `migrations/012_kiosk_events_indexes_and_rls.sql`.

One row per interaction. `event_name` is a free-form string (not a DB enum)
so the frontend can add new event types without a migration. `payload` holds
whatever fields are specific to that event — see the catalog below.

## API contract

```
POST /events
Content-Type: application/json

{
  "session_id": "3f1b2c4a-...-uuid",
  "event_name": "category_viewed",
  "occurred_at": "2026-07-29T10:15:30.000Z",
  "payload": { "category_name": "Rings" }
}

-> 202 Accepted
   { "status": "accepted" }
```

The endpoint must never fail loudly to the kiosk — errors are logged
server-side and swallowed (see `record_event` in `events.py`). Analytics
should never be able to break the customer-facing UI.

## Session lifecycle

A `session_id` (UUID, generated client-side) is created:
- On first app load of the day, or
- Whenever staff/customer taps **"New User"** on the kiosk (resets the UI
  for the next customer)

Every event during that session carries the same `session_id` until the
next reset. `session_started` / `session_ended` bound each session.

## Event catalog

| event_name | payload | fires when |
|---|---|---|
| `session_started` | `{}` | New User tapped, or first load |
| `session_ended` | `{}` | Right before a new session starts (previous customer's session closing), or the kiosk tab closes |
| `category_viewed` | `{ category_name }` | A category tile is tapped |
| `voice_search_started` | `{}` | The mic icon is tapped |
| `image_search_started` | `{}` | The camera icon is tapped |
| `text_search_opened` | `{}` | The search (typing) icon is tapped |
| `search_performed` | `{ query, source }` | A voice or typed search is actually submitted — `source` is `"voice"` or `"text"` |
| `filter_applied` | `{ filter_type, value, category }` | An Age Group / Price Band / Usage filter is selected on the Refine Search screen |
| `product_viewed` | `{ product_id, product_name, category_name }` | A search-result product card is tapped |
| `product_added_to_cart` | `{ product_id, product_name }` | The wishlist heart is tapped on a product not yet wishlisted (cart and wishlist are the same list) |
| `product_removed_from_wishlist` | `{ product_id, product_name }` | The wishlist heart is tapped on an already-wishlisted product, or its remove (X) button is tapped on the Wishlist screen |
| `order_completed` | `{ total_amount, item_count }` | "Let's connect" tapped with items in cart |
| `order_abandoned` | `{ item_count }` | New User tapped while cart still has items (customer walked away) |

## Example queries for the analytics questions

**Most explored categories:**
```sql
select payload->>'category_name' as category, count(*) as views
from kiosk_events
where event_name = 'category_viewed'
group by 1
order by views desc;
```

**Average session duration:**
```sql
with bounds as (
  select
    session_id,
    min(occurred_at) filter (where event_name = 'session_started') as started,
    max(occurred_at) filter (where event_name = 'session_ended') as ended
  from kiosk_events
  group by session_id
)
select avg(ended - started) as avg_session_duration
from bounds
where started is not null and ended is not null;
```

**Sales-strategy signal (funnel from view -> cart -> order per category):**
```sql
select
  payload->>'category_name' as category,
  count(*) filter (where event_name = 'category_viewed') as category_views,
  count(*) filter (where event_name = 'product_viewed') as product_views,
  count(*) filter (where event_name = 'product_added_to_cart') as add_to_carts,
  count(*) filter (where event_name = 'order_completed') as orders
from kiosk_events
group by 1
order by category_views desc;
```
(An LLM/MCP layer can take this funnel breakdown plus the abandonment rate
— `order_abandoned` vs `order_completed` counts — and turn it into concrete
suggestions, e.g. "Rings get the most views but the lowest add-to-cart rate
— check pricing or product photography for that category.")

## MCP access

Since this all lives in one Postgres/Supabase table, any Postgres-capable
MCP server (e.g. a Supabase or generic Postgres MCP connector) can query
`kiosk_events` directly using the queries above as a starting point — no
custom API needed beyond what's already here.
