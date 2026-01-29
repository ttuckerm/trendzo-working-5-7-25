#!/usr/bin/env node

/**
 * FEAT-007 Test Script
 * Tests the pre-content prediction API
 */

const https = require('https');

const BASE_URL = 'http://localhost:3002'; // Your dev server port

// Test data
const testScript = {
  script: `Day 1 of cutting my expenses by 50%. I cancelled Netflix, Spotify, and my gym membership. Here's what I learned: you don't need subscriptions to be happy. I started working out at home, reading library books, and cooking instead of ordering DoorDash. Week 1 savings: $487. Follow for Day 2!`,
  storyboard: 'Opens with before photo showing all subscription apps. Shows cancellation screens. Cut to home workout, library visit, home-cooked meal. Ends with savings tracker.',
  niche: 'personal-finance',
  platform: 'tiktok',
  creatorFollowers: 10000
};

async function test() {
  console.log('\n🧪 Testing FEAT-007: Pre-Content Prediction\n');

  // Test 1: Health Check
  console.log('Test 1: Health Check');
  try {
    const healthResponse = await fetch(`${BASE_URL}/api/predict/pre-content?action=health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health:', healthData);
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    console.log('💡 Make sure dev server is running: npm run dev');
    process.exit(1);
  }

  // Test 2: Actual Prediction
  console.log('\nTest 2: Prediction Request');
  try {
    const startTime = Date.now();
    const response = await fetch(`${BASE_URL}/api/predict/pre-content`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testScript)
    });

    const duration = Date.now() - startTime;

    if (!response.ok) {
      const error = await response.json();
      throw new Error(JSON.stringify(error, null, 2));
    }

    const prediction = await response.json();

    console.log(`✅ Prediction completed in ${duration}ms\n`);
    console.log('📊 Results:');
    console.log('  - Predicted Viral Score:', prediction.predictedViralScore);
    console.log('  - Predicted DPS:', prediction.predictedDPS);
    console.log('  - Confidence:', (prediction.confidence * 100).toFixed(1) + '%');
    console.log('  - Estimated Views:', prediction.predictions.estimatedViews);
    console.log('  - Estimated Likes:', prediction.predictions.estimatedLikes);
    console.log('  - DPS Percentile:', prediction.predictions.estimatedDPSPercentile);

    console.log('\n💡 LLM Scores:');
    if (prediction.breakdown.llmScores.gpt4) {
      console.log('  - GPT-4:', prediction.breakdown.llmScores.gpt4);
    }
    if (prediction.breakdown.llmScores.claude) {
      console.log('  - Claude:', prediction.breakdown.llmScores.claude);
    }
    if (prediction.breakdown.llmScores.gemini) {
      console.log('  - Gemini:', prediction.breakdown.llmScores.gemini);
    }

    console.log('\n🎯 Top Recommendations:');
    prediction.recommendations.forEach((rec, i) => {
      console.log(`  ${i + 1}. ${rec}`);
    });

    console.log('\n🧬 Idea Legos Extracted:');
    console.log('  - Topic:', prediction.ideaLegos.topic);
    console.log('  - Angle:', prediction.ideaLegos.angle);
    console.log('  - Hook:', prediction.ideaLegos.hookStructure);

    console.log('\n✨ All tests passed!\n');

  } catch (error) {
    console.error('❌ Prediction failed:', error.message);
    process.exit(1);
  }
}

test();
