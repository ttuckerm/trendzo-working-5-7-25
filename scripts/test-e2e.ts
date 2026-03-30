/**
 * End-to-End System Verification Tests
 * 
 * Run with: npx tsx scripts/test-e2e.ts
 */

const GOOD_VIRAL = `Want to retire early? Here's the secret nobody talks about! Most people think it's about saving every penny, but it's really about making your money work FOR YOU! Invest in assets like stocks or real estate that generate passive income. Your money should be earning money while you sleep! The rich don't trade time for money - they build systems. Hit follow for more wealth-building tips and drop a comment with your biggest financial goal!`;

const BAD_BORING = `Today I want to talk about some financial concepts. First, there's saving money. Second, there's investing. Third, there's budgeting. These are important topics that everyone should know about. I hope you found this information helpful. Thank you for watching my video today.`;

const MEDIUM_DECENT = `Here's a quick tip that changed my finances forever. Instead of buying coffee every day at Starbucks, I started making it at home. That's $5 a day saved, which is $150 a month, $1800 a year. Now here's where it gets interesting - put that money in an index fund earning 10% average returns, and in 10 years you'll have over $25,000. Small changes lead to big results.`;

interface TestResult {
  name: string;
  score: number | null;
  confidence: number | null;
  stats: any;
  error?: string;
}

async function testTranscript(name: string, transcript: string): Promise<TestResult> {
  try {
    const response = await fetch('http://localhost:3000/api/test/components', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript, niche: 'personal-finance' })
    });
    
    if (!response.ok) {
      const text = await response.text();
      return { name, score: null, confidence: null, stats: null, error: `HTTP ${response.status}: ${text}` };
    }
    
    const result = await response.json();
    return {
      name,
      score: result.finalScore,
      confidence: result.confidence,
      stats: result.stats
    };
  } catch (error: any) {
    return { name, score: null, confidence: null, stats: null, error: error.message };
  }
}

async function testAlgorithmIQ(): Promise<{ componentsWithData: number; totalComponents: number; overallAccuracy: number | null }> {
  try {
    const response = await fetch('http://localhost:3000/api/algorithm-iq/performance');
    
    if (!response.ok) {
      return { componentsWithData: 0, totalComponents: 0, overallAccuracy: null };
    }
    
    const result = await response.json();
    
    const components = result.componentReliability || [];
    const componentsWithData = components.filter((c: any) => c.total_predictions > 0).length;
    
    return {
      componentsWithData,
      totalComponents: components.length,
      overallAccuracy: result.overallAccuracy || null
    };
  } catch {
    return { componentsWithData: 0, totalComponents: 0, overallAccuracy: null };
  }
}

