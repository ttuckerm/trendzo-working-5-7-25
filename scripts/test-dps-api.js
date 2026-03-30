#!/usr/bin/env node

/**
 * DPS API Test Script
 * 
 * Tests the DPS Calculation Engine API endpoints
 * Run: node scripts/test-dps-api.js
 */

const API_BASE = process.env.API_BASE_URL || 'http://localhost:3002';

async function testDPSAPI() {
  console.log('🧪 Testing DPS Calculation Engine API\n');
  console.log(`📍 API Base: ${API_BASE}\n`);

  // Test 1: Health Check
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Test 1: Health Check (GET /api/dps/calculate)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  try {
    const response = await fetch(`${API_BASE}/api/dps/calculate`);
    const data = await response.json();
    console.log('✅ Health check passed');
    console.log(`Service: ${data.service}`);
    console.log(`Version: ${data.version}`);
    console.log(`Status: ${data.status}\n`);
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return;
  }

  // Test 2: Single Video Calculation
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Test 2: Single Video Calculation');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  try {
    const videoData = {
      video: {
        videoId: `test-${Date.now()}`,
        platform: 'tiktok',
        viewCount: 450000,
        likeCount: 32000,
        commentCount: 1200,
        shareCount: 4500,
        followerCount: 50000,
        hoursSinceUpload: 12,
        publishedAt: new Date().toISOString(),
      }
    };

    console.log('📤 Request:', JSON.stringify(videoData, null, 2));

    const response = await fetch(`${API_BASE}/api/dps/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(videoData),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Request failed:', data);
      return;
    }

    console.log('✅ Calculation successful');
    console.log(`📊 Viral Score: ${data.result.viralScore}`);
    console.log(`📈 Percentile Rank: ${data.result.percentileRank}`);
    console.log(`🏆 Classification: ${data.result.classification}`);
    console.log(`📉 Z-Score: ${data.result.zScore}`);
    console.log(`⏱️  Processing Time: ${data.result.processingTimeMs}ms`);
    console.log(`🎯 Confidence: ${(data.result.confidence * 100).toFixed(1)}%`);
    console.log(`🔍 Audit ID: ${data.result.auditId}\n`);
  } catch (error) {
    console.error('❌ Single video test failed:', error.message);
  }

  // Test 3: Batch Processing
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Test 3: Batch Processing (3 videos)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  try {
    const batchData = {
      videos: [
        {
          videoId: `batch-1-${Date.now()}`,
          platform: 'tiktok',
          viewCount: 100000,
          likeCount: 5000,
          commentCount: 200,
          shareCount: 300,
          followerCount: 20000,
          hoursSinceUpload: 6,
          publishedAt: new Date().toISOString(),
        },
        {
          videoId: `batch-2-${Date.now()}`,
          platform: 'instagram',
          viewCount: 50000,
          likeCount: 3000,
          commentCount: 150,
          shareCount: 200,
          followerCount: 15000,
          hoursSinceUpload: 3,
          publishedAt: new Date().toISOString(),
        },
        {
          videoId: `batch-3-${Date.now()}`,
          platform: 'youtube',
          viewCount: 200000,
          likeCount: 8000,
          commentCount: 400,
          shareCount: 600,
          followerCount: 100000,
          hoursSinceUpload: 24,
          publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        }
      ],
      batchId: `test-batch-${Date.now()}`,
    };

    const response = await fetch(`${API_BASE}/api/dps/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(batchData),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Batch request failed:', data);
      return;
    }

    console.log('✅ Batch calculation successful');
    console.log(`📦 Batch ID: ${data.batchId}`);
    console.log(`📊 Total Videos: ${data.totalVideos}`);
    console.log(`✅ Success: ${data.successCount}`);
    console.log(`❌ Failures: ${data.failureCount}`);
    console.log(`⏱️  Total Processing Time: ${data.processingTimeMs}ms`);
    console.log(`⚡ Avg Per Video: ${Math.round(data.processingTimeMs / data.totalVideos)}ms\n`);

    data.results.forEach((result, index) => {
      console.log(`  Video ${index + 1} (${result.videoId}):`);
      console.log(`    • Viral Score: ${result.viralScore}`);
      console.log(`    • Classification: ${result.classification}`);
      console.log(`    • Percentile: ${result.percentileRank}`);
    });
    console.log();
  } catch (error) {
    console.error('❌ Batch test failed:', error.message);
  }

  // Test 4: Cohort Statistics
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Test 4: Cohort Statistics');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  try {
    const response = await fetch(`${API_BASE}/api/dps/cohort-stats/tiktok/50000`);
    const data = await response.json();

    if (!response.ok) {
      console.log('⚠️  Cohort stats not found (expected in early development)');
      console.log('   Run database migration to create sample cohort data\n');
      return;
    }

    console.log('✅ Cohort stats retrieved');
    console.log(`Platform: ${data.platform}`);
    console.log(`Follower Count: ${data.followerCount}`);
    console.log(`Cohort Median: ${data.cohortStats.cohortMedian}`);
    console.log(`Cohort Mean: ${data.cohortStats.cohortMean}`);
    console.log(`Standard Deviation: ${data.cohortStats.cohortStdDev}`);
    console.log(`Sample Size: ${data.cohortStats.sampleSize}\n`);
  } catch (error) {
    console.error('❌ Cohort stats test failed:', error.message);
  }

  // Test 5: Invalid Input Handling
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Test 5: Invalid Input Handling');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  try {
    const invalidData = {
      video: {
        videoId: 'invalid-test',
        platform: 'invalid-platform', // Invalid
        viewCount: -100, // Invalid (negative)
        followerCount: 10000,
        hoursSinceUpload: 5,
        publishedAt: 'not-a-date', // Invalid format
      }
    };

    const response = await fetch(`${API_BASE}/api/dps/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidData),
    });

    const data = await response.json();

    if (response.status === 422) {
      console.log('✅ Validation correctly rejected invalid input');
      console.log(`Error: ${data.error}`);
      console.log('Validation errors:', data.details?.length || 0, 'issues\n');
    } else {
      console.log('⚠️  Expected validation error but got:', response.status);
    }
  } catch (error) {
    console.error('❌ Validation test failed:', error.message);
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 DPS API Testing Complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// Run tests
testDPSAPI().catch(console.error);


