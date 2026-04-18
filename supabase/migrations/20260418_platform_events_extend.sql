-- Stage 2 of substrate pivot (2026-04-18): extend platform_events with
-- actor_type, agency_id, correlation_id — the three fields the Stage 3
-- agent execution engine needs for session replay and tenant-scoped queries.
--
-- ADDITIVE ONLY. All new columns are nullable. Existing rows unaffected.
-- Existing emitEvent callers continue to work unchanged — new fields
-- default to null for them.

alter table public.platform_events
  add column if not exists actor_type     text,
  add column if not exists agency_id      uuid,
  add column if not exists correlation_id uuid;

-- Denormalized agency filter: every tenant-scoped event query hits this.
-- Querying payload->>'agency_id' is ~100x slower than a dedicated column + index.
create index if not exists idx_platform_events_agency_created
  on public.platform_events (agency_id, created_at desc)
  where agency_id is not null;

-- Replay a single user request's event chain. Critical for Stage 3 agent
-- sessions where one operator request fans out to N tool calls + results.
create index if not exists idx_platform_events_correlation
  on public.platform_events (correlation_id)
  where correlation_id is not null;

-- Flexible JSONB payload querying (e.g. filter events by any payload key).
create index if not exists idx_platform_events_payload_gin
  on public.platform_events using gin (payload);
