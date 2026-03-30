-- Pattern Library: Mechanical Templates for the Virality Transfer Protocol
-- Three tables: pattern archetypes (the library), instances (video→pattern links), niche metrics (aggregated trends)

-- ============================================================================
-- Table 1: pattern_archetypes — canonical library of pattern types
-- ============================================================================

CREATE TABLE IF NOT EXISTS pattern_archetypes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_name    TEXT NOT NULL UNIQUE,
  narrative_arc   TEXT NOT NULL,
  psych_trigger   TEXT NOT NULL,
  hook_structure  TEXT NOT NULL,
  pacing_rhythm   TEXT NOT NULL,
  cta_type        TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT chk_narrative_arc CHECK (narrative_arc IN (
    'transformation', 'revelation', 'warning', 'social_proof',
    'challenge', 'insider_access', 'myth_bust'
  )),
  CONSTRAINT chk_cta_type CHECK (cta_type IN (
    'follow', 'share', 'comment', 'save', 'none'
  ))
);

-- ============================================================================
-- Table 2: archetype_instances — links scraped videos to pattern archetypes
-- ============================================================================

CREATE TABLE IF NOT EXISTS archetype_instances (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_id      UUID NOT NULL REFERENCES pattern_archetypes(id) ON DELETE CASCADE,
  video_id        TEXT NOT NULL,
  niche_key       TEXT NOT NULL,
  views_count     BIGINT,
  detected_at     TIMESTAMPTZ DEFAULT now(),
  confidence      DOUBLE PRECISION,

  CONSTRAINT uq_pattern_video UNIQUE (pattern_id, video_id)
);

CREATE INDEX IF NOT EXISTS idx_archetype_instances_pattern ON archetype_instances(pattern_id);
CREATE INDEX IF NOT EXISTS idx_archetype_instances_niche ON archetype_instances(niche_key);
CREATE INDEX IF NOT EXISTS idx_archetype_instances_detected ON archetype_instances(detected_at DESC);

-- ============================================================================
-- Table 3: archetype_niche_metrics — aggregated per pattern per niche
-- ============================================================================

CREATE TABLE IF NOT EXISTS archetype_niche_metrics (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_id          UUID NOT NULL REFERENCES pattern_archetypes(id) ON DELETE CASCADE,
  niche_key           TEXT NOT NULL,
  instance_count_30d  INT DEFAULT 0,
  avg_views_30d       BIGINT DEFAULT 0,
  saturation_pct      DOUBLE PRECISION DEFAULT 0,
  trend_direction     TEXT DEFAULT 'stable',
  first_seen_in_niche TIMESTAMPTZ,
  last_computed_at    TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT uq_pattern_niche UNIQUE (pattern_id, niche_key),
  CONSTRAINT chk_trend_direction CHECK (trend_direction IN (
    'ascending', 'stable', 'declining'
  ))
);
