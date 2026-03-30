/**
 * Batch Extraction Script for Viral Genomes
 * 
 * Extracts viral genomes from top videos and saves to database.
 * 
 * Usage:
 *   npx ts-node scripts/extract-all-genomes.ts
 *   
 * Options:
 *   --limit=100     Number of videos to process (default: 100)
 *   --min-dps=50    Minimum DPS score (default: 0)
 *   --niche=xyz     Filter by niche (default: all)
 *   --delay=1500    Delay between API calls in ms (default: 1500)
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import {
  extractAndSaveViralGenome,
  getVideosWithoutGenomes,
  VideoForGenomeExtraction,
} from '../src/lib/services/pattern-extraction/extract-viral-genome';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// Parse command line arguments
function parseArgs(): { limit: number; minDps: number; niche?: string; delay: number } {
  const args = process.argv.slice(2);
  let limit = 100;
  let minDps = 0;
  let niche: string | undefined;
  let delay = 1500;

  for (const arg of args) {
    if (arg.startsWith('--limit=')) {
      limit = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--min-dps=')) {
      minDps = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--niche=')) {
      niche = arg.split('=')[1];
    } else if (arg.startsWith('--delay=')) {
      delay = parseInt(arg.split('=')[1], 10);
    }
  }

  return { limit, minDps, niche, delay };
}

async function extractAllGenomes() {
  const { limit, minDps, niche, delay } = parseArgs();

  console.log('='.repeat(60));
  console.log('VIRAL GENOME EXTRACTION');
  console.log('='.repeat(60));
  console.log(`Limit: ${limit} videos`);
  console.log(`Min DPS: ${minDps}`);
  console.log(`Niche: ${niche || 'all'}`);
  console.log(`Delay: ${delay}ms between calls`);
  console.log('='.repeat(60));
  console.log('');

  // Check if table exists by trying to count
  const { count, error: countError } = await supabase
    .from('viral_genomes')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('❌ Error accessing viral_genomes table:', countError.message);
    console.log('');
    console.log('Run the migration first:');
    console.log('  supabase db push');
    console.log('  OR apply: supabase/migrations/20251130_viral_genomes_v2.sql');
    return;
  }

  console.log(`📊 Current viral_genomes count: ${count || 0}`);
  console.log('');

  // Get videos without genomes
  console.log('📹 Fetching videos without genomes...');
  let videos: VideoForGenomeExtraction[];

  try {
    videos = await getVideosWithoutGenomes(limit, minDps);
    
    // Filter by niche if specified
    if (niche) {
      videos = videos.filter(v => v.niche?.toLowerCase() === niche.toLowerCase());
    }
  } catch (error: any) {
    console.error('❌ Failed to fetch videos:', error.message);
    return;
  }

  if (videos.length === 0) {
    console.log('✅ No videos need genome extraction. All done!');
    return;
  }

  console.log(`Found ${videos.length} videos to process`);
  console.log('');

  let success = 0;
  let failed = 0;
  const startTime = Date.now();

  for (let i = 0; i < videos.length; i++) {
    const video = videos[i];
    const progress = `[${i + 1}/${videos.length}]`;
    
    try {
      const titlePreview = (video.title || 'Untitled').slice(0, 40);
      console.log(`${progress} Processing: ${titlePreview}...`);
      
      const genome = await extractAndSaveViralGenome(video);
      
      console.log(`  ✅ Saved | DPS: ${video.dps_score?.toFixed(1)} | Hook: ${genome.hook_strength}/10 | Patterns: ${genome.viral_patterns?.length || 0}`);
      success++;
      
      // Rate limiting
      if (i < videos.length - 1) {
        await new Promise(r => setTimeout(r, delay));
      }
    } catch (err: any) {
      console.error(`  ❌ Failed: ${err.message}`);
      failed++;
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('');
  console.log('='.repeat(60));
  console.log('EXTRACTION COMPLETE');
  console.log('='.repeat(60));
  console.log(`✅ Success: ${success}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏱️  Time: ${elapsed}s`);
  console.log('');

  // Final count
  const { count: finalCount } = await supabase
    .from('viral_genomes')
    .select('*', { count: 'exact', head: true });

  console.log(`📊 Total genomes in database: ${finalCount || 0}`);
  console.log('');
}

// Run the script
extractAllGenomes().catch(console.error);












