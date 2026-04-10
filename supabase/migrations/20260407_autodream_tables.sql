-- autoDream Overnight Pipeline — Atlas subsystem 5
-- Pre-generated briefs from overnight cultural intel + creator context
-- Morning brief cards composed from top pre-generated briefs

-- Pre-generated briefs: one per client per cultural event mismatch
create table if not exists pre_generated_briefs (
  id                bigserial primary key,
  agency_id         uuid        not null,
  client_id         uuid        not null,
  cultural_event_id bigint      references cultural_events(id),
  brief_content     jsonb       not null default '{}'::jsonb,
  -- brief_content shape:
  -- { title, hook, angle, format, talking_points[], cta, pattern_id?, narrative_arc? }
  vps_score         double precision,
  confidence        double precision default 0,
  priority_type     text        default 'trend_opportunity'
    check (priority_type in ('outperformance_alert', 'decay_warning', 'trend_opportunity')),
  status            text        not null default 'draft'
    check (status in ('draft', 'presented', 'accepted', 'rejected', 'expired')),
  generated_at      timestamptz not null default now(),
  expires_at        timestamptz,
  niche             text
);

create index if not exists idx_pre_briefs_agency_client
  on pre_generated_briefs (agency_id, client_id, status, generated_at desc);

create index if not exists idx_pre_briefs_event
  on pre_generated_briefs (cultural_event_id);

-- Morning briefs: compiled brief cards per agency per day
create table if not exists morning_briefs (
  id          bigserial primary key,
  agency_id   uuid        not null,
  brief_date  date        not null default current_date,
  cards       jsonb       not null default '[]'::jsonb,
  -- cards shape: array of { client_id, client_name, event_title, brief_summary,
  --   vps_score, priority_type, pre_brief_id, decay_warning? }
  card_count  int         not null default 0,
  status      text        not null default 'ready'
    check (status in ('generating', 'ready', 'delivered', 'expired')),
  created_at  timestamptz not null default now()
);

create unique index if not exists idx_morning_briefs_unique
  on morning_briefs (agency_id, brief_date);

create index if not exists idx_morning_briefs_status
  on morning_briefs (status, brief_date desc);

comment on table pre_generated_briefs is 'Overnight-generated content briefs per client from cultural events (Atlas subsystem 5)';
comment on table morning_briefs is 'Compiled morning brief cards per agency — top 3 priorities (Atlas subsystem 5)';
