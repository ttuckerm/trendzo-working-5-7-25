const fetch = require('node-fetch');
const { promisify } = require('util');
const sleep = promisify(setTimeout);

// Define endpoints to test - focus on simpler pages first
const endpoints = [
  '/',
  '/editor',
  '/editor-simple', 
  '/editor-basic',
  '/dashboard-view',
  '/dashboard-view/remix',
  '/dashboard-view/template-library/view',
  '/dashboard-view/analytics/newsletter',
  '/dashboard-view/analytics/performance',
  '/dashboard-view/analytics/remix-stats'
];

// Test function
async function testEndpoints(baseUrl) {
  console.log(`\n🧪 Testing endpoints on ${baseUrl}...\n`);
  console.log('Make sure the Next.js server is running on port 3005!');
  console.log('Remember that some pages may still encounter auth issues in the browser due to API calls.\n');
  
  let passCount = 0;
  let failCount = 0;
  
  for (const endpoint of endpoints) {
    try {
      const url = `${baseUrl}${endpoint}`;
      const startTime = Date.now();
      const response = await fetch(url);
      const duration = Date.now() - startTime;
      
      if (response.ok) {
        console.log(`✅ ${endpoint} - ${response.status} (${duration}ms)`);
        passCount++;
      } else {
        console.log(`❌ ${endpoint} - ${response.status} - ${response.statusText} (${duration}ms)`);
        failCount++;
      }
    } catch (error) {
      console.log(`❌ ${endpoint} - Error: ${error.message}`);
      failCount++;
    }
    
    // Small delay between requests
    await sleep(300);
  }
  
  console.log('\n✨ Testing complete!');
  console.log(`Passed: ${passCount}/${endpoints.length}`);
  console.log(`Failed: ${failCount}/${endpoints.length}`);
  
  if (failCount > 0) {
    console.log('\n⚠️ Some endpoints failed. Possible issues:');
    console.log('1. Authentication API calls failing - this is expected in development');
    console.log('2. The ErrorBoundary should catch these errors when opening in a browser');
    console.log('3. Focus on using the editor pages that work without authentication');
  } else {
    console.log('\n🎉 All test endpoints passed basic connectivity tests!');
    console.log('Open these pages in your browser to check the actual rendering.');
  }
}

// Run tests on localhost:3005
testEndpoints('http://localhost:3005'); 