/**
 * Sound ETL Pipeline End-to-End Test
 * 
 * This script tests the entire sound ETL pipeline from data extraction to API verification
 */

const fs = require('fs');
const http = require('http');
const path = require('path');

// Configuration
const API_BASE_URL = 'http://localhost:3004/api';
const TEST_RESULTS_DIR = path.join(process.cwd(), 'test-results');
const TEST_RESULTS_FILE = path.join(TEST_RESULTS_DIR, 'sound-etl-test-results.json');

// Test status tracking
const testResults = {
  timestamp: new Date().toISOString(),
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
  }
};

// Create test results directory if it doesn't exist
if (!fs.existsSync(TEST_RESULTS_DIR)) {
  fs.mkdirSync(TEST_RESULTS_DIR, { recursive: true });
}

// Helper function to fetch data from an API endpoint
function fetchApi(endpoint) {
  return new Promise((resolve, reject) => {
    http.get(`${API_BASE_URL}${endpoint}`, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Invalid JSON response: ${e.message}`));
        }
      });
      
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Test helper function
function recordTestResult(name, passed, details = {}) {
  const result = {
    name,
    passed,
    timestamp: new Date().toISOString(),
    ...details
  };
  
  testResults.tests.push(result);
  testResults.summary.total++;
  
  if (passed) {
    testResults.summary.passed++;
    console.log(`✅ PASSED: ${name}`);
  } else {
    testResults.summary.failed++;
    console.log(`❌ FAILED: ${name}`);
    if (details.error) {
      console.error(`   Error: ${details.error}`);
    }
  }
  
  return passed;
}

// Main test function
async function runTests() {
  console.log('Starting Sound ETL Pipeline End-to-End Tests...');
  console.log('==============================================');
  
  try {
    // Test 1: Verify trending sounds API returns data
    try {
      console.log('\nTest 1: Verifying trending sounds API...');
      const trendingData = await fetchApi('/sounds/trending');
      
      recordTestResult('Trending Sounds API Response', 
        trendingData && trendingData.success === true,
        { 
          endpoint: '/sounds/trending',
          soundCount: trendingData?.count || 0
        }
      );
      
      // If we have sounds, use the first one for further tests
      if (trendingData?.sounds?.length > 0) {
        const firstSound = trendingData.sounds[0];
        
        // Test 2: Verify sound metadata fields
        console.log('\nTest 2: Verifying sound metadata fields...');
        const requiredFields = ['id', 'title', 'authorName', 'usageCount', 'stats'];
        const missingFields = requiredFields.filter(field => !firstSound.hasOwnProperty(field));
        
        recordTestResult('Sound Metadata Fields',
          missingFields.length === 0,
          {
            soundId: firstSound.id,
            checkedFields: requiredFields,
            missingFields
          }
        );
        
        // Test 3: Verify growth metrics
        console.log('\nTest 3: Verifying growth metrics calculation...');
        recordTestResult('Growth Metrics',
          firstSound.stats && 
          typeof firstSound.stats.growth !== 'undefined' &&
          typeof firstSound.stats.usageCount === 'number',
          {
            soundId: firstSound.id,
            usageCount: firstSound.stats?.usageCount,
            growthMetric: firstSound.stats?.growth
          }
        );
      }
    } catch (error) {
      recordTestResult('Trending Sounds API Access', false, { 
        error: error.message,
        endpoint: '/sounds/trending'
      });
    }
    
    // Test 4: Check data consistency across multiple requests
    try {
      console.log('\nTest 4: Checking data consistency across requests...');
      const firstResponse = await fetchApi('/sounds/trending');
      // Wait a second and make another request
      await new Promise(resolve => setTimeout(resolve, 1000));
      const secondResponse = await fetchApi('/sounds/trending');
      
      // Compare the sound IDs in both responses
      const firstIds = firstResponse.sounds.map(s => s.id).sort();
      const secondIds = secondResponse.sounds.map(s => s.id).sort();
      
      recordTestResult('Data Consistency',
        JSON.stringify(firstIds) === JSON.stringify(secondIds),
        {
          firstRequestSoundCount: firstResponse.sounds.length,
          secondRequestSoundCount: secondResponse.sounds.length,
          consistent: JSON.stringify(firstIds) === JSON.stringify(secondIds)
        }
      );
    } catch (error) {
      recordTestResult('Data Consistency', false, { 
        error: error.message 
      });
    }
    
    // Test 5: Check API response time (performance test)
    try {
      console.log('\nTest 5: Checking API response time...');
      const startTime = Date.now();
      await fetchApi('/sounds/trending');
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Response time should be under 500ms for good performance
      const isResponseTimeFast = responseTime < 500;
      
      recordTestResult('API Performance',
        isResponseTimeFast,
        {
          responseTime: `${responseTime}ms`,
          threshold: '500ms'
        }
      );
    } catch (error) {
      recordTestResult('API Performance', false, { 
        error: error.message 
      });
    }
    
    // Test 6: Verify each sound has categories
    try {
      console.log('\nTest 6: Verifying sound categories...');
      const trendingData = await fetchApi('/sounds/trending');
      
      if (trendingData?.sounds?.length > 0) {
        const soundsWithCategories = trendingData.sounds.filter(
          sound => Array.isArray(sound.categories) && sound.categories.length > 0
        );
        
        recordTestResult('Sound Categories',
          soundsWithCategories.length === trendingData.sounds.length,
          {
            totalSounds: trendingData.sounds.length,
            soundsWithCategories: soundsWithCategories.length
          }
        );
      } else {
        recordTestResult('Sound Categories', false, { 
          error: 'No sounds returned to test categories' 
        });
      }
    } catch (error) {
      recordTestResult('Sound Categories', false, { 
        error: error.message 
      });
    }
    
  } catch (error) {
    console.error('Error running tests:', error);
  } finally {
    // Print test summary
    console.log('\n==============================================');
    console.log('Test Summary:');
    console.log(`Total Tests: ${testResults.summary.total}`);
    console.log(`Passed: ${testResults.summary.passed}`);
    console.log(`Failed: ${testResults.summary.failed}`);
    console.log('==============================================');
    
    // Save test results to file
    fs.writeFileSync(TEST_RESULTS_FILE, JSON.stringify(testResults, null, 2));
    console.log(`\nTest results saved to: ${TEST_RESULTS_FILE}`);
  }
}

// Run the tests
runTests(); 