/**
 * Debug script to isolate Kai API failure points
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  {
    db: { schema: 'public' },
    auth: { persistSession: false }
  }
);

async function main() {
  console.log('=== DEBUG KAI API ===\n');

  // Step 1: Test Supabase connection
  console.log('Step 1: Testing Supabase connection...');
  try {
    const { data, error } = await supabase.from('video_files').select('id').limit(1);
    if (error) {
      console.error('❌ Supabase error:', error.message);
      console.error('   Code:', error.code);
      console.error('   Details:', error.details);
    } else {
      console.log('✅ Supabase connection OK');
    }
  } catch (e: any) {
    console.error('❌ Exception:', e.message);
  }

  // Step 2: Test insert into video_files
  console.log('\nStep 2: Testing insert into video_files...');
  try {
    const { data: videoRecord, error: insertError } = await supabase
      .from('video_files')
      .insert({
        tiktok_url: null,
        storage_path: null,
        niche: 'Test',
        goal: 'Test',
        account_size_band: 'Small',
        platform: 'tiktok',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Insert error:', insertError.message);
      console.error('   Code:', insertError.code);
    } else {
      console.log('✅ Insert OK, video ID:', videoRecord.id);

      // Delete the test record
      await supabase.from('video_files').delete().eq('id', videoRecord.id);
      console.log('   (Cleaned up test record)');
    }
  } catch (e: any) {
    console.error('❌ Exception:', e.message);
  }

  // Step 3: Test KaiOrchestrator import
  console.log('\nStep 3: Testing KaiOrchestrator import...');
  try {
    const { KaiOrchestrator } = await import('@/lib/orchestration/kai-orchestrator');
    console.log('✅ KaiOrchestrator imported');

    const kai = new KaiOrchestrator();
    console.log('✅ KaiOrchestrator instantiated');
  } catch (e: any) {
    console.error('❌ Import/instantiation error:', e.message);
  }

  // Step 4: Test PredictionHash import
  console.log('\nStep 4: Testing PredictionHash import...');
  try {
    const { PredictionHash } = await import('@/lib/services/prediction-hash');
    console.log('✅ PredictionHash imported');

    const hash = PredictionHash.generate({ test: 'data' });
    console.log('✅ PredictionHash.generate works:', hash.hash.substring(0, 20) + '...');
  } catch (e: any) {
    console.error('❌ Import error:', e.message);
  }

  // Step 5: Test prediction_events table
  console.log('\nStep 5: Testing prediction_events table...');
  try {
    const { data, error } = await supabase.from('prediction_events').select('id').limit(1);
    if (error) {
      console.error('❌ prediction_events error:', error.message);
    } else {
      console.log('✅ prediction_events table OK');
    }
  } catch (e: any) {
    console.error('❌ Exception:', e.message);
  }

  console.log('\n=== DEBUG COMPLETE ===');
}

main().catch(console.error);
