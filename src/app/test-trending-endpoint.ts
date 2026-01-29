// Test script for /api/sounds/trending endpoint
import fetch from 'node-fetch';

async function testTrendingEndpoint() {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
  
  // Test cases
  const testCases = [
    // Basic test - default parameters
    { 
      name: 'Default parameters',
      url: `${baseUrl}/api/sounds/trending`
    },
    // Test with timeframe parameter
    { 
      name: 'With 14d timeframe',
      url: `${baseUrl}/api/sounds/trending?timeframe=14d`
    },
    // Test with category filter
    { 
      name: 'Filter by music category',
      url: `${baseUrl}/api/sounds/trending?category=music`
    },
    // Test with limit
    { 
      name: 'Custom limit of 5',
      url: `${baseUrl}/api/sounds/trending?limit=5`
    },
    // Test with virality score filter
    { 
      name: 'Min virality score of 50',
      url: `${baseUrl}/api/sounds/trending?minViralityScore=50`
    },
    // Test with lifecycle filter
    { 
      name: 'Filter by emerging lifecycle',
      url: `${baseUrl}/api/sounds/trending?lifecycle=emerging`
    },
    // Test with multiple parameters
    { 
      name: 'Combined parameters',
      url: `${baseUrl}/api/sounds/trending?timeframe=30d&category=music&limit=10&minViralityScore=30&lifecycle=growing`
    },
    // Test with invalid timeframe (should return 400)
    { 
      name: 'Invalid timeframe',
      url: `${baseUrl}/api/sounds/trending?timeframe=60d`,
      expectedError: true
    },
  ];

  console.log('🧪 Testing /api/sounds/trending endpoint...');
  
  for (const test of testCases) {
    try {
      console.log(`\n📝 Test: ${test.name}`);
      console.log(`📡 URL: ${test.url}`);
      
      const response = await fetch(test.url);
      const data = await response.json();
      
      console.log(`🔍 Status: ${response.status}`);
      
      if (!response.ok) {
        if (test.expectedError) {
          console.log('✅ Expected error received:', data.error);
        } else {
          console.log('❌ Unexpected error:', data.error);
        }
        continue;
      }
      
      if (test.expectedError) {
        console.log('❌ Expected an error but received success response');
        continue;
      }
      
      // Validate structure
      console.log('✅ Response structure:');
      console.log(`  - success: ${data.success}`);
      console.log(`  - timeframe: ${data.timeframe}`);
      console.log(`  - count: ${data.count}`);
      console.log(`  - sounds: ${data.sounds ? `Array with ${data.sounds.length} items` : 'Missing'}`);
      
      // Validate first sound object if available
      if (data.sounds && data.sounds.length > 0) {
        const firstSound = data.sounds[0];
        console.log('📊 Sample sound data:');
        console.log(`  - id: ${firstSound.id}`);
        console.log(`  - title: ${firstSound.title}`);
        console.log(`  - soundCategory: ${firstSound.soundCategory}`);
        console.log(`  - usageCount: ${firstSound.usageCount}`);
        console.log(`  - viralityScore: ${firstSound.viralityScore}`);
        console.log(`  - stats.relativeGrowth: ${firstSound.stats?.relativeGrowth}`);
      } else {
        console.log('ℹ️ No sounds returned in this response');
      }
      
    } catch (error) {
      console.error('❌ Test error:', error);
    }
  }
  
  console.log('\n🏁 Trending endpoint tests completed');
}

// Run tests when executed directly
if (require.main === module) {
  testTrendingEndpoint();
}

export default testTrendingEndpoint; 