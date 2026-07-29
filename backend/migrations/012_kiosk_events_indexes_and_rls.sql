-- Run in the Supabase SQL editor, after 011_create_kiosk_events_table.sql.
--
-- Indexes match the query patterns in ANALYTICS.md's example queries
-- (group by session_id for duration, filter/group by event_name, filter on
-- payload contents like category_name).
--
-- RLS: unlike uploaded_images/search_history, kiosk_events has no user_id /
-- auth.uid() concept — sessions are anonymous, tied to a shared kiosk
-- device, not a logged-in user. All access is meant to go through this
-- backend's POST /events endpoint (service role key, bypasses RLS). RLS is
-- enabled with zero policies attached, which denies all access to the anon
-- and authenticated roles by default — there's no legitimate reason for a
-- browser client to read/write this table directly.

create index if not exists kiosk_events_session_id_idx on kiosk_events (session_id);
create index if not exists kiosk_events_event_name_idx on kiosk_events (event_name);
create index if not exists kiosk_events_occurred_at_idx on kiosk_events (occurred_at);
create index if not exists kiosk_events_payload_gin_idx on kiosk_events using gin (payload);

alter table kiosk_events enable row level security;
