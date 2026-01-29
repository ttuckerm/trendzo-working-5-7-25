/**
 * Test Script: Marketplace Integration
 *
 * Tests the complete marketplace integration flow:
 * 1. Fetch top apps for sidebar
 * 2. Fetch recommended apps by niche
 * 3. Fetch installed apps for user
 * 4. Simulate app installation
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

async function testMarketplaceIntegration() {
  console.log('🧪 Testing Marketplace Integration\n');
  console.log('=' .repeat(60));

  const userId = 'default_user';
  let passCount = 0;
  let failCount = 0;

  // Test 1: Fetch top apps (for sidebar)
  console.log('\n📊 Test 1: Fetch Top Apps for Sidebar');
  console.log('-'.repeat(60));
  try {
    const { data: topApps, error } = await supabase
      .from('mini_apps')
      .select('*')
      .eq('status', 'active')
      .order('install_count', { ascending: false })
      .limit(3);

    if (error) throw error;

    console.log(`✅ Found ${topApps.length} top apps:`);
    topApps.forEach((app, index) => {
      console.log(`   ${index + 1}. ${app.icon} ${app.name} - ${app.install_count} installs`);
    });
    passCount++;
  } catch (error) {
    console.log('❌ Failed:', error);
    failCount++;
  }

  // Test 2: Fetch recommended apps by niche
  console.log('\n🎯 Test 2: Fetch Recommended Apps by Niche (Real Estate)');
  console.log('-'.repeat(60));
  try {
    const niche = 'Real Estate';
    const { data: recommendedApps, error } = await supabase
      .from('mini_apps')
      .select('*')
      .eq('status', 'active')
      .or(`category.ilike.%${niche}%,name.ilike.%${niche}%,description.ilike.%${niche}%`)
      .order('install_count', { ascending: false })
      .limit(3);

    if (error) throw error;

    console.log(`✅ Found ${recommendedApps.length} apps for "${niche}" niche:`);
    recommendedApps.forEach((app) => {
      console.log(`   ${app.icon} ${app.name} (${app.category})`);
    });
    passCount++;
  } catch (error) {
    console.log('❌ Failed:', error);
    failCount++;
  }

  // Test 3: Install an app
  console.log('\n📦 Test 3: Install Real Estate Generator');
  console.log('-'.repeat(60));
  try {
    // First, get the Real Estate Generator app
    const { data: apps } = await supabase
      .from('mini_apps')
      .select('*')
      .eq('name', 'Real Estate Viral Generator')
      .single();

    if (!apps) {
      console.log('⚠️  Real Estate Generator not found in database');
      console.log('   Run migration first: npx supabase db push');
      failCount++;
    } else {
      // Check if already installed
      const { data: existing } = await supabase
        .from('user_apps')
        .select('*')
        .eq('user_id', userId)
        .eq('app_id', apps.id)
        .single();

      if (existing) {
        console.log('ℹ️  App already installed');
        passCount++;
      } else {
        // Install the app
        const { error: installError } = await supabase
          .from('user_apps')
          .insert({
            user_id: userId,
            app_id: apps.id,
          });

        if (installError) throw installError;

        // Record transaction
        const creatorShare = apps.price * 0.80;
        const platformShare = apps.price * 0.20;

        const { error: txError } = await supabase
          .from('transactions')
          .insert({
            user_id: userId,
            app_id: apps.id,
            amount: apps.price,
            creator_share: creatorShare,
            platform_share: platformShare,
            transaction_type: 'purchase',
            status: 'completed',
          });

        if (txError) throw txError;

        console.log(`✅ Installed: ${apps.name}`);
        console.log(`   Price: $${apps.price}`);
        console.log(`   Creator gets: $${creatorShare} (80%)`);
        console.log(`   Platform gets: $${platformShare} (20%)`);
        passCount++;
      }
    }
  } catch (error) {
    console.log('❌ Failed:', error);
    failCount++;
  }

  // Test 4: Fetch installed apps
  console.log('\n📱 Test 4: Fetch Installed Apps for User');
  console.log('-'.repeat(60));
  try {
    const { data: installedApps, error } = await supabase
      .from('user_apps')
      .select(`
        installed_at,
        mini_apps (
          id,
          name,
          description,
          category,
          price,
          icon
        )
      `)
      .eq('user_id', userId);

    if (error) throw error;

    const apps = (installedApps || []).map((item: any) => ({
      ...item.mini_apps,
      installed_at: item.installed_at,
    }));

    console.log(`✅ User has ${apps.length} installed apps:`);
    apps.forEach((app) => {
      const installedDate = new Date(app.installed_at).toLocaleDateString();
      console.log(`   ${app.icon} ${app.name} - Installed ${installedDate}`);
    });
    passCount++;
  } catch (error) {
    console.log('❌ Failed:', error);
    failCount++;
  }

  // Test 5: Verify API endpoints exist
  console.log('\n🌐 Test 5: Verify API Endpoint Files Exist');
  console.log('-'.repeat(60));
  const fs = require('fs');
  const endpoints = [
    'src/app/api/bloomberg/marketplace/route.ts',
    'src/app/api/bloomberg/marketplace/recommended/route.ts',
    'src/app/api/bloomberg/marketplace/installed/route.ts',
  ];

  endpoints.forEach((endpoint) => {
    const exists = fs.existsSync(endpoint);
    if (exists) {
      console.log(`✅ ${endpoint}`);
      passCount++;
    } else {
      console.log(`❌ ${endpoint} - NOT FOUND`);
      failCount++;
    }
  });

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${passCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📈 Success Rate: ${Math.round((passCount / (passCount + failCount)) * 100)}%`);

  if (failCount === 0) {
    console.log('\n🎉 All tests passed! Marketplace integration is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above.');
  }
}

// Run the test
testMarketplaceIntegration().catch(console.error);
