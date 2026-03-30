-- Migration: Merge calibration_profiles columns into onboarding_profiles
-- Goal: Make onboarding_profiles the single source of truth for all creator data.
-- calibration_profiles is NOT dropped — kept as a backup.
--
-- Column naming: calibration_profiles has hook_style_preference (JSONB) and tone_match (JSONB)
-- but onboarding_profiles already has hook_style_preference (TEXT) and tone_match (TEXT).
-- The calibration JSONB versions (Record<string,number> score maps) are added with cal_ prefix.

-- ─── Step 1: Add calibration-specific columns ──────────────────────────────

ALTER TABLE onboarding_profiles
  -- Raw dimension scores (JSONB, Record<string, number> with values 0-100)
  ADD COLUMN IF NOT EXISTS niche_affinity jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS cal_hook_style_preference jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS cal_tone_match jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS audience_pain_alignment jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS editing_style_fit jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS content_format_preference jsonb DEFAULT '{}',

  -- Inferred profile fields
  ADD COLUMN IF NOT EXISTS inferred_niche text,
  ADD COLUMN IF NOT EXISTS inferred_audience_age_range text,
  ADD COLUMN IF NOT EXISTS inferred_audience_description text,
  ADD COLUMN IF NOT EXISTS inferred_content_style text,
  ADD COLUMN IF NOT EXISTS inferred_competitors text[] DEFAULT '{}',

  -- User-provided fields from calibration
  ADD COLUMN IF NOT EXISTS offer text,
  ADD COLUMN IF NOT EXISTS exclusions text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS selected_niche text DEFAULT '',
  ADD COLUMN IF NOT EXISTS selected_goal text DEFAULT '',
  ADD COLUMN IF NOT EXISTS selected_subtopics text[],

  -- Creator staging
  ADD COLUMN IF NOT EXISTS creator_stage text,
  ADD COLUMN IF NOT EXISTS dimension_scores jsonb,
  ADD COLUMN IF NOT EXISTS staged_at timestamptz,

  -- Creator story (JSONB: transformation, nicheMyths[], audienceDesiredResult, etc.)
  ADD COLUMN IF NOT EXISTS cal_creator_story jsonb,

  -- Audience enrichment (progressive capture)
  ADD COLUMN IF NOT EXISTS audience_location text,
  ADD COLUMN IF NOT EXISTS audience_occupation text,

  -- Quality & diagnostics
  ADD COLUMN IF NOT EXISTS quality_discernment_score numeric(5,2),
  ADD COLUMN IF NOT EXISTS hook_usage_log jsonb DEFAULT '[]'::jsonb;

-- ─── Step 2: Add UNIQUE constraint on user_id ──────────────────────────────
-- Required for upsert pattern (onConflict: 'user_id')
-- get-or-create-profile.ts already assumes one row per user

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'onboarding_profiles_user_unique'
  ) THEN
    ALTER TABLE onboarding_profiles
      ADD CONSTRAINT onboarding_profiles_user_unique UNIQUE (user_id);
  END IF;
END $$;

-- ─── Step 3: Add indexes matching calibration_profiles ─────────────────────

CREATE INDEX IF NOT EXISTS idx_onboarding_profiles_creator_stage
  ON onboarding_profiles (creator_stage)
  WHERE creator_stage IS NOT NULL;

-- ─── Step 4: Migrate data from calibration_profiles ────────────────────────
-- For each calibration_profiles row with a valid user_id:
--   - If matching onboarding_profiles row exists: fill in NULL calibration columns
--   - If no matching row: INSERT a new onboarding_profiles row

-- Step 4a: Update existing onboarding_profiles rows with calibration data
-- ONLY uses columns from the base calibration_profiles CREATE TABLE (guaranteed to exist)
UPDATE onboarding_profiles op
SET
  niche_affinity = COALESCE(op.niche_affinity, cp.niche_affinity),
  cal_hook_style_preference = COALESCE(op.cal_hook_style_preference, cp.hook_style_preference),
  cal_tone_match = COALESCE(op.cal_tone_match, cp.tone_match),
  audience_pain_alignment = COALESCE(op.audience_pain_alignment, cp.audience_pain_alignment),
  editing_style_fit = COALESCE(op.editing_style_fit, cp.editing_style_fit),
  content_format_preference = COALESCE(op.content_format_preference, cp.content_format_preference),
  inferred_niche = COALESCE(op.inferred_niche, cp.inferred_niche),
  inferred_audience_age_range = COALESCE(op.inferred_audience_age_range, cp.inferred_audience_age_range),
  inferred_audience_description = COALESCE(op.inferred_audience_description, cp.inferred_audience_description),
  inferred_content_style = COALESCE(op.inferred_content_style, cp.inferred_content_style),
  inferred_competitors = CASE WHEN op.inferred_competitors = '{}' THEN cp.inferred_competitors ELSE op.inferred_competitors END,
  offer = COALESCE(op.offer, cp.offer),
  exclusions = CASE WHEN op.exclusions = '{}' THEN cp.exclusions ELSE op.exclusions END,
  selected_niche = CASE WHEN op.selected_niche = '' THEN cp.selected_niche ELSE op.selected_niche END,
  selected_goal = CASE WHEN op.selected_goal = '' THEN cp.selected_goal ELSE op.selected_goal END,
  updated_at = now()
