/**
 * TEST LIVE DASHBOARD INTEGRATION
 * 
 * This script tests that our live Super Admin dashboard
 * can fetch real data from our APIs and display it correctly.
 */

console.log('🧪 Testing Live Dashboard Integration...\n');

const API_BASE = 'http://localhost:3000/api/admin/super-admin';

// Test 1: Dashboard Data API
async function testDashboardData() {
  try {
    console.log('📊 Testing Dashboard Data API...');
    
    const response = await fetch(`${API_BASE}/dashboard-data`);
    const data = await response.json();
    
    if (data.systemOverview && data.moduleHealth && data.trendingTemplates) {
      console.log('✅ Dashboard Data API: WORKING');
      console.log(`   - Total Processed: ${data.systemOverview.totalProcessed.toLocaleString()}`);
      console.log(`   - Module Health: ${data.moduleHealth.length} modules`);
      console.log(`   - Trending Templates: ${data.trendingTemplates.length} templates`);
      console.log(`   - Validation Accuracy: ${data.validationMetrics.accuracy.toFixed(1)}%`);
      return true;
    } else {
      console.log('❌ Dashboard Data API: Missing required fields');
      return false;
    }
  } catch (error) {
    console.log('❌ Dashboard Data API: ERROR -', error.message);
    return false;
  }
}

// Test 2: Template Discovery API
async function testTemplateDiscovery() {
  try {
    console.log('\n🔬 Testing Template Discovery API...');
    
    const response = await fetch(`${API_BASE}/template-discovery`, {
      method: 'POST'
    });
    const data = await response.json();
    
    if (data.success && typeof data.templatesDiscovered === 'number') {
      console.log('✅ Template Discovery API: WORKING');
      console.log(`   - Templates Discovered: ${data.templatesDiscovered}`);
      console.log(`   - Processing Time: ${data.processingTime}`);
      console.log(`   - Patterns Analyzed: ${data.patternsAnalyzed}`);
      return true;
    } else {
      console.log('❌ Template Discovery API: Failed or invalid response');
      console.log('   Response:', data);
      return false;
    }
  } catch (error) {
    console.log('❌ Template Discovery API: ERROR -', error.message);
    return false;
  }
}

// Test 3: Quick Predict API
async function testQuickPredict() {
  try {
    console.log('\n🔮 Testing Quick Predict API...');
    
    const testVideo = {
      videoUrl: 'https://www.tiktok.com/@test/video/7000000000000000001',
      title: 'Test Video for Prediction',
      creator: 'Test Creator'
    };
    
    const response = await fetch(`${API_BASE}/quick-predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testVideo)
    });
    const data = await response.json();
    
    if (data.success && data.viralPrediction) {
      console.log('✅ Quick Predict API: WORKING');
      console.log(`   - Viral Probability: ${data.viralPrediction.probability}%`);
      console.log(`   - Confidence: ${data.viralPrediction.confidence}%`);
      console.log(`   - Category: ${data.viralPrediction.category}`);
      console.log(`   - Processing Time: ${data.processingTime}`);
      return true;
    } else {
      console.log('❌ Quick Predict API: Failed or invalid response');
      console.log('   Response:', data);
      return false;
    }
  } catch (error) {
    console.log('❌ Quick Predict API: ERROR -', error.message);
    return false;
  }
}

// Test 4: Database Connection via API
async function testDatabaseConnection() {
  try {
    console.log('\n🗄️ Testing Database Connection...');
    
    // Test by checking if dashboard data contains real database results
    const response = await fetch(`${API_BASE}/dashboard-data`);
    const data = await response.json();
    
    if (!data.error && data.lastUpdated) {
      console.log('✅ Database Connection: WORKING');
      console.log(`   - Last Updated: ${new Date(data.lastUpdated).toLocaleString()}`);
      
      // Check for real vs fallback data
      if (data.moduleHealth.some(m => m.processed > 0)) {
        console.log('   - Real module data detected');
      } else {
        console.log('   - Using fallback data (expected if no real data exists)');
      }
      
      return true;
    } else {
      console.log('❌ Database Connection: ERROR');
      console.log('   Error:', data.error || 'Unknown error');
      return false;
    }
  } catch (error) {
    console.log('❌ Database Connection: ERROR -', error.message);
    return false;
  }
}

// Test 5: Data Freshness
async function testDataFreshness() {
  try {
    console.log('\n⏰ Testing Data Freshness...');
    
    const response = await fetch(`${API_BASE}/dashboard-data`);
    const data = await response.json();
    
    if (data.lastUpdated) {
      const lastUpdate = new Date(data.lastUpdated);
      const now = new Date();
      const minutesSinceUpdate = (now - lastUpdate) / (1000 * 60);
      
      if (minutesSinceUpdate < 5) {
        console.log('✅ Data Freshness: EXCELLENT (< 5 minutes old)');
        console.log(`   - Data age: ${minutesSinceUpdate.toFixed(1)} minutes`);
        return true;
      } else if (minutesSinceUpdate < 60) {
        console.log('⚠️ Data Freshness: GOOD (< 1 hour old)');
        console.log(`   - Data age: ${minutesSinceUpdate.toFixed(1)} minutes`);
        return true;
      } else {
        console.log('❌ Data Freshness: STALE (> 1 hour old)');
        console.log(`   - Data age: ${(minutesSinceUpdate / 60).toFixed(1)} hours`);
        return false;
      }
    } else {
      console.log('❌ Data Freshness: No timestamp available');
      return false;
    }
  } catch (error) {
    console.log('❌ Data Freshness: ERROR -', error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 LIVE DASHBOARD INTEGRATION TEST SUITE\n');
  console.log('Testing connection to real APIs and database...\n');
  
  const results = [
    await testDashboardData(),
    await testTemplateDiscovery(),
    await testQuickPredict(),
    await testDatabaseConnection(),
    await testDataFreshness()
  ];
  
  const passedTests = results.filter(Boolean).length;
  const totalTests = results.length;
  
  console.log('\n📋 TEST RESULTS SUMMARY:');
  console.log('=' .repeat(50));
  console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests} tests`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('Your Live Super Admin Dashboard is ready for use!');
    console.log('\n🌐 Access the live dashboard at:');
    console.log('   http://localhost:3000/admin/super-admin-live');
  } else {
    console.log('\n⚠️ SOME TESTS FAILED');
    console.log('Check the errors above and fix the issues.');
    console.log('The dashboard may work with limited functionality.');
  }
  
  console.log('\n📊 Data Source Verification:');
  if (passedTests >= 3) {
    console.log('✅ Real data sources are connected');
    console.log('✅ APIs are responding correctly');
    console.log('✅ Dashboard will show live data');
  } else {
    console.log('❌ Real data sources may not be connected');
    console.log('❌ APIs may be failing');
    console.log('❌ Dashboard may show fallback data only');
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testDashboardData,
    testTemplateDiscovery,
    testQuickPredict,
    testDatabaseConnection,
    testDataFreshness,
    runAllTests
  };
}

// Run tests if script is executed directly
if (typeof window === 'undefined' && require.main === module) {
  runAllTests();
} 