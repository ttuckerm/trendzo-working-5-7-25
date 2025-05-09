#!/usr/bin/env node

/**
 * This script runs the API endpoint tests using ts-node
 * It can be used to test the API endpoints without building the project
 */

const { execSync } = require('child_process');
const path = require('path');

const tsNodePath = path.resolve('./node_modules/.bin/ts-node');
const testScriptPath = path.resolve('./src/app/test-api-endpoints.ts');

console.log('Running API endpoint tests...');

try {
  // Set environment variables for testing
  const env = {
    ...process.env,
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
    NODE_ENV: 'development', // Ensure we're in development mode
  };

  // Run the tests using ts-node
  execSync(`${tsNodePath} ${testScriptPath}`, {
    stdio: 'inherit',
    env,
  });

  console.log('Tests completed successfully!');
} catch (error) {
  console.error('Error running tests:', error.message);
  process.exit(1);
} 