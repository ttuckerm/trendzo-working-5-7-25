/**
 * Add Features Column to Prediction Events Table
 * Using direct Supabase client approach
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

async function addFeaturesColumn() {
  console.log('========================================');
  console.log('ADDING FEATURES COLUMN');
  console.log('========================================\n');

  // First, check current schema
  const { data: beforeData, error: beforeError } = await supabase
    .from('prediction_events')
    .select('*')
    .limit(1);

  if (!beforeError && beforeData && beforeData.length > 0) {
    console.log('Current columns:', Object.keys(beforeData[0]));
    console.log('');
  }

  // The columns need to be added via SQL migration
  // Let's verify if they already exist by trying to query them

  const { data: testData, error: testError } = await supabase
    .from('prediction_events')
    .select('features, components_used, component_scores')
    .limit(1);

  if (testError) {
    console.log('❌ Columns do not exist yet');
    console.log('   Error:', testError.message);
    console.log('\n📝 MANUAL ACTION REQUIRED:');
    console.log('   Run this SQL in Supabase SQL Editor:');
    console.log('');
    console.log('   ALTER TABLE prediction_events');
    console.log("   ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '{}'::jsonb,");
    console.log('   ADD COLUMN IF NOT EXISTS components_used TEXT[] DEFAULT ARRAY[]::TEXT[],');
    console.log("   ADD COLUMN IF NOT EXISTS component_scores JSONB DEFAULT '{}'::jsonb;");
    console.log('');
    console.log('   CREATE INDEX IF NOT EXISTS idx_prediction_events_features ON prediction_events USING gin(features);');
    console.log('   CREATE INDEX IF NOT EXISTS idx_prediction_events_components ON prediction_events USING gin(components_used);');
    console.log('   CREATE INDEX IF NOT EXISTS idx_prediction_events_component_scores ON prediction_events USING gin(component_scores);');
  } else {
    console.log('✅ All columns exist!');
    console.log('   features:', testData && testData[0] ? 'present' : 'no data');
    console.log('   components_used:', testData && testData[0] ? 'present' : 'no data');
    console.log('   component_scores:', testData && testData[0] ? 'present' : 'no data');
  }
}

addFeaturesColumn();
