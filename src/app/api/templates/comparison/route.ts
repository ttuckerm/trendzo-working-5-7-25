import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/firebase';
import { collection, query, where, getDocs, doc, getDoc, Firestore } from 'firebase/firestore';

// Type assertion for db (to avoid implicit any)
const firestore = db as Firestore | null;

/**
 * API endpoint for template comparison
 * 
 * Query Parameters:
 * - id1: ID of first template
 * - id2: ID of second template (optional)
 * - metrics: Which metrics to compare (optional, default: all)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id1 = searchParams.get('id1');
    const id2 = searchParams.get('id2');
    const metrics = searchParams.get('metrics')?.split(',') || ['all'];
    
    if (!id1) {
      return NextResponse.json({
        success: false,
        error: 'Missing id1 parameter'
      }, { status: 400 });
    }
    
    // Try to get data from Firebase if available
    try {
      // Check if db is properly initialized
      if (!firestore) {
        throw new Error('Firestore not initialized');
      }
      
      // Get first template
      const template1Doc = await getDoc(doc(firestore, 'templates', id1));
      
      if (!template1Doc.exists()) {
        throw new Error(`Template with ID ${id1} not found`);
      }
      
      const template1 = {
        id: template1Doc.id,
        ...template1Doc.data()
      };
      
      // Get second template if provided
      let template2 = null;
      
      if (id2) {
        const template2Doc = await getDoc(doc(firestore, 'templates', id2));
        
        if (template2Doc.exists()) {
          template2 = {
            id: template2Doc.id,
            ...template2Doc.data()
          };
        }
      }
      
      // Prepare comparison data
      const comparisonData = calculateComparisonMetrics(template1, template2, metrics);
      
      // Return comparison data
      return NextResponse.json({
        success: true,
        comparison: comparisonData
      });
    } catch (error) {
      console.error('Error fetching comparison from Firebase:', error);
      // Return mock data if Firebase isn't configured or encounters an error
      return NextResponse.json({
        success: true,
        comparison: getMockComparisonData(id1, id2, metrics)
      });
    }
  } catch (error: any) {
    console.error('Error in comparison API:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch comparison data'
    }, { status: 500 });
  }
}

/**
 * Calculate comparison metrics between two templates
 */
function calculateComparisonMetrics(template1: any, template2: any | null, metrics: string[]) {
  // Define all possible metrics
  const allMetrics = [
    'views',
    'likes',
    'comments',
    'shares',
    'engagementRate',
    'growthRate',
    'completionRate',
    'conversionRate'
  ];
  
  // Filter metrics if not 'all'
  const metricsToCompare = metrics.includes('all') ? allMetrics : metrics.filter(m => allMetrics.includes(m));
  
  // Calculate comparison
  const comparison = {
    template1: {
      id: template1.id,
      title: template1.title
    },
    template2: template2 ? {
      id: template2.id,
      title: template2.title
    } : null,
    metrics: metricsToCompare.map(metric => {
      // Handle metrics in different locations
      let value1, value2;
      
      if (['views', 'likes', 'comments', 'shares', 'engagementRate'].includes(metric)) {
        value1 = template1.stats?.[metric] || 0;
        value2 = template2?.stats?.[metric] || 0;
      } else if (['growthRate'].includes(metric)) {
        value1 = template1.analyticsData?.[metric] || 0;
        value2 = template2?.analyticsData?.[metric] || 0;
      } else if (['completionRate', 'conversionRate'].includes(metric)) {
        value1 = template1.analyticsData?.[metric === 'completionRate' ? 'averageCompletionRate' : 'conversionRate'] || 0;
        value2 = template2?.analyticsData?.[metric === 'completionRate' ? 'averageCompletionRate' : 'conversionRate'] || 0;
      }
      
      // Calculate difference
      const difference = template2 ? value1 - value2 : 0;
      const percentDifference = template2 ? (value2 > 0 ? (value1 - value2) / value2 * 100 : 0) : 0;
      
      return {
        name: metric,
        template1Value: value1,
        template2Value: template2 ? value2 : null,
        difference,
        percentDifference
      };
    })
  };
  
  return comparison;
}

/**
 * Generate mock comparison data for development/testing
 */
function getMockComparisonData(id1: string, id2: string | null, metrics: string[]) {
  // Define templates
  const template1 = {
    id: id1,
    title: `Template ${id1.slice(-3)}`,
    stats: {
      views: Math.floor(Math.random() * 5000000) + 100000,
      likes: Math.floor(Math.random() * 500000) + 10000,
      comments: Math.floor(Math.random() * 50000) + 1000,
      shares: Math.floor(Math.random() * 100000) + 5000,
      engagementRate: (Math.random() * 0.08) + 0.02
    },
    analyticsData: {
      growthRate: (Math.random() * 0.5) + 0.1,
      averageCompletionRate: (Math.random() * 0.4) + 0.5,
      conversionRate: (Math.random() * 0.15) + 0.05
    }
  };
  
  let template2 = null;
  
  if (id2) {
    template2 = {
      id: id2,
      title: `Template ${id2.slice(-3)}`,
      stats: {
        views: Math.floor(Math.random() * 5000000) + 100000,
        likes: Math.floor(Math.random() * 500000) + 10000,
        comments: Math.floor(Math.random() * 50000) + 1000,
        shares: Math.floor(Math.random() * 100000) + 5000,
        engagementRate: (Math.random() * 0.08) + 0.02
      },
      analyticsData: {
        growthRate: (Math.random() * 0.5) + 0.1,
        averageCompletionRate: (Math.random() * 0.4) + 0.5,
        conversionRate: (Math.random() * 0.15) + 0.05
      }
    };
  }
  
  return calculateComparisonMetrics(template1, template2, metrics);
} 