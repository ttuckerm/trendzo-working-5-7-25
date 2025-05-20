import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/firebase';
// import { collection, query, where, getDocs, orderBy, limit, Firestore } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore'; // Keep type if needed
import { checkSubscriptionAccess } from '@/middleware/checkSubscription';
import { isDemoRequest, getSampleAdvancedMetrics } from '@/lib/utils/demoData';

const ROUTE_DISABLED_MSG = "templates/analytics route: Firebase backend is removed. Analytics will be mocked.";

// Type assertion for db (to avoid implicit any)
const firestore = db as Firestore | null;

/**
 * API endpoint for template analytics
 * 
 * Query Parameters:
 * - timeRange: 7d, 30d, 90d, all (default: 30d)
 * - category: filter by category (optional)
 * - limit: number of templates to return (default: 10)
 * - sort: views, engagement, growth (default: views)
 * 
 * Advanced analytics metrics require premium subscription.
 * Non-premium users can access demo data by adding ?demo=true
 */
export async function GET(request: NextRequest) {
  try {
    console.warn(ROUTE_DISABLED_MSG);
    // Check subscription access with our middleware
    const subscriptionCheck = await checkSubscriptionAccess(request, {
      requiredTier: 'premium',
      allowDemoData: true
    });
    
    // If the subscription check returned a response, return it directly
    if (subscriptionCheck) {
      // If it's a demo request, return sample data
      if (isDemoRequest(request)) {
        const demoMetrics = getSampleAdvancedMetrics();
        const { searchParams } = new URL(request.url);
        const timeRange = searchParams.get('timeRange') || '30d';
        const category = searchParams.get('category');
        
        // Return demo analytics data
        return NextResponse.json({
          success: true,
          timeRange,
          category: category || 'All',
          isDemo: true,
          templates: getMockAnalyticsData(timeRange, category),
          advancedMetrics: demoMetrics
        });
      }
      
      return subscriptionCheck;
    }
    
    // If we reach here, the user has the required subscription level
    // Continue with normal flow
    
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '30d';
    const category = searchParams.get('category');
    const templateLimit = parseInt(searchParams.get('limit') || '10');
    const sort = searchParams.get('sort') || 'views';
    
    // Calculate date range based on timeRange
    const now = new Date();
    let startDate = new Date();
    
    switch(timeRange) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case 'all':
        startDate.setFullYear(2020, 0, 1); // Set a far past date
        break;
      default: // '30d'
        startDate.setDate(now.getDate() - 30);
    }
    
    // Try to get data from Firebase if available - THIS IS NOW DISABLED
    // try {
      // Check if db is properly initialized
      // if (!firestore) {
      //   throw new Error('Firestore not initialized');
      // }
      
      // Create base query
      // let q = query(
      //   collection(firestore, 'templates'),
      //   where('isActive', '==', true),
      //   orderBy(`stats.${sort === 'engagement' ? 'engagementRate' : sort === 'growth' ? 'growthRate' : 'views'}`, 'desc'),
      //   limit(templateLimit)
      // );
      
      // Add category filter if specified
      // if (category && category !== 'All') {
      //   q = query(
      //     collection(firestore, 'templates'),
      //     where('isActive', '==', true),
      //     where('category', '==', category),
      //     orderBy(`stats.${sort === 'engagement' ? 'engagementRate' : sort === 'growth' ? 'growthRate' : 'views'}`, 'desc'),
      //     limit(templateLimit)
      //   );
      // }
      
      // Execute query
      // const querySnapshot = await getDocs(q);
      
      // Process results
      // const templates = querySnapshot.docs.map(doc => ({
      //   id: doc.id,
      //   ...doc.data()
      // }));
      
      // Return actual data with time range info
      // return NextResponse.json({
      //   success: true,
      //   timeRange,
      //   category: category || 'All',
      //   sort,
      //   count: templates.length,
      //   templates
      // });
    // } catch (error) {
    //   console.error('Error fetching analytics from Firebase:', error);
      // Return mock data if Firebase isn't configured or encounters an error
      return NextResponse.json({
        success: true,
        timeRange,
        category: category || 'All',
        sort,
        // count: 10, // getMockAnalyticsData returns 10 by default
        templates: getMockAnalyticsData(timeRange, category, sort)
      });
    // }
  } catch (error: any) {
    console.error('Error in analytics API:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch analytics data'
    }, { status: 500 });
  }
}

