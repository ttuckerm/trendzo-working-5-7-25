import { NextResponse } from 'next/server';
import { extractPatternsFromAllVideos } from '@/lib/pattern-extraction/extraction-pipeline';

// Phase 1.6: forced dynamic to prevent Vercel build-phase static generation OOM
export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    // Start extraction in background or await if short
    const results = await extractPatternsFromAllVideos();
    
    return NextResponse.json({
      success: true,
      ...results
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
