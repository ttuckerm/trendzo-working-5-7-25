create table if not exists accuracy_metrics (
  id bigserial primary key,
  computed_at timestamptz not null,
  model_version text not null,
  n integer not null,
  auroc double precision not null,
  precision_at_100 double precision not null,
  ece double precision not null,
  heated_excluded_count integer default 0
);

create table if not exists experiment_runs (
  id bigserial primary key,
  created_at timestamptz not null,
  platform text not null,
  model_version text not null,
  metrics jsonb not null
);

create or replace view cohort_stats_current as
  select * from cohort_stats_2025W33; -- updated by recompute job


