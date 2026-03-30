-- Organizations and RBAC (simplified)
create table if not exists public.organization (
  id text primary key,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.user_role (
  user_id text not null,
  organization_id text not null references public.organization(id) on delete cascade,
  role text not null check (role in ('super_admin','admin','analyst','viewer')),
  primary key (user_id, organization_id)
);

-- Feature flags
create table if not exists public.flag (
  name text primary key,
  enabled boolean not null default true,
  updated_by text,
  updated_at timestamptz not null default now(),
  audience text not null default 'all'
);

-- API keys (hashed)
create table if not exists public.api_key (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null references public.organization(id) on delete cascade,
  name text not null,
  hash text not null,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

-- Rate limiting & idempotency
create table if not exists public.rate_limit_counter (
  key text primary key,
  window_end timestamptz not null,
  count integer not null
);

create table if not exists public.idempotency_store (
  idempotency_key text primary key,
  request_hash text not null,
  response_json jsonb not null,
  created_at timestamptz not null default now()
);

-- Jobs & DLQ
create table if not exists public.job_queue (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  payload jsonb not null,
  status text not null default 'queued',
  attempts integer not null default 0,
  available_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.job_dlq (
  id uuid primary key,
  type text not null,
  payload jsonb not null,
  error text,
  failed_at timestamptz not null default now()
);

-- Costs/quotas
create table if not exists public.endpoint_cost (
  id uuid primary key default gen_random_uuid(),
  tenant_id text,
  endpoint text not null,
  cost_units integer not null default 1,
  created_at timestamptz not null default now()
);

-- Privacy & DSAR
create table if not exists public.consent (
  id uuid primary key default gen_random_uuid(),
  tenant_id text,
  subject_id text not null,
  consent boolean not null,
  dnt boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.dsar_request (
  id uuid primary key default gen_random_uuid(),
  subject_id text not null,
  type text not null check (type in ('export','delete')),
  status text not null default 'queued',
  artifact_url text,
  created_at timestamptz not null default now()
);

-- Backups meta
create table if not exists public.backup_meta (
  id uuid primary key default gen_random_uuid(),
  path text not null,
  created_at timestamptz not null default now()
);

-- Synthetic monitoring
create table if not exists public.synthetic_probe (
  id uuid primary key default gen_random_uuid(),
  route text not null,
  status text not null,
  latency_ms integer not null,
  created_at timestamptz not null default now()
);


