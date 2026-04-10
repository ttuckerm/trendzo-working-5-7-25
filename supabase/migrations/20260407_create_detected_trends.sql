-- Cultural Intelligence Pipeline: LLM-synthesized trend detection
-- Atlas subsystem 4 — trend synthesis from Reddit + Twitter scan data

create table if not exists detected_trends (
  id              bigserial primary key,
  niche           text        not null,
  trend_summary   text        not null,
  velocity_score  double precision not null default 0,
  confidence      double precision not null default 0,
  source_count    int         not null default 0,
  sources         text[]      default '{}',
  evidence        jsonb       default '[]'::jsonb,
  detected_date   date        not null default current_date,
  created_at      timestamptz not null default now()
);

-- Fast lookups by niche + date
create index if not exists idx_detected_trends_niche_date
  on detected_trends (niche, detected_date desc);

-- Prevent duplicate trend entries for same niche+summary+date
create unique index if not exists idx_detected_trends_unique
  on detected_trends (niche, md5(trend_summary), detected_date);

comment on table detected_trends is 'LLM-synthesized cultural trends per niche from Reddit+Twitter scans (Atlas subsystem 4)';
