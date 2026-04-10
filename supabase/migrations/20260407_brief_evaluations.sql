-- Adversarial Evaluation Layer — Critic/Synthesizer pipeline
-- Tracks each adversarial round per brief before it enters pre_generated_briefs

-- brief_evaluations: one row per adversarial round per brief
create table if not exists brief_evaluations (
  id              bigserial primary key,
  brief_id        bigint      not null references pre_generated_briefs(id) on delete cascade,
  round_number    int         not null check (round_number between 1 and 3),
  critic_score    int         not null check (critic_score between 0 and 100),
  objections      jsonb       not null default '[]'::jsonb,
  -- objections shape: array of { element: string, weakness: string, threshold_violated?: string }
  revised         boolean     not null default false,
  created_at      timestamptz not null default now()
);

create index if not exists idx_brief_evals_brief
  on brief_evaluations (brief_id, round_number);

-- Add adversarial metadata to pre_generated_briefs
alter table pre_generated_briefs
  add column if not exists final_critic_score int,
  add column if not exists adversarial_rounds int default 0;

comment on table brief_evaluations is 'Adversarial critic evaluation rounds per pre-generated brief (Atlas subsystem 5)';
comment on column pre_generated_briefs.final_critic_score is 'Critic score from the last adversarial round (0-100)';
comment on column pre_generated_briefs.adversarial_rounds is 'Number of adversarial Critic rounds the brief went through';
