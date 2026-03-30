const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const API_URL = 'http://localhost:3000/api/predict/viral'

const TEST_SCRIPTS = [
  {
    name: 'Test 1: Personal Finance - Should Predict Viral',
    script: `You're losing thousands because of these 3 bank fees. First, overdraft fees - $35 every time you go negative. Switch to a bank with overdraft protection. Second, ATM fees - $3-5 per withdrawal adds up to $500 yearly. Use your bank's network. Third, monthly maintenance fees - $12/month is $144/year for nothing. Find a no-fee bank. I switched last year and saved $847. Comment which fee hit you hardest.`,
    platform: 'tiktok',
    niche: 'personal-finance',
    estimatedDuration: 60,
    creatorFollowers: 10000,
    expectedClass: 'viral',
    expectedDPS: '>= 70'
  },
  {
    name: 'Test 2: Generic Advice - Should Predict Normal',
    script: `Here are some tips about saving money. You should try to save more. Budgeting is important. Make sure you track your expenses. Saving money helps your future. Try to cut unnecessary costs.`,
    platform: 'tiktok',
    niche: 'personal-finance',
    estimatedDuration: 30,
    creatorFollowers: 10000,
    expectedClass: 'normal',
    expectedDPS: '< 70'
  },
  {
    name: 'Test 3: Fitness Transformation - Should Predict Viral',
    script: `Day 1 vs Day 90 of my weight loss journey. I started at 240 pounds, couldn't run for 30 seconds. Trainer told me: forget the scale, focus on consistency. Three things I did: walked 10k steps daily, meal prepped Sundays, lifted weights 3x per week. Today I ran my first 5K. The scale says 195, but I feel like a completely different person. Your turn - what's stopping you from starting?`,
    platform: 'tiktok',
    niche: 'fitness',
    estimatedDuration: 60,
    creatorFollowers: 15000,
    expectedClass: 'viral',
    expectedDPS: '>= 70'
  },
  {
    name: 'Test 4: Contrarian Angle - Should Predict Viral',
    script: `Everyone says "buy a house" but here's why I'm renting instead. Property taxes: $8k/year I'll never see again. Maintenance: $15k to replace the roof. Opportunity cost: my down payment in index funds made $47k last year. Freedom: I can move for better jobs without selling. Flexibility beats forced savings. Real estate isn't always the answer.`,
    platform: 'tiktok',
    niche: 'personal-finance',
    estimatedDuration: 45,
    creatorFollowers: 20000,
    expectedClass: 'viral',
    expectedDPS: '>= 70'
  },
  {
    name: 'Test 5: Mega-Viral Network Story - Should Predict Mega-Viral',
    script: `I asked 100 millionaires their biggest money mistake. 83 said the same thing. Not starting earlier - but not with investing. With networking. One intro led to my first $10k client. Another became my business partner. A third invested $200k in my startup. Your network is your net worth isn't cliché - it's math. Every millionaire I know can trace their success to one introduction. Who's one person you need to meet this month?`,
    platform: 'tiktok',
    niche: 'personal-finance',
    estimatedDuration: 60,
    creatorFollowers: 50000,
    expectedClass: 'mega-viral',
    expectedDPS: '>= 80'
  }
]

