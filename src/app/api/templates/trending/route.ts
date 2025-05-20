import { NextRequest, NextResponse } from 'next/server';
// import { db } from '@/lib/firebase/firebase'; // Firebase db is null
// import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore'; // Firebase SDK
import { TrendingTemplate } from '@/lib/types/trendingTemplate';

/**
 * API endpoint to fetch trending templates
 * 
 * Query Parameters:
 * - limit: number of templates to return (default: 10)
 * - category: filter by category
 * - timeWindow: 7d, 30d, all (default: 7d)
 * - minVelocity: minimum velocity score (default: 5)
 */
export async function GET(request: NextRequest) {
  console.warn("Trending templates API: Firebase backend has been removed. Returning mock data for now. TODO: Implement with Supabase.");

  const { searchParams } = new URL(request.url);
  const timeWindow = searchParams.get('timeWindow') || '7d';
  const minVelocity = parseFloat(searchParams.get('minVelocity') || '5');

  // Always return mock data as Firebase is removed
  // Original Firebase query logic has been removed.
  try {
    const mockTemplates = getMockTrendingTemplates(); // Assuming this function is defined below
    return NextResponse.json({
      success: true,
      message: "Data is currently mocked as Firebase is disabled. TODO: Reimplement with Supabase.",
      count: mockTemplates.length,
      timeWindow,
      minVelocity,
      templates: mockTemplates
    });
  } catch (error: any) {
    console.error('Error in mock trending templates (this should not happen if getMockTrendingTemplates is stable):', error);
    return NextResponse.json({
      success: false,
      error: 'Error generating mock trending templates'
    }, { status: 500 });
  }
}

// Mock data for development ( 수정됨 )
function getMockTrendingTemplates(): Partial<TrendingTemplate>[] { 
  return [
    {
      id: 'template-001',
      title: 'Product Showcase with Benefits',
      category: 'Marketing',
      description: 'A highly effective template for showcasing products with clear benefit statements',
      thumbnailUrl: '/images/product-template.jpg',
      authorName: 'Mock Creator A',
      tags: ['product', 'marketing', 'showcase'],
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
      stats: {
        views: 1250000,
        likes: 95000,
        usageCount: 7500,
        commentCount: 8500, // Renamed from comments
        shareCount: 12000,   // Renamed from shares
      },
      trendData: {
        velocityScore: 8.7,
        growthRate: 142,
        dailyGrowth: 12.5,
        weeklyGrowth: 85.3
      },
      metadata: {
        duration: 25,
        hashtags: ['#product', '#marketing', '#showcase'], // Kept for consistency with old mock, though TrendingTemplate.tags is primary
        aiDetectedCategory: 'Product'
      },
      // templateStructure removed as it's not in TrendingTemplate type for this endpoint
    },
    {
      id: 'template-002',
      title: 'Tutorial Step-by-Step Guide',
      category: 'Education',
      description: 'Clear step-by-step tutorial format that drives high completion rates',
      thumbnailUrl: '/images/tutorial-template.jpg',
      authorName: 'Mock Educator B',
      tags: ['tutorial', 'howto', 'learnontiktok'],
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
      stats: {
        views: 980000,
        likes: 85000,
        usageCount: 11000,
        commentCount: 12000,
        shareCount: 18000,
      },
      trendData: {
        velocityScore: 9.2,
        growthRate: 165,
        dailyGrowth: 15.8,
        weeklyGrowth: 92.1
      },
      metadata: {
        duration: 45,
        hashtags: ['#tutorial', '#howto', '#learnontiktok'],
        aiDetectedCategory: 'Tutorial'
      },
    },
    {
      id: 'template-003',
      title: 'Transition Dance Challenge',
      category: 'Dance',
      description: 'Multi-transition dance template that\'s easy to adapt and highly shareable',
      thumbnailUrl: '/images/dance-template.jpg',
      authorName: 'Mock Dancer C',
      tags: ['dance', 'transition', 'challenge'],
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(), // 1 day ago
      stats: {
        views: 3500000,
        likes: 420000,
        usageCount: 25000,
        commentCount: 25000,
        shareCount: 95000,
      },
      trendData: {
        velocityScore: 9.8,
        growthRate: 218,
        dailyGrowth: 22.5,
        weeklyGrowth: 105.3
      },
      metadata: {
        duration: 30,
        hashtags: ['#dance', '#transition', '#challenge'],
        aiDetectedCategory: 'Entertainment'
      },
    },
    {
      id: 'template-004',
      title: 'Before and After Transformation',
      category: 'Lifestyle',
      description: 'Powerful transformation reveal template with strong emotional impact',
      thumbnailUrl: '/images/transformation-template.jpg',
      authorName: 'Mock Influencer D',
      tags: ['transformation', 'beforeandafter', 'change'],
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), // 7 days ago
      stats: {
        views: 1850000,
        likes: 220000,
        usageCount: 15000,
        commentCount: 18500,
        shareCount: 45000,
      },
      trendData: {
        velocityScore: 8.5,
        growthRate: 175,
        dailyGrowth: 13.2,
        weeklyGrowth: 78.5
      },
      metadata: {
        duration: 20,
        hashtags: ['#transformation', '#beforeandafter', '#change'],
        aiDetectedCategory: 'Lifestyle'
      },
    },
    {
      id: 'template-005',
      title: 'Quick Tip Tutorial',
      category: 'Education',
      description: 'Short, impactful tutorial delivering a quick win for viewers.',
      thumbnailUrl: '/images/quick-tip-template.jpg',
      authorName: 'Mock Expert E',
      tags: ['quicktip', 'tutorial', 'protip'],
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
      stats: {
        views: 750000,
        likes: 65000,
        usageCount: 9000,
        commentCount: 7000,
        shareCount: 10000,
      },
      trendData: {
        velocityScore: 7.9,
        growthRate: 130,
        dailyGrowth: 10.5,
        weeklyGrowth: 70.2
      },
      metadata: {
        duration: 15,
        hashtags: ['#quicktip', '#tutorial', '#protip'],
        aiDetectedCategory: 'Education'
      },
    }
  ];
} 