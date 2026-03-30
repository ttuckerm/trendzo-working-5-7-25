-- Telemetry tables
create table if not exists public.telemetry_event (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  platform text not null,
  video_id text not null,
  t_ms integer not null,
  type text not null,
  position_ms integer,
  meta jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_te_event_video on public.telemetry_event (video_id, created_at desc);

create table if not exists public.telemetry_summary (
  video_id text primary key,
  retention jsonb not null,
  loops integer not null default 0,
  share_to_view double precision not null default 0,
  sample integer not null default 0,
  updated_at timestamptz not null default now()
);

-- Drift/importance
create table if not exists public.feature_importance_daily (
  id uuid primary key default gen_random_uuid(),
  feature text not null,
  importance double precision not null,
  delta_7d double precision not null default 0,
  created_at date not null default current_date
);

create table if not exists public.drift_alert (
  id uuid primary key default gen_random_uuid(),
  feature text not null,
  type text not null check (type in ('importance','psi')),
  value double precision not null,
  threshold double precision not null,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

-- Scoring branches
create table if not exists public.scoring_branch_run (
  id uuid primary key default gen_random_uuid(),
  video_id text not null,
  type text not null check (type in ('carousel','longform3m')),
  score double precision not null,
  features jsonb not null,
  created_at timestamptz not null default now()
);

-- Attribution/pixel
create table if not exists public.pixel_event (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('view','click','purchase')),
  template_id text,
  sku text,
  campaign_id text,
  value_cents integer,
  created_at timestamptz not null default now()
);
create index if not exists idx_pixel_template on public.pixel_event (template_id, sku, campaign_id, type, created_at desc);

create table if not exists public.conversion_aggregate (
  template_id text primary key,
  sku text,
  n_variant integer not null default 0,
  n_baseline integer not null default 0,
  variant_cr double precision not null default 0,
  baseline_cr double precision not null default 0,
  lift double precision not null default 0,
  updated_at timestamptz not null default now()
);

-- Templates leaderboard
create table if not exists public.template_metric_snapshot (
  id uuid primary key default gen_random_uuid(),
  template_id text not null,
  title text not null,
  time_window text not null,  -- Renamed from 'window' (reserved word)
  metric text not null,
  metric_value double precision not null,
  rank integer not null,
  tier text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_template_snapshot_window on public.template_metric_snapshot (time_window, metric_value desc);

-- Federated training
create table if not exists public.federated_round (
  round_id text primary key,
  status text not null,
  clients integer not null,
  model text not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  eval jsonb
);

create table if not exists public.federated_update (
  id uuid primary key default gen_random_uuid(),
  round_id text not null references public.federated_round(round_id) on delete cascade,
  client_id text not null,
  loss double precision not null,
  created_at timestamptz not null default now()
);

