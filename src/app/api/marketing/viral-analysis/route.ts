import { NextRequest, NextResponse } from 'next/server';
import { viralVideoAnalysisService } from '@/lib/services/viralVideoAnalysisService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'fetch_top_performing':
        const topVideo = await viralVideoAnalysisService.fetchTopPerformingVideo(params);
        return NextResponse.json({ success: true, data: topVideo });

      case 'extract_elements':
        const elements = await viralVideoAnalysisService.extractVideoElements(params.video);
        return NextResponse.json({ success: true, data: elements });

      case 'generate_swap_points':
        const swapPoints = await viralVideoAnalysisService.generateSwapPoints(
          params.elements, 
          params.targetBrand
        );
        return NextResponse.json({ success: true, data: swapPoints });

      case 'auto_fill_template':
        const result = await viralVideoAnalysisService.autoFillTemplate(
          params.templateId,
          params.elements,
          params.swapPoints
        );
        return NextResponse.json({ success: true, data: result });

      case 'predict_performance':
        const prediction = await viralVideoAnalysisService.generatePerformancePrediction(
          params.originalVideo,
          params.modifiedTemplate
        );
        return NextResponse.json({ success: true, data: prediction });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Viral analysis API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const niche = searchParams.get('niche') || 'productivity_tools';
    const timeframe = searchParams.get('timeframe') || 'last_7_days';
    const minViews = parseInt(searchParams.get('minViews') || '1000000');

    const topVideo = await viralVideoAnalysisService.fetchTopPerformingVideo({
      niche,
      timeframe: timeframe as any,
      minViews,
    });

    return NextResponse.json({ success: true, data: topVideo });
  } catch (error) {
    console.error('GET viral analysis error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch viral video data' },
      { status: 500 }
    );
  }
}