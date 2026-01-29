// Test script for FEAT-070 Pre-Content Viral Prediction API

const testScripts = {
  'personal-finance-viral': {
    script: `Here's the secret banks don't want you to know about compound interest. If you invest just $100 per month starting at age 25, by the time you're 65, you'll have over $1.1 MILLION dollars. But most people wait until they're 35 to start investing, and they end up with only $400,000. That 10-year delay costs you $700,000! Stop waiting. Start investing today. Your future self will thank you. Comment "START" if you're ready to begin building wealth.`,
    platform: 'tiktok',
    niche: 'personal-finance',
    estimatedDuration: 45,
    creatorFollowers: 15000
  },

  'personal-finance-low': {
    script: `Today I'm going to talk about saving money. It's important to save money for your future. You should try to save at least 10% of your income. That's my tip for today.`,
    platform: 'tiktok',
    niche: 'personal-finance',
    estimatedDuration: 15,
    creatorFollowers: 5000
  },

  'fitness-viral': {
    script: `Stop doing crunches for abs. Here's why: crunches only work your surface muscles and put massive strain on your neck and spine. Instead, do THIS 3-minute plank routine every morning. Plank for 30 seconds, side plank left for 30 seconds, side plank right for 30 seconds, then back to center for 30 seconds. Repeat 3 times. This works your ENTIRE core, not just abs, and you'll see results in 2 weeks. I lost 3 inches off my waist doing this. Try it and comment your results!`,
    platform: 'tiktok',
    niche: 'fitness',
    estimatedDuration: 50,
    creatorFollowers: 25000
  }
};

async function testPrediction(testName, input) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${testName}`);
  console.log('='.repeat(60));
  console.log(`Niche: ${input.niche}`);
  console.log(`Platform: ${input.platform}`);
  console.log(`Script length: ${input.script.length} chars`);
  console.log(`\nScript preview: ${input.script.substring(0, 100)}...`);

  try {
    const response = await fetch('http://localhost:3000/api/predict/viral', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(input)
    });

    const data = await response.json();

    if (!response.ok) {
      console.log(`\n❌ Error (${response.status}):`, data.error);
      if (data.details) console.log('   Details:', data.details);
      return;
    }

    if (!data.success) {
      console.log('\n❌ Prediction failed:', data.error);
      return;
    }

    const pred = data.prediction;

    console.log('\n📊 PREDICTION RESULTS:');
    console.log('─'.repeat(60));
    console.log(`🎯 Predicted DPS: ${pred.predicted_dps_score}`);
    console.log(`📈 Classification: ${pred.predicted_classification.toUpperCase()}`);
    console.log(`🎲 Confidence: ${(pred.confidence * 100).toFixed(1)}%`);
    console.log(`🔥 Viral Probability: ${(pred.viral_probability * 100).toFixed(1)}%`);

    console.log('\n🧮 BREAKDOWN:');
    console.log(`   Pattern Score: ${pred.pattern_based_score}`);
    console.log(`   Novelty Bonus: ${pred.novelty_bonus}`);
    console.log(`   Confidence Factor: ${pred.confidence_factor}`);

    console.log('\n🔍 VIRAL ELEMENTS:');
    console.log(`   Hooks: ${pred.viral_elements_detected.hooks.length}`);
    if (pred.viral_elements_detected.hooks.length > 0) {
      pred.viral_elements_detected.hooks.forEach((hook, i) => {
        console.log(`      ${i + 1}. "${hook}"`);
      });
    }
    console.log(`   Triggers: ${pred.viral_elements_detected.triggers.length}`);
    if (pred.viral_elements_detected.triggers.length > 0) {
      pred.viral_elements_detected.triggers.slice(0, 3).forEach((trigger, i) => {
        console.log(`      ${i + 1}. ${trigger}`);
      });
    }
    console.log(`   Structure: ${pred.viral_elements_detected.structure}`);

    console.log(`\n🧬 TOP PATTERNS (${pred.top_matching_patterns.length} matches):`);
    pred.top_matching_patterns.slice(0, 3).forEach((pattern, i) => {
      console.log(`   ${i + 1}. ${pattern.pattern_type}: "${pattern.pattern_value}"`);
      console.log(`      Match: ${(pattern.match_score * 100).toFixed(0)}% | Pattern DPS: ${pattern.pattern_dps}`);
    });

    console.log(`\n💡 RECOMMENDATIONS (${pred.recommendations.length}):`);
    pred.recommendations.forEach((rec, i) => {
      console.log(`   ${i + 1}. ${rec}`);
    });

    console.log('\n📋 METADATA:');
    console.log(`   Prediction ID: ${pred.prediction_id}`);
    console.log(`   Patterns Analyzed: ${pred.patterns_analyzed}`);
    console.log(`   Timestamp: ${new Date(pred.timestamp).toLocaleString()}`);

    if (data.cached) {
      console.log('\n📦 [CACHED] This prediction was returned from cache');
    }

    // Verdict
    console.log('\n' + '='.repeat(60));
    if (pred.predicted_classification === 'mega-viral') {
      console.log('✅ VERDICT: MEGA-VIRAL - Ship this immediately!');
    } else if (pred.predicted_classification === 'viral') {
      console.log('✅ VERDICT: VIRAL - Strong potential, minor tweaks recommended');
    } else if (pred.predicted_classification === 'good') {
      console.log('⚠️  VERDICT: GOOD - Solid content, but needs viral elements');
    } else {
      console.log('❌ VERDICT: NORMAL - Needs significant improvement');
    }
    console.log('='.repeat(60));

  } catch (error) {
    console.log('\n❌ Network error:', error.message);
  }
}

async function runTests() {
  console.log('\n🧪 FEAT-070: Pre-Content Viral Prediction Test Suite');
  console.log('Testing endpoint: POST /api/predict/viral\n');

  // Test 1: Viral personal finance script
  await testPrediction('Viral Personal Finance', testScripts['personal-finance-viral']);

  // Wait 2 seconds between tests
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 2: Low-quality script
  await testPrediction('Low Quality Personal Finance', testScripts['personal-finance-low']);

  // Wait 2 seconds
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 3: Viral fitness script
  await testPrediction('Viral Fitness', testScripts['fitness-viral']);

  // Wait 2 seconds
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 4: Duplicate script (should return cached)
  console.log('\n🔄 Testing cache (duplicate script)...');
  await testPrediction('Cached Result Test', testScripts['personal-finance-viral']);

  console.log('\n\n✅ All tests complete!');
}

runTests().catch(console.error);
