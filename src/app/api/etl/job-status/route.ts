import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  try {
    // In development mode, always return mock data
    if (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true') {
      return NextResponse.json({
        success: true,
        jobs: getMockJobs()
      });
    }
    
    // Check for API key
    const apiKey = request.headers.get('x-api-key');
    if (apiKey !== process.env.ADMIN_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limitParam = parseInt(searchParams.get('limit') || '20');
    
    // Ensure db is initialized
    if (!db) {
      throw new Error('Firebase database not initialized');
    }
    
    // Create a query to get the most recent ETL jobs
    const q = query(
      collection(db, 'etlJobs'),
      orderBy('startTime', 'desc'),
      limit(limitParam)
    );
    
    // Get the jobs
    const querySnapshot = await getDocs(q);
    const jobs = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Return the jobs
    return NextResponse.json({
      success: true,
      jobs
    });
    
  } catch (error: any) {
    console.error('Error fetching ETL job status:', error);
    
    // In development mode, return mock data
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({
        success: true,
        jobs: getMockJobs()
      });
    }
    
    // Otherwise, return an error
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error occurred'
    }, { status: 500 });
  }
}

// Mock data for development
function getMockJobs() {
  return [
    {
      id: '1',
      name: 'Daily Trending Templates',
      type: 'trending',
      status: 'completed',
      startTime: new Date(Date.now() - 3600000).toISOString(),
      endTime: new Date(Date.now() - 3550000).toISOString(),
      result: {
        processed: 28,
        failed: 2,
        templates: 20
      }
    },
    {
      id: '2',
      name: 'Beauty Category Analysis',
      type: 'category',
      status: 'running',
      startTime: new Date(Date.now() - 120000).toISOString()
    },
    {
      id: '3',
      name: 'Template Similarity Detection',
      type: 'find-similar',
      status: 'failed',
      startTime: new Date(Date.now() - 7200000).toISOString(),
      endTime: new Date(Date.now() - 7150000).toISOString(),
      error: 'API limit exceeded'
    },
    {
      id: '4',
      name: 'Weekly Analytics Update',
      type: 'detect-trending',
      status: 'scheduled',
      startTime: new Date(Date.now() + 3600000).toISOString()
    }
  ];
} 