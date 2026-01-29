const { execSync } = require('child_process');
const fs = require('fs');

console.log('═══════════════════════════════════════════════════════════════');
console.log('🚀 FEAT-070 QUICK VALIDATION - Complete Execution');
console.log('═══════════════════════════════════════════════════════════════\n');

async function runValidation() {
  // Step 1: Check predictions table schema
  console.log('STEP 1: Verifying predictions table schema...');
  try {
    execSync('node scripts/verify-predictions-migration.js', { stdio: 'inherit' });
  } catch (err) {
    console.error('\n❌ Predictions table migration not applied!');
    console.log('\n⚠️  REQUIRED ACTION:');
    console.log('Please follow instructions in: FIX-PREDICTIONS-TABLE-NOW.md');
    console.log('Then run this script again.\n');
    process.exit(1);
  }

  console.log('\n');

  // Step 2: Extract test videos
  console.log('STEP 2: Extracting 10 test videos...');
  try {
    execSync('node scripts/extract-test-videos.js', { stdio: 'inherit' });
  } catch (err) {
    console.error('\n❌ Failed to extract test videos');
    console.log('Check that scraped_videos table has data');
    process.exit(1);
  }

  console.log('\n');

  // Step 3: Check if dev server is running
  console.log('STEP 3: Checking if dev server is running...');
  const http = require('http');

  const isServerRunning = await new Promise((resolve) => {
    const req = http.get('http://localhost:3000', (res) => {
      resolve(true);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });

  if (!isServerRunning) {
    console.error('\n❌ Dev server is NOT running!');
    console.log('\n⚠️  REQUIRED ACTION:');
    console.log('Start the dev server in another terminal:');
    console.log('  npm run dev');
    console.log('\nThen run this script again.\n');
    process.exit(1);
  }

  console.log('✅ Dev server is running\n');

  // Step 4: Run validation
  console.log('STEP 4: Running prediction validation (this takes ~20 minutes)...\n');
  try {
    execSync('node scripts/validate-predictions.js', { stdio: 'inherit' });
  } catch (err) {
    console.error('\n❌ Validation failed');
    process.exit(1);
  }

  console.log('\n✅ FEAT-070 VALIDATION COMPLETE!\n');
  console.log('Check validation_results.json and validation_summary.json for details.\n');
}

runValidation();
