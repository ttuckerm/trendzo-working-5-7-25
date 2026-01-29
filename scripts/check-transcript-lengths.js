#!/usr/bin/env node

/**
 * Check transcript lengths for high-DPS videos
 */

const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env.development' });
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('\n🔍 Checking transcript lengths for DPS >= 70 videos...\n');

  const { data } = await supabase
    .from('scraped_videos')
    .select('video_id, dps_score, transcript')
    .gte('dps_score', 70)
    .order('dps_score', { ascending: false });
  
  if (!data || data.length === 0) {
    console.log('❌ No videos found');
    return;
  }

  console.log(`Found ${data.length} videos:\n`);

  data.forEach((v, i) => {
    const transcriptLength = v.transcript?.length || 0;
    const transcriptPreview = v.transcript?.substring(0, 100) || '(no transcript)';
    
    console.log(`[${i + 1}] Video: ${v.video_id}`);
    console.log(`    DPS: ${v.dps_score}`);
    console.log(`    Transcript length: ${transcriptLength} chars`);
    console.log(`    Preview: "${transcriptPreview}${transcriptLength > 100 ? '...' : ''}"`);
    console.log('');
  });

  const avgLength = data.reduce((sum, v) => sum + (v.transcript?.length || 0), 0) / data.length;
  const minLength = Math.min(...data.map(v => v.transcript?.length || 0));
  const maxLength = Math.max(...data.map(v => v.transcript?.length || 0));

  console.log('📊 Statistics:');
  console.log(`   Average: ${avgLength.toFixed(0)} chars`);
  console.log(`   Min: ${minLength} chars`);
  console.log(`   Max: ${maxLength} chars`);
  console.log('');
  
  if (avgLength < 200) {
    console.log('⚠️  WARNING: Transcripts are very short!');
    console.log('   This may not be enough content for detailed pattern extraction.');
    console.log('   Consider:');
    console.log('   1. Re-scraping videos with better transcript extraction');
    console.log('   2. Using full video descriptions instead');
    console.log('   3. Lowering the LLM confidence threshold for short transcripts');
  }
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});











