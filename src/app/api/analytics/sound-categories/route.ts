import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';

// Mock data generator for sound category analytics
const generateSoundCategoryData = (timeRange: string = '30d') => {
  const categories = [
    'Ambient', 'Bass', 'Beats', 'Cinematic', 'Drums', 
    'Electronic', 'FX', 'Guitar', 'Hip Hop', 'Loops', 
    'Percussion', 'Piano', 'Pop', 'Synthesizer', 'Vocal'
  ];
  
  // Generate distribution data
  const distribution = categories.map(category => {
    // Random count between 500 and 5000
    const count = Math.floor(Math.random() * 4500) + 500;
    return {
      category,
      count,
      percentage: 0, // Will calculate after generating all data
    };
  });
  
  // Calculate percentages
  const totalCount = distribution.reduce((sum, item) => sum + item.count, 0);
  distribution.forEach(item => {
    item.percentage = Number(((item.count / totalCount) * 100).toFixed(1));
  });
  
  // Sort by count descending
  distribution.sort((a, b) => b.count - a.count);
  
  // Generate trending data
  const trending = categories
    .map(category => {
      // Random growth rate between -10% and +30%
      const growthRate = (Math.random() * 40) - 10;
      // Random velocity between 0 and 10
      const velocity = Math.random() * 10;
      return {
        category,
        growthRate,
        velocity,
        previousRank: Math.floor(Math.random() * categories.length) + 1,
        currentRank: Math.floor(Math.random() * categories.length) + 1,
        rankChange: 0, // Will be calculated later
      };
    })
    // Sort by growth rate descending
    .sort((a, b) => b.growthRate - a.growthRate)
    // Take top 5
    .slice(0, 5);
  
  // Calculate rank changes
  trending.forEach(item => {
    item.rankChange = item.previousRank - item.currentRank;
  });
  
  // Generate time series data for top 5 categories
  const timeRanges = {
    '7d': 7,
    '14d': 14,
    '30d': 30,
    '90d': 90,
    '1y': 52, // Weekly data points for a year
  };
  
  const dataPoints = timeRanges[timeRange as keyof typeof timeRanges] || 30;
  const endDate = new Date();
  const isYearly = timeRange === '1y';
  
  // Generate time series data for top 5 categories
  const timeSeries = distribution.slice(0, 5).map(category => {
    const baseValue = category.count / dataPoints;
    const growthFactor = 1 + (Math.random() * 0.02); // 0-2% growth per period
    
    const seriesData = Array.from({ length: dataPoints }, (_, i) => {
      const date = new Date();
      if (isYearly) {
        // Weekly data points for yearly view
        date.setDate(endDate.getDate() - ((dataPoints - i - 1) * 7));
      } else {
        // Daily data points
        date.setDate(endDate.getDate() - (dataPoints - i - 1));
      }
      const dateStr = date.toISOString().split('T')[0];
      
      return {
        date: dateStr,
        // Some randomness in the growth
        value: Math.floor(baseValue * Math.pow(growthFactor, i) * (0.9 + Math.random() * 0.2)),
      };
    });
    
    return {
      category: category.category,
      data: seriesData,
    };
  });
  
  return {
    timeRange,
    distribution,
    trending,
    timeSeries,
    totalSounds: totalCount,
    categoriesCount: categories.length,
  };
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const timeRange = searchParams.get('timeRange') || '30d';

    // In a real application, you would fetch this data from your database
    // For now, we'll use mock data
    const data = generateSoundCategoryData(timeRange);

    return NextResponse.json({ 
      success: true, 
      data 
    });
  } catch (error) {
    console.error('Error fetching sound category analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch category analytics' },
      { status: 500 }
    );
  }
} 