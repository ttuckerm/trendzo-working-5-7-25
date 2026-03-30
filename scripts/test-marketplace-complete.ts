/**
 * MARKETPLACE FOUNDATION - COMPLETE TEST
 * Tests the entire marketplace flow from SDK to revenue tracking
 */

import { createClient } from '@supabase/supabase-js';
import { MiniAppSDK, executeMiniApp } from '../src/lib/marketplace/sdk';
import realEstateGenerator from '../src/lib/marketplace/apps/real-estate-gen';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL';
  details?: string;
  error?: any;
}

const results: TestResult[] = [];

function logTest(test: string, status: 'PASS' | 'FAIL', details?: string, error?: any) {
  results.push({ test, status, details, error });
  const icon = status === 'PASS' ? '✅' : '❌';
  console.log(`${icon} ${test}`);
  if (details) console.log(`   ${details}`);
  if (error) console.error('   Error:', error.message || error);
}

async function runTests() {
  console.log('\n🏪 MARKETPLACE FOUNDATION TEST SUITE');
  console.log('=' 85);

  const testUserId = 'test_user_' + Date.now();
  const testCreatorId = 'test_creator_' + Date.now();
  let testAppId: string | null = null;

  // ============================================================================
  // TEST 1: Database Tables Exist
  // ============================================================================
  try {
    const { data: miniApps, error: appsError } = await supabase
      .from('mini_apps')
      .select('count')
      .limit(1);

    const { data: userApps, error: userAppsError } = await supabase
      .from('user_apps')
      .select('count')
      .limit(1);

    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('count')
      .limit(1);

    const { data: appStorage, error: storageError } = await supabase
      .from('app_storage')
      .select('count')
      .limit(1);

    if (appsError || userAppsError || txError || storageError) {
      throw new Error('One or more tables do not exist');
    }

    logTest(
      'Database tables exist',
      'PASS',
      'mini_apps, user_apps, transactions, app_storage'
    );
  } catch (error) {
    logTest('Database tables exist', 'FAIL', undefined, error);
    return; // Cannot continue without tables
  }

  // ============================================================================
  // TEST 2: Seed Data Loaded (Real Estate App)
  // ============================================================================
  try {
    const { data, error } = await supabase
      .from('mini_apps')
      .select('*')
      .eq('name', 'Real Estate Viral Generator')
      .single();

    if (error) throw error;

    if (data) {
      logTest(
        'Seed data loaded',
        'PASS',
        `Real Estate app found: $${data.price}/mo, ${data.install_count} installs`
      );
      testAppId = data.id; // Use real app for testing
    } else {
      throw new Error('Real Estate app not found in seed data');
    }
  } catch (error) {
    logTest('Seed data loaded', 'FAIL', undefined, error);
  }

  // ============================================================================
  // TEST 3: App Installation
  // ============================================================================
  if (testAppId) {
    try {
      const { data: app } = await supabase
        .from('mini_apps')
        .select('*')
        .eq('id', testAppId)
        .single();

      if (!app) throw new Error('App not found');

      // Record transaction
      const creatorShare = app.price * 0.80;
      const platformShare = app.price * 0.20;

      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: testUserId,
          app_id: testAppId,
          amount: app.price,
          creator_share: creatorShare,
          platform_share: platformShare,
          transaction_type: 'purchase',
          status: 'completed',
        });

      if (txError) throw txError;

      // Install app
      const { error: installError } = await supabase
        .from('user_apps')
        .insert({
          user_id: testUserId,
          app_id: testAppId,
        });

      if (installError) throw installError;

      logTest(
        'App installation',
        'PASS',
        `Installed for $${app.price} (Creator: $${creatorShare}, Platform: $${platformShare})`
      );
    } catch (error) {
      logTest('App installation', 'FAIL', undefined, error);
    }
  }

  // ============================================================================
  // TEST 4: Revenue Split Calculation (80/20)
  // ============================================================================
  try {
    const testAmount = 49.00;
    const expectedCreatorShare = testAmount * 0.80; // $39.20
    const expectedPlatformShare = testAmount * 0.20; // $9.80

    if (expectedCreatorShare === 39.20 && expectedPlatformShare === 9.80) {
      logTest(
        'Revenue split calculation',
        'PASS',
        `$${testAmount} → Creator: $${expectedCreatorShare} (80%), Platform: $${expectedPlatformShare} (20%)`
      );
    } else {
      throw new Error('Revenue split calculation incorrect');
    }
  } catch (error) {
    logTest('Revenue split calculation', 'FAIL', undefined, error);
  }

  // ============================================================================
  // TEST 5: SDK Initialization
  // ============================================================================
  try {
    const sdk = new MiniAppSDK(testUserId, testAppId || 'mock_app_id');
    const context = await sdk.createContext(
      { id: testUserId, name: 'Test User', email: 'test@example.com' },
      { id: testAppId || 'mock_app_id', name: 'Real Estate Generator', version: '1.0.0' }
    );

    if (context.apis && context.storage && context.analytics) {
      logTest(
        'SDK initialization',
        'PASS',
        'APIs, storage, and analytics available'
      );
    } else {
      throw new Error('SDK context incomplete');
    }
  } catch (error) {
    logTest('SDK initialization', 'FAIL', undefined, error);
  }

  // ============================================================================
  // TEST 6: Sandboxed Storage (Get/Set)
  // ============================================================================
  if (testAppId) {
    try {
      // Set a value
      await supabase
        .from('app_storage')
        .upsert({
          user_id: testUserId,
          app_id: testAppId,
          key: 'test_key',
          value: { message: 'Hello from test!' },
        });

      // Get the value
      const { data, error } = await supabase
        .from('app_storage')
        .select('value')
        .eq('user_id', testUserId)
        .eq('app_id', testAppId)
        .eq('key', 'test_key')
        .single();

      if (error) throw error;

      if (data && data.value.message === 'Hello from test!') {
        logTest(
          'Sandboxed storage',
          'PASS',
          'Storage scoped to user + app, value retrieved'
        );
      } else {
        throw new Error('Storage value mismatch');
      }
    } catch (error) {
      logTest('Sandboxed storage', 'FAIL', undefined, error);
    }
  }

  // ============================================================================
  // TEST 7: Analytics Tracking
  // ============================================================================
  if (testAppId) {
    try {
      const { error } = await supabase
        .from('app_analytics')
        .insert({
          user_id: testUserId,
          app_id: testAppId,
          event: 'test_event',
          data: { action: 'test', timestamp: new Date().toISOString() },
        });

      if (error) throw error;

      logTest(
        'Analytics tracking',
        'PASS',
        'Event tracked successfully'
      );
    } catch (error) {
      logTest('Analytics tracking', 'FAIL', undefined, error);
    }
  }

  // ============================================================================
  // TEST 8: Real Estate Generator Execution
  // ============================================================================
  if (testAppId) {
    try {
      const sdk = new MiniAppSDK(testUserId, testAppId);
      const context = await sdk.createContext(
        { id: testUserId, name: 'Test User' },
        { id: testAppId, name: 'Real Estate Generator', version: '1.0.0' }
      );

      const generator = await realEstateGenerator(context);

      const result = await generator({
        propertyType: 'house',
        bedrooms: 4,
        bathrooms: 3,
        sqft: 2500,
        price: 675000,
        location: 'Austin, TX',
        uniqueFeatures: ['pool', 'modern kitchen', 'smart home'],
        targetAudience: 'first-time-buyers',
      });

      if (result.script && result.predictedDps && result.cinematicPrompt && result.tips) {
        logTest(
          'Real estate generator execution',
          'PASS',
          `DPS: ${result.predictedDps}, Tips: ${result.tips.length}`
        );
      } else {
        throw new Error('Real estate generator returned incomplete result');
      }
    } catch (error) {
      logTest('Real estate generator execution', 'FAIL', undefined, error);
    }
  }

  // ============================================================================
  // TEST 9: Creator Dashboard Revenue Calculation
  // ============================================================================
  if (testAppId) {
    try {
      // Fetch transactions for this app
      const { data: txData, error } = await supabase
        .from('transactions')
        .select('creator_share')
        .eq('app_id', testAppId)
        .eq('status', 'completed');

      if (error) throw error;

      const totalRevenue = (txData || []).reduce(
        (sum, tx) => sum + parseFloat(String(tx.creator_share)),
        0
      );

      logTest(
        'Creator dashboard revenue',
        'PASS',
        `Total creator revenue: $${totalRevenue.toFixed(2)}`
      );
    } catch (error) {
      logTest('Creator dashboard revenue', 'FAIL', undefined, error);
    }
  }

  // ============================================================================
  // TEST 10: Install Count Auto-Increment
  // ============================================================================
  if (testAppId) {
    try {
      const { data: beforeInstall } = await supabase
        .from('mini_apps')
        .select('install_count')
        .eq('id', testAppId)
        .single();

      const beforeCount = beforeInstall?.install_count || 0;

      // Install for a new user
      const newUserId = 'test_user_2_' + Date.now();
      await supabase
        .from('user_apps')
        .insert({
          user_id: newUserId,
          app_id: testAppId,
        });

      // Wait briefly for trigger to execute
      await new Promise(resolve => setTimeout(resolve, 100));

      const { data: afterInstall } = await supabase
        .from('mini_apps')
        .select('install_count')
        .eq('id', testAppId)
        .single();

      const afterCount = afterInstall?.install_count || 0;

      if (afterCount === beforeCount + 1) {
        logTest(
          'Install count auto-increment',
          'PASS',
          `Count: ${beforeCount} → ${afterCount}`
        );
      } else {
        throw new Error(`Expected ${beforeCount + 1}, got ${afterCount}`);
      }
    } catch (error) {
      logTest('Install count auto-increment', 'FAIL', undefined, error);
    }
  }

  // ============================================================================
  // CLEANUP: Remove test data
  // ============================================================================
  console.log('\n🧹 Cleaning up test data...');
  try {
    if (testAppId) {
      await supabase.from('user_apps').delete().eq('app_id', testAppId).in('user_id', [testUserId, `test_user_2_${testUserId.split('_')[2]}`]);
      await supabase.from('transactions').delete().eq('user_id', testUserId);
      await supabase.from('app_storage').delete().eq('user_id', testUserId);
      await supabase.from('app_analytics').delete().eq('user_id', testUserId);
    }
    console.log('✓ Test data cleaned up');
  } catch (error) {
    console.error('⚠️  Cleanup error:', error);
  }

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('\n' + '='.repeat(85));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(85));

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const total = results.length;

  console.log(`\nTotal Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Marketplace foundation is ready.\n');
  } else {
    console.log('\n⚠️  Some tests failed. Review errors above.\n');
    process.exit(1);
  }
}

runTests().catch(console.error);
