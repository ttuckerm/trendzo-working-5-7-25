/**
 * Verify Frameworks 1 & 2 Setup
 *
 * Checks that all components are ready to use
 */

import { config } from 'dotenv';
config();

interface CheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
}

async function verifySetup() {
  const results: CheckResult[] = [];

  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║     FRAMEWORKS 1 & 2 - SETUP VERIFICATION                ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  // Check 1: Environment Variables
  console.log('📋 Checking environment variables...\n');

  const requiredEnvVars = [
    { name: 'NEXT_PUBLIC_SUPABASE_URL', value: process.env.NEXT_PUBLIC_SUPABASE_URL },
    { name: 'SUPABASE_SERVICE_ROLE_KEY', value: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY },
    { name: 'APIFY_API_TOKEN', value: process.env.APIFY_API_TOKEN, optional: true },
  ];

  for (const envVar of requiredEnvVars) {
    if (envVar.value) {
      results.push({
        name: envVar.name,
        status: 'pass',
        message: `Set (${envVar.value.substring(0, 20)}...)`
      });
    } else if (envVar.optional) {
      results.push({
        name: envVar.name,
        status: 'warn',
        message: 'Not set (optional for testing, required for production)'
      });
    } else {
      results.push({
        name: envVar.name,
        status: 'fail',
        message: 'NOT SET - Required!'
      });
    }
  }

  // Check 2: Database Connection
  console.log('\n🗄️  Checking database connection...\n');

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || ''
    );

    // Try to query the new tables
    const tables = [
      'test_results',
      'tracking_checkpoints',
      'viral_creators',
      'viral_hashtags',
      'scraping_runs'
    ];

    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).select('*', { count: 'exact', head: true });

        if (error) {
          results.push({
            name: `Table: ${table}`,
            status: 'fail',
            message: `Error: ${error.message}`
          });
        } else {
          results.push({
            name: `Table: ${table}`,
            status: 'pass',
            message: 'Exists and accessible'
          });
        }
      } catch (err) {
        results.push({
          name: `Table: ${table}`,
          status: 'fail',
          message: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`
        });
      }
    }
  } catch (err) {
    results.push({
      name: 'Database Connection',
      status: 'fail',
      message: `Failed to connect: ${err instanceof Error ? err.message : 'Unknown error'}`
    });
  }

  // Check 3: Dependencies
  console.log('\n📦 Checking dependencies...\n');

  const dependencies = [
    '@supabase/supabase-js',
    'apify-client'
  ];

  for (const dep of dependencies) {
    try {
      await import(dep);
      results.push({
        name: `Package: ${dep}`,
        status: 'pass',
        message: 'Installed'
      });
    } catch (err) {
      results.push({
        name: `Package: ${dep}`,
        status: 'fail',
        message: 'NOT INSTALLED - Run: npm install ' + dep
      });
    }
  }

  // Check 4: Framework Files
  console.log('\n📁 Checking framework files...\n');

  const fs = await import('fs');
  const path = await import('path');

  const criticalFiles = [
    'src/lib/donna/workflows/viral-scraping-workflow.ts',
    'src/lib/donna/services/apify-integration.ts',
    'src/lib/donna/testing/testing-framework.ts',
    'src/app/api/donna/workflow/start/route.ts',
    'src/app/api/donna/workflow/stop/route.ts',
    'src/app/api/donna/workflow/status/route.ts',
    'src/app/api/donna/workflow/cycle/route.ts',
    'src/app/api/donna/tracking/process/route.ts',
    'src/app/api/donna/reason/route.ts',
    'src/app/api/donna/test/run/route.ts',
    'vercel.json'
  ];

  for (const file of criticalFiles) {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      results.push({
        name: `File: ${file}`,
        status: 'pass',
        message: 'Exists'
      });
    } else {
      results.push({
        name: `File: ${file}`,
        status: 'fail',
        message: 'MISSING'
      });
    }
  }

  // Print Results
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║                    VERIFICATION RESULTS                   ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  let passCount = 0;
  let failCount = 0;
  let warnCount = 0;

  for (const result of results) {
    const icon = result.status === 'pass' ? '✅' : result.status === 'warn' ? '⚠️' : '❌';
    console.log(`${icon} ${result.name}`);
    console.log(`   ${result.message}\n`);

    if (result.status === 'pass') passCount++;
    else if (result.status === 'fail') failCount++;
    else warnCount++;
  }

  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║                         SUMMARY                           ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  console.log(`✅ Passed: ${passCount}`);
  console.log(`⚠️  Warnings: ${warnCount}`);
  console.log(`❌ Failed: ${failCount}\n`);

  if (failCount === 0 && warnCount <= 1) {
    console.log('🎉 SUCCESS! Frameworks 1 & 2 are ready to use!\n');
    console.log('Next steps:');
    console.log('1. Set APIFY_API_TOKEN in .env.local (if not already set)');
    console.log('2. Test locally: npm run dev');
    console.log('3. Deploy to Vercel: vercel deploy --prod\n');
  } else if (failCount === 0) {
    console.log('⚠️  READY WITH WARNINGS\n');
    console.log('You can proceed, but consider setting optional environment variables.\n');
  } else {
    console.log('❌ SETUP INCOMPLETE\n');
    console.log('Please fix the failed checks above before using Frameworks 1 & 2.\n');
  }
}

verifySetup().catch((error) => {
  console.error('❌ Verification failed:', error);
  process.exit(1);
});
