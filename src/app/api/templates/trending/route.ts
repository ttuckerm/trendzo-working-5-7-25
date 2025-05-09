import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/firebase';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
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
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limitParam = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category');
    const timeWindow = searchParams.get('timeWindow') || '7d';
    const minVelocity = parseFloat(searchParams.get('minVelocity') || '5');
    
    // Create base query
    let q = query(
      collection(db, 'templates'),
      where('isActive', '==', true),
      orderBy('trendData.velocityScore', 'desc'),
      limit(limitParam)
    );
    
    // Add category filter if specified
    if (category && category !== 'All') {
      q = query(
        collection(db, 'templates'),
        where('isActive', '==', true),
        where('category', '==', category),
        orderBy('trendData.velocityScore', 'desc'),
        limit(limitParam)
      );
    }
    
    // Execute query
    const querySnapshot = await getDocs(q);
    
    // Process results
    const templates = querySnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }) as TrendingTemplate)
      .filter(template => {
        // Filter by velocity score
        const velocityScore = template.trendData.velocityScore || 0;
        return velocityScore >= minVelocity;
      })
      .map(template => {
        // Map to return format with additional information
        return {
          id: template.id,
          title: template.title,
          category: template.category,
          description: template.description,
          thumbnailUrl: template.thumbnailUrl || '/images/template-placeholder.jpg',
          stats: {
            views: template.stats.views,
            likes: template.stats.likes,
            comments: template.stats.comments,
            shares: template.stats.shares,
            engagementRate: template.stats.engagementRate
          },
          trendData: {
            velocityScore: template.trendData.velocityScore || 0,
            growthRate: template.trendData.growthRate || 0,
            dailyGrowth: template.trendData.dailyGrowth || 0,
            weeklyGrowth: template.trendData.weeklyGrowth || 0
          },
          metadata: {
            duration: template.metadata.duration,
            hashtags: template.metadata.hashtags || [],
            aiDetectedCategory: template.metadata.aiDetectedCategory
          },
          templateStructure: template.templateStructure.map(section => ({
            type: section.type,
            startTime: section.startTime,
            duration: section.duration,
            purpose: section.purpose || ''
          }))
        };
      });
    
    // Return with metadata
    return NextResponse.json({
      success: true,
      count: templates.length,
      timeWindow,
      minVelocity,
      templates
    });
    
  } catch (error: any) {
    console.error('Error fetching trending templates:', error);
    
    // In development mode, return mock data
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({
        success: true,
        count: 5,
        timeWindow: '7d',
        minVelocity: 5,
        templates: getMockTrendingTemplates()
      });
    }
    
    // In production, return error
    return NextResponse.json({
      success: false,
      error: error.message || 'Error fetching trending templates'
    }, { status: 500 });
  }
}

