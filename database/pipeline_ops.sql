-- Pipeline Operations Schema (24/7 Engine Room)
-- Safe, idempotent DDL. Uses if exists/if not exists guards.

-- Modules registry (12 modules + metadata)
create table if not exists pipeline_modules (
  id text primary key,
  name text not null,
  version text default '1.0.0',
  description text,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists pipeline_module_config (
  module_id text primary key references pipeline_modules(id) on delete cascade,
  env_flags jsonb not null default '{}',
  scale int not null default 1,
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

-- Directed acyclic graph for dependencies
create table if not exists pipeline_dag_nodes (
  id text primary key,
  label text not null,
  module_id text references pipeline_modules(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists pipeline_dag_edges (
  id uuid primary key default gen_random_uuid(),
  upstream_node_id text not null references pipeline_dag_nodes(id) on delete cascade,
  downstream_node_id text not null references pipeline_dag_nodes(id) on delete cascade,
  last_health text,
  last_run_at timestamptz,
  created_at timestamptz not null default now()
);

-- Runs and logs
create type if not exists run_status as enum ('queued','running','success','failed','cancelled');

create table if not exists module_runs (
  id uuid primary key default gen_random_uuid(),
  module_id text not null references pipeline_modules(id) on delete cascade,
  status run_status not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  duration_ms int,
  error text,
  meta jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists idx_module_runs_module_time on module_runs(module_id, started_at desc);

create table if not exists module_logs (
  id bigserial primary key,
  module_id text not null references pipeline_modules(id) on delete cascade,
  run_id uuid references module_runs(id) on delete set null,
  ts timestamptz not null default now(),
  level text not null default 'info',
  message text not null,
  file_url text,
  meta jsonb not null default '{}'
);
create index if not exists idx_module_logs_module_ts on module_logs(module_id, ts desc);

-- Scheduler and scraping queues
create type if not exists job_status as enum ('queued','running','success','failed');

create table if not exists scheduler_logs (
  id bigserial primary key,
  job_name text not null,
  status job_status not null,
  scheduled_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  miss boolean default false,
  error text,
  meta jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists idx_scheduler_logs_job_time on scheduler_logs(job_name, created_at desc);

create table if not exists scraping_jobs (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  status job_status not null default 'queued',
  queued_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  params jsonb not null default '{}',
  error text
);
create index if not exists idx_scraping_jobs_status_queued on scraping_jobs(status) where status = 'queued';

-- Engagement windows for freshness/labels
create table if not exists video_engagement_windows (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null,
  captured_at timestamptz not null,
  views bigint,
  likes bigint,
  comments bigint,
  shares bigint,
  updated_at timestamptz not null default now()
);
create index if not exists idx_vew_video_time on video_engagement_windows(video_id, captured_at desc);

-- Authors and median views (if not present)
create table if not exists authors (
  id uuid primary key default gen_random_uuid(),
  username text,
  platform text not null default 'tiktok',
  median_views_30d numeric,
  updated_at timestamptz not null default now()
);

-- Pipeline alerts/incidents
create type if not exists alert_severity as enum ('info','warn','crit');
create table if not exists pipeline_alerts (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  severity alert_severity not null default 'warn',
  title text not null,
  description text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  meta jsonb not null default '{}'
);
create index if not exists idx_pipeline_alerts_open on pipeline_alerts(resolved_at) where resolved_at is null;

-- Control actions audit
create table if not exists pipeline_control_actions (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  module_id text references pipeline_modules(id) on delete set null,
  user_id text,
  params jsonb not null default '{}',
  status text not null default 'accepted',
  result jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_control_actions_time on pipeline_control_actions(created_at desc);

-- Changelog / audit trail
create table if not exists ops_changelog (
  id bigserial primary key,
  who text,
  what text not null,
  category text not null default 'deploy',
  created_at timestamptz not null default now(),
  meta jsonb not null default '{}'
);

-- Videos write log via triggers to compute dedupe rate
create table if not exists videos_write_log (
  id bigserial primary key,
  video_id uuid,
  op text not null check (op in ('insert','update')),
  at timestamptz not null default now()
);

do $$ begin
  if not exists (
    select 1 from pg_trigger where tgname = 'trg_videos_write_log_insert'
  ) then
    create or replace function fn_log_videos_insert() returns trigger language plpgsql as $$
    begin
      insert into videos_write_log(video_id, op, at) values (NEW.id, 'insert', now());
      return NEW;
    end $$;
    create trigger trg_videos_write_log_insert
      after insert on videos
      for each row execute procedure fn_log_videos_insert();
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_trigger where tgname = 'trg_videos_write_log_update'
  ) then
    create or replace function fn_log_videos_update() returns trigger language plpgsql as $$
    begin
      insert into videos_write_log(video_id, op, at) values (NEW.id, 'update', now());
      return NEW;
    end $$;
    create trigger trg_videos_write_log_update
      after update on videos
      for each row execute procedure fn_log_videos_update();
  end if;
end $$;

-- Helper function: author median 30d from engagement windows
create or replace function calc_author_median_30d(a_id uuid)
returns numeric language sql as $$
  with v as (
    select e.views::numeric as v
    from video_engagement_windows e
    join videos v on v.id = e.video_id
    where v.creator_id = a_id
      and e.captured_at >= now() - interval '30 days'
  )
  select percentile_cont(0.5) within group (order by v) from v;
$$;

-- View for 24h validation label
create or replace view validation_labels_24h as
select p.id as prediction_id,
       p.video_id,
       v.creator_id as author_id,
       (select views from video_engagement_windows e where e.video_id = p.video_id and e.captured_at >= p.prediction_date and e.captured_at < p.prediction_date + interval '24 hours' order by e.captured_at desc limit 1) as views_24h,
       calc_author_median_30d(v.creator_id) as author_median_30d,
       case when calc_author_median_30d(v.creator_id) is null or calc_author_median_30d(v.creator_id) = 0 then null
            else ( (select views from video_engagement_windows e where e.video_id = p.video_id and e.captured_at >= p.prediction_date and e.captured_at < p.prediction_date + interval '24 hours' order by e.captured_at desc limit 1)::numeric
                   / calc_author_median_30d(v.creator_id) ) end as label
from viral_predictions p
join videos v on v.id = p.video_id;

-- Minimal seed for 12 modules (idempotent upserts)
insert into pipeline_modules(id, name)
values
  ('tiktok-scraper','TikTok Scraper'),
  ('viral-pattern-analyzer','Viral Pattern Analyzer'),
  ('template-discovery','Template Discovery Engine'),
  ('draft-video-analyzer','Draft Video Analyzer'),
  ('script-intelligence','Script Intelligence Module'),
  ('recipe-book-generator','Recipe Book Generator'),
  ('prediction-engine','Prediction Engine'),
  ('performance-validator','Performance Validator'),
  ('marketing-content-creator','Marketing Content Creator'),
  ('dashboard-aggregator','Dashboard Aggregator'),
  ('system-health-monitor','System Health Monitor'),
  ('process-intelligence-layer','Process Intelligence Layer')
on conflict (id) do update set name = excluded.name;



