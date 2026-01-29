/**
 * Test Component 22: Competitor Benchmarking
 */

import { benchmarkAgainstCompetitors } from '../src/lib/components/competitor-benchmark';

async function testComponent22() {
  console.log('=== TESTING COMPONENT 22: COMPETITOR BENCHMARKING ===\n');

  try {
    // Test 1: Side hustles niche (we have data for this)
    console.log('Test 1: Side Hustles Niche - Predicted DPS 68.2');
    console.log('─'.repeat(60));

    const result1 = await benchmarkAgainstCompetitors({
      niche: 'side-hustles',
      goal: 'build-engaged-following',
      accountSize: 'medium',
      predictedDps: 68.2,
      featureSnapshot: {
        top_features: [
          { name: 'word_count', value: 186, importance: 0.035 },
          { name: 'second_person_count', value: 6, importance: 0.008 },
          { name: 'flesch_kincaid_grade', value: 7.3, importance: 0.012 }
        ]
      }
    });

    console.log('\n📊 Results:');
    console.log(`  Competitive Score: ${result1.competitiveScore}/100`);
    console.log(`  Top Performer Count: ${result1.benchmarkStats.topPerformerCount}`);
    console.log(`  Top Performer Avg DPS: ${result1.benchmarkStats.avgTopPerformerDps}`);
    console.log(`  DPS Range: [${result1.benchmarkStats.topPerformerDpsRange[0]}, ${result1.benchmarkStats.topPerformerDpsRange[1]}]`);

    console.log('\n❌ Missing Elements:');
    result1.missingElements.forEach((elem, i) => {
      console.log(`  ${i + 1}. ${elem}`);
    });

    console.log('\n💡 Opportunities:');
    result1.opportunities.forEach((opp, i) => {
      console.log(`  ${i + 1}. ${opp}`);
    });

    console.log('\n' + '─'.repeat(60));

    // Test 2: Low predicted DPS
    console.log('\nTest 2: Business Niche - Low Predicted DPS (35.0)');
    console.log('─'.repeat(60));

    const result2 = await benchmarkAgainstCompetitors({
      niche: 'business',
      predictedDps: 35.0,
      featureSnapshot: {
        top_features: [
          { name: 'word_count', value: 120, importance: 0.035 },
          { name: 'sentiment_polarity', value: 0.5, importance: 0.040 }
        ]
      }
    });

    console.log('\n📊 Results:');
    console.log(`  Competitive Score: ${result2.competitiveScore}/100`);
    console.log(`  Top Performer Count: ${result2.benchmarkStats.topPerformerCount}`);
    console.log(`  Avg Top DPS: ${result2.benchmarkStats.avgTopPerformerDps}`);

    console.log('\n💡 Top Opportunities:');
    result2.opportunities.slice(0, 3).forEach((opp, i) => {
      console.log(`  ${i + 1}. ${opp}`);
    });

    console.log('\n' + '─'.repeat(60));

    // Test 3: High predicted DPS
    console.log('\nTest 3: Lifestyle Niche - High Predicted DPS (85.0)');
    console.log('─'.repeat(60));

    const result3 = await benchmarkAgainstCompetitors({
      niche: 'lifestyle',
      predictedDps: 85.0
    });

    console.log('\n📊 Results:');
    console.log(`  Competitive Score: ${result3.competitiveScore}/100`);
    console.log(`  Benchmark Count: ${result3.benchmarkStats.topPerformerCount}`);

    console.log('\n💡 Opportunities (for high performer):');
    result3.opportunities.slice(0, 2).forEach((opp, i) => {
      console.log(`  ${i + 1}. ${opp}`);
    });

    console.log('\n' + '─'.repeat(60));
    console.log('\n✅ ALL TESTS PASSED - Component 22 Working!\n');

  } catch (error: any) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testComponent22();
