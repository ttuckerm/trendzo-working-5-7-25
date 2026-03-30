/**
 * Run all ETL tests
 * This script runs all ETL tests in sequence
 */

console.log('Starting to run all ETL tests...');

// Run tests in sequence
const { spawn } = require('child_process');
const path = require('path');

async function runCommand(scriptPath) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [scriptPath], { stdio: 'inherit' });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Test failed with exit code ${code}`));
      }
    });
  });
}

async function runAllTests() {
  try {
    const testScripts = [
      'test-apify.ts',
      'test-firebase.ts',
      'test-scheduled-job.ts'
    ];
    
    for (const script of testScripts) {
      console.log(`\n====== Running ${script} ======\n`);
      await runCommand(path.join(__dirname, script));
      console.log(`\n====== ${script} completed ======\n`);
    }
    
    console.log('\n======================================\n');
    console.log('All tests completed successfully');
  } catch (error) {
    console.error('Test suite failed:', error.message);
    process.exit(1);
  }
}

// Start the tests
runAllTests(); 