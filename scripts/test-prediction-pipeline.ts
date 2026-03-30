/**
 * Test script for Hybrid Prediction Pipeline
 *
 * Tests the complete end-to-end flow:
 * 1. Feature extraction
 * 2. XGBoost prediction
 * 3. GPT-4 refinement (optional)
 * 4. Final prediction output
 *
 * Usage:
 *   npx tsx scripts/test-prediction-pipeline.ts
 */

import { predictVirality } from '../src/lib/ml/hybrid-predictor';

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║     HYBRID PREDICTION PIPELINE - END-TO-END TEST           ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Test 1: Predict for existing video (XGBoost only - fast)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 1: Existing Video (Fast Mode - XGBoost Only)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const test1Result = await predictVirality({
    videoId: '7523222079223745800',
    skipGPTRefinement: true, // Fast mode
  });

  if (test1Result.success) {
    console.log('\n✅ TEST 1 PASSED\n');
    console.log('Results:');
    console.log(`  Final DPS:       ${test1Result.finalDpsPrediction.toFixed(2)}`);
    console.log(`  Confidence:      ${(test1Result.confidence * 100).toFixed(1)}%`);
    console.log(`  Model Used:      ${test1Result.modelUsed}`);
    console.log(`  Processing Time: ${test1Result.processingTimeMs}ms`);
    console.log(`  LLM Cost:        $${test1Result.llmCostUsd.toFixed(6)}`);
    console.log(`  Features:        ${test1Result.featureCount}`);
    console.log('\nTop 5 Features:');
    test1Result.topFeatures.slice(0, 5).forEach((f, i) => {
      console.log(`  ${i + 1}. ${f.name.padEnd(30)} ${(f.importance * 100).toFixed(2)}%  (value: ${f.value.toFixed(2)})`);
    });
  } else {
    console.log(`\n❌ TEST 1 FAILED: ${test1Result.error}\n`);
    return;
  }

  // Test 2: Predict for existing video (Hybrid mode with GPT-4)
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 2: Existing Video (Hybrid Mode - XGBoost + GPT-4)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const test2Result = await predictVirality({
    videoId: '7523222079223745800',
    forceGPTRefinement: true, // Force GPT-4 refinement
  });

  if (test2Result.success) {
    console.log('\n✅ TEST 2 PASSED\n');
    console.log('Results:');
    console.log(`  Final DPS:       ${test2Result.finalDpsPrediction.toFixed(2)}`);
    console.log(`  Confidence:      ${(test2Result.confidence * 100).toFixed(1)}%`);
    console.log(`  Model Used:      ${test2Result.modelUsed}`);
    console.log(`  Processing Time: ${test2Result.processingTimeMs}ms`);
    console.log(`  LLM Cost:        $${test2Result.llmCostUsd.toFixed(6)}`);

    console.log('\nPrediction Breakdown:');
    console.log(`  XGBoost Base:    ${test2Result.predictionBreakdown.xgboostBase.toFixed(2)}`);
    console.log(`  GPT-4 Adjustment: ${test2Result.predictionBreakdown.gptAdjustment >= 0 ? '+' : ''}${test2Result.predictionBreakdown.gptAdjustment.toFixed(2)}`);
    console.log(`  Final Score:     ${test2Result.predictionBreakdown.finalScore.toFixed(2)}`);

    if (test2Result.qualitativeAnalysis) {
      console.log('\nQualitative Analysis:');
      console.log(`\n  Viral Hooks (${test2Result.qualitativeAnalysis.viralHooks.length}):`);
      test2Result.qualitativeAnalysis.viralHooks.forEach((hook, i) => {
        console.log(`    ${i + 1}. ${hook}`);
      });

      console.log(`\n  Weaknesses (${test2Result.qualitativeAnalysis.weaknesses.length}):`);
      test2Result.qualitativeAnalysis.weaknesses.forEach((weakness, i) => {
        console.log(`    ${i + 1}. ${weakness}`);
      });

      console.log(`\n  Recommendations (${test2Result.qualitativeAnalysis.recommendations.length}):`);
      test2Result.qualitativeAnalysis.recommendations.forEach((rec, i) => {
        console.log(`    ${i + 1}. ${rec}`);
      });

      console.log(`\n  Reasoning:`);
      console.log(`    ${test2Result.qualitativeAnalysis.reasoning}`);
    }
  } else {
    console.log(`\n❌ TEST 2 FAILED: ${test2Result.error}\n`);
    return;
  }

  // Test 3: Custom transcript prediction
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 3: Custom Transcript (Hybrid Mode)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const customTranscript = `
    I discovered this crazy hack that literally changed my life overnight.
    So here's what happened - I was scrolling through TikTok at 2am when I stumbled upon this secret.
    Nobody talks about this! Like seriously, why is no one sharing this?
    You need to try this right now. I'm not even kidding.
    First, grab your phone. Then open the settings app.
    Go to notifications and turn off ALL social media apps except TikTok.
    Now here's the magic part - you'll actually have time to focus on your goals.
    I went from barely productive to crushing it every single day.
    My productivity increased by 300% in just one week.
    This is actually insane. Try it and let me know if it works for you!
  `.trim();

  const test3Result = await predictVirality({
    transcript: customTranscript,
    title: 'The Secret Productivity Hack Nobody Talks About',
    metadata: {
      viewsCount: 0,
      likesCount: 0,
      commentsCount: 0,
    },
    forceGPTRefinement: true,
  });

  if (test3Result.success) {
    console.log('\n✅ TEST 3 PASSED\n');
    console.log('Results:');
    console.log(`  Final DPS:       ${test3Result.finalDpsPrediction.toFixed(2)}`);
    console.log(`  Confidence:      ${(test3Result.confidence * 100).toFixed(1)}%`);
    console.log(`  Model Used:      ${test3Result.modelUsed}`);
    console.log(`  Processing Time: ${test3Result.processingTimeMs}ms`);
    console.log(`  LLM Cost:        $${test3Result.llmCostUsd.toFixed(6)}`);

    console.log('\nPrediction Breakdown:');
    console.log(`  XGBoost Base:    ${test3Result.predictionBreakdown.xgboostBase.toFixed(2)}`);
    console.log(`  GPT-4 Adjustment: ${test3Result.predictionBreakdown.gptAdjustment >= 0 ? '+' : ''}${test3Result.predictionBreakdown.gptAdjustment.toFixed(2)}`);
    console.log(`  Final Score:     ${test3Result.predictionBreakdown.finalScore.toFixed(2)}`);

    if (test3Result.qualitativeAnalysis) {
      console.log('\nTop Viral Hooks:');
      test3Result.qualitativeAnalysis.viralHooks.slice(0, 3).forEach((hook, i) => {
        console.log(`  ${i + 1}. ${hook}`);
      });

      console.log('\nTop Recommendations:');
      test3Result.qualitativeAnalysis.recommendations.slice(0, 3).forEach((rec, i) => {
        console.log(`  ${i + 1}. ${rec}`);
      });
    }
  } else {
    console.log(`\n❌ TEST 3 FAILED: ${test3Result.error}\n`);
    return;
  }

  // Summary
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║     ✅ ALL TESTS PASSED - PIPELINE FULLY OPERATIONAL       ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log('Summary:');
  console.log(`  ✅ XGBoost-only mode: ${test1Result.processingTimeMs}ms`);
  console.log(`  ✅ Hybrid mode: ${test2Result.processingTimeMs}ms`);
  console.log(`  ✅ Custom transcript: ${test3Result.processingTimeMs}ms`);
  console.log(`  Total cost: $${(test1Result.llmCostUsd + test2Result.llmCostUsd + test3Result.llmCostUsd).toFixed(6)}\n`);
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
