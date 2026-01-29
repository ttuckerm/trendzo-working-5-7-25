#!/usr/bin/env node

/**
 * ETL Test Runner Script
 * 
 * This script runs the ETL integration tests to verify:
 * 1. Apify scraper can successfully collect TikTok data
 * 2. Extended Firestore fields are properly populated
 * 3. ETL process error handling and logging
 * 4. Scheduled job triggers alerts on failure
 * 
 * Usage:
 *   node test-etl.js [--cleanup] [--test-alerts]
 */

// Load environment variables from .env file
require('dotenv').config();

const path = require('path');
const axios = require('axios');
const { execSync } = require('child_process');

// Default config
const config = {
  apiBase: process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000',
  apiKey: process.env.ADMIN_API_KEY || process.env.NEXT_PUBLIC_ADMIN_API_KEY,
  cleanup: process.argv.includes('--cleanup'),
  testAlerts: process.argv.includes('--test-alerts')
};

// Get path to Next.js app directory
const appDir = path.resolve(__dirname, '..');

/**
 * Run tests by starting a local server and making API requests
 */
async function runTestsWithLocalServer() {
  let serverProcess = null;

  try {
    console.log('Starting local Next.js server...');
    serverProcess = require('child_process').spawn(
      'npx',
      ['next', 'dev', '-p', '3000'],
      { 
        cwd: appDir, 
        stdio: 'pipe',
        shell: true
      }
    );

    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log('Local server started at http://localhost:3000');

    // Run the tests
    await runTests();
  } catch (error) {
    console.error('Error running tests with local server:', error);
    process.exit(1);
  } finally {
    // Cleanup server process
    if (serverProcess) {
      console.log('Shutting down local server...');
      serverProcess.kill();
    }
  }
}

/**
 * Run tests via API
 */
async function runTests() {
  if (!config.apiKey) {
    console.error('Error: ADMIN_API_KEY not set. Please set it in your .env file');
    process.exit(1);
  }

  try {
    console.log(`Running ETL integration tests with options: 
- Cleanup after: ${config.cleanup}
- Test alerts: ${config.testAlerts}
`);

    // Make the API request
    const response = await axios.post(
      `${config.apiBase}/api/etl/test`,
      {
        cleanupAfter: config.cleanup,
        testAlerts: config.testAlerts
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey
        }
      }
    );

    // Print the results
    const results = response.data;
    
    console.log('\n=== TEST RESULTS ===');
    
    // Print summary of each test
    for (const [testName, testResult] of Object.entries(results.tests || {})) {
      const status = testResult.status;
      let statusIcon = '❓';
      
      if (status === 'passed') statusIcon = '✅';
      else if (status === 'failed') statusIcon = '❌';
      else if (status === 'warning') statusIcon = '⚠️';
      else if (status === 'skipped') statusIcon = '⏭️';
      
      console.log(`${statusIcon} ${testName}: ${status.toUpperCase()}`);
      
      // Print error if failed
      if (status === 'failed' && testResult.error) {
        console.log(`   Error: ${testResult.error}`);
      }
    }
    
    // Print overall outcome
    console.log('\nOverall result:', results.success ? '✅ PASSED' : '❌ FAILED');
    
    // Exit with appropriate code
    process.exit(results.success ? 0 : 1);
  } catch (error) {
    if (error.response) {
      console.error('Request failed with status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else {
      console.error('Error making API request:', error.message);
    }
    process.exit(1);
  }
}

/**
 * Main function
 */
async function main() {
  // Check if server is already running
  try {
    await axios.get(`${config.apiBase}`);
    console.log('Server already running, using it for tests');
    await runTests();
  } catch (error) {
    // Server not running, start a local one
    await runTestsWithLocalServer();
  }
}

// Run the main function
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 