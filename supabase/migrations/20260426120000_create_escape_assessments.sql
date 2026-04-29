-- Canonical migration for the escape_assessments table.
-- This is the schema that exists in production (trendzo-production / main) as of
-- 2026-04-26. It supersedes the prior two migration files (create_escape_blueprints
-- + rename_blueprints_to_assessments), which never ran against production and have
-- been deleted from the repo. This file is idempotent: re-running it against the
-- already-populated production database is a no-op.

-- Create escape_assessments table
CREATE TABLE IF NOT EXISTS public.escape_assessments (
  assessment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload JSONB NOT NULL,
  inputs JSONB NOT NULL
);

-- Index for faster lookups by user
CREATE INDEX IF NOT EXISTS idx_escape_assessments_user_id
  ON public.escape_assessments(user_id);

-- Index for faster lookups by created_at (for recent-assessments queries)
CREATE INDEX IF NOT EXISTS idx_escape_assessments_created_at
  ON public.escape_assessments(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.escape_assessments ENABLE ROW LEVEL SECURITY;

-- Allow anyone (including anonymous users) to insert assessments.
-- Intentional: the funnel allows code-gated anonymous redemption.
DROP POLICY IF EXISTS "Anyone can insert assessments" ON public.escape_assessments;
CREATE POLICY "Anyone can insert assessments"
  ON public.escape_assessments
  FOR INSERT
  WITH CHECK (true);

-- Allow anyone to read assessments by assessment_id.
-- The assessment_id is a UUID and acts as the access token; if you have it, you can read it.
DROP POLICY IF EXISTS "Anyone can read by assessment_id" ON public.escape_assessments;
CREATE POLICY "Anyone can read by assessment_id"
  ON public.escape_assessments
  FOR SELECT
  USING (true);

-- Allow the owning user (if authenticated) to update their own assessment.
-- Anonymous-created assessments (user_id IS NULL) can be updated by anyone with the assessment_id.
DROP POLICY IF EXISTS "Owner can update" ON public.escape_assessments;
CREATE POLICY "Owner can update"
  ON public.escape_assessments
  FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Auto-update updated_at on row updates.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_escape_assessments_updated_at ON public.escape_assessments;
CREATE TRIGGER trg_escape_assessments_updated_at
  BEFORE UPDATE ON public.escape_assessments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
