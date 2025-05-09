import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';

// Types for the correlation data
interface SoundCorrelationPoint {
  soundId: string;
  soundName: string;
  category: string;
  tempo: number;
  duration: number;
  usageCount: number;
  engagementRate: number;
  completionRate: number;
  shareRate: number;
  conversionRate: number;
  userRetentionImpact: number;
}

// Mock data generator for sound-engagement correlation
const generateCorrelationData = (category?: string, minEngagement?: string, sortBy?: string) => {
  // Categories and the number of points to generate for each
  const categories = [
    { name: 'Ambient', count: 10 },
    { name: 'Bass', count: 8 },
    { name: 'Beats', count: 12 },
    { name: 'Cinematic', count: 7 },
    { name: 'Drums', count: 9 },
    { name: 'Electronic', count: 15 },
    { name: 'FX', count: 6 },
    { name: 'Guitar', count: 11 },
    { name: 'Hip Hop', count: 14 },
    { name: 'Vocal', count: 10 },
  ];

  // Generate a certain number of points for each category
  const points: SoundCorrelationPoint[] = [];
  let idCounter = 1;

  for (const cat of categories) {
    // Skip if a specific category was requested and this isn't it
    if (category && cat.name.toLowerCase() !== category.toLowerCase()) {
      continue;
    }

    for (let i = 0; i < cat.count; i++) {
      const tempo = Math.floor(Math.random() * 120) + 60; // 60-180 BPM
      const duration = Math.floor(Math.random() * 180) + 30; // 30-210 seconds
      const usageCount = Math.floor(Math.random() * 10000) + 1000; // 1K-11K
      
      // Engagement metrics with some correlation to tempo and duration
      // Higher tempos generally have higher engagement
      const tempoFactor = (tempo - 60) / 120; // 0.0 to 1.0
      // Mid-range durations have higher engagement
      const durationFactor = 1 - Math.abs((duration - 120) / 90); // 0.0 to 1.0
      
      // Random base values for each metric
      const engagementBase = Math.random() * 0.4 + 0.3; // 0.3 to 0.7
      const completionBase = Math.random() * 0.5 + 0.4; // 0.4 to 0.9
      const shareBase = Math.random() * 0.15 + 0.05; // 0.05 to 0.2
      const conversionBase = Math.random() * 0.2 + 0.1; // 0.1 to 0.3
      const retentionBase = Math.random() * 0.3 + 0.2; // 0.2 to 0.5
      
      // Apply factors to base values
      const engagementRate = Math.min(0.95, engagementBase + tempoFactor * 0.2 + durationFactor * 0.1);
      const completionRate = Math.min(0.98, completionBase + durationFactor * 0.2);
      const shareRate = Math.min(0.3, shareBase + tempoFactor * 0.1);
      const conversionRate = Math.min(0.4, conversionBase + engagementRate * 0.2);
      const userRetentionImpact = Math.min(0.6, retentionBase + completionRate * 0.1 + conversionRate * 0.1);

      // Filter by minimum engagement if requested
      if (minEngagement) {
        const minValue = parseFloat(minEngagement);
        if (engagementRate < minValue) {
          continue;
        }
      }

      points.push({
        soundId: `sound-${idCounter}`,
        soundName: `${cat.name} Sound ${i + 1}`,
        category: cat.name,
        tempo,
        duration,
        usageCount,
        engagementRate,
        completionRate,
        shareRate,
        conversionRate,
        userRetentionImpact,
      });
      
      idCounter++;
    }
  }

  // Sort the data if requested
  if (sortBy) {
    switch (sortBy) {
      case 'engagement':
        points.sort((a, b) => b.engagementRate - a.engagementRate);
        break;
      case 'completion':
        points.sort((a, b) => b.completionRate - a.completionRate);
        break;
      case 'share':
        points.sort((a, b) => b.shareRate - a.shareRate);
        break;
      case 'conversion':
        points.sort((a, b) => b.conversionRate - a.conversionRate);
        break;
      case 'retention':
        points.sort((a, b) => b.userRetentionImpact - a.userRetentionImpact);
        break;
      case 'usage':
        points.sort((a, b) => b.usageCount - a.usageCount);
        break;
      default:
        // No sorting
        break;
    }
  }

  // Generate metrics and insights
  const calculateAverage = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  
  const engagementRates = points.map(p => p.engagementRate);
  const completionRates = points.map(p => p.completionRate);
  const shareRates = points.map(p => p.shareRate);
  const conversionRates = points.map(p => p.conversionRate);
  const retentionImpacts = points.map(p => p.userRetentionImpact);
  
  const avgEngagement = calculateAverage(engagementRates);
  const avgCompletion = calculateAverage(completionRates);
  const avgShare = calculateAverage(shareRates);
  const avgConversion = calculateAverage(conversionRates);
  const avgRetention = calculateAverage(retentionImpacts);
  
  const categoryCounts = categories
    .filter(c => !category || c.name.toLowerCase() === category.toLowerCase())
    .map(c => ({
      category: c.name,
      count: points.filter(p => p.category === c.name).length,
    }));

  return {
    points,
    metrics: {
      totalSounds: points.length,
      avgEngagementRate: avgEngagement,
      avgCompletionRate: avgCompletion,
      avgShareRate: avgShare,
      avgConversionRate: avgConversion,
      avgUserRetentionImpact: avgRetention,
    },
    categories: categoryCounts,
    insights: [
      {
        id: 'insight-1',
        type: 'correlation',
        title: 'Tempo and Engagement',
        description: 'Sounds with higher tempo (120+ BPM) show 15% better engagement rates on average.',
        impact: 'high',
      },
      {
        id: 'insight-2',
        type: 'correlation',
        title: 'Duration and Completion',
        description: 'Sounds between 60-120 seconds have the highest completion rates.',
        impact: 'medium',
      },
      {
        id: 'insight-3',
        type: 'trend',
        title: 'Completion and Conversion',
        description: 'Higher completion rates strongly correlate with improved conversion metrics.',
        impact: 'high',
      },
      {
        id: 'insight-4',
        type: 'recommendation',
        title: 'Share Rate Optimization',
        description: 'Electronic and Hip Hop sounds receive significantly more shares than other categories.',
        impact: 'medium',
      },
    ],
    comparativeAnalysis: {
      topPerformers: points
        .sort((a, b) => b.engagementRate - a.engagementRate)
        .slice(0, 5)
        .map(p => ({
          soundId: p.soundId,
          soundName: p.soundName,
          category: p.category,
          engagementRate: p.engagementRate,
          completionRate: p.completionRate,
          improvementPotential: 1 - p.engagementRate, // How much room for improvement
        })),
      categoryComparison: categories
        .filter(c => !category || c.name.toLowerCase() === category.toLowerCase())
        .map(c => {
          const categoryPoints = points.filter(p => p.category === c.name);
          if (categoryPoints.length === 0) return null;
          
          return {
            category: c.name,
            avgEngagement: calculateAverage(categoryPoints.map(p => p.engagementRate)),
            avgCompletion: calculateAverage(categoryPoints.map(p => p.completionRate)),
            avgShare: calculateAverage(categoryPoints.map(p => p.shareRate)),
            soundCount: categoryPoints.length,
          };
        })
        .filter(c => c !== null),
    }
  };
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category') || undefined;
    const minEngagement = searchParams.get('minEngagement') || undefined;
    const sortBy = searchParams.get('sortBy') || undefined;

    // In a real application, you would fetch this data from your database
    // For now, we'll use mock data
    const data = generateCorrelationData(category, minEngagement, sortBy);

    return NextResponse.json({ 
      success: true, 
      data 
    });
  } catch (error) {
    console.error('Error fetching sound-engagement correlation data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch correlation data' },
      { status: 500 }
    );
  }
} 