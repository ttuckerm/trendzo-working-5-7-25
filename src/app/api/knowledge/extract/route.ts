/**
 * FEAT-060: Knowledge Extraction API
 * POST /api/knowledge/extract
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  extractKnowledge,
  matchPatterns,
  type VideoInput
} from '@/lib/services/gppt/knowledge-extraction-engine';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

interface ExtractRequest {
  video_id: string;
  force_refresh?: boolean;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = (await request.json()) as ExtractRequest;
    const { video_id, force_refresh = false } = body;

    if (!video_id) {
      return NextResponse.json(
        { success: false, error: 'video_id is required' },
        { status: 400 }
      );
    }

    // STEP 1: Check if already extracted
    if (!force_refresh) {
      const { data: existing } = await supabase
        .from('extracted_knowledge')
        .select('*')
        .eq('video_id', video_id)
        .single();

      if (existing) {
        console.log(`[FEAT-060] Using cached extraction for ${video_id}`);
        return NextResponse.json({
          success: true,
          extraction_id: existing.id,
          consensus_insights: existing.consensus_insights,
          processing_time_ms: Date.now() - startTime,
          llm_agreement: existing.agreement_score,
          confidence: existing.confidence_score,
          cached: true
        });
      }
    }

    // STEP 2: Fetch video data
    const { data: video, error: videoError } = await supabase
      .from('scraped_videos')
      .select('*')
      .eq('video_id', video_id)
      .single();

    if (videoError || !video) {
      return NextResponse.json(
        { success: false, error: 'Video not found or missing transcript' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!video.transcript && !video.caption) {
      return NextResponse.json(
        { success: false, error: 'Video missing both transcript and caption' },
        { status: 400 }
      );
    }

    if (!video.dps_score) {
      return NextResponse.json(
        { success: false, error: 'Video missing DPS score' },
        { status: 400 }
      );
    }

    // STEP 3: Prepare input
    const videoInput: VideoInput = {
      video_id: video.video_id,
      transcript: video.transcript || '',
      caption: video.caption || '',
      dps_score: video.dps_score,
      classification: video.classification || 'normal',
      engagement_metrics: {
        views: video.views || 0,
        likes: video.likes || 0,
        comments: video.comments || 0,
        shares: video.shares || 0
      },
      creator_metadata: {
        followers: video.followers || 0
        // Do NOT send username to LLMs for privacy
      }
    };

    // STEP 4: Extract knowledge
    console.log(`[FEAT-060] Extracting knowledge for ${video_id}...`);
    const consensusResult = await extractKnowledge(videoInput);

    // STEP 5: Match patterns
    const patternMatch = await matchPatterns(consensusResult.consensus_insights);

    // STEP 6: Store results
    const extractionRecord = {
      video_id,
      extraction_timestamp: new Date().toISOString(),
      gpt4_analysis: consensusResult.gpt4_analysis,
      claude_analysis: consensusResult.claude_analysis,
      gemini_analysis: consensusResult.gemini_analysis,
      consensus_insights: consensusResult.consensus_insights,
      agreement_score: consensusResult.agreement_score,
      confidence_score: consensusResult.confidence_score,
      matched_patterns: patternMatch.matched_patterns,
      pattern_match_confidence: patternMatch.pattern_match_confidence,
      is_novel_pattern: patternMatch.is_novel_pattern,
      extraction_model_versions: {
        gpt4: consensusResult.gpt4_analysis?.model,
        claude: consensusResult.claude_analysis?.model,
        gemini: consensusResult.gemini_analysis?.model
      },
      processing_time_ms: consensusResult.processing_time_ms,
      extraction_status: 'success'
    };

    const { data: inserted, error: insertError } = await supabase
      .from('extracted_knowledge')
      .upsert(extractionRecord, { onConflict: 'video_id' })
      .select('id')
      .single();

    if (insertError) {
      console.error('[FEAT-060] Database insert failed:', insertError);
      return NextResponse.json(
        { success: false, error: 'Failed to store extraction results' },
        { status: 500 }
      );
    }

    console.log(`[FEAT-060] Extraction complete for ${video_id} in ${consensusResult.processing_time_ms}ms`);

    // STEP 7: Return success
    return NextResponse.json({
      success: true,
      extraction_id: inserted.id,
      consensus_insights: consensusResult.consensus_insights,
      processing_time_ms: Date.now() - startTime,
      llm_agreement: consensusResult.agreement_score,
      confidence: consensusResult.confidence_score,
      is_novel_pattern: patternMatch.is_novel_pattern,
      matched_patterns: patternMatch.matched_patterns
    });

  } catch (error) {
    console.error('[FEAT-060] Extraction error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve existing extraction
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const video_id = searchParams.get('video_id');

  if (!video_id) {
    return NextResponse.json(
      { success: false, error: 'video_id is required' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('extracted_knowledge')
    .select('*')
    .eq('video_id', video_id)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { success: false, error: 'Extraction not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    extraction: data
  });
}
