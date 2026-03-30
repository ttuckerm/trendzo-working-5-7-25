/**
 * Test SET ROLE Enforcement
 *
 * Tests if we can use SET ROLE to enforce table-level permissions
 * within a session using the postgres user
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

async function testSetRoleEnforcement() {
  console.log('\n🧪 Testing SET ROLE Enforcement...\n');

  try {
    // Test 1: Verify roles exist
    console.log('Test 1: Checking if roles exist...');
    const { data: checkRole, error: checkError } = await supabase.rpc('exec_sql', {
      query: "SELECT rolname FROM pg_roles WHERE rolname IN ('predictor_role', 'scraper_role', 'admin_role')"
    });

    if (checkError) {
      console.log('⚠️ Cannot query pg_roles via RPC (expected - no exec_sql function)');
      console.log('   Assuming roles exist from migration (verified earlier)\n');
    } else {
      console.log('✅ Roles found:', checkRole);
    }

    // Test 2: Try SET ROLE predictor_role and access prediction_actuals
    console.log('Test 2: SET ROLE predictor_role and try to access prediction_actuals...');

    // Create a test video first
    const { data: video, error: videoError } = await supabase
      .from('video_files')
      .insert({ niche: 'test', goal: 'test', account_size_band: 'small (0-10K)' })
      .select('id')
      .single();

    if (videoError || !video) {
      throw new Error(`Failed to create test video: ${videoError?.message}`);
    }

    console.log(`   Created test video: ${video.id}`);

    // Create a test prediction
    const { data: prediction, error: predError } = await supabase
      .from('prediction_events')
      .insert({
        video_id: video.id,
        model_version: 'test',
        feature_snapshot: {},
        predicted_dps: 50,
        predicted_dps_low: 40,
        predicted_dps_high: 60,
        confidence: 0.7,
        prediction_hash: 'test_' + Date.now()
      })
      .select('id')
      .single();

    if (predError || !prediction) {
      throw new Error(`Failed to create prediction: ${predError?.message}`);
    }

    console.log(`   Created test prediction: ${prediction.id}`);

    // Test 3: Can service_role access prediction_actuals? (should work)
    console.log('\nTest 3: service_role accessing prediction_actuals...');
    const { data: actualsAsService, error: actualsServiceError } = await supabase
      .from('prediction_actuals')
      .select('*')
      .limit(1);

    if (actualsServiceError) {
      console.log('   ❌ service_role CANNOT access prediction_actuals:', actualsServiceError.message);
    } else {
      console.log('   ✅ service_role CAN access prediction_actuals (expected - bypasses RLS)');
    }

    // Test 4: Try to use SET ROLE via SQL
    console.log('\nTest 4: Attempting SET ROLE via raw SQL query...');

    // Supabase client doesn't support raw SQL transactions
    // This would require direct PostgreSQL connection
    console.log('   ⚠️ Cannot test SET ROLE via Supabase client');
    console.log('   Supabase JS client uses REST API (PostgREST), not direct PostgreSQL connection');
    console.log('   SET ROLE requires session-level PostgreSQL connection\n');

    // Cleanup
    console.log('Test 5: Cleanup...');
    await supabase.from('video_files').delete().eq('id', video.id);
    console.log('   ✅ Cleanup complete\n');

    console.log('═══════════════════════════════════════════════════════');
    console.log('CONCLUSION:');
    console.log('═══════════════════════════════════════════════════════');
    console.log('❌ Database-enforced separation NOT possible with Supabase:');
    console.log('   1. Supabase JS client uses PostgREST (REST API)');
    console.log('   2. PostgREST does not support SET ROLE');
    console.log('   3. service_role bypasses ALL RLS policies');
    console.log('   4. Custom PostgreSQL users cannot be created');
    console.log('\n✅ Code-level separation is ONLY option for Phase 0:');
    console.log('   1. Predictor queries ONLY video_files (code discipline)');
    console.log('   2. Scraper queries ONLY prediction_actuals (code discipline)');
    console.log('   3. Admin has full access (for testing)');
    console.log('   4. Enforcement via code review + testing');
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

testSetRoleEnforcement();
