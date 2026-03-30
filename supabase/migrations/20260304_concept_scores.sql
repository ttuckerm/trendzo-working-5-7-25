-- Pre-Mortem Content Scoring
-- Stores concept-level predictions scored BEFORE filming.
-- Links to content_briefs for feedback loop (concept → brief → measured).

-- ============================================================================
-- Table: concept_scores
-- ============================================================================

CREATE TABLE IF NOT EXISTS concept_scores (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  concept_text        TEXT NOT NULL,
  niche_key           TEXT NOT NULL,

  -- Score output
  concept_vps         NUMERIC(5,1),
  confidence_low      NUMERIC(5,1),
  confidence_high     NUMERIC(5,1),

  -- Pattern match
  matched_pattern_id  UUID REFERENCES pattern_archetypes(id) ON DELETE SET NULL,
  pattern_saturation  JSONB,
    -- { saturation_pct, trend_direction, lifecycle_stage, opportunity_score }

  -- Creator fit
  creator_fit         JSONB,
    -- { hookStyleMatch, toneMatch, formatMatch, nicheMatch, overallFit }

  -- Diagnosis & adjustments
  diagnosis           JSONB NOT NULL DEFAULT '{}',
    -- { primary_limiting_factor, suggestion, projected_improvement, strengths[], weaknesses[] }
  adjustments         JSONB NOT NULL DEFAULT '[]',
    -- [{ adjustment_text, projected_vps_delta, rationale }]

  -- Raw Gemini analysis
  gemini_analysis     JSONB,

  -- Expand-to-script tracking
  expanded_to_script  BOOLEAN DEFAULT false,
  expanded_brief_id   UUID REFERENCES content_briefs(id) ON DELETE SET NULL,
  expanded_run_id     UUID,

  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_concept_scores_user
  ON concept_scores(user_id);

CREATE INDEX IF NOT EXISTS idx_concept_scores_user_created
  ON concept_scores(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_concept_scores_pattern
  ON concept_scores(matched_pattern_id);

-- RLS
ALTER TABLE concept_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY concept_scores_user_select ON concept_scores
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY concept_scores_user_insert ON concept_scores
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY concept_scores_user_update ON concept_scores
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_concept_scores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER concept_scores_updated_at_trigger
  BEFORE UPDATE ON concept_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_concept_scores_updated_at();

-- ============================================================================
-- Feedback loop: link content_briefs back to concept_scores
-- ============================================================================

ALTER TABLE content_briefs
  ADD COLUMN IF NOT EXISTS concept_score_id UUID REFERENCES concept_scores(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_content_briefs_concept_score
  ON content_briefs(concept_score_id);
