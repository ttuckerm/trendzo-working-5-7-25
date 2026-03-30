-- Persist Freedom OS generated plans so users can access them via a unique link.
-- This table stores NON-SENSITIVE plan data only (no passwords, no SSN, no financials beyond what the tool computes).

create table if not exists public.freedom_os_saved_plans (
  id          uuid          primary key default gen_random_uuid(),
  created_at  timestamptz   not null    default now(),
  email       text,
  plan        jsonb         not null,
  source_url  text,
  user_agent  text,
  ip          text,
  expires_at  timestamptz
);

create index if not exists freedom_os_saved_plans_created_at_idx
  on public.freedom_os_saved_plans (created_at desc);

-- RLS: public read (for plan link access) + public insert (for lead route)
alter table public.freedom_os_saved_plans enable row level security;

create policy "Anyone can read a saved plan by id"
  on public.freedom_os_saved_plans
  for select
  using (true);

create policy "Anyone can insert a saved plan"
  on public.freedom_os_saved_plans
  for insert
  with check (true);