async function runPrediction(testCase) {
  const { name, expectedClass, expectedDPS, ...payload } = testCase

  console.log(`\n${'='.repeat(80)}`)
  console.log(`🧪 ${name}`)
  console.log(`   Expected: ${expectedClass} (DPS ${expectedDPS})`)
  console.log(`${'='.repeat(80)}`)

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('❌ API Error:', data.error)
      return {
        testName: name,
        success: false,
        error: data.error,
        expectedClass,
        expectedDPS
      }
    }

    const { prediction } = data

    // Evaluate if prediction makes sense
    const dpsMatch = evalDPSMatch(prediction.predicted_dps_score, expectedDPS)
    const classMatch = prediction.predicted_classification === expectedClass

    console.log(`\n📊 RESULTS:`)
    console.log(`   Predicted DPS: ${prediction.predicted_dps_score} ${dpsMatch ? '✅' : '⚠️'}`)
    console.log(`   Classification: ${prediction.predicted_classification} ${classMatch ? '✅' : '⚠️'}`)
    console.log(`   Confidence: ${(prediction.confidence * 100).toFixed(1)}%`)
    console.log(`   Viral Probability: ${(prediction.viral_probability * 100).toFixed(1)}%`)

    console.log(`\n🧬 BREAKDOWN:`)
    console.log(`   Pattern-Based Score: ${prediction.pattern_based_score}`)
    console.log(`   Novelty Bonus: +${prediction.novelty_bonus}`)
    console.log(`   Confidence Factor: ${prediction.confidence_factor}`)
    console.log(`   Patterns Analyzed: ${prediction.patterns_analyzed}`)

    console.log(`\n🎯 TOP PATTERNS:`)
    prediction.top_matching_patterns.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.pattern_type}: "${p.pattern_value.substring(0, 60)}..." (score: ${p.match_score.toFixed(2)})`)
    })

    console.log(`\n🔍 VIRAL ELEMENTS:`)
    console.log(`   Hooks: ${prediction.viral_elements_detected.hooks.length}`)
    prediction.viral_elements_detected.hooks.forEach(h => console.log(`      • ${h}`))
    console.log(`   Triggers: ${prediction.viral_elements_detected.triggers.length}`)
    prediction.viral_elements_detected.triggers.forEach(t => console.log(`      • ${t}`))

    console.log(`\n💡 RECOMMENDATIONS:`)
    prediction.recommendations.forEach(r => console.log(`   ${r}`))

    const makesSense = dpsMatch && (classMatch || Math.abs(getDPSFromClass(expectedClass) - prediction.predicted_dps_score) <= 15)

    return {
      testName: name,
      success: true,
      predicted_dps: prediction.predicted_dps_score,
      predicted_class: prediction.predicted_classification,
      expected_class: expectedClass,
      expected_dps: expectedDPS,
      confidence: prediction.confidence,
      patterns_analyzed: prediction.patterns_analyzed,
      top_patterns: prediction.top_matching_patterns,
      recommendations: prediction.recommendations,
      makesSense,
      dpsMatch,
      classMatch
    }

  } catch (error) {
    console.error('❌ Request failed:', error.message)
    return {
      testName: name,
      success: false,
      error: error.message,
      expectedClass,
      expectedDPS
    }
  }
}

function evalDPSMatch(actualDPS, expectedRange) {
  if (expectedRange.includes('>=')) {
    const threshold = parseInt(expectedRange.split('>=')[1].trim())
    return actualDPS >= threshold
  } else if (expectedRange.includes('<')) {
    const threshold = parseInt(expectedRange.split('<')[1].trim())
    return actualDPS < threshold
  }
  return false
}

function getDPSFromClass(classification) {
  const map = {
    'mega-viral': 85,
    'viral': 75,
    'good': 60,
    'normal': 40
  }
  return map[classification] || 50
}

async function main() {
  console.log('🚀 FEAT-070: Viral Prediction Endpoint Testing')
  console.log('=' .repeat(80))

  const results = []

  for (const testCase of TEST_SCRIPTS) {
    const result = await runPrediction(testCase)
    results.push(result)
    await new Promise(resolve => setTimeout(resolve, 2000)) // Delay between tests
  }

  // Generate summary report
  console.log('\n\n')
  console.log('═'.repeat(80))
  console.log('📋 VALIDATION REPORT')
  console.log('═'.repeat(80))

  console.log('\n1. PREDICTION RESULTS TABLE:\n')
  console.log('| Test | Predicted DPS | Classification | Confidence | Makes Sense? |')
  console.log('|------|---------------|----------------|------------|--------------|')

  results.forEach((r, i) => {
    if (r.success) {
      console.log(`| ${i + 1}    | ${r.predicted_dps.toString().padEnd(13)} | ${r.predicted_class.padEnd(14)} | ${(r.confidence * 100).toFixed(1)}%${' '.repeat(6)} | ${r.makesSense ? 'Yes ✅' : 'No ❌'} ${' '.repeat(6)} |`)
    } else {
      console.log(`| ${i + 1}    | ERROR${' '.repeat(8)} | ERROR${' '.repeat(9)} | N/A${' '.repeat(7)} | No ❌${' '.repeat(7)} |`)
    }
  })

  const successfulTests = results.filter(r => r.success && r.makesSense)
  const totalTests = results.length

  console.log('\n2. PATTERN MATCH QUALITY:')
  console.log(`   - ${successfulTests.length}/${totalTests} predictions seem reasonable`)

  const patternsAnalyzed = results.filter(r => r.success).map(r => r.patterns_analyzed)
  if (patternsAnalyzed.length > 0) {
    console.log(`   - Avg patterns analyzed: ${(patternsAnalyzed.reduce((a, b) => a + b, 0) / patternsAnalyzed.length).toFixed(0)}`)
  }

  console.log('\n3. NEXT STEPS DECISION:')
  if (successfulTests.length >= 4) {
    console.log('   ✅ System works! 4/5+ predictions are reasonable.')
    console.log('   → Ready to validate with real posts')
  } else if (successfulTests.length >= 2) {
    console.log('   ⚠️ Mixed results. 2-3/5 predictions make sense.')
    console.log('   → Algorithm may need tuning OR need more training data')
  } else {
    console.log('   ❌ System needs work. Less than 2/5 predictions make sense.')
    console.log('   → Algorithm needs improvement, not just data')
  }

  console.log('\n' + '═'.repeat(80))
}

main().catch(console.error)
