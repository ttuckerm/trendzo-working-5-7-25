/**
 * POST /api/gemini/analyze-video
 * Analyze a video using Gemini 3.0 Pro's multimodal capabilities
 */

import { NextRequest, NextResponse } from 'next/server';
import { geminiAnalyzer } from '@/lib/services/gemini-video-analyzer';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { videoPath, videoId, analysisType = 'full' } = body;

    if (!videoPath) {
      return NextResponse.json(
        { success: false, error: 'videoPath is required' },
        { status: 400 }
      );
    }

    // Check if Gemini API key is configured (check all possible env var names)
    const geminiKey = process.env.GOOGLE_GEMINI_AI_API_KEY || process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      return NextResponse.json(
        { success: false, error: 'Gemini API key not set. Add GOOGLE_GEMINI_AI_API_KEY to .env.local' },
        { status: 500 }
      );
    }

    console.log(`[Gemini] Analyzing video: ${videoPath}`);
    console.log(`[Gemini] Analysis type: ${analysisType}`);

    let analysis;

    switch (analysisType) {
      case 'transcript':
        const transcript = await geminiAnalyzer.quickTranscript(videoPath);
        analysis = { transcript };
        break;

      case 'visual':
        const visualData = await geminiAnalyzer.quickVisualAnalysis(videoPath);
        analysis = { visual: visualData };
        break;

      case 'full':
      default:
        analysis = await geminiAnalyzer.analyzeVideo(videoPath);
        break;
    }

    console.log(`[Gemini] Analysis complete`);

    // Optionally store analysis in database
    if (videoId) {
      await supabase
        .from('video_analysis_gemini')
        .upsert({
          video_id: videoId,
          analysis_type: analysisType,
          analysis_data: analysis,
          analyzed_at: new Date().toISOString(),
        });
    }

    return NextResponse.json({
      success: true,
      data: analysis,
    });

  } catch (error: any) {
    console.error('[Gemini] Analysis failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Video analysis failed',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
