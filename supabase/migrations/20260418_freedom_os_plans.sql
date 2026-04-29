-- AI-generated Freedom OS plans (Claude) with shareable id for /free/freedom-os/plan/[id]

create table if not exists public.freedom_os_plans (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  email             text,
  inputs            jsonb not null default '{}'::jsonb,
  plan              jsonb not null,
  beehiiv_tag       text,
  beehiiv_segment   text
);

create index if not exists freedom_os_plans_created_at_idx
  on public.freedom_os_plans (created_at desc);

create index if not exists freedom_os_plans_email_idx
  on public.freedom_os_plans (email, created_at desc);

alter table public.freedom_os_plans enable row level security;

create policy "Anyone can read a freedom_os_plan by id"
  on public.freedom_os_plans
  for select
  using (true);

-- Inserts: use Supabase service role in API (bypasses RLS). No public insert policy.
