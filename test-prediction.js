/**
 * Quick Test Script for Tier-Based Prediction System
 * Run: node test-prediction.js
 */

const testScript = `If you save your money in a regular savings account, you're missing out on thousands of dollars. According to my research, Bank of America and Wells Fargo are the worst banks to open up a savings account at. The third worst is Chase Savings because they have low APY and high monthly fees. Citibank is bad too - though they have a good APY, they have monthly fees and require a minimum balance. Instead, put your money in a High Yield Savings Account. It's the same thing as a savings account except you get 10-15x more interest.`;

const testData = {
  script: testScript,
  niche: "personal-finance",
  platform: "tiktok",
  creatorFollowers: 50000
};

async function testTierPrediction() {
  console.log('🧪 TESTING TIER-BASED PREDICTION SYSTEM\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📝 Script:', testScript.substring(0, 100) + '...');
  console.log('🎯 Niche:', testData.niche);
  console.log('📱 Platform:', testData.platform);
  console.log('👥 Followers:', testData.creatorFollowers.toLocaleString());
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const startTime = Date.now();

  try {
    // Try localhost:3000 first, then 3002
    const ports = [3000, 3002];
    let response;
    let successPort;

    for (const port of ports) {
      try {
        console.log(`🔍 Trying http://localhost:${port}/api/predict/pre-content...`);
        response = await fetch(`http://localhost:${port}/api/predict/pre-content`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(testData),
        });
        
        if (response.ok) {
          successPort = port;
          break;
        }
      } catch (err) {
        console.log(`   ❌ Port ${port} not available`);
        continue;
      }
    }

    if (!response || !response.ok) {
      console.error('\n❌ ERROR: Could not connect to prediction API');
      console.error('Make sure the development server is running:');
      console.error('   npm run dev');
      process.exit(1);
    }

    console.log(`   ✅ Connected on port ${successPort}\n`);

    const responseTime = Date.now() - startTime;
    const data = await response.json();

    console.log('✨ TIER-BASED PREDICTION RESULTS:\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Display tier prediction prominently
    console.log('🎯 PREDICTED TIER:', data.predictedTier?.toUpperCase() || 'N/A');
    console.log('🎲 CONFIDENCE:', data.confidence ? `${(data.confidence * 100).toFixed(1)}%` : 'N/A');
    console.log('💭 REASONING:', data.reasoning || 'N/A');

    console.log('\n📊 TIER PROBABILITIES:');
    if (data.tierProbabilities) {
      Object.entries(data.tierProbabilities).forEach(([tier, prob]) => {
        const percentage = (prob * 100).toFixed(1);
        const barLength = Math.round(prob * 50);
        const bar = '█'.repeat(barLength);
        const tierLabel = tier.padEnd(15);
        const percentLabel = percentage.padStart(5);
        console.log(`   ${tierLabel}: ${percentLabel}% ${bar}`);
      });
    } else {
      console.log('   No tier probabilities available');
    }

    console.log('\n⏱️  RESPONSE TIME:', responseTime + 'ms');

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Display legacy fields (deprecated)
    console.log('📌 LEGACY FIELDS (deprecated):');
    console.log('   Viral Score:', data.predictedViralScore || 'N/A');
    console.log('   Predicted DPS:', data.predictedDPS || 'N/A');

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Display pattern matches
    console.log('🎯 TOP MATCHING PATTERNS:\n');
    if (data.topMatchingPatterns && data.topMatchingPatterns.length > 0) {
      data.topMatchingPatterns.slice(0, 3).forEach((pattern, i) => {
        console.log(`   ${i + 1}. [${pattern.type}] ${pattern.description}`);
        if (pattern.matchScore) {
          console.log(`      Match: ${(pattern.matchScore * 100).toFixed(1)}%`);
        }
      });
    } else {
      console.log('   No patterns matched');
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Display recommendations
    console.log('💡 RECOMMENDATIONS:\n');
    if (data.recommendations && data.recommendations.length > 0) {
      data.recommendations.slice(0, 5).forEach((rec, i) => {
        console.log(`   ${i + 1}. ${rec}`);
      });
    } else {
      console.log('   No recommendations');
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Display Idea Legos
    console.log('🧱 EXTRACTED IDEA LEGOS:\n');
    if (data.ideaLegos) {
      console.log('   Topic:', data.ideaLegos.topic);
      console.log('   Angle:', data.ideaLegos.angle);
      console.log('   Hook:', data.ideaLegos.hookStructure);
      console.log('   Story:', data.ideaLegos.storyStructure);
      console.log('   Visual:', data.ideaLegos.visualFormat);
      console.log('   Key Visuals:', data.ideaLegos.keyVisuals);
      console.log('   Audio:', data.ideaLegos.audio);
    } else {
      console.log('   No Idea Legos extracted');
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Display breakdown
    console.log('📊 PREDICTION BREAKDOWN:\n');
    if (data.breakdown) {
      console.log('   Pattern Match Score:', data.breakdown.patternMatchScore?.toFixed(1) || 'N/A');
      console.log('   LLM Consensus Score:', data.breakdown.llmConsensusScore?.toFixed(1) || 'N/A');
      if (data.breakdown.llmScores) {
        console.log('   LLM Scores:');
        if (data.breakdown.llmScores.gpt4) {
          console.log(`      GPT-4: ${data.breakdown.llmScores.gpt4.toFixed(1)}`);
        }
        if (data.breakdown.llmScores.claude) {
          console.log(`      Claude: ${data.breakdown.llmScores.claude.toFixed(1)}`);
        }
        if (data.breakdown.llmScores.gemini) {
          console.log(`      Gemini: ${data.breakdown.llmScores.gemini.toFixed(1)}`);
        }
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ TEST COMPLETE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Summary
    console.log('📋 SUMMARY:');
    console.log(`   Tier: ${data.predictedTier?.toUpperCase()}`);
    console.log(`   Confidence: ${data.confidence ? (data.confidence * 100).toFixed(1) : 'N/A'}%`);
    console.log(`   Response Time: ${responseTime}ms`);
    console.log('');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// Run the test
testTierPrediction();










