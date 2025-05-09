import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { generateContentComparison } from '@/lib/analytics/expertAnalyticsPipeline';
import { db } from '@/lib/firebase/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  Timestamp
} from 'firebase/firestore';

/**
 * API endpoint for retrieving expert vs. automated content comparison data
 * 
 * Query parameters:
 * - period: Time period (7d, 30d, 90d, all) - defaults to 30d
 * - refresh: If true, regenerates the comparison data instead of using cached values
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Parse query parameters
    const { searchParams } = request.nextUrl;
    const period = searchParams.get('period') || '30d';
    const refresh = searchParams.get('refresh') === 'true';
    
    // If refresh is requested and user has admin/premium access, generate new comparison
    if (refresh) {
      const comparison = await generateContentComparison(period);
      
      if (!comparison) {
        return NextResponse.json(
          { error: 'Failed to generate comparison data' },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        success: true,
        data: comparison,
        source: 'fresh'
      });
    }
    
    // Otherwise, try to fetch the most recent comparison for this period
    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
        startDate = new Date(2020, 0, 1); // Far in the past
        break;
      case '30d':
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }
    
    // Query for most recent comparison with this period
    const comparisonsQuery = query(
      collection(db, 'contentPerformanceComparisons'),
      where('period', '==', period),
      where('createdAt', '>=', Timestamp.fromDate(new Date(now.getTime() - 24 * 60 * 60 * 1000))), // Last 24 hours
      orderBy('createdAt', 'desc'),
      limit(1)
    );
    
    const comparisonSnapshot = await getDocs(comparisonsQuery);
    
    if (comparisonSnapshot.empty) {
      // No recent comparison found, generate a new one
      const comparison = await generateContentComparison(period);
      
      if (!comparison) {
        return NextResponse.json(
          { error: 'Failed to generate comparison data' },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        success: true,
        data: comparison,
        source: 'fresh'
      });
    }
    
    // Return the most recent comparison
    const comparisonData = comparisonSnapshot.docs[0].data();
    
    return NextResponse.json({
      success: true,
      data: comparisonData,
      source: 'cached',
      cachedAt: comparisonData.createdAt?.toDate?.() || new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in expert-vs-automated analytics endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve comparison data' },
      { status: 500 }
    );
  }
}

/**
 * Handles POST requests for tagging templates as expert or automated
 */
export async function POST(request: NextRequest) {
  try {
    // Check for admin/editor authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Check for admin/editor role
    const userRole = session.user.role;
    if (!['admin', 'editor', 'expert'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }
    
    if (body.isExpert === undefined) {
      return NextResponse.json(
        { error: 'isExpert field is required' },
        { status: 400 }
      );
    }
    
    // Import the function we need to tag templates
    const { tagTemplateSource } = await import('@/lib/analytics/expertAnalyticsPipeline');
    
    // Tag the template
    const success = await tagTemplateSource(
      body.templateId,
      body.isExpert,
      body.creatorId || (body.isExpert ? session.user.id : 'automated-system'),
      body.notes
    );
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to tag template' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: `Template successfully tagged as ${body.isExpert ? 'expert' : 'automated'} content`
    });
  } catch (error) {
    console.error('Error tagging template:', error);
    return NextResponse.json(
      { error: 'Failed to tag template' },
      { status: 500 }
    );
  }
} 