-- Add default TTL of 30 days to expires_at column.
-- Existing rows with NULL expires_at remain accessible (no retroactive expiry).
alter table public.freedom_os_saved_plans
  alter column expires_at set default (now() + interval '30 days');

-- Index for efficient expiry lookups
create index if not exists freedom_os_saved_plans_expires_at_idx
  on public.freedom_os_saved_plans (expires_at)
  where expires_at is not null;

-- Index for email lookups (used by resend route)
create index if not exists freedom_os_saved_plans_email_idx
  on public.freedom_os_saved_plans (email, created_at desc)
  where email is not null;
