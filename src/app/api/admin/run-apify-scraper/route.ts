import { NextRequest, NextResponse } from 'next/server';
import { scrapeTikTokBatch } from '@/lib/services/apifyScraper';

export async function POST(request: NextRequest) {
  try {
    const { keywords } = await request.json();

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json(
        { error: 'Keywords array is required' },
        { status: 400 }
      );
    }

    console.log('Starting ApifyScraper with keywords:', keywords);
    const startTime = Date.now();

    // Run the scraper
    await scrapeTikTokBatch(keywords);

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(1) + 's';

    return NextResponse.json({
      success: true,
      message: 'Scraping completed successfully',
      keywords,
      duration,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('ApifyScraper API error:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Check server logs for more information'
      },
      { status: 500 }
    );
  }
}