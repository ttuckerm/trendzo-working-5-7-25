// Simple script to run the template analyzer features
require('dotenv').config({ path: '.env.local' });

const { log, error } = console;
const { 
  testVideoProcessing,
  testTemplateStructureExtraction, 
  testTemplateSimilarity,
  runAllAnalyzerTests
} = require('../src/lib/etl/test-template-analyzer');

// Show help message
function showHelp() {
  log('\nTemplate Analyzer Tool');
  log('========================');
  log('\nCommands:');
  log('  structure   - Test template structure visualization');
  log('  similarity  - Test template similarity detection');
  log('  process     - Test video processing and analysis');
  log('  all         - Run all tests');
  log('\nOptions:');
  log('  --samples=N - Number of samples to process (default: 3)');
  log('  --help      - Show this help message');
  log('\nExamples:');
  log('  node scripts/analyze-templates.js structure --samples=5');
  log('  node scripts/analyze-templates.js similarity');
  log('  node scripts/analyze-templates.js all');
  log('\n');
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const command = args[0];
  const options = {};

  args.slice(1).forEach(arg => {
    if (arg === '--help') {
      options.help = true;
      return;
    }

    const match = arg.match(/^--([^=]+)=(.+)$/);
    if (match) {
      const [_, key, value] = match;
      options[key] = value;
    }
  });

  return { command, options };
}

// Main function
async function main() {
  const { command, options } = parseArgs();

  // Handle help flag
  if (options.help || !command) {
    showHelp();
    return;
  }

  // Get sample size
  const sampleSize = options.samples ? parseInt(options.samples, 10) : 3;

  try {
    log(`Running command: ${command} with ${sampleSize} samples`);
    
    switch (command) {
      case 'structure':
        await testTemplateStructureExtraction(sampleSize);
        break;
      case 'similarity':
        await testTemplateSimilarity();
        break;
      case 'process':
        await testVideoProcessing(sampleSize);
        break;
      case 'all':
        await runAllAnalyzerTests();
        break;
      default:
        log(`Unknown command: ${command}`);
        showHelp();
        break;
    }
  } catch (err) {
    error('Error running analyzer:', err);
    process.exit(1);
  }
}

// Run the main function
main().catch(err => {
  error('Unhandled error:', err);
  process.exit(1);
}); 