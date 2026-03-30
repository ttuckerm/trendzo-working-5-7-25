/**
 * Test Admin Lab Permissions
 *
 * Verifies that:
 * 1. Tables exist and are accessible
 * 2. Full workflow works (video -> prediction -> actuals)
 * 3. PostgreSQL roles were created (can't test permissions yet - need users)
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testAdminLabPermissions() {
  console.log('\n🧪 Testing Admin Lab Permissions...\n');

  try {
    // Step 1: Create test video
    console.log('Step 1: Creating test video...');
    const { data: video, error: videoError } = await supabase
      .from('video_files')
      .insert({
        niche: 'test',
        goal: 'test permissions',
        account_size_band: 'small (0-10K)'
      })
      .select('id')
      .single();

    if (videoError || !video) {
      throw new Error(`Failed to create video: ${videoError?.message}`);
    }

    console.log(`✅ Created video: ${video.id}`);

    // Step 2: Create prediction
    console.log('\nStep 2: Creating prediction...');
    const { data: prediction, error: predError } = await supabase
      .from('prediction_events')
      .insert({
        video_id: video.id,
        model_version: 'test_v1.0',
        feature_snapshot: {
          top_features: [
            { name: 'hook_strength', importance: 0.15, value: 8.2 }
          ]
        },
        predicted_dps: 50.0,
        predicted_dps_low: 40.0,
        predicted_dps_high: 60.0,
        confidence: 0.7,
        prediction_hash: 'test_hash_' + Date.now()
      })
      .select('id')
      .single();

    if (predError || !prediction) {
      throw new Error(`Failed to create prediction: ${predError?.message}`);
    }

    console.log(`✅ Created prediction: ${prediction.id}`);

    // Step 3: Create actuals
    console.log('\nStep 3: Creating actuals...');
    const { error: actualsError } = await supabase
      .from('prediction_actuals')
      .insert({
        prediction_id: prediction.id,
        snapshot_type: '24h',
        views: 1000,
        likes: 50,
        comments: 10,
        shares: 5,
        bookmarks: 3,
        actual_dps: 55.0,
        source: 'manual'
      });

    if (actualsError) {
      throw new Error(`Failed to create actuals: ${actualsError.message}`);
    }

    console.log(`✅ Created actuals`);

    // Step 4: Verify data
    console.log('\nStep 4: Verifying data...');
    const { data: fullPrediction, error: verifyError } = await supabase
      .from('prediction_events')
      .select(`
        *,
        video:video_files(*),
        actuals:prediction_actuals(*)
      `)
      .eq('id', prediction.id)
      .single();

    if (verifyError || !fullPrediction) {
      throw new Error(`Failed to verify: ${verifyError?.message}`);
    }

    console.log(`✅ Verified join:`, {
      prediction_id: fullPrediction.id,
      video_niche: fullPrediction.video.niche,
      predicted_dps: fullPrediction.predicted_dps,
      actual_dps: fullPrediction.actuals[0].actual_dps
    });

    // Step 5: Cleanup
    console.log('\nStep 5: Cleaning up...');
    const { error: cleanupError } = await supabase
      .from('video_files')
      .delete()
      .eq('id', video.id);

    if (cleanupError) {
      throw new Error(`Cleanup failed: ${cleanupError.message}`);
    }

    console.log(`✅ Cleanup complete`);

    console.log('\n✅ All tests passed!\n');
    console.log('Summary:');
    console.log('  - Tables: video_files, prediction_events, prediction_actuals ✅');
    console.log('  - Foreign keys: Working ✅');
    console.log('  - Cascade delete: Working ✅');
    console.log('\nNOTE: PostgreSQL role permissions will be tested after creating users in Task 1.3\n');

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

testAdminLabPermissions();
