-- S6 retrain experiments. Separate from the trainer-engine `training_experiments`
-- table (20260407) which has a different schema and is used by the adaptive
-- trainer. This table holds the 5-variant Optuna runs awaiting manual promotion.
create table if not exists public.s6_training_experiments (
  id uuid primary key default gen_random_uuid(),
  experiment_name text not null,
  model_version text not null,
  variant text not null,
  cv_spearman double precision,
  holdout_spearman double precision,
  holdout_mae double precision,
  feature_importance_top15 jsonb,
  hyperparameters jsonb,
  training_rows integer,
  feature_count integer,
  status text not null default 'pending-approval'
    check (status in ('pending-approval', 'promoted', 'rejected', 'archived')),
  created_at timestamptz not null default now(),
  promoted_at timestamptz,
  promoted_by uuid
);

create index if not exists s6_training_experiments_version_idx
  on public.s6_training_experiments (model_version, created_at desc);
create index if not exists s6_training_experiments_status_idx
  on public.s6_training_experiments (status);
create index if not exists s6_training_experiments_experiment_idx
  on public.s6_training_experiments (experiment_name);

alter table public.s6_training_experiments enable row level security;
