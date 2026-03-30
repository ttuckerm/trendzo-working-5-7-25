create table if not exists public.objective_results (
  id uuid primary key default gen_random_uuid(),
  objective_id text not null,
  status text not null check (status in ('PASS','FAIL','PENDING','SKIPPED')),
  summary_json jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_objective_results_objective_created on public.objective_results (objective_id, created_at desc);

