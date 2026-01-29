const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function verifyMigration() {
  console.log('🔍 Verifying predictions table migration...\n');

  // Check table exists and has correct schema
  const { data, error } = await supabase
    .from('predictions')
    .select('*')
    .limit(1);

  if (error) {
    console.error('❌ Error accessing predictions table:', error);
    console.log('\n⚠️  Migration not applied yet. Follow instructions in APPLY-PREDICTIONS-MIGRATION.md');
    return false;
  }

  // Expected columns
  const expectedColumns = [
    'id',
    'script',
    'platform',
    'niche',
    'predicted_dps',
    'predicted_classification',
    'confidence',
    'extraction_insights',
    'top_pattern_matches',
    'recommendations',
    'actual_video_id',
    'actual_dps',
    'actual_classification',
    'prediction_error',
    'validated_at',
    'created_at',
    'updated_at'
  ];

  // Test insert
  console.log('🧪 Testing insert with new schema...');
  const testPrediction = {
    script: 'Test script for validation',
    platform: 'tiktok',
    niche: 'test',
    predicted_dps: 50.5,
    predicted_classification: 'normal',
    confidence: 0.85,
    extraction_insights: { test: 'insights' },
    top_pattern_matches: [{ pattern: 'test', score: 0.9 }],
    recommendations: ['Test recommendation 1', 'Test recommendation 2']
  };

  const { data: insertedData, error: insertError } = await supabase
    .from('predictions')
    .insert(testPrediction)
    .select()
    .single();

  if (insertError) {
    console.error('❌ Insert test failed:', insertError);
    console.log('\n⚠️  Schema may be incorrect. Check migration was applied properly.');
    return false;
  }

  console.log('✅ Insert successful!\n');

  // Verify all columns exist
  const actualColumns = Object.keys(insertedData);
  const missingColumns = expectedColumns.filter(col => !actualColumns.includes(col));
  const extraColumns = actualColumns.filter(col => !expectedColumns.includes(col));

  if (missingColumns.length > 0) {
    console.log('⚠️  Missing columns:', missingColumns);
  }

  if (extraColumns.length > 0) {
    console.log('⚠️  Extra columns:', extraColumns);
  }

  console.log('📋 Actual columns:', actualColumns.join(', '));

  // Clean up test record
  await supabase
    .from('predictions')
    .delete()
    .eq('id', insertedData.id);

  console.log('\n✅ Test record cleaned up');

  if (missingColumns.length === 0) {
    console.log('\n✅✅✅ MIGRATION SUCCESSFUL! Schema is correct.');
    console.log('You can now proceed to Priority 3: Validate on 10 known videos');
    return true;
  } else {
    console.log('\n❌ Migration incomplete. Please reapply the migration.');
    return false;
  }
}

verifyMigration();
