/**
 * Demo data utility functions
 * Provides sample data for features that require premium subscription
 */

import { NextRequest } from 'next/server';

/**
 * Check if the request is asking for demo data
 * @param request - Next.js request object
 * @returns boolean indicating if demo data was requested
 */
export function isDemoRequest(request: NextRequest): boolean {
  return request.headers.has('x-demo-data') || request.nextUrl.searchParams.has('demo');
}

/**
 * Sample prediction data for non-premium users
 */
export interface TrendPrediction {
  id: string;
  name: string;
  category: string;
  confidence: number;
  predictedGrowth: number;
  timeframe: string;
  currentVolume: number;
  supportingData?: any;
  createdAt: string;
}

/**
 * Get sample trend predictions for demo purposes
 * @returns Array of sample trend predictions
 */
export function getSampleTrendPredictions(): TrendPrediction[] {
  return [
    {
      id: 'pred-001',
      name: 'Sustainable Fashion',
      category: 'Fashion',
      confidence: 0.87,
      predictedGrowth: 34.5,
      timeframe: '3 months',
      currentVolume: 12500,
      supportingData: {
        socialMentions: 156000,
        growthRate: '22% month-over-month',
        topMarkets: ['US', 'EU', 'Australia']
      },
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'pred-002',
      name: 'Plant-Based Alternatives',
      category: 'Food',
      confidence: 0.92,
      predictedGrowth: 46.2,
      timeframe: '6 months',
      currentVolume: 28700,
      supportingData: {
        socialMentions: 243000,
        growthRate: '35% month-over-month',
        topMarkets: ['US', 'Canada', 'UK']
      },
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'pred-003',
      name: 'Mental Wellness Apps',
      category: 'Health & Wellness',
      confidence: 0.81,
      predictedGrowth: 28.9,
      timeframe: '3 months',
      currentVolume: 18200,
      supportingData: {
        socialMentions: 95000,
        growthRate: '18% month-over-month',
        topMarkets: ['US', 'UK', 'Japan']
      },
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'pred-004',
      name: 'Eco-Friendly Packaging',
      category: 'Sustainability',
      confidence: 0.89,
      predictedGrowth: 41.3,
      timeframe: '6 months',
      currentVolume: 15600,
      supportingData: {
        socialMentions: 128000,
        growthRate: '27% month-over-month',
        topMarkets: ['EU', 'US', 'Australia']
      },
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'pred-005',
      name: 'AR Shopping Experiences',
      category: 'E-commerce',
      confidence: 0.76,
      predictedGrowth: 52.1,
      timeframe: '12 months',
      currentVolume: 8900,
      supportingData: {
        socialMentions: 76000,
        growthRate: '43% month-over-month',
        topMarkets: ['US', 'China', 'South Korea']
      },
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];
}

/**
 * Sample advanced analytics metrics for non-premium users
 */
export interface AdvancedMetrics {
  marketShare: {
    current: number;
    previous: number;
    change: number;
  };
  competitiveAnalysis: Array<{
    competitor: string;
    sharePercentage: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  predictedGrowth: {
    nextQuarter: number;
    nextYear: number;
  };
  regionalPerformance: Array<{
    region: string;
    penetration: number;
    growth: number;
  }>;
  dateRange: {
    start: string;
    end: string;
  };
}

/**
 * Get sample advanced analytics metrics for demo purposes
 * @returns Advanced metrics sample data
 */
export function getSampleAdvancedMetrics(): AdvancedMetrics {
  return {
    marketShare: {
      current: 23.5,
      previous: 21.2,
      change: 2.3
    },
    competitiveAnalysis: [
      {
        competitor: 'Competitor A',
        sharePercentage: 31.8,
        trend: 'down'
      },
      {
        competitor: 'Competitor B',
        sharePercentage: 18.5,
        trend: 'up'
      },
      {
        competitor: 'Competitor C',
        sharePercentage: 15.2,
        trend: 'stable'
      },
      {
        competitor: 'Others',
        sharePercentage: 11.0,
        trend: 'down'
      }
    ],
    predictedGrowth: {
      nextQuarter: 4.2,
      nextYear: 15.7
    },
    regionalPerformance: [
      {
        region: 'North America',
        penetration: 28.4,
        growth: 3.2
      },
      {
        region: 'Europe',
        penetration: 22.1,
        growth: 4.5
      },
      {
        region: 'Asia Pacific',
        penetration: 18.7,
        growth: 7.8
      },
      {
        region: 'Latin America',
        penetration: 9.3,
        growth: 5.1
      }
    ],
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      end: new Date().toISOString()
    }
  };
} 