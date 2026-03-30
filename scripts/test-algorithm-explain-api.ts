/**
 * Test /api/algorithm/explain endpoint
 */

async function testAlgorithmExplainAPI() {
  console.log('=== TESTING /api/algorithm/explain API ===\n');

  try {
    // Test POST endpoint (real-time explanation)
    console.log('Test 1: POST /api/algorithm/explain (Real-time)\n');

    const testInput = {
      transcript: 'Want to make $10,000 per month with a side hustle? Here are the top 3 passive income strategies that actually work in 2024. First, start with affiliate marketing. You can promote products you already use and earn commissions. Second, create digital products like templates or guides. Sell them on Etsy or Gumroad. Third, build a YouTube channel in a profitable niche. Follow for more money-making tips!',
      niche: 'side-hustles',
      goal: 'build-engaged-following',
      accountSize: 'medium',
      workflow: 'immediate-analysis'
    };

    console.log('Input:');
    console.log(`  Transcript length: ${testInput.transcript.length} chars`);
    console.log(`  Niche: ${testInput.niche}`);
    console.log(`  Workflow: ${testInput.workflow}\n`);

    const response = await fetch('http://localhost:3000/api/algorithm/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testInput)
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`❌ API Error: ${response.status}`, error);
      return;
    }

    const result = await response.json();

    if (!result.success) {
      console.error('❌ API returned success: false');
      console.error(result);
      return;
    }

    const { explanation } = result;

    console.log('✅ API Response Received\n');
    console.log('─'.repeat(70));
    console.log('PREDICTION RESULT');
    console.log('─'.repeat(70));
    console.log(`  DPS: ${explanation.result.predictedDps}`);
    console.log(`  Confidence: ${(explanation.result.confidence * 100).toFixed(1)}%`);
    console.log(`  Range: [${explanation.result.range[0].toFixed(1)}, ${explanation.result.range[1].toFixed(1)}]`);
    console.log(`  Viral Potential: ${explanation.result.viralPotential}`);

    console.log('\n' + '─'.repeat(70));
    console.log('COMPONENTS ANALYSIS');
    console.log('─'.repeat(70));
    console.log(`  Total: ${explanation.components.total}`);
    console.log(`  Executed: ${explanation.components.executed}`);
    console.log(`  Successful: ${explanation.components.successful}`);

    if (explanation.components.breakdown.length > 0) {
      console.log('\n  Top Components:');
      explanation.components.breakdown.slice(0, 5).forEach((comp: any) => {
        console.log(`    - ${comp.id}: ${comp.success ? '✅' : '❌'} | Prediction: ${comp.prediction?.toFixed(1) || 'N/A'} | Latency: ${comp.latency}ms`);
      });
    }

    console.log('\n' + '─'.repeat(70));
    console.log('MULTI-PATH EXPLORATION');
    console.log('─'.repeat(70));
    explanation.paths.forEach((path: any) => {
      console.log(`  ${path.name}:`);
      console.log(`    Weight: ${path.weight * 100}%`);
      console.log(`    Success: ${path.success ? '✅' : '❌'}`);
      console.log(`    Prediction: ${path.prediction?.toFixed(1) || 'N/A'}`);
      console.log(`    Components Used: ${path.componentsUsed}`);
    });

    console.log('\n' + '─'.repeat(70));
    console.log('LEARNING LOOP STATUS');
    console.log('─'.repeat(70));
    console.log(`  Enabled: ${explanation.learningLoop.enabled}`);
    console.log(`  Reliability Scores Loaded: ${explanation.learningLoop.reliabilityScoresLoaded}`);
    console.log(`  Total Predictions Tracked: ${explanation.learningLoop.totalPredictions}`);
    console.log(`  Components Tracked: ${explanation.learningLoop.componentCount}`);

    if (explanation.learningLoop.topPerformers.length > 0) {
      console.log('\n  Top Performing Components:');
      explanation.learningLoop.topPerformers.forEach((comp: any) => {
        console.log(`    - ${comp.name}: ${(comp.reliability * 100).toFixed(1)}% (${comp.totalPredictions} predictions)`);
      });
    }

    console.log('\n' + '─'.repeat(70));
    console.log('DECISION TREE');
    console.log('─'.repeat(70));
    Object.entries(explanation.decisionTree).forEach(([step, action]) => {
      console.log(`  ${step}: ${action}`);
    });

    console.log('\n' + '─'.repeat(70));
    console.log('RECOMMENDATIONS');
    console.log('─'.repeat(70));
    if (explanation.recommendations && explanation.recommendations.length > 0) {
      explanation.recommendations.slice(0, 5).forEach((rec: string, i: number) => {
        console.log(`  ${i + 1}. ${rec}`);
      });
    }

    console.log('\n' + '─'.repeat(70));
    console.log('ALGORITHMIC EXPLANATION');
    console.log('─'.repeat(70));
    console.log(`\n${explanation.explanation}\n`);

    console.log('─'.repeat(70));
    console.log('✅ API TEST COMPLETE - Algorithm Explanation Working!');
    console.log('─'.repeat(70) + '\n');

  } catch (error: any) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error(error.stack);
  }
}

testAlgorithmExplainAPI();
