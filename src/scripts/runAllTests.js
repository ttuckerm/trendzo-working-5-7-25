/**
 * Comprehensive Test Runner
 * 
 * This script runs all test suites in sequence and generates a comprehensive report
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Import environment setup utility
const { setupTestEnvironment } = require('./setupEnv');

// Set up environment for tests
setupTestEnvironment();

// Configuration
const TEST_RESULTS_DIR = path.join(process.cwd(), 'test-results');
const SUMMARY_FILE = path.join(TEST_RESULTS_DIR, 'test-summary.json');
const HTML_REPORT_FILE = path.join(TEST_RESULTS_DIR, 'test-report.html');

// Create test results directory if it doesn't exist
if (!fs.existsSync(TEST_RESULTS_DIR)) {
  fs.mkdirSync(TEST_RESULTS_DIR, { recursive: true });
}

// Helper function to run a script and capture output
function runScript(scriptPath) {
  return new Promise((resolve, reject) => {
    console.log(`Running ${path.basename(scriptPath)}...`);
    
    exec(`node ${scriptPath}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing ${scriptPath}: ${error.message}`);
      }
      
      if (stderr) {
        console.error(`${scriptPath} stderr: ${stderr}`);
      }
      
      console.log(stdout);
      resolve({
        script: path.basename(scriptPath),
        success: !error,
        output: stdout,
        error: error ? error.message : null
      });
    });
  });
}

// Main function to run all tests
async function runAllTests() {
  console.log('Starting Comprehensive Test Suite...');
  console.log('==============================================');
  
  const startTime = Date.now();
  const summary = {
    timestamp: new Date().toISOString(),
    scripts: [],
    duration: 0
  };
  
  try {
    // Define all test scripts
    const scripts = [
      path.join(__dirname, 'soundEtlTester.js'),
      path.join(__dirname, 'verifyFirebaseData.js'),
      path.join(__dirname, 'regressionTest.js')
    ];
    
    // Run each script in sequence
    for (const script of scripts) {
      const result = await runScript(script);
      summary.scripts.push(result);
      console.log(`Completed ${path.basename(script)}\n`);
    }
    
  } catch (error) {
    console.error('Error running tests:', error);
  } finally {
    // Record total duration
    const endTime = Date.now();
    summary.duration = endTime - startTime;
    
    // Print summary
    console.log('\n==============================================');
    console.log('Test Suite Summary:');
    console.log(`Total scripts: ${summary.scripts.length}`);
    console.log(`Duration: ${(summary.duration / 1000).toFixed(2)} seconds`);
    console.log('==============================================');
    
    // Save summary to file
    fs.writeFileSync(SUMMARY_FILE, JSON.stringify(summary, null, 2));
    console.log(`\nTest summary saved to: ${SUMMARY_FILE}`);
    
    // Generate HTML report
    generateHtmlReport();
    console.log(`HTML report generated at: ${HTML_REPORT_FILE}`);
  }
}

// Generate HTML report from all test results
function generateHtmlReport() {
  try {
    // Collect all test results
    const results = {};
    
    // Find all JSON result files
    const resultFiles = fs.readdirSync(TEST_RESULTS_DIR)
      .filter(file => file.endsWith('.json') && file !== 'test-summary.json');
    
    // Read each file
    for (const file of resultFiles) {
      const content = fs.readFileSync(path.join(TEST_RESULTS_DIR, file), 'utf8');
      results[file] = JSON.parse(content);
    }
    
    // Generate HTML
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sound ETL Test Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    h1, h2, h3 {
      color: #2c3e50;
    }
    .summary {
      background-color: #f8f9fa;
      border-radius: 5px;
      padding: 15px;
      margin-bottom: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .test-file {
      margin-bottom: 30px;
      border: 1px solid #ddd;
      border-radius: 5px;
      overflow: hidden;
    }
    .test-file-header {
      background-color: #eef1f5;
      padding: 10px 15px;
      border-bottom: 1px solid #ddd;
    }
    .test-results {
      padding: 15px;
    }
    .test-result {
      margin-bottom: 15px;
      padding: 10px;
      border-radius: 5px;
      border-left: 5px solid #ddd;
    }
    .pass {
      background-color: #f0fff4;
      border-left-color: #68d391;
    }
    .fail {
      background-color: #fff5f5;
      border-left-color: #fc8181;
    }
    .details {
      margin-top: 10px;
      padding: 10px;
      background-color: rgba(0,0,0,0.03);
      border-radius: 3px;
      font-family: monospace;
      white-space: pre-wrap;
      font-size: 0.85em;
    }
    .stats {
      display: flex;
      gap: 15px;
      margin-bottom: 15px;
    }
    .stat-box {
      background-color: #fff;
      padding: 10px 15px;
      border-radius: 5px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      flex: 1;
    }
    .stat-box h4 {
      margin: 0 0 5px 0;
      font-size: 1em;
      color: #6c757d;
    }
    .stat-box .value {
      font-size: 1.8em;
      font-weight: bold;
    }
    .pass-color { color: #2f855a; }
    .fail-color { color: #c53030; }
    .timestamp {
      color: #6c757d;
      font-size: 0.9em;
    }
  </style>
</head>
<body>
  <h1>Sound ETL Test Report</h1>
  <p class="timestamp">Generated on ${new Date().toLocaleString()}</p>
  
  <div class="summary">
    <h2>Summary</h2>
    <div class="stats">
      ${summarizeTestResults(results)}
    </div>
  </div>
  
  ${Object.entries(results).map(([file, result]) => `
    <div class="test-file">
      <div class="test-file-header">
        <h3>${file.replace('.json', '')}</h3>
        <div class="timestamp">Run at: ${new Date(result.timestamp).toLocaleString()}</div>
      </div>
      <div class="test-results">
        ${renderTestResults(result.tests)}
      </div>
    </div>
  `).join('')}
</body>
</html>
    `;
    
    fs.writeFileSync(HTML_REPORT_FILE, html);
  } catch (error) {
    console.error('Error generating HTML report:', error);
  }
}

// Helper function to summarize all test results
function summarizeTestResults(results) {
  let totalTests = 0;
  let totalPassed = 0;
  let totalFailed = 0;
  
  // Count all tests
  Object.values(results).forEach(result => {
    if (result.summary) {
      totalTests += result.summary.total || 0;
      totalPassed += result.summary.passed || 0;
      totalFailed += result.summary.failed || 0;
    }
  });
  
  return `
    <div class="stat-box">
      <h4>Total Tests</h4>
      <div class="value">${totalTests}</div>
    </div>
    <div class="stat-box">
      <h4>Passed</h4>
      <div class="value pass-color">${totalPassed}</div>
    </div>
    <div class="stat-box">
      <h4>Failed</h4>
      <div class="value fail-color">${totalFailed}</div>
    </div>
  `;
}

// Helper function to render test results
function renderTestResults(tests) {
  if (!tests || tests.length === 0) {
    return '<p>No test results available</p>';
  }
  
  return tests.map(test => `
    <div class="test-result ${test.passed ? 'pass' : 'fail'}">
      <h4>${test.passed ? '✅' : '❌'} ${test.name}</h4>
      ${renderTestDetails(test)}
    </div>
  `).join('');
}

// Helper function to render test details
function renderTestDetails(test) {
  // Remove fields we've already shown
  const { name, passed, timestamp, ...details } = test;
  
  if (Object.keys(details).length === 0) {
    return '';
  }
  
  return `
    <div class="details">
${JSON.stringify(details, null, 2)}
    </div>
  `;
}

// Run all tests
runAllTests(); 