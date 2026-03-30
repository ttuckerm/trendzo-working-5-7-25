const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const fetch = require('node-fetch');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

async function applyMigrationDirect() {
  console.log('🔧 Applying predictions table migration via REST API...\n');

  const migrationSQL = `
-- Step 1: Drop old predictions table
DROP TABLE IF EXISTS predictions CASCADE;
DROP VIEW IF EXISTS prediction_accuracy CASCADE;

-- Step 2: Create new predictions table
CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Input
  script TEXT NOT NULL,
  platform VARCHAR(50) NOT NULL,
  niche VARCHAR(100) NOT NULL,

  -- Prediction
  predicted_dps NUMERIC(10, 2),
  predicted_classification VARCHAR(50),
  confidence NUMERIC(5, 4),

  -- Breakdown
  extraction_insights JSONB,
  top_pattern_matches JSONB,
  recommendations TEXT[],

  -- Validation
  actual_video_id VARCHAR(255),
  actual_dps NUMERIC(10, 2),
  actual_classification VARCHAR(50),
  prediction_error NUMERIC(10, 2),
  validated_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_predictions_niche ON predictions(niche);
CREATE INDEX idx_predictions_confidence ON predictions(confidence DESC);
CREATE INDEX idx_predictions_validated ON predictions(validated_at) WHERE validated_at IS NOT NULL;

CREATE OR REPLACE VIEW prediction_accuracy AS
SELECT
  niche,
  COUNT(*) as total_predictions,
  COUNT(*) FILTER (WHERE validated_at IS NOT NULL) as validated_count,
  AVG(confidence) as avg_confidence,
  AVG(ABS(predicted_dps - actual_dps)) as avg_error,
  COUNT(*) FILTER (WHERE ABS(predicted_dps - actual_dps) <= 10) as within_10_points,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE ABS(predicted_dps - actual_dps) <= 10) /
    NULLIF(COUNT(*) FILTER (WHERE validated_at IS NOT NULL), 0),
    1
  ) as accuracy_pct
FROM predictions
GROUP BY niche
ORDER BY accuracy_pct DESC NULLS LAST;
`;

  try {
    // Use Supabase's REST API to execute SQL
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ query: migrationSQL })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Migration failed:', error);
      console.log('\n⚠️  The REST API method did not work.');
      console.log('Please apply the migration manually using APPLY-PREDICTIONS-MIGRATION.md\n');
      return false;
    }

    console.log('✅ Migration applied successfully!\n');

    // Verify
    console.log('🔍 Verifying migration...');
    const { execSync } = require('child_process');
    execSync('node scripts/verify-predictions-migration.js', { stdio: 'inherit' });

    return true;

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.log('\n⚠️  Automated migration failed.');
    console.log('Please apply the migration manually using APPLY-PREDICTIONS-MIGRATION.md\n');

    console.log('Manual steps:');
    console.log('1. Go to Supabase Dashboard > SQL Editor');
    console.log('2. Copy the SQL from: supabase/migrations/20251008_predictions_table.sql');
    console.log('3. Add this at the top:');
    console.log('   DROP TABLE IF EXISTS predictions CASCADE;');
    console.log('   DROP VIEW IF EXISTS prediction_accuracy CASCADE;');
    console.log('4. Click Run');
    console.log('5. Run: node scripts/verify-predictions-migration.js\n');

    return false;
  }
}

applyMigrationDirect();
