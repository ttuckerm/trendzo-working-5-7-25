-- ============================================================================
-- RLS Policies for Permission Gate (Prompt 13)
-- Adds row-level security to prediction_runs table.
-- agencies/creators already have RLS + policies from admin_schema.
-- freedom_agent_sessions/freedom_os_saved_plans already have public policies.
-- ============================================================================

-- Helper: get the current user's role from profiles
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$;

-- ============================================================================
-- prediction_runs — enable RLS
-- ============================================================================
ALTER TABLE prediction_runs ENABLE ROW LEVEL SECURITY;

-- Chairman and sub_admin can see all prediction runs
CREATE POLICY "Admin can view all prediction_runs"
  ON prediction_runs FOR SELECT
  USING (auth.user_role() IN ('chairman', 'sub_admin'));

-- Chairman and sub_admin can insert/update (pipeline operations)
CREATE POLICY "Admin can manage prediction_runs"
  ON prediction_runs FOR ALL
  USING (auth.user_role() IN ('chairman', 'sub_admin'));

-- Service role (used by cron jobs and pipeline) bypasses RLS automatically

-- ============================================================================
-- run_component_results — enable RLS (same pattern as prediction_runs)
-- ============================================================================
ALTER TABLE run_component_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view all run_component_results"
  ON run_component_results FOR SELECT
  USING (auth.user_role() IN ('chairman', 'sub_admin'));

CREATE POLICY "Admin can manage run_component_results"
  ON run_component_results FOR ALL
  USING (auth.user_role() IN ('chairman', 'sub_admin'));

-- ============================================================================
-- Strengthen existing agencies policies
-- Agency owners can only read their own agency
-- ============================================================================

-- Drop and recreate if the existing policy is too broad
-- (safe: DROP POLICY IF EXISTS is idempotent)
DROP POLICY IF EXISTS "Agency can read own agency" ON agencies;
CREATE POLICY "Agency can read own agency"
  ON agencies FOR SELECT
  USING (
    auth.user_role() IN ('chairman', 'sub_admin')
    OR owner_id = auth.uid()
  );

-- ============================================================================
-- Strengthen existing creators policies
-- Agency sees own agency's creators, creator sees self
-- ============================================================================
DROP POLICY IF EXISTS "Scoped creator access" ON creators;
CREATE POLICY "Scoped creator access"
  ON creators FOR SELECT
  USING (
    auth.user_role() IN ('chairman', 'sub_admin')
    OR user_id = auth.uid()
    OR agency_id IN (
      SELECT id FROM agencies WHERE owner_id = auth.uid()
    )
  );
