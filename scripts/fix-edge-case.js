const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function fixEdgeCase() {
  console.log('🔧 Fixing edge case classification...\n');

  // Get the video with score = 80
  const { data: calc, error: fetchError } = await supabase
    .from('dps_calculations')
    .select('*')
    .eq('video_id', '7556687934095723798')
    .order('calculated_at', { ascending: false })
    .limit(1)
    .single();

  if (fetchError) {
    console.error('❌ Failed to fetch:', fetchError.message);
    return;
  }

  console.log(`Found video: ${calc.video_id}`);
  console.log(`  Current score: ${calc.viral_score}`);
  console.log(`  Current classification: ${calc.classification}`);

  // Determine correct classification
  const correctClassification = calc.viral_score >= 80 ? 'mega-viral' :
                                calc.viral_score >= 70 ? 'viral' :
                                'normal';

  if (calc.classification === correctClassification) {
    console.log(`\n✅ Classification is already correct: ${correctClassification}`);
    return;
  }

  console.log(`  Expected classification: ${correctClassification}`);

  // Update the classification
  const { error: updateError } = await supabase
    .from('dps_calculations')
    .update({ classification: correctClassification })
    .eq('video_id', calc.video_id)
    .eq('calculated_at', calc.calculated_at);

  if (updateError) {
    console.error('❌ Failed to update:', updateError.message);
    return;
  }

  console.log(`\n✅ Updated classification to: ${correctClassification}`);

  // Also update scraped_videos if needed
  const { error: updateVideoError } = await supabase
    .from('scraped_videos')
    .update({ classification: correctClassification })
    .eq('video_id', calc.video_id);

  if (updateVideoError) {
    console.warn('⚠️  Could not update scraped_videos:', updateVideoError.message);
  } else {
    console.log(`✅ Updated scraped_videos classification`);
  }
}

fixEdgeCase().catch(console.error);
