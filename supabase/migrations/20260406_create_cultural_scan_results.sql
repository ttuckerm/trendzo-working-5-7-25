-- Cultural Intelligence Pipeline: Reddit scan results
-- Atlas subsystem 4 — KAIROS tick loop for periodic cultural data collection

create table if not exists cultural_scan_results (
  id            bigserial primary key,
  niche         text        not null,
  source        text        not null default 'reddit',
  subreddit     text,
  scan_date     date        not null default current_date,
  raw_data      jsonb       not null default '[]'::jsonb,
  post_count    int         not null default 0,
  top_themes    text[]      default '{}',
  created_at    timestamptz not null default now()
);

-- Fast lookups by niche + date
create index if not exists idx_cultural_scan_niche_date
  on cultural_scan_results (niche, scan_date desc);

-- Prevent duplicate scans for same niche+source+subreddit+date
-- coalesce handles Twitter rows where subreddit is null
create unique index if not exists idx_cultural_scan_unique
  on cultural_scan_results (niche, source, coalesce(subreddit, '_none_'), scan_date);

comment on table cultural_scan_results is 'Nightly Reddit+Twitter cultural intelligence scans per niche (Atlas subsystem 4)';