// Mock data for development
function getMockTrendingTemplates() {
  return [
    {
      id: 'template-001',
      title: 'Product Showcase with Benefits',
      category: 'Marketing',
      description: 'A highly effective template for showcasing products with clear benefit statements',
      thumbnailUrl: '/images/product-template.jpg',
      stats: {
        views: 1250000,
        likes: 95000,
        comments: 8500,
        shares: 12000,
        engagementRate: 9.2
      },
      trendData: {
        velocityScore: 8.7,
        growthRate: 142,
        dailyGrowth: 12.5,
        weeklyGrowth: 85.3
      },
      metadata: {
        duration: 25,
        hashtags: ['#product', '#marketing', '#showcase'],
        aiDetectedCategory: 'Product'
      },
      templateStructure: [
        { type: 'Hook', startTime: 0, duration: 3, purpose: 'Attention grabbing opening with problem statement' },
        { type: 'Introduction', startTime: 3, duration: 5, purpose: 'Product reveal with main benefit' },
        { type: 'Feature 1', startTime: 8, duration: 5, purpose: 'Highlight first key feature' },
        { type: 'Feature 2', startTime: 13, duration: 5, purpose: 'Highlight second key feature' },
        { type: 'Call to Action', startTime: 18, duration: 7, purpose: 'Clear CTA with urgency element' }
      ]
    },
    {
      id: 'template-002',
      title: 'Tutorial Step-by-Step Guide',
      category: 'Education',
      description: 'Clear step-by-step tutorial format that drives high completion rates',
      thumbnailUrl: '/images/tutorial-template.jpg',
      stats: {
        views: 980000,
        likes: 85000,
        comments: 12000,
        shares: 18000,
        engagementRate: 11.8
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
      templateStructure: [
        { type: 'Hook', startTime: 0, duration: 5, purpose: 'Promise of value with before/after glimpse' },
        { type: 'Introduction', startTime: 5, duration: 8, purpose: 'Explain what viewers will learn' },
        { type: 'Step 1', startTime: 13, duration: 8, purpose: 'First key action demonstrated' },
        { type: 'Step 2', startTime: 21, duration: 8, purpose: 'Second key action demonstrated' },
        { type: 'Step 3', startTime: 29, duration: 8, purpose: 'Third key action demonstrated' },
        { type: 'Results', startTime: 37, duration: 5, purpose: 'Show completed result' },
        { type: 'Call to Action', startTime: 42, duration: 3, purpose: 'Ask for engagement and suggest follow' }
      ]
    },
    {
      id: 'template-003',
      title: 'Transition Dance Challenge',
      category: 'Dance',
      description: 'Multi-transition dance template that\'s easy to adapt and highly shareable',
      thumbnailUrl: '/images/dance-template.jpg',
      stats: {
        views: 3500000,
        likes: 420000,
        comments: 25000,
        shares: 95000,
        engagementRate: 15.4
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
      templateStructure: [
        { type: 'Starting Pose', startTime: 0, duration: 4, purpose: 'Eye-catching pose with beat anticipation' },
        { type: 'First Transition', startTime: 4, duration: 2, purpose: 'Smooth visual effect transition' },
        { type: 'First Sequence', startTime: 6, duration: 6, purpose: 'First dance sequence aligned with beat' },
        { type: 'Second Transition', startTime: 12, duration: 2, purpose: 'Creative transition to new setting/outfit' },
        { type: 'Second Sequence', startTime: 14, duration: 6, purpose: 'Second dance sequence with higher energy' },
        { type: 'Third Transition', startTime: 20, duration: 2, purpose: 'Final dramatic transition' },
        { type: 'Final Sequence', startTime: 22, duration: 6, purpose: 'Final sequence with most impressive moves' },
        { type: 'Ending Pose', startTime: 28, duration: 2, purpose: 'Memorable ending pose on final beat' }
      ]
    },
    {
      id: 'template-004',
      title: 'Before and After Transformation',
      category: 'Lifestyle',
      description: 'Powerful transformation reveal template with strong emotional impact',
      thumbnailUrl: '/images/transformation-template.jpg',
      stats: {
        views: 1850000,
        likes: 220000,
        comments: 18500,
        shares: 45000,
        engagementRate: 15.3
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
      templateStructure: [
        { type: 'Before State', startTime: 0, duration: 6, purpose: 'Show the starting condition/situation' },
        { type: 'Transition Effect', startTime: 6, duration: 3, purpose: 'Dramatic transition with music build-up' },
        { type: 'After Reveal', startTime: 9, duration: 8, purpose: 'Dramatic reveal of transformation results' },
        { type: 'Call to Action', startTime: 17, duration: 3, purpose: 'Inspirational message with engagement prompt' }
      ]
    },
    {
      id: 'template-005',
      title: 'Comedy Skit Format',
      category: 'Comedy',
      description: 'Short comedy format with twist ending that drives high completion rates',
      thumbnailUrl: '/images/comedy-template.jpg',
      stats: {
        views: 2750000,
        likes: 380000,
        comments: 42000,
        shares: 125000,
        engagementRate: 19.9
      },
      trendData: {
        velocityScore: 9.5,
        growthRate: 210,
        dailyGrowth: 18.7,
        weeklyGrowth: 95.4
      },
      metadata: {
        duration: 35,
        hashtags: ['#comedy', '#skit', '#funny'],
        aiDetectedCategory: 'Comedy'
      },
      templateStructure: [
        { type: 'Setup', startTime: 0, duration: 8, purpose: 'Establish character/situation with clear premise' },
        { type: 'Escalation', startTime: 8, duration: 12, purpose: 'Build tension through dialogue/action' },
        { type: 'Twist', startTime: 20, duration: 5, purpose: 'Unexpected twist that subverts expectations' },
        { type: 'Punchline', startTime: 25, duration: 5, purpose: 'Final punchline with comedic resolution' },
        { type: 'Reaction', startTime: 30, duration: 5, purpose: 'Character reaction or callback for extra laugh' }
      ]
    }
  ];
} 