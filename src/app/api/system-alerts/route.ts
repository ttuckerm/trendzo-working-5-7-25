import { NextResponse } from 'next/server';
import { AlertService, SystemAlert } from '@/lib/services/alertService';

interface AlertsApiResponse {
  success: boolean;
  data?: SystemAlert[];
  count?: number;
  message?: string;
  error?: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    console.log(`[SYSTEM ALERTS API] Fetching alerts - unreadOnly: ${unreadOnly}, limit: ${limit}`);

    let alerts: SystemAlert[];
    
    if (unreadOnly) {
      alerts = await AlertService.getUnreadAlerts();
    } else {
      alerts = await AlertService.getAllAlerts(limit);
    }

    console.log(`[SYSTEM ALERTS API] Retrieved ${alerts.length} alerts`);

    return NextResponse.json({
      success: true,
      data: alerts,
      count: alerts.length
    } as AlertsApiResponse);

  } catch (error) {
    console.error('[SYSTEM ALERTS API] Error fetching alerts:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch system alerts',
        data: [],
        count: 0
      } as AlertsApiResponse,
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { severity, source, message } = body;

    console.log(`[SYSTEM ALERTS API] Creating new alert: ${severity} from ${source}`);

    // Validate required fields
    if (!severity || !source || !message) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: severity, source, and message are required' 
        } as AlertsApiResponse,
        { status: 400 }
      );
    }

    // Validate severity
    if (!['info', 'warning', 'error'].includes(severity)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid severity. Must be one of: info, warning, error' 
        } as AlertsApiResponse,
        { status: 400 }
      );
    }

    const alert = await AlertService.logAlert(severity, source, message);

    console.log(`[SYSTEM ALERTS API] Alert created successfully with ID: ${alert.id}`);

    return NextResponse.json({
      success: true,
      data: [alert],
      message: 'Alert created successfully'
    } as AlertsApiResponse);

  } catch (error) {
    console.error('[SYSTEM ALERTS API] Error creating alert:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create alert' 
      } as AlertsApiResponse,
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, markAllAsRead } = body;

    console.log(`[SYSTEM ALERTS API] Marking alerts as read - id: ${id}, markAll: ${markAllAsRead}`);

    if (markAllAsRead) {
      await AlertService.markAllAlertsAsRead();
      console.log('[SYSTEM ALERTS API] All alerts marked as read');
      
      return NextResponse.json({
        success: true,
        message: 'All alerts marked as read'
      } as AlertsApiResponse);
    } else if (id) {
      await AlertService.markAlertAsRead(parseInt(id, 10));
      console.log(`[SYSTEM ALERTS API] Alert ${id} marked as read`);
      
      return NextResponse.json({
        success: true,
        message: 'Alert marked as read'
      } as AlertsApiResponse);
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Either id or markAllAsRead must be provided' 
        } as AlertsApiResponse,
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('[SYSTEM ALERTS API] Error updating alerts:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update alerts' 
      } as AlertsApiResponse,
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function DELETE() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405 }
  );
}