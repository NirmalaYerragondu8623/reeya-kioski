-- Run in the Supabase SQL editor, after 007_add_source_product_id.sql.
--
-- Single append-only table for all kiosk analytics events. `event_name` is a
-- free-form string rather than an enum so the frontend can add new event
-- types without a migration; `payload` holds whatever fields are specific to
-- that event (category_name, product_id, total_amount, ...) as JSON so this
-- table never needs reshaping when a new event needs a new field.
--
-- Every customer interaction belongs to a `session_id`, minted client-side
-- when a session starts ("New User" button, or first load of the day) and
-- reused for every event until the next reset. Session boundaries and
-- duration are derived from the session_started / session_ended events
-- already stored here — see backend/ANALYTICS.md for the query cookbook.

create table if not exists kiosk_events (
    id uuid primary key default gen_random_uuid(),
    session_id uuid not null,
    event_name text not null,
    -- Client-supplied event time (not `created_at`/`now()`), so ordering and
    -- duration math reflect when the interaction actually happened on the
    -- kiosk, not when the write reached the database.
    occurred_at timestamptz not null,
    payload jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);
