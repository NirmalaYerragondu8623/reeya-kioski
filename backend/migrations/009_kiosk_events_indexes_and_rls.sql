-- Run in the Supabase SQL editor, after 008_create_kiosk_events_table.sql.

create index if not exists kiosk_events_session_id_idx
    on kiosk_events (session_id);

create index if not exists kiosk_events_event_name_idx
    on kiosk_events (event_name);

create index if not exists kiosk_events_occurred_at_idx
    on kiosk_events (occurred_at);

-- Speeds up filtering/grouping on payload fields (e.g. payload->>'category_name'),
-- which the "most explored categories" style queries rely on.
create index if not exists kiosk_events_payload_gin_idx
    on kiosk_events
    using gin (payload);

-- Locked down like uploaded_images: the FastAPI backend writes via the
-- service role key, which bypasses RLS entirely. These policies only matter
-- if something ever queries Supabase directly with an anon/user JWT instead
-- of through the backend — default to no public access since event payloads
-- may include business data (order totals, browsing behavior).
alter table kiosk_events enable row level security;
