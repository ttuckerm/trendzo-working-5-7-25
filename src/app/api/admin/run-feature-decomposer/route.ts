import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { supabaseClient } from '@/lib/supabase/client';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { videoId } = await request.json();

    if (!videoId) {
      return NextResponse.json(
        { error: 'Video ID is required' },
        { status: 400 }
      );
    }

    console.log('Starting FeatureDecomposer for video:', videoId);

    // Get video details from database
    const { data: video, error: fetchError } = await supabaseClient
      .from('raw_videos')
      .select('*')
      .eq('id', videoId)
      .single();

    if (fetchError || !video) {
      return NextResponse.json(
        { error: 'Video not found in database' },
        { status: 404 }
      );
    }

    if (!video.saved_filepath) {
      return NextResponse.json(
        { error: 'Video file not available for processing' },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    // Lazily import heavy native deps via featureDecomposer
    const { decomposeVideo } = await import('@/lib/services/featureDecomposer');

    await decomposeVideo({
      id: video.id,
      filepath: video.saved_filepath,
      caption: video.caption || ''
    });

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(1) + 's';

    return NextResponse.json({
      success: true,
      message: 'Video processing completed (OCR/transcription may be disabled)',
      videoId,
      duration,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('FeatureDecomposer API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Processing failed but scraping remains disabled; see server logs for details.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}