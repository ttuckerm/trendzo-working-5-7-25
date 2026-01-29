import { createClient } from '@supabase/supabase-js';
import { ViralPatternCouncil } from './viral-pattern-council';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  {
    auth: { persistSession: false }
  }
);

export async function extractPatternsFromAllVideos() {
  console.log('Starting pattern extraction pipeline...');
  
  // Get all high-performing videos
  // Using raw SQL query logic or Supabase filter
  const { data: viralVideos, error } = await supabase
    .from('scraped_videos')
    .select('*')
    .gt('views', 100000) // Threshold for "viral"
    .limit(50); // Process in batches
  
  if (error || !viralVideos) {
    console.error('Failed to fetch videos', error);
    return { videosAnalyzed: 0, patternsExtracted: 0 };
  }

  const council = new ViralPatternCouncil();
  let processed = 0;
  
  for (const video of viralVideos) {
    console.log(`Analyzing video ${video.id} (${video.platform_id})...`);
    
    try {
      // Extract patterns
      await council.analyzeVideo(video.id);
      processed++;
    } catch (e) {
      console.error(`Failed to analyze ${video.id}`, e);
    }
  }
  
  return {
    videosAnalyzed: processed,
    patternsExtracted: processed // Roughly 1 pattern set per video
  };
}





