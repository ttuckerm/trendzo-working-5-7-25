import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';

// Mock data generator for sound growth metrics
const generateSoundGrowthData = (soundId?: string, timeRange: string = '30d', compareMode: boolean = false) => {
  const ranges = {
    '7d': 7,
    '14d': 14,
    '30d': 30,
    '90d': 90,
    '1y': 365,
  };
  
  const days = ranges[timeRange as keyof typeof ranges] || 30;
  const endDate = new Date();
  
  // Create an array of dates and metrics for the requested period
  const data = Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(endDate.getDate() - (days - i - 1));
    const dateStr = date.toISOString().split('T')[0];
    
    // Base metric calculations with some randomness
    const baseUsage = Math.floor(Math.random() * 1000) + 500;
    const growthFactor = 1 + (Math.random() * 0.03); // 0-3% daily growth
    
    return {
      date: dateStr,
      usageCount: Math.floor(baseUsage * Math.pow(growthFactor, i)),
      engagement: Math.random() * 100,
      shareRate: Math.random() * 10,
    };
  });
  
  // For comparison mode, add data for multiple sounds
  if (compareMode) {
    // Generate dummy sound IDs if none provided
    const soundIds = soundId ? 
      [soundId, 'sound-2', 'sound-3'] : 
      ['sound-1', 'sound-2', 'sound-3'];
    
    return {
      timeRange,
      sounds: soundIds.map(id => ({
        id,
        name: `Sound ${id.split('-')[1]}`,
        data: data.map(d => ({
          ...d,
          // Vary the metrics slightly for each sound
          usageCount: Math.floor(d.usageCount * (0.8 + Math.random() * 0.4)),
          engagement: d.engagement * (0.8 + Math.random() * 0.4),
          shareRate: d.shareRate * (0.8 + Math.random() * 0.4),
        })),
        totalUsage: Math.floor(Math.random() * 50000) + 10000,
        growthRate: (Math.random() * 30) - 5, // -5% to +25% growth
      })),
    };
  }
  
  // For single sound view
  return {
    timeRange,
    id: soundId || 'sound-1',
    name: soundId ? `Sound ${soundId.split('-')[1]}` : 'Sound 1',
    data,
    metrics: {
      totalUsage: data.reduce((sum, d) => sum + d.usageCount, 0),
      avgEngagement: data.reduce((sum, d) => sum + d.engagement, 0) / data.length,
      avgShareRate: data.reduce((sum, d) => sum + d.shareRate, 0) / data.length,
      growthRate: ((data[data.length - 1].usageCount / data[0].usageCount) - 1) * 100,
    },
    predictedGrowth: {
      next7d: Math.floor(data[data.length - 1].usageCount * (1 + (Math.random() * 0.1))),
      next30d: Math.floor(data[data.length - 1].usageCount * (1 + (Math.random() * 0.25))),
      next90d: Math.floor(data[data.length - 1].usageCount * (1 + (Math.random() * 0.5))),
    },
  };
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const soundId = searchParams.get('soundId') || undefined;
    const timeRange = searchParams.get('timeRange') || '30d';
    const compareMode = searchParams.get('compareMode') === 'true';

    // In a real application, you would fetch this data from your database
    // For now, we'll use mock data
    const data = generateSoundGrowthData(soundId, timeRange, compareMode);

    return NextResponse.json({ 
      success: true, 
      data 
    });
  } catch (error) {
    console.error('Error fetching sound growth metrics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch growth metrics' },
      { status: 500 }
    );
  }
} 