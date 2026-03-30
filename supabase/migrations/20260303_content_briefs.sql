-- Content Briefs: tracks creator progress through the Quick Win workflow.
-- Each brief = one workflow run, from template selection through publication.
-- Completed briefs with actual_vps become labeled training data points.

CREATE TABLE IF NOT EXISTS content_briefs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_video_id TEXT,
  pattern_id      UUID REFERENCES pattern_archetypes(id) ON DELETE SET NULL,
  brief_content   JSONB NOT NULL DEFAULT '{}',
  predicted_vps   NUMERIC(5,1),
  status          TEXT NOT NULL DEFAULT 'generated'
                  CHECK (status IN (
                    'generated', 'accepted', 'recorded', 'analyzed',
                    'optimized', 'published', 'measured'
                  )),
  actual_vps      NUMERIC(5,1),
  first_win       BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_briefs_user
  ON content_briefs(user_id);

CREATE INDEX IF NOT EXISTS idx_content_briefs_user_status
  ON content_briefs(user_id, status);

CREATE INDEX IF NOT EXISTS idx_content_briefs_created
  ON content_briefs(created_at DESC);

-- RLS: users can only read/write their own briefs
ALTER TABLE content_briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY content_briefs_user_select ON content_briefs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY content_briefs_user_insert ON content_briefs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY content_briefs_user_update ON content_briefs
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_content_briefs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER content_briefs_updated_at_trigger
  BEFORE UPDATE ON content_briefs
  FOR EACH ROW
  EXECUTE FUNCTION update_content_briefs_updated_at();
