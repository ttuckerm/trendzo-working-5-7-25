-- Calibration profiles: persist signal calibration results so they survive page navigation
-- Raw dimension scores (JSONB) + inferred profile fields + onboarding context

CREATE TABLE IF NOT EXISTS calibration_profiles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,

  -- Raw dimension scores (each is Record<string, number> with values 0-100)
  niche_affinity jsonb NOT NULL DEFAULT '{}',
  hook_style_preference jsonb NOT NULL DEFAULT '{}',
  tone_match jsonb NOT NULL DEFAULT '{}',
  audience_pain_alignment jsonb NOT NULL DEFAULT '{}',
  editing_style_fit jsonb NOT NULL DEFAULT '{}',
  content_format_preference jsonb NOT NULL DEFAULT '{}',

  -- Inferred profile fields (after user edits on confirmation screen)
  inferred_niche text NOT NULL,
  inferred_audience_age_range text NOT NULL,
  inferred_audience_description text NOT NULL,
  inferred_content_style text NOT NULL,
  inferred_competitors text[] NOT NULL DEFAULT '{}',

  -- User-provided fields
  offer text,
  exclusions text[] NOT NULL DEFAULT '{}',

  -- Onboarding context (needed to restore full workflow state)
  selected_niche text NOT NULL DEFAULT '',
  selected_goal text NOT NULL DEFAULT '',

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- One profile per user (upsert pattern)
  CONSTRAINT calibration_profiles_user_unique UNIQUE (user_id)
);

-- Index for fast lookups by user
CREATE INDEX IF NOT EXISTS idx_calibration_profiles_user_id ON calibration_profiles(user_id);

-- Auto-update updated_at on row changes
CREATE OR REPLACE FUNCTION update_calibration_profiles_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calibration_profiles_updated_at
  BEFORE UPDATE ON calibration_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_calibration_profiles_updated_at();