FROM calibration_profiles cp
WHERE cp.user_id = op.user_id;

-- Step 4b: Insert calibration_profiles rows that have no matching onboarding_profiles row
-- ONLY uses base table columns
INSERT INTO onboarding_profiles (
  user_id,
  niche_affinity, cal_hook_style_preference, cal_tone_match,
  audience_pain_alignment, editing_style_fit, content_format_preference,
  inferred_niche, inferred_audience_age_range, inferred_audience_description,
  inferred_content_style, inferred_competitors,
  offer, exclusions, selected_niche, selected_goal,
  onboarding_step
)
SELECT
  cp.user_id,
  cp.niche_affinity, cp.hook_style_preference, cp.tone_match,
  cp.audience_pain_alignment, cp.editing_style_fit, cp.content_format_preference,
  cp.inferred_niche, cp.inferred_audience_age_range, cp.inferred_audience_description,
  cp.inferred_content_style, cp.inferred_competitors,
  cp.offer, cp.exclusions, cp.selected_niche, cp.selected_goal,
  'migrated'
FROM calibration_profiles cp
WHERE cp.user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM onboarding_profiles op WHERE op.user_id = cp.user_id
  );

-- Step 4c: Conditionally migrate ALTER TABLE columns (may not exist on calibration_profiles
-- if their respective migrations were not applied to the live DB)
DO $$
DECLARE
  col_exists boolean;
BEGIN
  -- creator_stage, dimension_scores, staged_at (from 20260303_creator_staging.sql)
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'calibration_profiles' AND column_name = 'creator_stage'
  ) INTO col_exists;
  IF col_exists THEN
    EXECUTE '
      UPDATE onboarding_profiles op SET
        creator_stage = COALESCE(op.creator_stage, cp.creator_stage),
        dimension_scores = COALESCE(op.dimension_scores, cp.dimension_scores),
        staged_at = COALESCE(op.staged_at, cp.staged_at)
      FROM calibration_profiles cp WHERE cp.user_id = op.user_id';
    RAISE NOTICE 'Migrated creator_stage, dimension_scores, staged_at from calibration_profiles';
  ELSE
    RAISE NOTICE 'Skipped creator_stage columns — not found on calibration_profiles';
  END IF;

  -- selected_subtopics (from 20260306_subtopic_scope.sql)
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'calibration_profiles' AND column_name = 'selected_subtopics'
  ) INTO col_exists;
  IF col_exists THEN
    EXECUTE '
      UPDATE onboarding_profiles op SET
        selected_subtopics = COALESCE(op.selected_subtopics, cp.selected_subtopics)
      FROM calibration_profiles cp WHERE cp.user_id = op.user_id';
    RAISE NOTICE 'Migrated selected_subtopics from calibration_profiles';
  ELSE
    RAISE NOTICE 'Skipped selected_subtopics — not found on calibration_profiles';
  END IF;

  -- creator_story (from 20260306_creator_story.sql)
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'calibration_profiles' AND column_name = 'creator_story'
  ) INTO col_exists;
  IF col_exists THEN
    EXECUTE '
      UPDATE onboarding_profiles op SET
        cal_creator_story = COALESCE(op.cal_creator_story, cp.creator_story)
      FROM calibration_profiles cp WHERE cp.user_id = op.user_id';
    RAISE NOTICE 'Migrated creator_story from calibration_profiles';
  ELSE
    RAISE NOTICE 'Skipped creator_story — not found on calibration_profiles';
  END IF;

  -- audience_location, audience_occupation (from 20260306_audience_enrichment.sql)
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'calibration_profiles' AND column_name = 'audience_location'
  ) INTO col_exists;
  IF col_exists THEN
    EXECUTE '
      UPDATE onboarding_profiles op SET
        audience_location = COALESCE(op.audience_location, cp.audience_location),
        audience_occupation = COALESCE(op.audience_occupation, cp.audience_occupation)
      FROM calibration_profiles cp WHERE cp.user_id = op.user_id';
    RAISE NOTICE 'Migrated audience_location, audience_occupation from calibration_profiles';
  ELSE
    RAISE NOTICE 'Skipped audience enrichment columns — not found on calibration_profiles';
  END IF;

  -- quality_discernment_score, hook_usage_log (from 20260306_validation_fixes.sql)
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'calibration_profiles' AND column_name = 'quality_discernment_score'
  ) INTO col_exists;
  IF col_exists THEN
    EXECUTE '
      UPDATE onboarding_profiles op SET
        quality_discernment_score = COALESCE(op.quality_discernment_score, cp.quality_discernment_score),
        hook_usage_log = CASE WHEN op.hook_usage_log = ''[]''::jsonb THEN cp.hook_usage_log ELSE op.hook_usage_log END
      FROM calibration_profiles cp WHERE cp.user_id = op.user_id';
    RAISE NOTICE 'Migrated quality_discernment_score, hook_usage_log from calibration_profiles';
  ELSE
    RAISE NOTICE 'Skipped quality/hook columns — not found on calibration_profiles';
  END IF;
END $$;

-- ─── NOTE: calibration_profiles is NOT dropped ─────────────────────────────
-- It remains as a backup until the pipeline is verified working with onboarding_profiles.
-- All NEW writes now go to onboarding_profiles only.
