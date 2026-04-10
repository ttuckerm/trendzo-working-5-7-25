-- Brief Variants — A/B/C variant generation for operator choice tracking
-- Each pre_generated_brief gets up to 3 variants with different feature dimensions

create table if not exists brief_variants (
  id                        bigserial primary key,
  brief_id                  bigint      not null references pre_generated_briefs(id) on delete cascade,
  variant_label             text        not null check (variant_label in ('A', 'B', 'C')),
  brief_content             jsonb       not null default '{}'::jsonb,
  vps_score                 double precision,
  feature_dimensions_varied jsonb       not null default '{}'::jsonb,
  -- shape: { "hook_type": "shock_stat", "changed_from": "question" }
  -- or: { "content_format": "pov", "changed_from": "talking_head", "pacing": "fast_cuts" }
  was_selected              boolean     not null default false,
  created_at                timestamptz not null default now()
);

create index if not exists idx_brief_variants_brief
  on brief_variants (brief_id, variant_label);

create index if not exists idx_brief_variants_selected
  on brief_variants (was_selected) where was_selected = true;

comment on table brief_variants is 'A/B/C variants per pre-generated brief — tracks operator/creator choice for Atlas feedback (subsystem 5)';
comment on column brief_variants.feature_dimensions_varied is 'What feature dimensions were changed from Variant A (the primary). Empty for Variant A itself.';
comment on column brief_variants.was_selected is 'Set to true when operator approves this variant. Exactly one variant per brief_id should be selected.';
