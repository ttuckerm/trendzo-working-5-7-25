import { NextResponse } from 'next/server';
import { getMockAnalyticsData, getMockExpertInsights } from '@/app/api/templates/analytics/route';

// Define Template interface to match the structure from getMockAnalyticsData
interface Template {
  id: string;
  title: string;
  category: string;
  thumbnailUrl: string;
  stats: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
    engagementRate: number;
  };
  analyticsData: {
    growthRate: number;
    viewTrend: string;
    bestPerformingDemographic: string;
    averageCompletionRate: number;
    conversionRate: number;
    aiOnlyScore?: number;
    expertAdjustedScore?: number;
    expertConfidence?: number;
  };
  historyData: {
    dates: string[];
    views: number[];
    engagementRate: number[];
  };
  industryBenchmarks: {
    views: number;
    engagementRate: number;
  };
  analysisData: {
    viralityFactors: {
      score: number;
      strengths: string[];
      weaknesses: string[];
    };
  };
  expertInsights?: any;
  hasExpertInput?: boolean;
  expertAdjusted?: boolean;
}

/**
 * Simple debug endpoint to verify API functionality
 */
export async function GET() {
  try {
    // Return a simple success response
    return NextResponse.json({
      success: true,
      message: 'API is working properly',
      timestamp: new Date().toISOString(),
      mockDataAvailable: true,
      testMode: true,
    });
  } catch (error: any) {
    console.error('Error in debug analytics API:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'An error occurred',
    }, { status: 500 });
  }
} 