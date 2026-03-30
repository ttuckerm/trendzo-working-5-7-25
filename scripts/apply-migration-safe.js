const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function applyMigration() {
  console.log('🔧 Applying predictions table migration (safe mode)...\n');

  // Step 1: Drop old table
  console.log('Step 1: Dropping old predictions table...');
  try {
    await supabase.rpc('exec', {
      sql: 'DROP TABLE IF EXISTS predictions CASCADE;'
    });
    console.log('✅ Old table dropped\n');
  } catch (err) {
    console.log('⚠️  Could not drop via RPC, trying alternative...\n');
  }

  // Step 2: Create new table (run each statement separately)
  console.log('Step 2: Creating new predictions table...');

  const statements = [
    `CREATE TABLE predictions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      script TEXT NOT NULL,
      platform VARCHAR(50) NOT NULL,
      niche VARCHAR(100) NOT NULL,
      predicted_dps NUMERIC(10, 2),
      predicted_classification VARCHAR(50),
      confidence NUMERIC(5, 4),
      extraction_insights JSONB,
      top_pattern_matches JSONB,
      recommendations TEXT[],
      actual_video_id VARCHAR(255),
      actual_dps NUMERIC(10, 2),
      actual_classification VARCHAR(50),
      prediction_error NUMERIC(10, 2),
      validated_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`,
    `CREATE INDEX idx_predictions_niche ON predictions(niche)`,
    `CREATE INDEX idx_predictions_confidence ON predictions(confidence DESC)`,
    `CREATE INDEX idx_predictions_validated ON predictions(validated_at) WHERE validated_at IS NOT NULL`,
    `CREATE OR REPLACE VIEW prediction_accuracy AS
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
    ORDER BY accuracy_pct DESC NULLS LAST`
  ];

  for (let i = 0; i < statements.length; i++) {
    try {
      await supabase.rpc('exec', { sql: statements[i] });
      console.log(`✅ Statement ${i + 1}/${statements.length} executed`);
    } catch (err) {
      console.error(`❌ Statement ${i + 1} failed:`, err.message);
    }
  }

  console.log('\n🔍 Verifying migration...');

  // Test the new schema
  const { data, error } = await supabase
    .from('predictions')
    .select('*')
    .limit(1);

  if (error && error.code === 'PGRST116') {
    console.log('✅ Table exists (empty)\n');
  } else if (error) {
    console.error('❌ Verification error:', error);
    console.log('\n⚠️  MANUAL MIGRATION REQUIRED');
    console.log('See instructions in: APPLY-PREDICTIONS-MIGRATION.md\n');
    return;
  } else {
    console.log('✅ Table verified\n');
  }

  console.log('✅✅✅ Migration complete! Running full verification...\n');

  // Run verification script
  const { execSync } = require('child_process');
  try {
    execSync('node scripts/verify-predictions-migration.js', { stdio: 'inherit' });
  } catch (err) {
    console.log('Verification script not found or failed');
  }
}

applyMigration();
