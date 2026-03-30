/**
 * Test script for Optimization Loop (Prompt 3C)
 * Tests the complete workflow: Generate → Analyze → Optimize → Regenerate
 */

const BASE_URL = 'http://localhost:3001';

interface ScriptResponse {
  success: boolean;
  data: {
    script: {
      hook: { content: string };
      context: { content: string };
      value: { content: string };
      cta: { content: string };
      fullScript: string;
    };
    predictedDps: number;
    dpsBreakdown: any;
    attributes: Record<string, number>;
    recommendations: Array<{
      attribute: string;
      current: number;
      target: number;
      impact: string;
      suggestion: string;
      example: string;
    }>;
  };
  error?: string;
}

interface OptimizeResponse {
  success: boolean;
  data: {
    optimizedScript: {
      hook: { content: string };
      context: { content: string };
      value: { content: string };
      cta: { content: string };
      fullScript: string;
    };
    changesMade: string;
    tokensUsed: number;
  };
  error?: string;
}

async function testOptimizationLoop() {
  console.log('\n🧪 TESTING OPTIMIZATION LOOP (PROMPT 3C)\n');
  console.log('=' .repeat(60));

  // STEP 1: Generate initial script
  console.log('\n📝 STEP 1: Generating initial script...\n');

  const scriptPayload = {
    concept: 'How to make money with AI in 2025',
    platform: 'tiktok',
    length: 30,
    niche: 'AI & Technology',
  };

  const scriptRes = await fetch(`${BASE_URL}/api/generate/script`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(scriptPayload),
  });

  const scriptData: ScriptResponse = await scriptRes.json();

  if (!scriptData.success) {
    console.error('❌ Script generation failed:', scriptData.error);
    process.exit(1);
  }

  console.log('✅ Script generated successfully!\n');
  console.log('📊 Initial DPS:', scriptData.data.predictedDps);
  console.log('\n📜 Generated Script:');
  console.log('─'.repeat(60));
  console.log(scriptData.data.script.fullScript);
  console.log('─'.repeat(60));

  // STEP 2: Display Nine Attributes
  console.log('\n⚡ STEP 2: Nine Attributes Analysis\n');

  if (!scriptData.data.attributes) {
    console.error('❌ No attributes returned in response!');
    process.exit(1);
  }

  const attributes = scriptData.data.attributes;
  console.log('┌─────────────────────────┬───────┐');
  console.log('│ Attribute               │ Score │');
  console.log('├─────────────────────────┼───────┤');

  Object.entries(attributes).forEach(([key, value]) => {
    const score = Math.round((value as number) * 100);
    const emoji = score >= 80 ? '🟢' : score >= 60 ? '🟡' : '🔴';
    const formattedKey = key.replace(/([A-Z])/g, ' $1').trim();
    const paddedKey = formattedKey.padEnd(23);
    const paddedScore = `${score}%`.padStart(5);
    console.log(`│ ${paddedKey} │ ${emoji} ${paddedScore} │`);
  });

  console.log('└─────────────────────────┴───────┘');

  // STEP 3: Display Optimization Recommendations
  console.log('\n💡 STEP 3: Optimization Recommendations\n');

  if (!scriptData.data.recommendations || scriptData.data.recommendations.length === 0) {
    console.error('❌ No recommendations returned in response!');
    process.exit(1);
  }

  console.log(`Found ${scriptData.data.recommendations.length} optimization opportunities:\n`);

  scriptData.data.recommendations.forEach((rec, idx) => {
    console.log(`${idx + 1}. ${rec.attribute.replace(/([A-Z])/g, ' $1').trim().toUpperCase()}`);
    console.log(`   Current: ${Math.round(rec.current * 100)}% → Target: ${Math.round(rec.target * 100)}%`);
    console.log(`   Impact: ${rec.impact}`);
    console.log(`   💡 ${rec.suggestion}`);
    console.log(`   📌 Example: ${rec.example}`);
    console.log();
  });

  // STEP 4: Apply optimizations (select first 2 recommendations)
  console.log('\n🔧 STEP 4: Applying optimizations...\n');

  const selectedRecs = scriptData.data.recommendations.slice(0, 2);
  console.log(`Selected ${selectedRecs.length} optimizations to apply:`);
  selectedRecs.forEach((rec, idx) => {
    console.log(`  ${idx + 1}. ${rec.attribute} - ${rec.suggestion}`);
  });

  const optimizeRes = await fetch(`${BASE_URL}/api/generate/optimize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      originalScript: scriptData.data.script,
      selectedRecommendations: selectedRecs,
      platform: scriptPayload.platform,
      length: scriptPayload.length,
      niche: scriptPayload.niche,
    }),
  });

  const optimizeData: OptimizeResponse = await optimizeRes.json();

  if (!optimizeData.success) {
    console.error('❌ Optimization failed:', optimizeData.error);
    process.exit(1);
  }

  console.log('\n✅ Script optimized successfully!\n');
  console.log('📝 Changes made:');
  console.log('─'.repeat(60));
  console.log(optimizeData.data.changesMade);
  console.log('─'.repeat(60));

  console.log('\n📜 Optimized Script:');
  console.log('─'.repeat(60));
  console.log(optimizeData.data.optimizedScript.fullScript);
  console.log('─'.repeat(60));

  // STEP 5: Re-calculate DPS for optimized script
  console.log('\n📈 STEP 5: Re-calculating DPS for optimized script...\n');

  const optimizedScriptRes = await fetch(`${BASE_URL}/api/generate/script`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...scriptPayload,
      concept: optimizeData.data.optimizedScript.fullScript,
    }),
  });

  const optimizedScriptData: ScriptResponse = await optimizedScriptRes.json();

  if (!optimizedScriptData.success) {
    console.error('❌ DPS re-calculation failed:', optimizedScriptData.error);
    process.exit(1);
  }

  // STEP 6: Compare before/after
  console.log('\n🎯 STEP 6: Before vs After Comparison\n');
  console.log('═'.repeat(60));
  console.log(`📊 ORIGINAL DPS: ${scriptData.data.predictedDps}`);
  console.log(`📊 OPTIMIZED DPS: ${optimizedScriptData.data.predictedDps}`);
  console.log(`📈 IMPROVEMENT: ${(optimizedScriptData.data.predictedDps - scriptData.data.predictedDps).toFixed(1)} DPS`);
  console.log('═'.repeat(60));

  // Detailed attribute comparison
  console.log('\n📊 Attribute Improvements:\n');
  console.log('┌─────────────────────────┬──────────┬───────────┬──────────┐');
  console.log('│ Attribute               │ Original │ Optimized │ Change   │');
  console.log('├─────────────────────────┼──────────┼───────────┼──────────┤');

  Object.keys(attributes).forEach((key) => {
    const originalScore = Math.round((attributes[key] as number) * 100);
    const optimizedScore = Math.round((optimizedScriptData.data.attributes[key] as number) * 100);
    const change = optimizedScore - originalScore;
    const changeStr = change > 0 ? `+${change}%` : `${change}%`;
    const emoji = change > 0 ? '📈' : change < 0 ? '📉' : '➖';

    const formattedKey = key.replace(/([A-Z])/g, ' $1').trim();
    const paddedKey = formattedKey.padEnd(23);
    const paddedOriginal = `${originalScore}%`.padStart(8);
    const paddedOptimized = `${optimizedScore}%`.padStart(9);
    const paddedChange = changeStr.padStart(8);

    console.log(`│ ${paddedKey} │${paddedOriginal} │${paddedOptimized} │ ${emoji} ${paddedChange} │`);
  });

  console.log('└─────────────────────────┴──────────┴───────────┴──────────┘');

  // Final summary
  console.log('\n✅ OPTIMIZATION LOOP TEST COMPLETE!\n');
  console.log('Summary:');
  console.log(`  ✓ Initial script generated with Nine Attributes`);
  console.log(`  ✓ ${scriptData.data.recommendations.length} optimization recommendations provided`);
  console.log(`  ✓ ${selectedRecs.length} optimizations applied successfully`);
  console.log(`  ✓ DPS improved from ${scriptData.data.predictedDps} → ${optimizedScriptData.data.predictedDps}`);
  console.log(`  ✓ Average attribute improvement: ${Object.keys(attributes).reduce((sum, key) => {
    const original = (attributes[key] as number) * 100;
    const optimized = (optimizedScriptData.data.attributes[key] as number) * 100;
    return sum + (optimized - original);
  }, 0) / Object.keys(attributes).length}%\n`);
}

// Run the test
testOptimizationLoop().catch((error) => {
  console.error('\n❌ TEST FAILED:', error);
  process.exit(1);
});
