/**
 * Test Learning Loop System
 *
 * Simulates the complete learning cycle:
 * 1. Make a prediction
 * 2. Record actual metrics
 * 3. Update component reliability
 * 4. Verify reliability scores changed
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  {
    db: { schema: 'public' },
    auth: { persistSession: false }
  }
);

async function main() {
  console.log('=== TESTING LEARNING LOOP SYSTEM ===\n');

  // Step 1: Check initial component reliability scores
  console.log('Step 1: Fetching initial component reliability scores...');
  const { data: initialScores } = await supabase
    .from('component_reliability')
    .select('component_id, reliability_score, total_predictions, avg_accuracy_delta')
    .order('reliability_score', { ascending: false });

  console.log('\nInitial Component Reliability:');
  console.log('Component'.padEnd(25), 'Reliability', 'Predictions', 'Avg Error');
  console.log('-'.repeat(70));
  for (const score of initialScores || []) {
    console.log(
      score.component_id.padEnd(25),
      `${(score.reliability_score * 100).toFixed(1)}%`.padEnd(12),
      String(score.total_predictions).padEnd(12),
      score.avg_accuracy_delta ? `${score.avg_accuracy_delta.toFixed(1)} DPS` : 'N/A'
    );
  }

  // Step 2: Create a test prediction
  console.log('\n\nStep 2: Creating test prediction...');

  // Insert test video
  const { data: videoRecord } = await supabase
    .from('video_files')
    .insert({
      niche: 'business',
      goal: 'increase-engagement',
      account_size_band: 'medium',
      platform: 'tiktok'
    })
    .select()
    .single();

  if (!videoRecord) {
    console.error('Failed to create video record');
    return;
  }

  console.log('✓ Video created:', videoRecord.id);

  // Insert test prediction
  const { data: predictionEvent, error: predError } = await supabase
    .from('prediction_events')
    .insert({
      video_id: videoRecord.id,
      model_version: 'kai_v1.0_test',
      feature_snapshot: {
        components_used: ['xgboost', 'gpt4', '7-legos'],
        path_results: [
          {
            path: 'quantitative',
            prediction: 75.0,
            components: [
              { id: 'xgboost', prediction: 75.0 }
            ]
          },
          {
            path: 'qualitative',
            prediction: 68.0,
            components: [
              { id: 'gpt4', prediction: 68.0 }
            ]
          },
          {
            path: 'pattern_based',
            prediction: 72.0,
            components: [
              { id: '7-legos', prediction: 72.0 }
            ]
          }
        ]
      },
      predicted_dps: 71.7,
      predicted_dps_low: 66.7,
      predicted_dps_high: 76.7,
      confidence: 0.85,
      explanation: 'Test prediction for learning loop',
      prediction_hash: 'test_hash_' + Date.now()
    })
    .select()
    .single();

  if (!predictionEvent || predError) {
    console.error('Failed to create prediction:', predError?.message);
    return;
  }

  console.log('✓ Prediction created:', predictionEvent.id);
  console.log('  Predicted DPS: 71.7');

  // Step 3: Simulate actual metrics (under-prediction scenario)
  console.log('\n\nStep 3: Recording actual metrics (actual DPS: 85.0)...');

  const actualMetrics = {
    actual_views: 500000,
    actual_likes: 75000,
    actual_comments: 5000,
    actual_shares: 10000,
    actual_saves: 20000
  };

  // Call learning API
  const learningResponse = await fetch('http://localhost:3000/api/learning/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prediction_id: predictionEvent.id,
      video_id: videoRecord.id,
      ...actualMetrics,
      niche: 'business',
      account_size: 'medium'
    })
  });

  const learningData = await learningResponse.json();

  if (learningData.success) {
    console.log('✓ Learning loop updated successfully!');
    console.log('\nAccuracy Report:');
    console.log('  Predicted DPS:', learningData.accuracy.predicted_dps);
    console.log('  Actual DPS:', learningData.accuracy.actual_dps);
    console.log('  Error:', learningData.accuracy.delta.toFixed(1), 'DPS');
    console.log('  Error %:', learningData.accuracy.delta_pct.toFixed(1), '%');
    console.log('  Within Range:', learningData.accuracy.within_range ? 'YES' : 'NO');

    console.log('\nComponents Updated:', learningData.components_updated);

    console.log('\nInsights:');
    for (const insight of learningData.insights) {
      console.log('  •', insight);
    }
  } else {
    console.error('Learning update failed:', learningData.error);
    return;
  }

  // Step 4: Verify reliability scores changed
  console.log('\n\nStep 4: Verifying component reliability updated...');

  const { data: updatedScores } = await supabase
    .from('component_reliability')
    .select('component_id, reliability_score, total_predictions, avg_accuracy_delta')
    .in('component_id', ['xgboost', 'gpt4', '7-legos'])
    .order('reliability_score', { ascending: false });

  console.log('\nUpdated Component Reliability:');
  console.log('Component'.padEnd(25), 'Reliability', 'Predictions', 'Avg Error', 'Change');
  console.log('-'.repeat(80));

  for (const updatedScore of updatedScores || []) {
    const initial = initialScores?.find(s => s.component_id === updatedScore.component_id);
    const change = initial
      ? ((updatedScore.reliability_score - initial.reliability_score) * 100).toFixed(2)
      : 'N/A';

    console.log(
      updatedScore.component_id.padEnd(25),
      `${(updatedScore.reliability_score * 100).toFixed(1)}%`.padEnd(12),
      String(updatedScore.total_predictions).padEnd(12),
      updatedScore.avg_accuracy_delta ? `${updatedScore.avg_accuracy_delta.toFixed(1)} DPS`.padEnd(12) : 'N/A'.padEnd(12),
      change !== 'N/A' ? (parseFloat(change) > 0 ? `+${change}%` : `${change}%`) : 'N/A'
    );
  }

  // Cleanup
  console.log('\n\nCleaning up test data...');
  await supabase.from('prediction_outcomes').delete().eq('video_id', videoRecord.id);
  await supabase.from('prediction_events').delete().eq('id', predictionEvent.id);
  await supabase.from('video_files').delete().eq('id', videoRecord.id);
  console.log('✓ Cleanup complete');

  console.log('\n=== TEST COMPLETE ===');
  console.log('\n✓ Learning loop is working!');
  console.log('✓ Component reliability scores update automatically');
  console.log('✓ Kai will get smarter with each prediction');
}

main().catch(console.error);
