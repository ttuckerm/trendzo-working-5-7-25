const testScript = `If you save your money in a regular savings account, you're missing out on thousands of dollars. According to my research, Bank of America and Wells Fargo are the worst banks to open up a savings account at. The third worst is Chase Savings because they have low APY and high monthly fees. Citibank is bad too - though they have a good APY, they have monthly fees and require a minimum balance. Instead, put your money in a High Yield Savings Account. It's the same thing as a savings account except you get 10-15x more interest.`;

const testData = {
  script: testScript,
  niche: "personal-finance",
  platform: "tiktok"
};

async function testPreContentPrediction() {
  console.log('🧪 TESTING FEAT-007: PRE-CONTENT PREDICTION\n');
  console.log('Script:', testScript.substring(0, 100) + '...\n');

  const startTime = Date.now();

  try {
    const response = await fetch('http://localhost:3002/api/predict/pre-content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    const responseTime = Date.now() - startTime;
    const data = await response.json();

    if (!response.ok) {
      console.error('❌ API Error:', data);
      process.exit(1);
    }

    console.log('✅ PREDICTION RESULTS:\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('🎯 PREDICTED TIER:', data.predictedTier.toUpperCase());
    console.log('🎲 CONFIDENCE:', (data.confidence * 100).toFixed(1) + '%');
    console.log('💭 REASONING:', data.reasoning);
    console.log('\n📊 TIER PROBABILITIES:');
    Object.entries(data.tierProbabilities).forEach(([tier, prob]) => {
      const percentage = (prob * 100).toFixed(1);
      const bar = '█'.repeat(Math.round(prob * 50));
      console.log(`   ${tier.padEnd(15)}: ${percentage.padStart(5)}% ${bar}`);
    });
    console.log('\n⏱️  RESPONSE TIME:', responseTime + 'ms');
    console.log('\n📌 LEGACY FIELDS (deprecated):');
    console.log('   Viral Score:', data.predictedViralScore || 'N/A');
    console.log('   Predicted DPS:', data.predictedDPS || 'N/A');

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('🎯 3. TOP MATCHING PATTERNS:\n');
    if (data.topMatchingPatterns && data.topMatchingPatterns.length > 0) {
      data.topMatchingPatterns.forEach((pattern, i) => {
        console.log(`   ${i + 1}. [${pattern.type}] ${pattern.description}`);
        const matchScore = pattern.matchScore ? (pattern.matchScore * 100).toFixed(1) : 'N/A';
        const avgDPS = pattern.avgDPSScore ? pattern.avgDPSScore.toFixed(1) : 'N/A';
        const freq = pattern.frequency || 'N/A';
        console.log(`      Match Score: ${matchScore}% | Avg DPS: ${avgDPS} | Frequency: ${freq}`);
        console.log('');
      });
    } else {
      console.log('   No patterns matched.\n');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('💡 4. RECOMMENDATIONS:\n');
    if (data.recommendations && data.recommendations.length > 0) {
      data.recommendations.forEach((rec, i) => {
        console.log(`   ${i + 1}. ${rec}`);
      });
    } else {
      console.log('   No recommendations.\n');
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('📋 EXTRACTED IDEA LEGOS:\n');
    if (data.ideaLegos) {
      console.log('   Topic:', data.ideaLegos.topic);
      console.log('   Angle:', data.ideaLegos.angle);
      console.log('   Hook Structure:', data.ideaLegos.hookStructure);
      console.log('   Story Structure:', data.ideaLegos.storyStructure);
      console.log('   Visual Format:', data.ideaLegos.visualFormat);
      console.log('   Key Visuals:', data.ideaLegos.keyVisuals);
      console.log('   Audio:', data.ideaLegos.audio);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('🎯 PREDICTION BREAKDOWN:\n');
    console.log('   Pattern Match Score:', data.breakdown?.patternMatchScore?.toFixed(1) || 'N/A');
    console.log('   LLM Consensus Score:', data.breakdown?.llmConsensusScore?.toFixed(1) || 'N/A');
    console.log('   Tier Confidence:', (data.confidence * 100).toFixed(1) + '%');
    console.log('   Predicted Tier:', data.predictedTier);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ TEST COMPLETE');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testPreContentPrediction();