async function runAllTests() {
  console.log('='.repeat(70));
  console.log('END-TO-END SYSTEM VERIFICATION TESTS');
  console.log('='.repeat(70));
  console.log('');
  
  const results: string[] = [];
  let passCount = 0;
  
  // TEST 3: Component Differentiation
  console.log('TEST 3: COMPONENT DIFFERENTIATION');
  console.log('-'.repeat(50));
  
  const goodResult = await testTranscript('Good Viral', GOOD_VIRAL);
  console.log(`  Good Viral: ${goodResult.score !== null ? goodResult.score : 'ERROR - ' + goodResult.error}`);
  
  const badResult = await testTranscript('Bad Boring', BAD_BORING);
  console.log(`  Bad Boring: ${badResult.score !== null ? badResult.score : 'ERROR - ' + badResult.error}`);
  
  const mediumResult = await testTranscript('Medium Decent', MEDIUM_DECENT);
  console.log(`  Medium Decent: ${mediumResult.score !== null ? mediumResult.score : 'ERROR - ' + mediumResult.error}`);
  
  let test3Pass = false;
  if (goodResult.score !== null && badResult.score !== null) {
    const difference = goodResult.score - badResult.score;
    console.log(`  Difference (Good - Bad): ${difference}`);
    console.log(`  Score Spread: ${goodResult.stats?.scoreSpread || 'N/A'}`);
    console.log(`  Real Analysis Components: ${goodResult.stats?.realAnalysisComponents || 'N/A'}/${goodResult.stats?.totalComponents || 'N/A'}`);
    
    test3Pass = difference >= 20;
    console.log(`  RESULT: ${test3Pass ? 'PASS ✅' : 'FAIL ❌'} (Expected difference >= 20)`);
    
    results.push(`TEST 3: Component Differentiation
- Good transcript score: ${goodResult.score}
- Bad transcript score: ${badResult.score}
- Medium transcript score: ${mediumResult.score}
- Difference: ${difference}
- PASS/FAIL: ${test3Pass ? 'PASS' : 'FAIL'}`);
    
    if (test3Pass) passCount++;
  } else {
    console.log('  RESULT: FAIL ❌ (Could not get scores)');
    results.push(`TEST 3: Component Differentiation - FAIL (API error)`);
  }
  
  console.log('');
  
  // TEST 4: Algorithm IQ
  console.log('TEST 4: ALGORITHM IQ');
  console.log('-'.repeat(50));
  
  const iqResult = await testAlgorithmIQ();
  console.log(`  Components with data: ${iqResult.componentsWithData}/${iqResult.totalComponents}`);
  console.log(`  Overall accuracy: ${iqResult.overallAccuracy !== null ? iqResult.overallAccuracy + '%' : 'N/A'}`);
  
  const test4Pass = iqResult.componentsWithData >= 5;
  console.log(`  RESULT: ${test4Pass ? 'PASS ✅' : 'FAIL ❌'} (Expected >= 5 components with data)`);
  
  results.push(`TEST 4: Algorithm IQ
- Components with data: ${iqResult.componentsWithData}/${iqResult.totalComponents}
- Overall accuracy: ${iqResult.overallAccuracy !== null ? iqResult.overallAccuracy + '%' : 'N/A'}
- PASS/FAIL: ${test4Pass ? 'PASS' : 'FAIL'}`);
  
  if (test4Pass) passCount++;
  
  console.log('');
  
  // Additional checks
  console.log('ADDITIONAL ANALYSIS');
  console.log('-'.repeat(50));
  
  if (goodResult.stats) {
    console.log('  Hardcoded components detected:', goodResult.stats.hardcodedComponents);
    console.log('  Suspicious (narrow spread):', goodResult.stats.isSuspicious ? 'YES ⚠️' : 'NO ✅');
    console.log('  Min score:', goodResult.stats.minScore);
    console.log('  Max score:', goodResult.stats.maxScore);
    console.log('  Average score:', goodResult.stats.avgScore);
  }
  
  console.log('');
  
  // Summary
  console.log('='.repeat(70));
  console.log('SUMMARY');
  console.log('='.repeat(70));
  console.log('');
  results.forEach(r => console.log(r + '\n'));
  
  console.log('');
  console.log(`OVERALL: ${passCount}/2 AUTOMATED TESTS PASSED`);
  console.log('');
  console.log('MANUAL TESTS REQUIRED:');
  console.log('- TEST 1: Upload bad video at /admin/upload-test → Expected DPS < 50');
  console.log('- TEST 2: Upload good video at /admin/upload-test → Expected DPS > 75');
  console.log('- TEST 5: Quick Win workflow at /admin/studio');
  console.log('');
  
  // Score expectations check
  console.log('SCORE EXPECTATIONS CHECK:');
  if (goodResult.score !== null) {
    const goodOk = goodResult.score >= 75;
    console.log(`  Good Viral (${goodResult.score}): ${goodOk ? '✅ Expected 75-95' : '❌ Should be 75-95'}`);
  }
  if (badResult.score !== null) {
    const badOk = badResult.score <= 45;
    console.log(`  Bad Boring (${badResult.score}): ${badOk ? '✅ Expected 25-45' : '❌ Should be 25-45'}`);
  }
  if (mediumResult.score !== null) {
    const medOk = mediumResult.score >= 50 && mediumResult.score <= 70;
    console.log(`  Medium (${mediumResult.score}): ${medOk ? '✅ Expected 50-70' : '❌ Should be 50-70'}`);
  }
}

runAllTests().catch(console.error);














