-- Run in the Supabase SQL editor, after 010_fix_match_products_category_filter.sql.
--
-- Implements the kiosk_events table described in ANALYTICS.md. Renumbered
-- from the doc's original 008/009 to 011/012 — this project's real 008/009
-- were already built and run against live Supabase before ANALYTICS.md was
-- pushed (008_add_price_range.sql, 009_add_voice_search.sql), so the
-- analytics migrations take the next free numbers instead.
--
-- One row per interaction, append-only. `event_name` is intentionally a
-- free-form string, not a DB enum/CHECK constraint — per ANALYTICS.md, the
-- frontend can add new event types without needing a migration.

create table if not exists kiosk_events (
    id           uuid primary key default gen_random_uuid(),
    session_id   uuid not null,
    event_name   text not null,
    occurred_at  timestamptz not null,              -- client-supplied event time
    payload      jsonb not null default '{}'::jsonb,
    created_at   timestamptz not null default now() -- server insert time
);
