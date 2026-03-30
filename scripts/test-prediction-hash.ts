/**
 * Test Prediction Hash Service
 *
 * Verifies that:
 * 1. Hash generation is deterministic (same input = same hash)
 * 2. Hash verification works
 * 3. Small changes produce different hashes
 * 4. Payload creation from predictor output works
 */

import { generatePredictionHash, verifyPredictionHash, createPayloadFromPrediction, PredictionPayload } from '../src/lib/services/prediction-hash';

function testPredictionHash() {
  console.log('\n🧪 Testing Prediction Hash Service...\n');

  // Test 1: Generate hash
  console.log('Test 1: Generating hash from payload...');
  const payload: PredictionPayload = {
    video_id: 'test-video-123',
    predicted_dps: 67.5,
    predicted_range: [52.5, 82.5],
    confidence: 0.73,
    model_version: 'xgb_v1.0',
    top_features: [
      { name: 'hook_strength', importance: 0.15, value: 8.2 },
      { name: 'pacing_score', importance: 0.12, value: 3.1 },
      { name: 'emotion_variance', importance: 0.10, value: 7.5 }
    ],
    explanation: 'High hook strength (8.2) and good pacing detected',
    timestamp_utc: '2025-11-15T12:00:00.000Z'
  };

  const result1 = generatePredictionHash(payload);
  console.log(`   Hash: ${result1.hash.substring(0, 32)}...`);
  console.log(`   Algorithm: ${result1.algorithm}`);
  console.log(`   ✅ Hash generated\n`);

  // Test 2: Deterministic hashing (same input = same hash)
  console.log('Test 2: Verifying deterministic hashing...');
  const result2 = generatePredictionHash(payload);

  if (result1.hash === result2.hash) {
    console.log(`   ✅ Same input produces same hash\n`);
  } else {
    console.error(`   ❌ FAIL: Hashes don't match!`);
    console.error(`      Hash 1: ${result1.hash}`);
    console.error(`      Hash 2: ${result2.hash}`);
    process.exit(1);
  }

  // Test 3: Hash verification
  console.log('Test 3: Verifying hash...');
  const isValid = verifyPredictionHash(result1.hash, payload);

  if (isValid) {
    console.log(`   ✅ Hash verification passed\n`);
  } else {
    console.error(`   ❌ FAIL: Hash verification failed!`);
    process.exit(1);
  }

  // Test 4: Modified payload produces different hash
  console.log('Test 4: Modified payload should produce different hash...');
  const modifiedPayload = { ...payload, predicted_dps: 67.6 }; // Changed 67.5 → 67.6
  const result3 = generatePredictionHash(modifiedPayload);

  if (result1.hash !== result3.hash) {
    console.log(`   Original: ${result1.hash.substring(0, 32)}...`);
    console.log(`   Modified: ${result3.hash.substring(0, 32)}...`);
    console.log(`   ✅ Different hash for modified payload\n`);
  } else {
    console.error(`   ❌ FAIL: Modified payload produced same hash!`);
    process.exit(1);
  }

  // Test 5: Create payload from predictor output
  console.log('Test 5: Creating payload from predictor output...');
  const mockPredictorOutput = {
    finalDpsPrediction: 67.5,
    confidence: 0.73,
    predictionInterval: { lower: 52.5, upper: 82.5 },
    topFeatures: [
      { name: 'hook_strength', importance: 0.15, value: 8.2 },
      { name: 'pacing_score', importance: 0.12, value: 3.1 }
    ],
    qualitativeAnalysis: {
      reasoning: 'High hook strength detected'
    },
    modelUsed: 'xgboost',
    featureCount: 119,
    timestamp: '2025-11-15T12:00:00.000Z'
  };

  const createdPayload = createPayloadFromPrediction(mockPredictorOutput, 'test-video-456');

  if (createdPayload.video_id === 'test-video-456' &&
      createdPayload.predicted_dps === 67.5 &&
      createdPayload.model_version === 'xgb_v1.0') {
    console.log(`   ✅ Payload created successfully`);
    console.log(`      Video ID: ${createdPayload.video_id}`);
    console.log(`      DPS: ${createdPayload.predicted_dps}`);
    console.log(`      Model: ${createdPayload.model_version}\n`);
  } else {
    console.error(`   ❌ FAIL: Payload creation failed!`);
    console.error(`      Created:`, createdPayload);
    process.exit(1);
  }

  // Test 6: Hash the created payload
  console.log('Test 6: Hashing the created payload...');
  const result4 = generatePredictionHash(createdPayload);
  console.log(`   Hash: ${result4.hash.substring(0, 32)}...`);
  console.log(`   ✅ Created payload hashed successfully\n`);

  // Summary
  console.log('═══════════════════════════════════════════════════════');
  console.log('✅ All tests passed!');
  console.log('═══════════════════════════════════════════════════════');
  console.log('Summary:');
  console.log('  - Hash generation: Deterministic ✅');
  console.log('  - Hash verification: Working ✅');
  console.log('  - Collision resistance: Different inputs = different hashes ✅');
  console.log('  - Payload creation: From predictor output ✅');
  console.log('  - Ready for integration: YES ✅');
  console.log('═══════════════════════════════════════════════════════\n');
}

testPredictionHash();
