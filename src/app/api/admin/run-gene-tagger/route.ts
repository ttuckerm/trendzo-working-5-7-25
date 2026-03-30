import { NextRequest, NextResponse } from 'next/server';
import { tagGenes } from '@/lib/services/geneTagger';

export async function POST(request: NextRequest) {
  try {
    const { videoId } = await request.json();

    if (!videoId) {
      return NextResponse.json(
        { error: 'Video ID is required' },
        { status: 400 }
      );
    }

    console.log('Starting GeneTagger for video:', videoId);
    const startTime = Date.now();

    // Run the gene tagger
    const genes = await tagGenes(videoId);

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(1) + 's';

    // Get active genes for response
    const activeGenes = genes
      .map((gene, index) => gene ? index : -1)
      .filter(index => index !== -1);

    return NextResponse.json({
      success: true,
      message: 'Gene tagging completed successfully',
      videoId,
      genes,
      activeGenes,
      totalGenes: genes.length,
      detectedGenes: activeGenes.length,
      duration,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('GeneTagger API error:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Check server logs for more information'
      },
      { status: 500 }
    );
  }
}