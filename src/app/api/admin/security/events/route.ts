/**
 * Security Events API
 * Real-time security monitoring and event management
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRateLimiter, RateLimitTiers, KeyGenerators } from '@/lib/security/rate-limiter';
import { requireAuth, Permission } from '@/lib/security/auth-middleware';
import { securityMonitor, SecurityEventType, SecuritySeverity } from '@/lib/security/security-monitor';

// Rate limiting for security events API
const securityEventsRateLimit = createRateLimiter({
  ...RateLimitTiers.ADMIN_OPERATIONS,
  keyGenerator: KeyGenerators.byIPAndUser
});

/**
 * GET /api/admin/security/events
 * Retrieve security events with filtering and pagination
 */
export async function GET(req: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResponse = await securityEventsRateLimit(req);
    if (rateLimitResponse) return rateLimitResponse;

    // Authentication & authorization
    const { authContext, response: authResponse } = await requireAuth([
      Permission.ADMIN_ANALYTICS
    ])(req);
    if (authResponse) return authResponse;

    // Parse query parameters
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
    const severity = url.searchParams.get('severity') as SecuritySeverity;
    const type = url.searchParams.get('type') as SecurityEventType;
    const source = url.searchParams.get('source');
    const timeRange = url.searchParams.get('timeRange') as '1h' | '24h' | '7d' | '30d' || '24h';
    const resolved = url.searchParams.get('resolved');

    // Get metrics and events
    const metrics = await securityMonitor.getMetrics(timeRange);

    // Filter events based on query parameters
    let filteredEvents = metrics.recentEvents;

    if (severity) {
      filteredEvents = filteredEvents.filter(event => event.severity === severity);
    }

    if (type) {
      filteredEvents = filteredEvents.filter(event => event.type === type);
    }

    if (source) {
      filteredEvents = filteredEvents.filter(event => 
        event.source.toLowerCase().includes(source.toLowerCase())
      );
    }

    if (resolved !== null) {
      const isResolved = resolved === 'true';
      filteredEvents = filteredEvents.filter(event => event.resolved === isResolved);
    }

    // Pagination
    const offset = (page - 1) * limit;
    const paginatedEvents = filteredEvents.slice(offset, offset + limit);

    // Calculate summary statistics
    const summary = {
      total: filteredEvents.length,
      bySeverity: {
        critical: filteredEvents.filter(e => e.severity === SecuritySeverity.CRITICAL).length,
        high: filteredEvents.filter(e => e.severity === SecuritySeverity.HIGH).length,
        medium: filteredEvents.filter(e => e.severity === SecuritySeverity.MEDIUM).length,
        low: filteredEvents.filter(e => e.severity === SecuritySeverity.LOW).length
      },
      resolved: filteredEvents.filter(e => e.resolved).length,
      automated: filteredEvents.filter(e => e.actionsTaken?.length).length
    };

    return NextResponse.json({
      success: true,
      data: {
        events: paginatedEvents,
        summary,
        metrics: {
          totalEvents: metrics.totalEvents,
          alertsTriggered: metrics.alertsTriggered,
          actionsAutomated: metrics.actionsAutomated,
          topSources: metrics.topSources.slice(0, 5)
        },
        pagination: {
          page,
          limit,
          total: filteredEvents.length,
          pages: Math.ceil(filteredEvents.length / limit)
        }
      }
    });

  } catch (error) {
    console.error('Security events API error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to fetch security events'
    }, { status: 500 });
  }
}

/**
 * POST /api/admin/security/events
 * Manually create a security event (for testing or manual logging)
 */
export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResponse = await securityEventsRateLimit(req);
    if (rateLimitResponse) return rateLimitResponse;

    // Authentication & authorization
    const { authContext, response: authResponse } = await requireAuth([
      Permission.ADMIN_SYSTEM
    ])(req);
    if (authResponse) return authResponse;

    const body = await req.json();
    
    // Validate required fields
    const { type, severity, title, description, source } = body;
    
    if (!type || !severity || !title || !description || !source) {
      return NextResponse.json({
        error: 'Validation failed',
        message: 'Missing required fields: type, severity, title, description, source'
      }, { status: 400 });
    }

    // Create security event
    await securityMonitor.logEvent({
      type: type as SecurityEventType,
      severity: severity as SecuritySeverity,
      title,
      description,
      source,
      ipAddress: body.ipAddress || req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
      userAgent: body.userAgent || req.headers.get('user-agent'),
      userId: body.userId || authContext.user?.id,
      endpoint: body.endpoint,
      method: body.method,
      statusCode: body.statusCode,
      metadata: {
        ...body.metadata,
        manuallyCreated: true,
        createdBy: authContext.user?.id || authContext.apiKey?.userId
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Security event logged successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Manual security event creation error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to create security event'
    }, { status: 500 });
  }
}