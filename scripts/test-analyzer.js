#!/usr/bin/env node

/**
 * Script to test the template analyzer functionality
 * This script allows running individual template analyzer tests
 * 
 * Usage:
 *   npm run test-analyzer [test-name] [options]
 * 
 * Examples:
 *   npm run test-analyzer              # Run all tests
 *   npm run test-analyzer processing   # Test only video processing
 *   npm run test-analyzer categorization --samples=5  # Test categorization with 5 samples
 *   npm run test-analyzer structure --samples=3       # Test structure extraction with 3 samples
 *   npm run test-analyzer similarity   # Test template similarity
 */

const { execSync } = require('child_process');
const path = require('path');

// Set environment variables for testing
process.env.TESTING_MODE = 'true';

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0] || 'all';

// Extract options
let options = {
  samples: 3, // Default sample size
};

// Parse options from arguments
args.forEach(arg => {
  if (arg.startsWith('--')) {
    const [key, value] = arg.substring(2).split('=');
    options[key] = value;
  }
});

// Valid test commands
const commands = {
  all: 'Run all template analyzer tests',
  processing: 'Test video processing only',
  categorization: 'Test template categorization only',
  structure: 'Test template structure extraction only',
  similarity: 'Test template similarity only',
  help: 'Display this help message'
};

// Check if command is valid
if (!Object.keys(commands).includes(command)) {
  console.error(`Error: Unknown command '${command}'`);
  console.error('Use "npm run test-analyzer help" for usage information');
  process.exit(1);
}

// Display help message
if (command === 'help') {
  console.log('Usage: npm run test-analyzer [command] [options]');
  console.log('\nCommands:');
  Object.entries(commands).forEach(([cmd, desc]) => {
    console.log(`  ${cmd.padEnd(14)} ${desc}`);
  });
  console.log('\nOptions:');
  console.log('  --samples=N       Number of videos to sample (default: 3)');
  process.exit(0);
}

// Build the test command
let testCommand = '';

switch (command) {
  case 'all':
    testCommand = `npx ts-node src/lib/etl/test-template-analyzer.ts`;
    break;
  case 'processing':
    testCommand = `npx ts-node -e "require('./src/lib/etl/test-template-analyzer').testVideoProcessing(${options.samples}).then(result => process.exit(result ? 0 : 1))"`;
    break;
  case 'categorization':
    testCommand = `npx ts-node -e "require('./src/lib/etl/test-template-analyzer').testTemplateCategorization(${options.samples}).then(result => process.exit(result ? 0 : 1))"`;
    break;
  case 'structure':
    testCommand = `npx ts-node -e "require('./src/lib/etl/test-template-analyzer').testTemplateStructureExtraction(${options.samples}).then(result => process.exit(result ? 0 : 1))"`;
    break;
  case 'similarity':
    testCommand = `npx ts-node -e "require('./src/lib/etl/test-template-analyzer').testTemplateSimilarity().then(result => process.exit(result ? 0 : 1))"`;
    break;
}

// Run the test
console.log(`Running test command: ${command} (samples: ${options.samples})`);
try {
  execSync(testCommand, { stdio: 'inherit' });
  console.log('Test completed successfully.');
} catch (error) {
  console.error('Test failed with exit code:', error.status);
  process.exit(1);
} 