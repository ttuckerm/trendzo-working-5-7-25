import { NextResponse } from 'next/server';
import { extractPatternsFromAllVideos } from '@/lib/pattern-extraction/extraction-pipeline';

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
