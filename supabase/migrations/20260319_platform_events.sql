-- Platform Event Spine
-- Unified event log for cross-cutting platform telemetry.
-- Runs alongside existing event tables — does NOT replace them.

create table platform_events (
  id uuid default gen_random_uuid() primary key,
  event_type text not null,
  payload jsonb default '{}',
  actor_id uuid,
  entity_type text,
  entity_id uuid,
  created_at timestamptz default now()
);

create index idx_platform_events_type on platform_events(event_type);
create index idx_platform_events_entity on platform_events(entity_type, entity_id);
create index idx_platform_events_created on platform_events(created_at desc);
