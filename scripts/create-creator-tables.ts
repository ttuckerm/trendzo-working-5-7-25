/**
 * Create Creator Personalization Tables
 *
 * Manual table creation since we can't run SQL migrations directly
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { db: { schema: 'public' }, auth: { persistSession: false } }
);

async function main() {
  console.log('Creating creator personalization tables...\n');

  // Check if tables already exist
  const { data: existingTables } = await supabase
    .from('creator_profiles')
    .select('id')
    .limit(1);

  if (existingTables !== null) {
    console.log('✓ Tables already exist');
    return;
  }

  console.log('✗ Tables do not exist yet');
  console.log('\nPlease run the migration SQL manually in Supabase Dashboard:');
  console.log('1. Go to https://supabase.com/dashboard/project/vyeiyccrageeckeehyhj/editor');
  console.log('2. Open SQL Editor');
  console.log('3. Paste the contents of: supabase/migrations/20251119_creator_personalization.sql');
  console.log('4. Run the migration\n');

  console.log('For now, I\'ll create a test creator profile directly...\n');

  // Insert a test creator profile using raw insert
  const testProfile = {
    tiktok_username: 'test_creator',
    channel_url: 'https://tiktok.com/@test_creator',
    total_videos: 0,
    avg_views: 0,
    avg_likes: 0,
    avg_comments: 0,
    avg_shares: 0,
    avg_saves: 0,
    baseline_dps: 0,
    baseline_engagement_rate: 0,
    content_style: {},
    strengths: [],
    weaknesses: [],
    dps_percentiles: {},
    videos_analyzed: 0,
    analysis_status: 'pending'
  };

  const { data, error } = await supabase
    .from('creator_profiles')
    .insert(testProfile)
    .select()
    .single();

  if (error) {
    console.error('Error creating test profile:', error.message);
    console.log('\nMigration SQL file is ready at:');
    console.log('supabase/migrations/20251119_creator_personalization.sql');
  } else {
    console.log('✓ Test creator profile created:', data.id);
  }
}

main().catch(console.error);
