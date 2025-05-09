import { NextRequest, NextResponse } from 'next/server';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  Timestamp,
  DocumentData,
  Firestore
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';

// Define types for analytics data
interface AnalyticsItem extends DocumentData {
  id: string;
  templateId?: string;
  source?: string;
  campaign?: string;
  action?: string;
  timestamp?: Timestamp;
  metadata?: Record<string, any>;
}

// Mock data for development mode or when Firebase fails
const MOCK_DATA = {
  period: '30d',
  summary: {
    clicks: 2547,
    views: 1832,
    edits: 976,
    saves: 412,
    viewToEditRate: 53.3,
    clickToEditRate: 38.3,
    editToSaveRate: 42.2,
  },
  campaigns: [
    { 
      name: 'Weekly Newsletter', 
      clicks: 1254, 
      views: 879, 
      edits: 463, 
      saves: 198,
      viewToEditRate: 52.7,
      clickToEditRate: 36.9,
      editToSaveRate: 42.8,
    },
    { 
      name: 'Tips & Tricks', 
      clicks: 842, 
      views: 612, 
      edits: 341, 
      saves: 157,
      viewToEditRate: 55.7,
      clickToEditRate: 40.5,
      editToSaveRate: 46.0,
    },
    { 
      name: 'Product Update', 
      clicks: 451, 
      views: 341, 
      edits: 172, 
      saves: 57,
      viewToEditRate: 50.4,
      clickToEditRate: 38.1,
      editToSaveRate: 33.1,
    }
  ]
};

/**
 * API route for newsletter statistics
 * Retrieves aggregated data on newsletter performance
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const period = searchParams.get('period') || '30d';
  const campaign = searchParams.get('campaign') || 'all';
  
  try {
    // Check if we're in development mode or testing
    if (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
      console.log('Using mock data for newsletter stats');
      return NextResponse.json(MOCK_DATA);
    }
    
    // Make sure Firebase is initialized
    if (!db) {
      console.error('Firebase not initialized');
      return NextResponse.json(MOCK_DATA);
    }
    
    // Cast db to Firestore to avoid TypeScript errors
    const firestore = db as Firestore;
    
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
    
    try {
      // Create the base query
      let analyticsQuery;
      
      if (campaign !== 'all') {
        analyticsQuery = query(
          collection(firestore, 'template_analytics'),
          where('source', '==', 'newsletter'),
          where('campaign', '==', campaign),
          where('timestamp', '>=', Timestamp.fromDate(startDate)),
          orderBy('timestamp', 'desc')
        );
      } else {
        analyticsQuery = query(
          collection(firestore, 'template_analytics'),
          where('source', '==', 'newsletter'),
          where('timestamp', '>=', Timestamp.fromDate(startDate)),
          orderBy('timestamp', 'desc')
        );
      }
      
      // Execute the query
      const analyticsSnapshot = await getDocs(analyticsQuery);
      
      // Process the data
      const analyticsData = analyticsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AnalyticsItem[];
      
      // Calculate metrics
      const clickCount = analyticsData.filter(item => item.action === 'click').length;
      const viewCount = analyticsData.filter(item => item.action === 'view').length;
      const editCount = analyticsData.filter(item => item.action === 'edit').length;
      const saveCount = analyticsData.filter(item => item.action === 'save').length;
      
      // Calculate rates
      const viewToEditRate = viewCount > 0 ? (editCount / viewCount) * 100 : 0;
      const clickToEditRate = clickCount > 0 ? (editCount / clickCount) * 100 : 0;
      const editToSaveRate = editCount > 0 ? (saveCount / editCount) * 100 : 0;
      
      // Return the data
      return NextResponse.json({
        period,
        summary: {
          clicks: clickCount,
          views: viewCount,
          edits: editCount,
          saves: saveCount,
          viewToEditRate,
          clickToEditRate,
          editToSaveRate,
        }
      });
    } catch (error) {
      console.error('Error getting newsletter stats:', error);
      // Return mock data on error
      return NextResponse.json(MOCK_DATA);
    }
  } catch (error) {
    console.error('Error in newsletter-stats API:', error);
    return NextResponse.json(MOCK_DATA);
  }
} 