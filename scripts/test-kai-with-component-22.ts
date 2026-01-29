/**
 * Test Kai Orchestrator with Component 22 Integration
 */

import { KaiOrchestrator } from '../src/lib/orchestration/kai-orchestrator';

async function testKaiWithComponent22() {
  console.log('=== TESTING KAI ORCHESTRATOR WITH COMPONENT 22 ===\n');

  const kai = new KaiOrchestrator();

  try {
    // Test video input
    const videoInput = {
      videoId: 'test_component_22',
      transcript: 'This is a test video about side hustles. How to make money online. You can earn passive income with these proven strategies. Follow for more tips!',
      niche: 'side-hustles',
      goal: 'build-engaged-following',
      accountSize: 'medium'
    };

    console.log('📹 Test Video Input:');
    console.log(`   Niche: ${videoInput.niche}`);
    console.log(`   Goal: ${videoInput.goal}`);
    console.log(`   Transcript length: ${videoInput.transcript.length} chars\n`);

    console.log('🚀 Running Kai Prediction (trending-library workflow)...\n');

    const result = await kai.predict(videoInput, 'trending-library');

    console.log('\n' + '='.repeat(70));
    console.log('📊 PREDICTION RESULTS');
    console.log('='.repeat(70));

    console.log(`\n✅ Success: ${result.success}`);
    console.log(`🎯 DPS: ${result.dps}`);
    console.log(`🔒 Confidence: ${(result.confidence * 100).toFixed(1)}%`);
    console.log(`📈 Range: [${result.range[0].toFixed(1)}, ${result.range[1].toFixed(1)}]`);
    console.log(`🔥 Viral Potential: ${result.viralPotential}`);
    console.log(`⏱️  Latency: ${result.latency}ms`);

    console.log(`\n🔧 Components Used: ${result.componentsUsed.length}`);
    result.componentsUsed.forEach((comp, i) => {
      console.log(`   ${i + 1}. ${comp}`);
    });

    // Find historical path results
    const historicalPath = result.paths.find(p => p.path === 'historical');

    if (historicalPath) {
      console.log(`\n📚 Historical Path Results:`);
      console.log(`   Success: ${historicalPath.success}`);
      console.log(`   Aggregated Prediction: ${historicalPath.aggregatedPrediction?.toFixed(1) || 'N/A'}`);
      console.log(`   Components: ${historicalPath.results.length}`);

      // Find Component 22 specifically
      const comp22Result = historicalPath.results.find(r => r.componentId === 'competitor-benchmark');

      if (comp22Result) {
        console.log(`\n🏆 Component 22: Competitor Benchmarking`);
        console.log(`   Status: ${comp22Result.success ? '✅ Success' : '❌ Failed'}`);

        if (comp22Result.success) {
          console.log(`   Prediction: ${comp22Result.prediction?.toFixed(1)}`);
          console.log(`   Confidence: ${((comp22Result.confidence || 0) * 100).toFixed(1)}%`);
          console.log(`   Latency: ${comp22Result.latency}ms`);

          if (comp22Result.features) {
            console.log(`\n   📊 Competitive Analysis:`);
            console.log(`      Score: ${comp22Result.features.competitiveScore}/100`);
            console.log(`      Top Performers: ${comp22Result.features.benchmarkStats?.topPerformerCount || 0}`);
            console.log(`      Avg Top DPS: ${comp22Result.features.benchmarkStats?.avgTopPerformerDps || 'N/A'}`);

            if (comp22Result.features.opportunities?.length > 0) {
              console.log(`\n   💡 Opportunities:`);
              comp22Result.features.opportunities.slice(0, 3).forEach((opp: string, i: number) => {
                console.log(`      ${i + 1}. ${opp}`);
              });
            }
          }

          if (comp22Result.insights && comp22Result.insights.length > 0) {
            console.log(`\n   🔍 Insights:`);
            comp22Result.insights.forEach((insight, i) => {
              console.log(`      ${i + 1}. ${insight}`);
            });
          }
        } else {
          console.log(`   Error: ${comp22Result.error || 'Unknown error'}`);
        }
      } else {
        console.log(`\n⚠️  Component 22 not found in historical path results`);
      }
    } else {
      console.log(`\n⚠️  Historical path not found in results`);
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ KAI + COMPONENT 22 INTEGRATION TEST COMPLETE!');
    console.log('='.repeat(70) + '\n');

  } catch (error: any) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testKaiWithComponent22();
