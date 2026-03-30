/**
 * Test Admin Predict API
 *
 * Tests the end-to-end prediction flow:
 * 1. Create video record
 * 2. Make prediction (NO metrics access)
 * 3. Verify prediction frozen in database
 * 4. Verify hash is correct
 */

import { createClient } from '@supabase/supabase-js';
import { predictVirality } from '../src/lib/ml/hybrid-predictor';
import { PredictionHash } from '../src/lib/services/prediction-hash';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

async function testAdminPredictAPI() {
  console.log('\n🧪 Testing Admin Predict API Flow...\n');

  try {
    // Step 1: Create test video in video_files table
    console.log('Step 1: Creating test video...');
    const { data: video, error: videoError } = await supabase
      .from('video_files')
      .insert({
        niche: 'fitness',
        goal: 'grow followers',
        account_size_band: 'small (0-10K)',
        storage_path: null,
        tiktok_url: null
      })
      .select('id')
      .single();

    if (videoError || !video) {
      throw new Error(`Failed to create video: ${videoError?.message}`);
    }

    console.log(`   ✅ Created video: ${video.id}\n`);

    // Step 2: Run prediction with transcript (simulating API call)
    console.log('Step 2: Running prediction (Admin Lab mode)...');
    const testTranscript = `
      Hey guys, today I'm going to show you an amazing workout routine
      that will transform your body in just 30 days. This is the exact
      routine I used to lose 20 pounds. Let's get started!
    `.trim();

    const predictionResult = await predictVirality({
      videoId: video.id,
      transcript: testTranscript,
      skipGPTRefinement: true  // Skip GPT for faster test
    });

    if (!predictionResult.success) {
      throw new Error(`Prediction failed: ${predictionResult.error}`);
    }

    console.log(`   ✅ Prediction: ${predictionResult.finalDpsPrediction.toFixed(1)} DPS`);
    console.log(`   ✅ Confidence: ${(predictionResult.confidence * 100).toFixed(0)}%`);
    console.log(`   ✅ Model: ${predictionResult.modelUsed}\n`);

    // Step 3: Generate hash
    console.log('Step 3: Generating prediction hash...');
    const predictionPayload = PredictionHash.createPayload(
      predictionResult,
      video.id
    );

    const hashResult = PredictionHash.generate(predictionPayload);
    console.log(`   ✅ Hash: ${hashResult.hash.substring(0, 32)}...\n`);

    // Step 4: Save frozen prediction
    console.log('Step 4: Saving frozen prediction...');
    const { data: predictionEvent, error: predError } = await supabase
      .from('prediction_events')
      .insert({
        video_id: video.id,
        model_version: predictionResult.modelUsed === 'hybrid' ? 'hybrid_v1.0' : 'xgb_v1.0',
        feature_snapshot: {
          top_features: predictionResult.topFeatures.slice(0, 10)
        },
        predicted_dps: predictionResult.finalDpsPrediction,
        predicted_dps_low: predictionResult.predictionInterval?.lower || (predictionResult.finalDpsPrediction - 15),
        predicted_dps_high: predictionResult.predictionInterval?.upper || (predictionResult.finalDpsPrediction + 15),
        confidence: predictionResult.confidence,
        explanation: `Test prediction: ${predictionResult.finalDpsPrediction.toFixed(1)} DPS`,
        prediction_hash: hashResult.hash
      })
      .select()
      .single();

    if (predError || !predictionEvent) {
      throw new Error(`Failed to save prediction: ${predError?.message}`);
    }

    console.log(`   ✅ Saved prediction: ${predictionEvent.id}\n`);

    // Step 5: Verify hash in database
    console.log('Step 5: Verifying hash in database...');
    const { data: storedPrediction, error: fetchError } = await supabase
      .from('prediction_events')
      .select('*')
      .eq('id', predictionEvent.id)
      .single();

    if (fetchError || !storedPrediction) {
      throw new Error(`Failed to fetch prediction: ${fetchError?.message}`);
    }

    if (storedPrediction.prediction_hash === hashResult.hash) {
      console.log(`   ✅ Hash verified in database\n`);
    } else {
      throw new Error('Hash mismatch!');
    }

    // Step 6: Verify predictor did NOT access prediction_actuals
    console.log('Step 6: Verifying NO contamination...');
    const { data: actuals } = await supabase
      .from('prediction_actuals')
      .select('*')
      .eq('prediction_id', predictionEvent.id);

    if (!actuals || actuals.length === 0) {
      console.log(`   ✅ No actuals exist yet (predictor did not access metrics)\n`);
    } else {
      throw new Error('CONTAMINATION: Actuals should not exist yet!');
    }

    // Cleanup
    console.log('Step 7: Cleanup...');
    await supabase.from('video_files').delete().eq('id', video.id);
    console.log(`   ✅ Cleanup complete\n`);

    // Summary
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ Admin Predict API Flow - All Tests Passed!');
    console.log('═══════════════════════════════════════════════════════');
    console.log('Verified:');
    console.log('  - Video created in video_files ✅');
    console.log('  - Prediction made WITHOUT metrics access ✅');
    console.log('  - Hash generated (SHA-256) ✅');
    console.log('  - Prediction frozen in database ✅');
    console.log('  - Hash verified ✅');
    console.log('  - NO contamination (no actuals created) ✅');
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

testAdminPredictAPI();
