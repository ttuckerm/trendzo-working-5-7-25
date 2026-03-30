-- Live selling session tracking
create table if not exists public.ecom_live_sessions (
  id uuid primary key default gen_random_uuid(),
  product_id text references public.ecom_products(id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'live', 'ended')),
  title text,
  notes text,
  target_buyer text,
  creator_style text,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists ecom_live_sessions_status_idx
  on public.ecom_live_sessions (status, created_at desc);

-- Per-minute metric events streamed during a live session
create table if not exists public.ecom_live_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.ecom_live_sessions(id) on delete cascade,
  ts timestamptz not null default now(),
  viewers int not null default 0,
  comments_per_min numeric not null default 0,
  shares_per_min numeric not null default 0,
  clicks_per_min numeric not null default 0,
  carts_per_min numeric not null default 0,
  purchases_per_min numeric not null default 0,
  revenue_per_min numeric not null default 0,
  avg_watch_seconds numeric not null default 0,
  metadata jsonb
);

create index if not exists ecom_live_events_session_ts_idx
  on public.ecom_live_events (session_id, ts desc);
