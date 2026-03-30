/**
 * API Endpoint: Extract Viral Genomes
 * 
 * POST /api/admin/extract-genomes
 * 
 * Triggers genome extraction for top videos.
 * Returns progress updates via streaming response.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  extractAndSaveViralGenome,
  getVideosWithoutGenomes,
} from '@/lib/services/pattern-extraction/extract-viral-genome';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const limit = Math.min(body.limit || 50, 100); // Max 100 per request
    const minDps = body.minDps || 0;
    const niche = body.niche;

    // Get videos without genomes
    let videos = await getVideosWithoutGenomes(limit * 2, minDps);
    
    // Filter by niche if specified
    if (niche) {
      videos = videos.filter(v => v.niche?.toLowerCase() === niche.toLowerCase());
    }
    
    videos = videos.slice(0, limit);

    if (videos.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No videos need genome extraction',
        processed: 0,
        failed: 0,
      });
    }

    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const video of videos) {
      try {
        await extractAndSaveViralGenome(video);
        success++;
        
        // Rate limiting - 1.5 seconds between calls
        await new Promise(r => setTimeout(r, 1500));
      } catch (err: any) {
        failed++;
        errors.push(`${video.video_id}: ${err.message}`);
      }
    }

    // Get final count
    const { count } = await supabase
      .from('viral_genomes')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      success: true,
      processed: success,
      failed,
      totalGenomes: count || 0,
      errors: errors.slice(0, 10), // First 10 errors only
    });

  } catch (error: any) {
    console.error('Genome extraction error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Get genome count and stats
    const { count } = await supabase
      .from('viral_genomes')
      .select('*', { count: 'exact', head: true });

    // Get videos without genomes count
    const { count: videosWithTranscript } = await supabase
      .from('scraped_videos')
      .select('*', { count: 'exact', head: true })
      .not('transcript_text', 'is', null);

    // Get sample genomes (using actual table schema)
    const { data: samples } = await supabase
      .from('viral_genomes')
      .select('id, niche, pattern_type, pattern_dna, success_rate, dps_average, example_videos')
      .order('dps_average', { ascending: false })
      .limit(5);

    // Transform samples to show useful data
    const formattedSamples = (samples || []).map(s => ({
      id: s.id,
      niche: s.niche,
      pattern_type: s.pattern_type,
      success_rate: s.success_rate,
      dps_average: s.dps_average,
      source_video_id: s.pattern_dna?.source_video_id,
      topic: s.pattern_dna?.topic,
      hook_strength: s.pattern_dna?.nine_attributes?.hook_strength,
      viral_patterns: s.pattern_dna?.viral_patterns,
    }));

    return NextResponse.json({
      totalGenomes: count || 0,
      videosWithTranscript: videosWithTranscript || 0,
      videosNeedingGenomes: (videosWithTranscript || 0) - (count || 0),
      samples: formattedSamples,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}


