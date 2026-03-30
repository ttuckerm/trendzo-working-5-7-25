/**
 * Test Hook Strength Scorer Component
 *
 * Tests all 4 hook types with sample transcripts
 */

import { HookScorer } from '@/lib/components/hook-scorer';

const testCases = [
  {
    name: 'Question Hook - Pure',
    transcript: "How do you make money online without any experience? Want to learn the real method that works?",
    expectedType: 'question',
    expectedScoreRange: [6, 10]
  },
  {
    name: 'Statistic Hook - Mixed (Statistic + Question)',
    transcript: "What if I told you that 97% of people are doing this wrong? Want to know the secret?",
    expectedType: 'statistic', // Statistic dominates when both present
    expectedScoreRange: [5, 10]
  },
  {
    name: 'Statistic Hook - Pure Dollar Amount',
    transcript: "I made $50,000 in 30 days using this method. Here's exactly how I did it step by step...",
    expectedType: 'statistic',
    expectedScoreRange: [5, 10]
  },
  {
    name: 'Story Hook - Strong',
    transcript: "Let me tell you what happened last week. I was sitting in my car when I realized something insane...",
    expectedType: 'story',
    expectedScoreRange: [5, 10]
  },
  {
    name: 'Claim Hook - Strong',
    transcript: "Nobody tells you this secret about making money online. This will change your life forever. Here's the truth...",
    expectedType: 'claim',
    expectedScoreRange: [6, 10]
  },
  {
    name: 'Weak Hook - Vague Opening',
    transcript: "Hey everyone, welcome back to my channel. In this video we're going to be talking about something interesting...",
    expectedType: 'weak',
    expectedScoreRange: [0, 4]
  },
  {
    name: 'Multiple Hook Types - Statistic Dominant',
    transcript: "$10,000 in one week! Want to know how I did it? Let me tell you the best method that changed my life...",
    expectedType: 'statistic',
    expectedScoreRange: [5, 10]
  },
  {
    name: 'No Transcript',
    transcript: '',
    expectedType: null,
    expectedScoreRange: [0, 0]
  }
];

console.log('=== TESTING HOOK STRENGTH SCORER ===\n');

let passedTests = 0;
let failedTests = 0;

for (const testCase of testCases) {
  console.log(`Test: ${testCase.name}`);
  console.log(`Transcript: "${testCase.transcript.substring(0, 80)}..."`);

  const result = HookScorer.analyze(testCase.transcript);
  const dpsPrediction = result.success ? HookScorer.toDPS(result) : 0;

  console.log(`\nResult:`);
  console.log(`  Hook Type: ${result.hookType}`);
  console.log(`  Hook Score: ${result.hookScore}/10`);
  console.log(`  Confidence: ${(result.hookConfidence * 100).toFixed(0)}%`);
  console.log(`  DPS Prediction: ${dpsPrediction}`);
  console.log(`  Hook Text: "${result.hookText}"`);

  if (result.insights.length > 0) {
    console.log(`\nInsights:`);
    for (const insight of result.insights) {
      console.log(`  • ${insight}`);
    }
  }

  // Validate results
  let testPassed = true;
  const reasons: string[] = [];

  if (result.hookType !== testCase.expectedType) {
    testPassed = false;
    reasons.push(`Expected hook type "${testCase.expectedType}" but got "${result.hookType}"`);
  }

  if (result.hookScore < testCase.expectedScoreRange[0] || result.hookScore > testCase.expectedScoreRange[1]) {
    testPassed = false;
    reasons.push(`Expected score in range [${testCase.expectedScoreRange[0]}, ${testCase.expectedScoreRange[1]}] but got ${result.hookScore}`);
  }

  if (testPassed) {
    console.log('\n✅ TEST PASSED\n');
    passedTests++;
  } else {
    console.log('\n❌ TEST FAILED');
    for (const reason of reasons) {
      console.log(`   ${reason}`);
    }
    console.log('');
    failedTests++;
  }

  console.log('-'.repeat(80));
  console.log('');
}

console.log('\n=== TEST SUMMARY ===');
console.log(`Total Tests: ${testCases.length}`);
console.log(`Passed: ${passedTests} ✅`);
console.log(`Failed: ${failedTests} ❌`);
console.log(`Success Rate: ${((passedTests / testCases.length) * 100).toFixed(0)}%`);

if (failedTests === 0) {
  console.log('\n🎉 All tests passed! Hook Strength Scorer is working correctly.');
} else {
  console.log('\n⚠️  Some tests failed. Review the results above.');
}
