-- Feature Flags MVP schema (idempotent)
create table if not exists features (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  description text,
  default_state boolean not null default false,
  owner text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists feature_rules (
  id uuid primary key default gen_random_uuid(),
  feature_key text references features(key) on delete cascade,
  rule jsonb not null default '{}'::jsonb,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists entitlements (
  id uuid primary key default gen_random_uuid(),
  subject_type text not null check (subject_type in ('user','tenant')),
  subject_id text not null,
  feature_key text references features(key) on delete cascade,
  state boolean not null,
  meta jsonb default '{}'::jsonb,
  unique(subject_type, subject_id, feature_key)
);

create table if not exists flag_audit (
  id uuid primary key default gen_random_uuid(),
  feature_key text not null,
  action text not null,
  actor_id text,
  before jsonb,
  after jsonb,
  created_at timestamptz default now()
);

-- Seed features
insert into features(key, description, default_state)
values
  ('rewards_v1','Rewards program for 30‑day clients', false),
  ('per_million_views_v1','$1000 per million views pilot', false)
on conflict (key) do nothing;