/**
 * Generate mock analytics data for development/testing
 */
function getMockAnalyticsData(timeRange: string, category?: string | null, sort?: string | null) {
  // Categories for random assignment if not specified
  const categories = ['Tutorial', 'Marketing', 'Dance', 'Lifestyle', 'Comedy', 'Fashion'];
  const selectedCategory = category && category !== 'All' ? category : null;
  
  // Generate 10 templates with analytics data
  return Array.from({ length: 10 }, (_, i) => {
    // Generate realistic randomized analytics data
    const views = Math.floor(Math.random() * 5000000) + 100000;
    const likes = Math.floor(views * (Math.random() * 0.2 + 0.05));
    const comments = Math.floor(views * (Math.random() * 0.05 + 0.01));
    const shares = Math.floor(views * (Math.random() * 0.1 + 0.02));
    const engagementRate = (likes + comments + shares) / views;
    const growthRate = Math.random() * 0.5 + 0.1; // 10-60% growth
    
    // Generate historical data points
    const historyPoints = 7;
    const viewHistory = generateHistoricalData(views, growthRate, historyPoints, timeRange);
    const engagementHistory = generateHistoricalData(engagementRate, growthRate / 2, historyPoints, timeRange);
    
    return {
      id: `template-${i + 1}`,
      title: `Template ${String.fromCharCode(65 + i)} - ${selectedCategory || categories[i % categories.length]}`,
      category: selectedCategory || categories[i % categories.length],
      thumbnailUrl: `https://picsum.photos/seed/template${i}/400/225`,
      stats: {
        views,
        likes,
        comments,
        shares,
        engagementRate
      },
      analyticsData: {
        growthRate,
        viewTrend: Math.random() > 0.7 ? 'decreasing' : 'increasing',
        bestPerformingDemographic: ['18-24', '25-34', '35-44'][Math.floor(Math.random() * 3)],
        averageCompletionRate: Math.random() * 0.4 + 0.5, // 50-90% completion rate
        conversionRate: Math.random() * 0.15 + 0.05, // 5-20% conversion
      },
      historyData: {
        dates: generateDateLabels(timeRange, historyPoints),
        views: viewHistory,
        engagementRate: engagementHistory
      },
      industryBenchmarks: {
        views: Math.floor(views * (Math.random() * 0.3 + 0.7)), // 70-100% of views
        engagementRate: engagementRate * (Math.random() * 0.3 + 0.7) // 70-100% of engagement
      }
    };
  }).sort((a, b) => {
    // Sort based on selected sort method
    if (sort === 'engagement') {
      return b.stats.engagementRate - a.stats.engagementRate;
    } else if (sort === 'growth') {
      return b.analyticsData.growthRate - a.analyticsData.growthRate;
    }
    // Default sort by views
    return b.stats.views - a.stats.views;
  });
}

/**
 * Generate historical data points
 */
function generateHistoricalData(currentValue: number, growthRate: number, points: number, timeRange: string) {
  // Factor to adjust growth based on time range
  const growthFactor = 
    timeRange === '7d' ? 0.05 : 
    timeRange === '30d' ? 0.2 : 
    timeRange === '90d' ? 0.5 : 1;
  
  // Generate points working backward from current value
  return Array.from({ length: points }, (_, i) => {
    // More recent points are closer to currentValue
    // Earlier points show more variance
    const pointPosition = (points - i) / points; // 1 -> 0 as i increases
    const reduction = currentValue * growthRate * growthFactor * pointPosition;
    const variance = currentValue * 0.1 * Math.random(); // Add some randomness
    
    // Earlier values are lower (showing growth to current)
    return Math.max(currentValue - reduction + variance, currentValue * 0.1);
  });
}

/**
 * Generate date labels for the historical data
 */
function generateDateLabels(timeRange: string, points: number) {
  const dates = [];
  const today = new Date();
  
  // Determine interval based on time range
  let interval: number;
  switch (timeRange) {
    case '7d':
      interval = 1; // 1 day interval
      break;
    case '30d':
      interval = 5; // 5 day interval
      break;
    case '90d':
      interval = 15; // 15 day interval
      break;
    default: // 'all'
      interval = 30; // 30 day interval
  }
  
  // Generate date labels
  for (let i = 0; i < points; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - (i * interval));
    dates.unshift(date.toISOString().split('T')[0]); // Format as YYYY-MM-DD
  }
  
  return dates;
} 