/**
 * Test Creator Personalization System
 *
 * Demonstrates Component 19: Creator History Baseline
 * Shows how predictions are contextualized to individual creators
 */

import { CreatorBaseline, CreatorProfile } from '@/lib/components/creator-baseline';

console.log('=== TESTING CREATOR PERSONALIZATION SYSTEM ===\n');

// Simulate two different creator profiles
const lowPerformingCreator: CreatorProfile = {
  id: 'test-1',
  tiktok_username: 'newbie_creator',
  baseline_dps: 25, // Struggles to get engagement
  baseline_engagement_rate: 0.03,
  avg_views: 5000,
  avg_likes: 150,
  total_videos: 20,
  dps_percentiles: {
    p25: 15,
    p50: 25,
    p75: 35,
    p90: 45
  },
  strengths: ['consistent_posting'],
  weaknesses: ['weak_hooks', 'slow_editing']
};

const highPerformingCreator: CreatorProfile = {
  id: 'test-2',
  tiktok_username: 'viral_master',
  baseline_dps: 70, // Consistently high engagement
  baseline_engagement_rate: 0.15,
  avg_views: 500000,
  avg_likes: 75000,
  total_videos: 100,
  dps_percentiles: {
    p25: 55,
    p50: 70,
    p75: 82,
    p90: 91
  },
  strengths: ['strong_hooks', 'fast_editing', 'text_overlays'],
  weaknesses: ['inconsistent_niche']
};

// Test same prediction (60 DPS) for both creators
const samePrediction = 60;

console.log('Scenario: Kai predicts 60 DPS for both creators\n');
console.log('='.repeat(80));
console.log('\n');

// Test 1: Low-performing creator
console.log(`Creator 1: @${lowPerformingCreator.tiktok_username}`);
console.log(`  Baseline DPS: ${lowPerformingCreator.baseline_dps}`);
console.log(`  Average Views: ${lowPerformingCreator.avg_views.toLocaleString()}`);
console.log(`  Total Videos Analyzed: ${lowPerformingCreator.total_videos}\n`);

const result1 = CreatorBaseline.analyze(samePrediction, lowPerformingCreator);

console.log(`Prediction: ${samePrediction} DPS`);
console.log(`\nPersonalized Analysis:`);
console.log(`  Relative Score: ${result1.relativeScore}/10`);
console.log(`  Improvement Factor: ${result1.improvementFactor}x`);
console.log(`  Percentile Rank: ${result1.percentileRank}`);
console.log(`\n  ${result1.contextualizedPrediction}\n`);

console.log(`Insights:`);
for (const insight of result1.insights) {
  console.log(`  • ${insight}`);
}

console.log('\n' + '='.repeat(80));
console.log('\n');

// Test 2: High-performing creator
console.log(`Creator 2: @${highPerformingCreator.tiktok_username}`);
console.log(`  Baseline DPS: ${highPerformingCreator.baseline_dps}`);
console.log(`  Average Views: ${highPerformingCreator.avg_views.toLocaleString()}`);
console.log(`  Total Videos Analyzed: ${highPerformingCreator.total_videos}\n`);

const result2 = CreatorBaseline.analyze(samePrediction, highPerformingCreator);

console.log(`Prediction: ${samePrediction} DPS`);
console.log(`\nPersonalized Analysis:`);
console.log(`  Relative Score: ${result2.relativeScore}/10`);
console.log(`  Improvement Factor: ${result2.improvementFactor}x`);
console.log(`  Percentile Rank: ${result2.percentileRank}`);
console.log(`\n  ${result2.contextualizedPrediction}\n`);

console.log(`Insights:`);
for (const insight of result2.insights) {
  console.log(`  • ${insight}`);
}

console.log('\n' + '='.repeat(80));
console.log('\n');

// Test 3: Show how predictions get adjusted
console.log('DPS Adjustment Examples:\n');

const rawPrediction = 60;
const adjusted1 = CreatorBaseline.adjustPrediction(rawPrediction, result1);
const adjusted2 = CreatorBaseline.adjustPrediction(rawPrediction, result2);

console.log(`Raw Prediction: ${rawPrediction} DPS\n`);
console.log(`@${lowPerformingCreator.tiktok_username}:`);
console.log(`  Relative Score: ${result1.relativeScore}/10`);
console.log(`  Adjusted Prediction: ${adjusted1} DPS`);
console.log(`  Change: ${(adjusted1 - rawPrediction > 0 ? '+' : '')}${(adjusted1 - rawPrediction).toFixed(1)} DPS\n`);

console.log(`@${highPerformingCreator.tiktok_username}:`);
console.log(`  Relative Score: ${result2.relativeScore}/10`);
console.log(`  Adjusted Prediction: ${adjusted2} DPS`);
console.log(`  Change: ${(adjusted2 - rawPrediction > 0 ? '+' : '')}${(adjusted2 - rawPrediction).toFixed(1)} DPS\n`);

console.log('='.repeat(80));
console.log('\n');

// Test 4: Different prediction scenarios
console.log('Scenario Comparison:\n');

const scenarios = [
  { name: 'Poor Performance', prediction: 30 },
  { name: 'Average Performance', prediction: 50 },
  { name: 'Good Performance', prediction: 70 },
  { name: 'Viral Performance', prediction: 90 }
];

console.log(`For @${lowPerformingCreator.tiktok_username} (Baseline: ${lowPerformingCreator.baseline_dps} DPS):\n`);
for (const scenario of scenarios) {
  const result = CreatorBaseline.analyze(scenario.prediction, lowPerformingCreator);
  console.log(`  ${scenario.name} (${scenario.prediction} DPS):`);
  console.log(`    → ${result.improvementFactor.toFixed(1)}x baseline, ${result.percentileRank}, Score: ${result.relativeScore}/10`);
}

console.log(`\nFor @${highPerformingCreator.tiktok_username} (Baseline: ${highPerformingCreator.baseline_dps} DPS):\n`);
for (const scenario of scenarios) {
  const result = CreatorBaseline.analyze(scenario.prediction, highPerformingCreator);
  console.log(`  ${scenario.name} (${scenario.prediction} DPS):`);
  console.log(`    → ${result.improvementFactor.toFixed(1)}x baseline, ${result.percentileRank}, Score: ${result.relativeScore}/10`);
}

console.log('\n' + '='.repeat(80));
console.log('\n=== KEY TAKEAWAYS ===\n');

console.log('✓ Same 60 DPS prediction means completely different things for different creators');
console.log('✓ For low-performer (25 DPS baseline): 60 DPS = 2.4x improvement = EXCELLENT');
console.log('✓ For high-performer (70 DPS baseline): 60 DPS = 0.86x = BELOW AVERAGE');
console.log('✓ Creator personalization provides contextualized, actionable insights');
console.log('✓ Helps creators understand performance relative to their own baseline\n');

console.log('=== TEST COMPLETE ===\n');
