const fetch = require('node-fetch');
const fs = require('fs');

async function validatePredictions() {
  // Check if test videos exist
  if (!fs.existsSync('test_videos.json')) {
    console.error('❌ test_videos.json not found!');
    console.log('Run: node scripts/extract-test-videos.js');
    return;
  }

  const testVideos = JSON.parse(fs.readFileSync('test_videos.json', 'utf8'));
  const results = [];

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🧪 FEAT-070 VALIDATION: Testing Predictions on 10 Known Videos');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log(`Total test videos: ${testVideos.length}`);
  console.log(`API endpoint: http://localhost:3000/api/predict/viral\n`);

  for (let i = 0; i < testVideos.length; i++) {
    const video = testVideos[i];
    const videoNum = i + 1;
    
    // Derive niche from creator or use default
    const niche = video.creator_username || 'general';

    console.log(`\n[${videoNum}/${testVideos.length}] Testing video: ${video.video_id.substring(0, 8)}...`);
    console.log(`  Creator: ${video.creator_username || 'unknown'}`);
    console.log(`  Actual DPS: ${video.dps_score.toFixed(1)} (${video.dps_classification})`);
    console.log(`  Transcript length: ${video.transcript?.length || 0} chars`);

    try {
      const response = await fetch('http://localhost:3000/api/predict/viral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script: video.transcript,
          platform: 'tiktok',
          niche: niche,
          estimatedDuration: 60,
          creatorFollowers: video.creator_followers_count || 10000
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log(`  ❌ HTTP ${response.status}: ${errorText.substring(0, 100)}`);
        results.push({
          video_id: video.video_id,
          creator: video.creator_username,
          actual_dps: video.dps_score,
          actual_classification: video.dps_classification,
          error: 'HTTP_ERROR',
          error_details: errorText.substring(0, 200)
        });
        continue;
      }

      const prediction = await response.json();

      if (prediction.success && prediction.prediction) {
        const predictedDPS = prediction.prediction.predicted_dps_score;
        const actualDPS = video.dps_score;
        const error = Math.abs(predictedDPS - actualDPS);
        const withinRange = error <= 10;

        console.log(`  ✅ Predicted DPS: ${predictedDPS.toFixed(1)}`);
        console.log(`  📊 Error: ${error.toFixed(1)} points ${withinRange ? '✓ within ±10' : '✗ outside ±10'}`);
        console.log(`  🎯 Confidence: ${(prediction.prediction.confidence * 100).toFixed(1)}%`);
        console.log(`  🔍 Top patterns found: ${prediction.prediction.top_matching_patterns?.length || 0}`);

        results.push({
          video_id: video.video_id,
          creator: video.creator_username,
          actual_dps: actualDPS,
          actual_classification: video.dps_classification,
          predicted_dps: predictedDPS,
          predicted_classification: prediction.prediction.predicted_classification,
          error: error,
          within_10_points: withinRange,
          confidence: prediction.prediction.confidence,
          top_patterns_count: prediction.prediction.top_matching_patterns?.length || 0,
          pattern_matches: prediction.prediction.top_matching_patterns?.slice(0, 3).map(p => ({
            type: p.pattern_type,
            description: p.pattern_description?.substring(0, 50),
            score: p.similarity_score
          })) || []
        });

      } else {
        console.log(`  ❌ Prediction failed: ${prediction.error || 'Unknown error'}`);
        results.push({
          video_id: video.video_id,
          creator: video.creator_username,
          actual_dps: video.dps_score,
          actual_classification: video.dps_classification,
          error: 'PREDICTION_FAILED',
          error_details: prediction.error || 'Unknown error'
        });
      }

      // Rate limit: 2 seconds between requests
      if (i < testVideos.length - 1) {
        process.stdout.write('  ⏳ Waiting 2s before next request...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        process.stdout.write(' Done\n');
      }

    } catch (err) {
      console.log(`  ❌ Request failed: ${err.message}`);
      results.push({
        video_id: video.video_id,
        creator: video.creator_username,
        actual_dps: video.dps_score,
        actual_classification: video.dps_classification,
        error: 'REQUEST_FAILED',
        error_details: err.message
      });
    }
  }

  // Calculate metrics
  console.log('\n\n═══════════════════════════════════════════════════════════════');
  console.log('📊 VALIDATION RESULTS');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const successfulPredictions = results.filter(r => !r.error || typeof r.error === 'number');
  const totalTests = results.length;
  const successCount = successfulPredictions.length;

  if (successCount === 0) {
    console.log('❌ NO SUCCESSFUL PREDICTIONS');
    console.log('System needs debugging. Check:');
    console.log('  1. Is dev server running? (npm run dev)');
    console.log('  2. Is predictions table schema correct?');
    console.log('  3. Are there any API errors in server logs?');
    console.log('\n💾 Detailed errors saved to: validation_results.json\n');
    fs.writeFileSync('validation_results.json', JSON.stringify(results, null, 2));
    return;
  }

  const mae = successfulPredictions.reduce((sum, r) => sum + r.error, 0) / successCount;
  const within10 = successfulPredictions.filter(r => r.within_10_points).length;
  const accuracy = (within10 / successCount) * 100;

  console.log(`Total Tests: ${totalTests}`);
  console.log(`Successful Predictions: ${successCount} (${(successCount / totalTests * 100).toFixed(1)}%)`);
  console.log(`Failed Predictions: ${totalTests - successCount}`);
  console.log(`\n🎯 Mean Absolute Error (MAE): ${mae.toFixed(1)} points`);
  console.log(`✅ Predictions within ±10 points: ${within10}/${successCount} (${accuracy.toFixed(1)}%)`);
  console.log(`📊 Average Confidence: ${(successfulPredictions.reduce((sum, r) => sum + r.confidence, 0) / successCount * 100).toFixed(1)}%`);

  console.log('\n📈 BY CLASSIFICATION:');
  ['mega-viral', 'viral', 'normal'].forEach(classification => {
    const classResults = successfulPredictions.filter(r => r.actual_classification === classification);
    if (classResults.length > 0) {
      const classMAE = classResults.reduce((sum, r) => sum + r.error, 0) / classResults.length;
      const classWithin10 = classResults.filter(r => r.within_10_points).length;
      console.log(`  ${classification}: ${classResults.length} videos, MAE ${classMAE.toFixed(1)}, ${classWithin10}/${classResults.length} within ±10`);
    }
  });

  console.log('\n🏆 TOP 3 BEST PREDICTIONS (lowest error):');
  successfulPredictions
    .sort((a, b) => a.error - b.error)
    .slice(0, 3)
    .forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.video_id.substring(0, 8)}... - Error: ${r.error.toFixed(1)} (Predicted: ${r.predicted_dps.toFixed(1)}, Actual: ${r.actual_dps.toFixed(1)})`);
    });

  console.log('\n⚠️  TOP 3 WORST PREDICTIONS (highest error):');
  successfulPredictions
    .sort((a, b) => b.error - a.error)
    .slice(0, 3)
    .forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.video_id.substring(0, 8)}... - Error: ${r.error.toFixed(1)} (Predicted: ${r.predicted_dps.toFixed(1)}, Actual: ${r.actual_dps.toFixed(1)})`);
    });

  console.log('\n🎯 FINAL VERDICT:');
  if (mae < 15) {
    console.log('✅✅✅ EXCELLENT - System is PRODUCTION-READY! (MAE < 15)');
    console.log('The prediction system is highly accurate and ready for deployment.');
  } else if (mae < 25) {
    console.log('✅✅ GOOD - System WORKS, needs minor tuning (MAE 15-25)');
    console.log('The system is functional and can be used with some calibration.');
  } else if (mae < 40) {
    console.log('⚠️  FAIR - System works but needs data quality improvement (MAE 25-40)');
    console.log('More training data or pattern refinement recommended.');
  } else {
    console.log('❌ POOR - Algorithm needs major revision (MAE > 40)');
    console.log('The system needs significant improvements before production use.');
  }

  // Save detailed results
  fs.writeFileSync('validation_results.json', JSON.stringify(results, null, 2));
  console.log('\n💾 Detailed results saved to: validation_results.json');

  // Save summary report
  const summary = {
    timestamp: new Date().toISOString(),
    total_tests: totalTests,
    successful_predictions: successCount,
    failed_predictions: totalTests - successCount,
    mae: parseFloat(mae.toFixed(2)),
    within_10_points: within10,
    accuracy_pct: parseFloat(accuracy.toFixed(2)),
    avg_confidence: parseFloat((successfulPredictions.reduce((sum, r) => sum + r.confidence, 0) / successCount).toFixed(4)),
    verdict: mae < 15 ? 'EXCELLENT' : mae < 25 ? 'GOOD' : mae < 40 ? 'FAIR' : 'POOR',
    ready_for_production: mae < 25
  };

  fs.writeFileSync('validation_summary.json', JSON.stringify(summary, null, 2));
  console.log('📊 Summary report saved to: validation_summary.json\n');

  console.log('═══════════════════════════════════════════════════════════════\n');
}

validatePredictions();
