-- ============================================================================
-- Creator Pattern Performance & Content Calendars
-- Bucket 4, Prompt 5: Pattern Inheritance Protocol
-- ============================================================================

-- Table: creator_pattern_performance
-- Tracks how each creator performs with each pattern archetype.
-- This is the proprietary data moat — maps which patterns work for which
-- creator profiles, enabling personalized pattern recommendations over time.

CREATE TABLE IF NOT EXISTS creator_pattern_performance (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pattern_id      UUID NOT NULL REFERENCES pattern_archetypes(id) ON DELETE CASCADE,
  brief_id        UUID REFERENCES content_briefs(id) ON DELETE SET NULL,
  predicted_vps   NUMERIC(5,1),
  actual_vps      NUMERIC(5,1),
  delta           NUMERIC(5,1),                -- actual_vps - predicted_vps
  creator_stage   TEXT,                         -- snapshot at time of execution
  niche_key       TEXT,                         -- snapshot at time of execution
  created_at      TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT uq_cpp_user_pattern_brief UNIQUE (user_id, pattern_id, brief_id)
);

CREATE INDEX IF NOT EXISTS idx_cpp_user ON creator_pattern_performance(user_id);
CREATE INDEX IF NOT EXISTS idx_cpp_pattern ON creator_pattern_performance(pattern_id);
CREATE INDEX IF NOT EXISTS idx_cpp_user_pattern ON creator_pattern_performance(user_id, pattern_id);

ALTER TABLE creator_pattern_performance ENABLE ROW LEVEL SECURITY;

CREATE POLICY cpp_user_select ON creator_pattern_performance
  FOR SELECT USING (auth.uid() = user_id);


-- Table: content_calendars
-- Stores generated 30-day calendars for each user.
-- Cached for 7 days, regenerated weekly by cron.

CREATE TABLE IF NOT EXISTS content_calendars (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  niche_key       TEXT NOT NULL,
  calendar_data   JSONB NOT NULL DEFAULT '[]',  -- Array of CalendarBrief objects
  generated_at    TIMESTAMPTZ DEFAULT now(),
  expires_at      TIMESTAMPTZ,                  -- 7 days after generation
  week_number     INT NOT NULL,                 -- ISO week for dedup

  CONSTRAINT uq_calendar_user_week UNIQUE (user_id, week_number)
);

CREATE INDEX IF NOT EXISTS idx_calendars_user ON content_calendars(user_id);
CREATE INDEX IF NOT EXISTS idx_calendars_expires ON content_calendars(expires_at);

ALTER TABLE content_calendars ENABLE ROW LEVEL SECURITY;

CREATE POLICY calendars_user_select ON content_calendars
  FOR SELECT USING (auth.uid() = user_id);
