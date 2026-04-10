-- Cultural Events — classified and actionable events from detected trends
-- Atlas subsystem 4 — Cultural Intelligence Pipeline
-- Fed by event-classifier from detected_trends, consumed by cultural-timing-intelligence.ts

create table if not exists cultural_events (
  id                      bigserial primary key,
  niche                   text        not null,
  event_title             text        not null,
  event_summary           text        not null,
  taxonomy_classification jsonb       not null default '{}'::jsonb,
  -- taxonomy_classification shape:
  -- { who: "...", what: "...", where: "...", when: "...", why: "...", how: "..." }
  velocity_score          double precision not null default 0,
  confidence              double precision not null default 0,
  decay_rate_estimate     double precision not null default 0.1,
  -- decay_rate: 0.0 = evergreen, 0.5 = moderate decay, 1.0 = flash trend (hours)
  activated_niches        text[]      default '{}',
  source_trend_ids        bigint[]    default '{}',
  keywords                text[]      default '{}',
  status                  text        not null default 'detected'
    check (status in ('detected', 'approved', 'expired', 'rejected')),
  auto_approved           boolean     not null default false,
  reviewed_at             timestamptz,
  reviewed_by             text,
  created_at              timestamptz not null default now(),
  expires_at              timestamptz
);

-- Fast lookups for active events by niche
create index if not exists idx_cultural_events_niche_status
  on cultural_events (niche, status, created_at desc);

-- Fast lookups for approved events (used by prediction pipeline)
create index if not exists idx_cultural_events_approved
  on cultural_events (status, expires_at)
  where status = 'approved';

-- Dedup handled at insert time (LLM classification checks for existing similar events)

comment on table cultural_events is 'Classified cultural events from detected_trends — consumed by prediction pipeline (Atlas subsystem 4)';
