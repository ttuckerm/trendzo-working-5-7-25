-- Core Onboarding Data Foundation
-- Session 1 of 6: onboarding_profiles + generated_scripts tables
-- Note: existing creator_profiles (channel analytics) and calibration_profiles tables are NOT modified.
-- This new onboarding_profiles table supersedes them for the core onboarding flow.
-- Safe to re-run: uses IF NOT EXISTS and DO $$ blocks throughout.

-- ─── onboarding_profiles ─────────────────────────────────────────────────────
-- Canonical record for everything we know about a user from onboarding.
-- Every downstream feature reads from this table.

create table if not exists onboarding_profiles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  onboarding_step text default 'entry',
  onboarding_completed_at timestamptz,
  account_type text,

  -- Business Identity
  business_name text,
  business_description text,
  offer_breakdown jsonb default '[]',
  customer_journey_steps jsonb default '[]',

  -- Niche & Content
  niche_key text,
  subtopics jsonb default '[]',
  content_goals text[] default '{}',

  -- Channel
  platform text default 'tiktok',
  channel_handle text,
  channel_verified boolean default false,
  follower_count integer,
  channel_data jsonb,

  -- Creator Story
  origin_story text,
  wins_and_losses text,
  current_position text,
  content_exclusions jsonb default '[]',
  fun_facts jsonb default '[]',

  -- Audience Profile
  target_demographics jsonb,
  audience_pain_points jsonb default '[]',
  audience_dream_result text,
  audience_myths jsonb default '[]',
  audience_mistakes jsonb default '[]',

  -- Content Voice & Style
  brand_tone text[],
  editing_style_references jsonb default '[]',
  brand_colors jsonb,
  brand_assets jsonb default '[]',

  -- Competitive Landscape
  competitor_handles jsonb default '[]',
  competitor_analysis jsonb,

  -- Signal Calibration Results
  calibration_preferences jsonb,
  hook_style_preference text,
  tone_match text,
  pattern_saturation jsonb,

  -- Engagement Setup
  manychat_trigger_word text,
  landing_page_url text,
  lead_magnet_description text,
  lead_magnet_url text,

  -- System-Generated (populated after onboarding completes)
  niche_viral_patterns jsonb,
  recommended_hooks jsonb,
  content_strategy_summary text
);

-- Add columns that may be missing if table was created before Session 2 updates
do $$ begin
  alter table onboarding_profiles add column if not exists account_type text;
  alter table onboarding_profiles add column if not exists content_goals text[] default '{}';
exception when others then null;
end $$;

create index if not exists idx_onboarding_profiles_user on onboarding_profiles(user_id);
create index if not exists idx_onboarding_profiles_niche on onboarding_profiles(niche_key);

-- ─── generated_scripts ───────────────────────────────────────────────────────
-- Dedicated table for script storage and retrieval.
-- Previously scripts were only stored in api_usage_logs with no retrieval mechanism.

create table if not exists generated_scripts (
  id uuid default gen_random_uuid() primary key,
  onboarding_profile_id uuid references onboarding_profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  -- Script content
  script_text text not null,
  script_version integer default 1,
  parent_script_id uuid references generated_scripts(id),

  -- Generation context
  niche_key text,
  template_video_id text,
  hook_type text,
  generation_prompt_hash text,

  -- Data sources used
  viral_patterns_used jsonb,
  hooks_used jsonb,
  creator_data_used jsonb,

  -- Prediction linkage
  prediction_run_id uuid,
  vps_score numeric,

  -- Status
  status text default 'draft'
);

create index if not exists idx_generated_scripts_profile on generated_scripts(onboarding_profile_id);
create index if not exists idx_generated_scripts_niche on generated_scripts(niche_key);
