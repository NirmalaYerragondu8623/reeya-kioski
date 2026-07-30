-- Run in the Supabase SQL editor, after 014_add_uploaded_images_embedding.sql.
--
-- Stores one row per unique phone number submitted via the "Let's connect"
-- popup. Deliberately NOT an append-only event log like kiosk_events —
-- the same customer submitting again (same phone, a later kiosk visit)
-- should update this one record, not create a duplicate.
--
-- `session_ids` accumulates every kiosk session_id this phone number has
-- ever submitted under, so the customer's full activity history for any of
-- those visits (every category view, filter, search, wishlist action —
-- everything logged in kiosk_events) can be pulled with:
--
--   select *
--   from kiosk_events
--   where session_id = any(
--     (select session_ids from leads where phone = '9876543210')
--   )
--   order by occurred_at;
--
-- `phone` is stored normalized (digits only, leading country code/trunk
-- prefix stripped — see app/routers/leads.py's normalize_phone()) so the
-- same number typed with different formatting (spaces, +91, a leading 0)
-- still matches the same row instead of creating a near-duplicate.

create table leads (
    id            uuid primary key default gen_random_uuid(),
    phone         text not null unique,
    name          text not null,
    session_ids   uuid[] not null default '{}',
    item_count    int,
    total_amount  numeric,
    created_at    timestamptz not null default now(),
    updated_at    timestamptz not null default now()
);

create index leads_phone_idx on leads (phone);

alter table leads enable row level security;
-- No public policies — this table holds customer PII (name/phone) and is
-- only ever written/read by this backend's service-role key, same reasoning
-- as kiosk_events (see migration 012's notes on that pattern).
