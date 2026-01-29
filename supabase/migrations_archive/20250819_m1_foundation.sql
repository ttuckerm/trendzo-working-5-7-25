-- Milestone M1 Foundation: Universal Video Profile (VIT v1), metrics, predictions, dedupe, drift, calibration, pipeline
-- Idempotent, safe to re-run. Uses IF NOT EXISTS and ON CONFLICT.

-- Enable required extensions
create extension if not exists pgcrypto;
create extension if not exists pg_stat_statements;
create extension if not exists pg_trgm;
create extension if not exists btree_gin;
create extension if not exists pg_cron;

-- VIT core tables
create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  platform_video_id text not null,
  creator_id text,
  niche text,
  publish_ts timestamptz,
  duration_sec int,
  locale text,
  caption text,
  hashtags jsonb,
  audio jsonb,
  vit_json jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(platform, platform_video_id)
);

create table if not exists public.video_metrics (
  video_id uuid not null references public.videos(id) on delete cascade,
  window text not null check (window in ('1h','2h','6h','24h','48h','7d')),
  views int default 0,
  likes int default 0,
  comments int default 0,
  shares int default 0,
  saves int default 0,
  avg_view_dur_sec int,
  retention jsonb,
  computed_at timestamptz not null default now(),
  primary key(video_id, window)
);

create table if not exists public.creator_baselines (
  creator_id text not null,
  platform text not null,
  window text not null,
  median_views numeric,
  median_er numeric,
  median_velocity numeric,
  z_params jsonb,
  updated_at timestamptz not null default now(),
  primary key(creator_id, platform, window)
);

create table if not exists public.predictions (
  video_id uuid primary key references public.videos(id) on delete cascade,
  probability numeric,
  confidence numeric,
  rationale text,
  top_factors jsonb,
  latency_ms int,
  created_at timestamptz not null default now()
);

create table if not exists public.validations (
  video_id uuid not null references public.videos(id) on delete cascade,
  label text not null check (label in ('viral','nonviral')),
  was_correct bool,
  error_type text,
  calibration_bin int,
  collected_at timestamptz not null default now()
);
create index if not exists idx_validations_video on public.validations(video_id);

