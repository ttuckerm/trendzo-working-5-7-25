-- ============================================================================
-- Admin Lab: PostgreSQL Roles for Anti-Contamination
-- ============================================================================
-- Purpose: Enforce table-level permissions to prevent predictor from seeing metrics
-- Date: 2025-11-15
-- ============================================================================

-- ============================================================================
-- Role 1: predictor_role
-- Can read video_files, write prediction_events, CANNOT access prediction_actuals
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'predictor_role') THEN
    CREATE ROLE predictor_role;
  END IF;
END
$$;

-- Read permissions
GRANT SELECT ON video_files TO predictor_role;

-- Write permissions
GRANT INSERT, SELECT ON prediction_events TO predictor_role;

-- CRITICAL: No access to actuals
REVOKE ALL ON prediction_actuals FROM predictor_role;

-- Comments
COMMENT ON ROLE predictor_role IS 'Admin Lab: Predictor service (NO ACCESS to metrics)';

-- ============================================================================
-- Role 2: scraper_role
-- Can write to prediction_actuals, CANNOT modify predictions
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'scraper_role') THEN
    CREATE ROLE scraper_role;
  END IF;
END
$$;

-- Write permissions
GRANT INSERT, UPDATE, SELECT ON prediction_actuals TO scraper_role;

-- Read-only access to predictions (for linking)
GRANT SELECT ON prediction_events TO scraper_role;
GRANT SELECT ON video_files TO scraper_role;

-- CRITICAL: Cannot modify frozen predictions
REVOKE INSERT, UPDATE, DELETE ON prediction_events FROM scraper_role;

-- Comments
COMMENT ON ROLE scraper_role IS 'Admin Lab: Scraper service (writes metrics only)';

-- ============================================================================
-- Role 3: admin_role (for manual testing)
-- Full access to all tables
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'admin_role') THEN
    CREATE ROLE admin_role;
  END IF;
END
$$;

-- Full permissions on all tables
GRANT ALL ON video_files TO admin_role;
GRANT ALL ON prediction_events TO admin_role;
GRANT ALL ON prediction_actuals TO admin_role;

-- Comments
COMMENT ON ROLE admin_role IS 'Admin Lab: Full access for testing and debugging';

-- ============================================================================
-- Verification
-- ============================================================================

-- This query can be run to verify roles and permissions:
-- SELECT
--   grantee,
--   table_name,
--   privilege_type
-- FROM information_schema.role_table_grants
-- WHERE grantee IN ('predictor_role', 'scraper_role', 'admin_role')
-- ORDER BY grantee, table_name, privilege_type;
