// Main test script for API endpoints
import testTrendingEndpoint from './test-trending-endpoint';
import testCategoriesEndpoint from './test-categories-endpoint';
import testRecommendationsEndpoint from './test-recommendations-endpoint';

async function testAllEndpoints() {
  console.log('🚀 Starting API endpoint tests\n');
  
  try {
    console.log('═════════════════════════════════════════');
    console.log('📊 TESTING TRENDING ENDPOINT');
    console.log('═════════════════════════════════════════\n');
    await testTrendingEndpoint();
    
    console.log('\n═════════════════════════════════════════');
    console.log('📊 TESTING CATEGORIES ENDPOINT');
    console.log('═════════════════════════════════════════\n');
    await testCategoriesEndpoint();
    
    console.log('\n═════════════════════════════════════════');
    console.log('📊 TESTING RECOMMENDATIONS ENDPOINT');
    console.log('═════════════════════════════════════════\n');
    await testRecommendationsEndpoint();
    
    console.log('\n═════════════════════════════════════════');
    console.log('✅ ALL TESTS COMPLETED');
    console.log('═════════════════════════════════════════');
  } catch (error) {
    console.error('❌ Test execution error:', error);
  }
}

// Run tests when executed directly
if (require.main === module) {
  testAllEndpoints();
}

export default testAllEndpoints; 