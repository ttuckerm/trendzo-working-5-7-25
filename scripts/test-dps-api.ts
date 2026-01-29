#!/usr/bin/env tsx
/**
 * Quick diagnostic test for DPS API
 * Tests if the API is accessible and returns expected responses
 */

import fetch from 'node-fetch';

const DPS_API_URL = process.env.DPS_API_URL || 'http://localhost:3002/api/dps/calculate';

async function testDPSAPI() {
  console.log('🔍 Testing DPS API...\n');
  console.log(`API URL: ${DPS_API_URL}\n`);

  // Test 1: Health check (GET)
  console.log('Test 1: Health Check (GET)');
  try {
    const response = await fetch(DPS_API_URL);
    const data = await response.json();
    console.log('✅ Status:', response.status);
    console.log('📄 Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.log('❌ Error:', error instanceof Error ? error.message : String(error));
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // Test 2: Single video calculation (POST)
  console.log('Test 2: Single Video Calculation (POST)');
  const testVideo = {
    video: {
      videoId: 'test_12345',
      platform: 'tiktok',
      viewCount: 100000,
      likeCount: 5000,
      commentCount: 500,
      shareCount: 200,
      followerCount: 50000,
      hoursSinceUpload: 24,
      publishedAt: new Date().toISOString(),
    },
  };

  console.log('📤 Request:', JSON.stringify(testVideo, null, 2));
  console.log('');

  try {
    const response = await fetch(DPS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testVideo),
    });

    console.log('✅ Status:', response.status, response.statusText);
    
    const responseText = await response.text();
    console.log('📄 Raw Response:', responseText);
    
    try {
      const data = JSON.parse(responseText);
      console.log('📄 Parsed Response:', JSON.stringify(data, null, 2));
    } catch {
      console.log('⚠️  Could not parse response as JSON');
    }
  } catch (error) {
    console.log('❌ Error:', error instanceof Error ? error.message : String(error));
  }

  console.log('\n' + '='.repeat(60) + '\n');
}

testDPSAPI().catch(console.error);