create table if not exists public.duplicate_signatures (
  video_id uuid primary key references public.videos(id) on delete cascade,
  sig_text text,
  sig_thumb_hash text,
  sig_audio_id text,
  duplicate_of uuid null references public.videos(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.drift_events (
  id uuid primary key default gen_random_uuid(),
  feature text not null,
  stat text not null,
  score numeric not null,
  action text,
  created_at timestamptz not null default now()
);

create table if not exists public.calibration_bins (
  bin int primary key,
  count int not null default 0,
  mean_pred numeric,
  empirical_rate numeric,
  updated_at timestamptz not null default now()
);

create table if not exists public.pipeline_runs (
  id uuid primary key default gen_random_uuid(),
  status text,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  processed_count int not null default 0,
  error_count int not null default 0,
  spend_usd numeric,
  notes jsonb
);

-- Pipeline control flags honored by edge functions
create table if not exists public.pipeline_control (
  id int primary key default 1,
  is_running boolean not null default true,
  desired_action text,
  updated_at timestamptz not null default now()
);

create table if not exists public.objective_status (
  objective_id int primary key,
  title text,
  target text,
  value text,
  passed bool,
  updated_at timestamptz not null default now()
);

create table if not exists public.cost_ledger (
  source text not null,
  run_id uuid,
  cost_usd numeric not null,
  occurred_at timestamptz not null default now()
);
create index if not exists idx_cost_ledger_time on public.cost_ledger(occurred_at);

-- Materialized views
create materialized view if not exists public.mv_video_metrics_48h as
  select v.id as video_id,
         coalesce(m.views,0) as views,
         coalesce(m.likes,0) as likes,
         coalesce(m.comments,0) as comments,
         coalesce(m.shares,0) as shares,
         coalesce(m.saves,0) as saves,
         m.avg_view_dur_sec,
         m.retention,
         m.computed_at
  from public.videos v
  left join public.video_metrics m on m.video_id = v.id and m.window = '48h';

create materialized view if not exists public.mv_accuracy_summary as
  with latest_labels as (
    select video_id, label, collected_at,
           row_number() over(partition by video_id order by collected_at desc) rn
    from public.validations
  ),
  comp as (
    select p.video_id,
           case when l.label = 'viral' and p.probability >= 0.5 then 1
                when l.label = 'nonviral' and p.probability < 0.5 then 1
                else 0 end as correct
    from public.predictions p
    join latest_labels l on l.video_id = p.video_id and l.rn = 1
  )
  select count(*) as n,
         sum(correct)::int as correct,
         round(100.0 * sum(correct) / nullif(count(*),0), 1) as accuracy_pct,
         now() as computed_at
  from comp;

-- Update triggers
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end; $$ language plpgsql;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_videos_updated_at') then
    create trigger trg_videos_updated_at before update on public.videos
    for each row execute procedure public.set_updated_at();
  end if;
end $$;

-- SQL helper functions
create or replace function public.refresh_video_metrics() returns void as $$
begin
  -- Example aggregation logic; replace with real aggregation from raw events when available
  refresh materialized view concurrently public.mv_video_metrics_48h;
end; $$ language plpgsql;

create or replace function public.refresh_creator_baselines() returns void as $$
begin
  -- Compute median stats per creator/platform from last 30d 48h window
  insert into public.creator_baselines (creator_id, platform, window, median_views, median_er, median_velocity, z_params, updated_at)
  select v.creator_id, v.platform, '48h',
         percentile_cont(0.5) within group (order by m.views)::numeric as median_views,
         null::numeric as median_er,
         null::numeric as median_velocity,
         jsonb_build_object('mean', avg(m.views), 'stddev', stddev_pop(m.views)) as z_params,
         now()
  from public.videos v
  join public.video_metrics m on m.video_id = v.id and m.window = '48h'
  where v.publish_ts > now() - interval '30 days'
  group by 1,2
  on conflict (creator_id, platform, window) do update set
    median_views = excluded.median_views,
    median_er = excluded.median_er,
    median_velocity = excluded.median_velocity,
    z_params = excluded.z_params,
    updated_at = now();
end; $$ language plpgsql;

create or replace function public.compute_viral_label(in_video_id uuid) returns void as $$
declare
  v_platform text;
  v_creator text;
  v_views numeric;
  mean_views numeric;
  std_views numeric;
  z_score numeric;
  pct numeric;
begin
  select v.platform, v.creator_id into v_platform, v_creator from public.videos v where v.id = in_video_id;
  select m.views into v_views from public.video_metrics m where m.video_id = in_video_id and m.window = '48h';
  select (z_params->>'mean')::numeric, (z_params->>'stddev')::numeric into mean_views, std_views
    from public.creator_baselines where creator_id = v_creator and platform = v_platform and window = '48h';
  if std_views is null or std_views = 0 then
    z_score := null;
  else
    z_score := (v_views - mean_views) / nullif(std_views,0);
  end if;
  -- Percentile within creator-platform cohort
  select percentile_cont(0.95) within group (order by m.views)::numeric into pct
  from public.videos v
  join public.video_metrics m on m.video_id = v.id and m.window = '48h'
  where v.platform = v_platform and v.creator_id = v_creator;

  if z_score is not null and z_score >= 2.0 and v_views >= coalesce(pct, 0) then
    insert into public.validations (video_id, label, was_correct)
    values (in_video_id, 'viral', null)
    on conflict do nothing;
  else
    insert into public.validations (video_id, label, was_correct)
    values (in_video_id, 'nonviral', null)
    on conflict do nothing;
  end if;
end; $$ language plpgsql;

create or replace function public.recompute_calibration_bins() returns void as $$
begin
  with joined as (
    select p.video_id, p.probability, v.label
    from public.predictions p
    join public.validations v on v.video_id = p.video_id
  ), binned as (
    select width_bucket(probability, 0.0, 1.0, 20) as bin,
           count(*) as cnt,
           avg(probability) as mean_pred,
           avg(case when label='viral' then 1.0 else 0.0 end) as empirical_rate
    from joined group by 1
  )
  insert into public.calibration_bins as cb (bin, count, mean_pred, empirical_rate, updated_at)
  select bin, cnt, mean_pred, empirical_rate, now() from binned
  on conflict (bin) do update set
    count = excluded.count,
    mean_pred = excluded.mean_pred,
    empirical_rate = excluded.empirical_rate,
    updated_at = now();
end; $$ language plpgsql;

-- Validation rollup for videos past 48h; computes labels and updates calibration summary
create or replace function public.run_validation_rollup() returns void as $$
declare
  r record;
begin
  for r in
    select id from public.videos
    where publish_ts is not null and publish_ts < now() - interval '48 hours'
  loop
    perform public.compute_viral_label(r.id);
  end loop;
  perform public.recompute_calibration_bins();
  refresh materialized view concurrently public.mv_accuracy_summary;
end; $$ language plpgsql;

-- Safe views for public pages
create view if not exists public.v_videos_grid as
  select v.id, v.platform, v.creator_id, v.updated_at,
         (select probability from public.predictions p where p.video_id = v.id limit 1) as probability,
         (select label from public.validations val where val.video_id = v.id order by collected_at desc limit 1) as label
  from public.videos v;

-- RLS
alter table public.videos enable row level security;
alter table public.video_metrics enable row level security;
alter table public.creator_baselines enable row level security;
alter table public.predictions enable row level security;
alter table public.validations enable row level security;
alter table public.duplicate_signatures enable row level security;
alter table public.drift_events enable row level security;
alter table public.calibration_bins enable row level security;
alter table public.pipeline_runs enable row level security;
alter table public.objective_status enable row level security;
alter table public.cost_ledger enable row level security;

do $$ begin
  -- basic read to authenticated
  perform 1;
  exception when others then null; -- ignore if roles not present
end $$;

create policy if not exists vids_read on public.videos for select to authenticated using (true);
create policy if not exists vidm_read on public.video_metrics for select to authenticated using (true);
create policy if not exists pred_read on public.predictions for select to authenticated using (true);
create policy if not exists val_read on public.validations for select to authenticated using (true);
create policy if not exists bins_read on public.calibration_bins for select to anon, authenticated using (true);
create policy if not exists drift_read on public.drift_events for select to anon, authenticated using (true);
create policy if not exists pipeline_read on public.pipeline_runs for select to authenticated using (true);
create policy if not exists objective_read on public.objective_status for select to authenticated using (true);

-- pg_cron registrations
select cron.schedule('metrics_refresh', '*/10 * * * *', $$ select public.refresh_video_metrics(); $$);
select cron.schedule('validation_rollup', '*/30 * * * *', $$ select public.run_validation_rollup(); $$);


