import { NextResponse } from 'next/server';
import { ErrorLogEntry } from '@/lib/control-center/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // In production, query your error logging system/database
    // For now, return known issues
    const errors: ErrorLogEntry[] = [
      {
        id: '1',
        source: 'Upload Test',
        sourcePath: '/admin/upload-test',
        message: 'Prediction error: 39.3 DPS over-prediction (182%)',
        timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        severity: 'error',
        resolved: false
      },
      {
        id: '2',
        source: 'Bulk Download',
        sourcePath: '/admin/bulk-download',
        message: 'Kling API connection timeout after 30s',
        timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        severity: 'error',
        resolved: false
      },
      {
        id: '3',
        source: 'Signup',
        sourcePath: '/auth?signup=true',
        message: 'Email verification service not configured',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        severity: 'error',
        resolved: false
      },
      {
        id: '4',
        source: 'Trend Timing',
        sourcePath: '/admin/component-test',
        message: 'Rate limit exceeded for trend API',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        severity: 'warning',
        resolved: false
      },
      {
        id: '5',
        source: 'Algorithm IQ',
        sourcePath: '/admin/algorithm-iq',
        message: 'Insufficient data points for 30-day trend',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        severity: 'warning',
        resolved: false
      }
    ];
    
    return NextResponse.json({ errors });
  } catch (error) {
    console.error('Error fetching error logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch error logs' },
      { status: 500 }
    );
  }
}
































































































