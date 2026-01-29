/**
 * Check Latest Prediction in Database
 * Verify that Gemini features were stored correctly
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

async function checkLatestPrediction() {
  console.log('========================================');
  console.log('CHECKING LATEST PREDICTION');
  console.log('========================================\n');

  // Get latest prediction event
  const { data: predictions, error: predError } = await supabase
    .from('prediction_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1);

  if (predError || !predictions || predictions.length === 0) {
    console.log('❌ No predictions found');
    return;
  }

  const latestPrediction = predictions[0];

  console.log(`📊 Latest Prediction: ${latestPrediction.id}`);
  console.log(`   Video ID: ${latestPrediction.video_id}`);
  console.log(`   Created: ${latestPrediction.created_at}`);
  console.log(`   DPS: ${latestPrediction.predicted_dps}\n`);

  console.log('========================================');
  console.log('CHECKING FOR GEMINI FEATURES');
  console.log('========================================\n');

  // Check if features field exists
  const features = latestPrediction.features as any;

  if (!features) {
    console.log('❌ CRITICAL: features field is NULL in database');
    console.log('   Available columns:', Object.keys(latestPrediction));
    return;
  }

  console.log('✅ features field EXISTS in database\n');

  // Check if gemini features exist
  if (!features.gemini) {
    console.log('❌ gemini features NOT FOUND in features object');
    console.log('   Available feature keys:', Object.keys(features));
    return;
  }

  console.log('✅ gemini features FOUND in database\n');

  const geminiFeatures = features.gemini;

  console.log('📋 Stored Gemini Features:\n');
  console.log(JSON.stringify(geminiFeatures, null, 2));

  console.log('\n========================================');
  console.log('VERIFICATION CHECKLIST');
  console.log('========================================\n');

  const checks = [
    { field: 'modelName', expected: 'gemini-3-pro-preview' },
    { field: 'analysisType', expected: ['video_file', 'transcript'] },
    { field: 'visualEngagement', type: 'number' },
    { field: 'audioQuality', type: 'number' }
  ];

  let allPass = true;

  for (const check of checks) {
    const value = geminiFeatures[check.field];

    if (value === undefined) {
      console.log(`❌ ${check.field}: NOT FOUND`);
      allPass = false;
    } else if (check.expected) {
      if (Array.isArray(check.expected)) {
        if (check.expected.includes(value)) {
          console.log(`✅ ${check.field}: ${value}`);
        } else {
          console.log(`❌ ${check.field}: ${value} (expected: ${check.expected.join('/')})`);
          allPass = false;
        }
      } else if (value === check.expected) {
        console.log(`✅ ${check.field}: ${value}`);
      } else {
        console.log(`❌ ${check.field}: ${value} (expected: ${check.expected})`);
        allPass = false;
      }
    } else if (check.type === 'number') {
      if (typeof value === 'number') {
        console.log(`✅ ${check.field}: ${value}`);
      } else {
        console.log(`❌ ${check.field}: ${value} (expected number, got ${typeof value})`);
        allPass = false;
      }
    }
  }

  console.log('\n========================================');
  console.log('COMPONENTS USED');
  console.log('========================================\n');

  const componentsUsed = latestPrediction.components_used || [];
  console.log(`Total components: ${componentsUsed.length}`);
  console.log(`Components: ${componentsUsed.join(', ')}\n`);

  if (componentsUsed.includes('gemini')) {
    console.log('✅ Gemini component was used');
  } else {
    console.log('❌ Gemini component was NOT used');
  }

  console.log('\n========================================');
  console.log('FINAL RESULT');
  console.log('========================================\n');

  if (allPass && componentsUsed.includes('gemini')) {
    console.log('🎉 ALL CHECKS PASSED!');
    console.log('✅ Gemini 3 Pro video analysis worked');
    console.log('✅ Features were stored in database');
    console.log('✅ Frontend should be able to display them');
  } else {
    console.log('⚠️  SOME CHECKS FAILED');
    console.log('   Review the errors above');
  }
}

checkLatestPrediction();
