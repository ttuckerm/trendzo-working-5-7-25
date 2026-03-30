-- QuickWin TikTok Pipeline – core schemas (v1)
-- Idempotent-safe: use IF NOT EXISTS guards where possible

-- Platforms enum (text-based for flexibility)
-- Engagement window values: '1h','6h','24h','48h','7d'

create table if not exists public.authors (
  id bigserial primary key,
  platform text not null default 'tiktok',
  author_id text not null,
  handle text,
  verified boolean default false,
  bio text,
  external_url_present boolean default false,
  followers bigint default 0,
  following bigint default 0,
  hearts bigint default 0,
  video_count bigint default 0,
  median_views_30d numeric,
  iqr_views_30d numeric,
  post_freq_30d numeric,
  posting_heatmap jsonb,
  niche_profile jsonb,
  goal_profile jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(platform, author_id)
);

create index if not exists idx_authors_platform_author on public.authors(platform, author_id);

create table if not exists public.sounds (
  id bigserial primary key,
  platform text not null default 'tiktok',
  sound_id text not null,
  title text,
  url text,
  total_uses bigint,
  velocity_24h numeric,
  velocity_7d numeric,
  niche_mapping jsonb,
  median_success_label_24h numeric,
  audio_features jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(platform, sound_id)
);

create table if not exists public.hashtags (
  id bigserial primary key,
  platform text not null default 'tiktok',
  tag text not null,
  total_uses bigint,
  velocity_24h numeric,
  velocity_7d numeric,
  niche_mapping jsonb,
  median_success_label_24h numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(platform, tag)
);

create table if not exists public.effects (
  id bigserial primary key,
  platform text not null default 'tiktok',
  effect_id text not null,
  name text,
  total_uses bigint,
  velocity_24h numeric,
  velocity_7d numeric,
  niche_mapping jsonb,
  median_success_label_24h numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(platform, effect_id)
);

create table if not exists public.videos (
  id bigserial primary key,
  platform text not null default 'tiktok',
  video_id text not null,
  author_id text not null,
  create_time timestamptz,
  duration_sec numeric,
  aspect text,
  caption_full text,
  hashtags text[] default '{}',
  mentions text[] default '{}',
  sound_id text,
  sound_title text,
  sound_url text,
  is_original_sound boolean,
  is_duet boolean,
  is_stitch boolean,
  parent_video_id text,
  is_ad boolean,
  branded_hint boolean,
  niche_labels text[] default '{}',
  goal_labels text[] default '{}',
  scrape_id text,
  actor_name text,
  actor_version text,
  scrape_time timestamptz,
  source_url text,
  content_lang text,
  transcript_lang text,
  geo_hint text,
  pipeline_version text,
  retention_policy_key text,
  dedupe_hash text,
  seen_before_at timestamptz,
  source_consistency_score numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(platform, video_id)
);

create index if not exists idx_videos_platform_video on public.videos(platform, video_id);
create index if not exists idx_videos_author on public.videos(author_id);
create index if not exists idx_videos_hashtags_gin on public.videos using gin(hashtags);
create index if not exists idx_videos_labels_gin on public.videos using gin(niche_labels);
create index if not exists idx_videos_goal_labels_gin on public.videos using gin(goal_labels);

create table if not exists public.video_features (
  id bigserial primary key,
  platform text not null default 'tiktok',
  video_id text not null,
  asr_transcript jsonb,
  ocr_overlays jsonb,
  beat_timeline jsonb,
  cta_forward boolean,
  cuts_per_min numeric,
  avg_shot_length numeric,
  talking_head_ratio numeric,
  broll_ratio numeric,
  captions_present boolean,
  words_on_screen_per_10s numeric,
  emoji_count integer,
  caps_ratio numeric,
  question_mark_count integer,
  list_pattern_detected boolean,
  steps_count integer,
  transformation_pair_detected boolean,
  myth_truth_pattern boolean,
  bpm numeric,
  energy_mood text,
  voiceover_present boolean,
  speech_rate_wpm numeric,
  posted_local_hour integer,
  dow integer,
  time_to_first_1k_views numeric,
  competing_trend_density numeric,
  safety jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(platform, video_id)
);

create table if not exists public.video_engagement_windows (
  id bigserial primary key,
  platform text not null default 'tiktok',
  video_id text not null,
  window text not null check (window in ('1h','6h','24h','48h','7d')),
  metric text not null check (metric in ('views','likes','comments','shares','saves')),
  value bigint not null default 0,
  captured_at timestamptz not null default now()
);
create index if not exists idx_vew_video_window_metric on public.video_engagement_windows(platform, video_id, window, metric);

create table if not exists public.comments_sample (
  id bigserial primary key,
  platform text not null default 'tiktok',
  video_id text not null,
  top_comments jsonb,
  sentiment_avg numeric,
  sentiment_std numeric,
  qa_ratio numeric,
  intents jsonb,
  objection_themes jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.template_reservoir (
  id bigserial primary key,
  platform text not null default 'tiktok',
  niche text,
  goal text,
  template_type text,
  name text,
  canonical_sequence_modes jsonb,
  hook_archetypes jsonb,
  cta_placement_distribution jsonb,
  durations jsonb,
  cuts_per_min_norms jsonb,
  caption_length_norms jsonb,
  sound_archetypes jsonb,
  expected_uplift_by_fix jsonb,
  example_scripts jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.predictions (
  id bigserial primary key,
  receipt_id text not null,
  platform text not null default 'tiktok',
  video_draft_id text,
  inputs jsonb,
  prediction_probability numeric,
  predicted_bucket text,
  validation_eta_hours integer default 48,
  created_at timestamptz not null default now(),
  unique(receipt_id)
);

create table if not exists public.posting_schedules (
  id bigserial primary key,
  plan jsonb not null,
  created_at timestamptz not null default now()
);

-- FKs (soft, not enforced if missing reference rows; Supabase may need policies)
-- Not adding strict FKs to avoid ingestion order issues in v1.


