import { NextRequest, NextResponse } from 'next/server';
import { soundService } from '@/lib/services/soundService';

export async function GET(request: NextRequest) {
  try {
    // Get the latest trend report from service
    const report = await soundService.getLatestTrendReport();
    
    if (!report) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No trend report found' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error fetching latest trend report:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch trend report'
      },
      { status: 500 }
    );
  }
} 