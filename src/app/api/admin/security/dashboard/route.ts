/**
 * Security Dashboard API
 * Real-time security metrics and dashboard data
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRateLimiter, RateLimitTiers, KeyGenerators } from '@/lib/security/rate-limiter';
import { requireAuth, Permission } from '@/lib/security/auth-middleware';
import { securityMonitor, SecuritySeverity, SecurityEventType } from '@/lib/security/security-monitor';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_ANON_KEY } from '@/lib/env';

// Rate limiting for dashboard
const dashboardRateLimit = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60, // 1 request per second
  keyGenerator: KeyGenerators.byIPAndUser
});

// Lazily create DB client to avoid build-time env checks
function getDb(){
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY);
}

/**
 * GET /api/admin/security/dashboard
 * Get comprehensive security dashboard data
 */
export async function GET(req: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResponse = await dashboardRateLimit(req);
    if (rateLimitResponse) return rateLimitResponse;

    // Authentication & authorization
    const { authContext, response: authResponse } = await requireAuth([
      Permission.ADMIN_ANALYTICS
    ])(req);
    if (authResponse) return authResponse;

    // Get time range from query
    const url = new URL(req.url);
    const timeRange = url.searchParams.get('timeRange') as '1h' | '24h' | '7d' | '30d' || '24h';
    
    // Get security metrics
    const metrics = await securityMonitor.getMetrics(timeRange);

    // Get additional dashboard data
    const dashboardData = await Promise.all([
      getActiveThreats(),
      getBlockedIPs(),
      getSystemHealth(),
      getSecurityTrends(timeRange),
      getTopVulnerabilities(),
      getAPISecurityStatus()
    ]);

    const [
      activeThreats,
      blockedIPs,
      systemHealth,
      securityTrends,
      topVulnerabilities,
      apiSecurityStatus
    ] = dashboardData;

    // Calculate security score
    const securityScore = calculateSecurityScore(metrics, systemHealth);

    // Build comprehensive dashboard response
    const dashboard = {
      // Overview metrics
      overview: {
        securityScore,
        totalEvents: metrics.totalEvents,
        alertsTriggered: metrics.alertsTriggered,
        actionsAutomated: metrics.actionsAutomated,
        activeThreats: activeThreats.length,
        blockedIPs: blockedIPs.length,
        lastUpdated: new Date().toISOString()
      },

      // Severity breakdown
      severity: {
        critical: metrics.eventsBySeverity[SecuritySeverity.CRITICAL] || 0,
        high: metrics.eventsBySeverity[SecuritySeverity.HIGH] || 0,
        medium: metrics.eventsBySeverity[SecuritySeverity.MEDIUM] || 0,
        low: metrics.eventsBySeverity[SecuritySeverity.LOW] || 0
      },

      // Event types breakdown
      eventTypes: Object.entries(metrics.eventsByType)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),

      // Top security sources (IPs, etc.)
      topSources: metrics.topSources.slice(0, 10),

      // Recent critical events
      recentCriticalEvents: metrics.recentEvents
        .filter(event => event.severity === SecuritySeverity.CRITICAL)
        .slice(0, 5),

      // Active threats
      activeThreats,

      // Blocked IPs with details
      blockedIPs,

      // System health
      systemHealth,

      // Security trends over time
      trends: securityTrends,

      // Top vulnerabilities
      vulnerabilities: topVulnerabilities,

      // API security status
      apiSecurity: apiSecurityStatus,

      // Recommendations
      recommendations: generateSecurityRecommendations(metrics, systemHealth)
    };

    return NextResponse.json({
      success: true,
      data: dashboard,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Security dashboard API error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to generate security dashboard'
    }, { status: 500 });
  }
}

/**
 * Helper functions for dashboard data
 */

async function getActiveThreats() {
  try {
    const { data } = await getDb()
      .from('security_events')
      .select('*')
      .in('severity', [SecuritySeverity.CRITICAL, SecuritySeverity.HIGH])
      .eq('resolved', false)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(10);

    return data || [];
  } catch (error) {
    console.error('Failed to fetch active threats:', error);
    return [];
  }
}

async function getBlockedIPs() {
  try {
    const { data } = await supabase
      .from('blocked_ips')
      .select('*')
      .eq('is_active', true)
      .order('blocked_at', { ascending: false })
      .limit(20);

    return data?.map(ip => ({
      ...ip,
      blockedDuration: Date.now() - new Date(ip.blocked_at).getTime()
    })) || [];
  } catch (error) {
    console.error('Failed to fetch blocked IPs:', error);
    return [];
  }
}

async function getSystemHealth() {
  try {
    // Get recent error rates
    const { data: recentEvents } = await getDb()
      .from('security_events')
      .select('type, severity, created_at')
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()); // Last hour

    const events = recentEvents || [];
    const totalEvents = events.length;
    const criticalEvents = events.filter(e => e.severity === SecuritySeverity.CRITICAL).length;
    const highEvents = events.filter(e => e.severity === SecuritySeverity.HIGH).length;

    // Calculate health score (0-100)
    let healthScore = 100;
    healthScore -= criticalEvents * 10; // -10 per critical event
    healthScore -= highEvents * 5; // -5 per high event
    healthScore = Math.max(0, healthScore);

    return {
      score: healthScore,
      status: healthScore >= 90 ? 'excellent' : 
              healthScore >= 70 ? 'good' : 
              healthScore >= 50 ? 'warning' : 'critical',
      eventsLastHour: totalEvents,
      criticalEvents,
      highEvents,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      lastCheck: new Date().toISOString()
    };
  } catch (error) {
    console.error('Failed to calculate system health:', error);
    return {
      score: 0,
      status: 'unknown',
      eventsLastHour: 0,
      criticalEvents: 0,
      highEvents: 0,
      uptime: 0,
      memoryUsage: process.memoryUsage(),
      lastCheck: new Date().toISOString()
    };
  }
}

async function getSecurityTrends(timeRange: string) {
  try {
    const hours = timeRange === '1h' ? 1 : 
                  timeRange === '24h' ? 24 : 
                  timeRange === '7d' ? 168 : 720; // 30 days

    const { data } = await getDb()
      .from('security_events')
      .select('type, severity, created_at')
      .gte('created_at', new Date(Date.now() - hours * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: true });

    if (!data) return [];

    // Group events by hour
    const hourlyData = data.reduce((acc, event) => {
      const hour = new Date(event.created_at).toISOString().substring(0, 13);
      if (!acc[hour]) {
        acc[hour] = { total: 0, critical: 0, high: 0, medium: 0, low: 0 };
      }
      acc[hour].total++;
      acc[hour][event.severity]++;
      return acc;
    }, {} as Record<string, any>);

    return Object.entries(hourlyData).map(([hour, counts]) => ({
      time: hour,
      ...counts
    }));
  } catch (error) {
    console.error('Failed to fetch security trends:', error);
    return [];
  }
}

async function getTopVulnerabilities() {
  try {
    const { data } = await getDb()
      .from('security_events')
      .select('type, count(*)')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .group('type')
      .order('count', { ascending: false })
      .limit(10);

    return data?.map(item => ({
      type: item.type,
      count: item.count,
      severity: getVulnerabilitySeverity(item.type),
      description: getVulnerabilityDescription(item.type)
    })) || [];
  } catch (error) {
    console.error('Failed to fetch top vulnerabilities:', error);
    return [];
  }
}

async function getAPISecurityStatus() {
  try {
    const { data: apiKeys } = await getDb()
      .from('api_keys')
      .select('is_active, expires_at, last_used, created_at');

    const { data: recentAPIEvents } = await getDb()
      .from('security_events')
      .select('*')
      .not('api_key_id', 'is', null)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const totalKeys = apiKeys?.length || 0;
    const activeKeys = apiKeys?.filter(key => key.is_active).length || 0;
    const expiredKeys = apiKeys?.filter(key => 
      key.expires_at && new Date(key.expires_at) < new Date()
    ).length || 0;
    const unusedKeys = apiKeys?.filter(key => !key.last_used).length || 0;

    return {
      totalKeys,
      activeKeys,
      expiredKeys,
      unusedKeys,
      recentViolations: recentAPIEvents?.length || 0,
      healthScore: Math.round((activeKeys / Math.max(totalKeys, 1)) * 100)
    };
  } catch (error) {
    console.error('Failed to fetch API security status:', error);
    return {
      totalKeys: 0,
      activeKeys: 0,
      expiredKeys: 0,
      unusedKeys: 0,
      recentViolations: 0,
      healthScore: 0
    };
  }
}

function calculateSecurityScore(metrics: any, systemHealth: any): number {
  let score = 100;

  // Deduct for recent critical events
  const criticalEvents = metrics.eventsBySeverity[SecuritySeverity.CRITICAL] || 0;
  score -= criticalEvents * 15;

  // Deduct for high severity events
  const highEvents = metrics.eventsBySeverity[SecuritySeverity.HIGH] || 0;
  score -= highEvents * 8;

  // Deduct for medium severity events
  const mediumEvents = metrics.eventsBySeverity[SecuritySeverity.MEDIUM] || 0;
  score -= mediumEvents * 3;

  // Factor in system health
  score = (score + systemHealth.score) / 2;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function generateSecurityRecommendations(metrics: any, systemHealth: any) {
  const recommendations = [];

  if (metrics.eventsBySeverity[SecuritySeverity.CRITICAL] > 0) {
    recommendations.push({
      priority: 'critical',
      title: 'Critical Security Events Detected',
      description: 'Immediate attention required for critical security events',
      action: 'Review and resolve critical events in the security log'
    });
  }

  if (systemHealth.score < 70) {
    recommendations.push({
      priority: 'high',
      title: 'System Health Below Threshold',
      description: 'System health score indicates potential security issues',
      action: 'Investigate recent security events and system performance'
    });
  }

  if (metrics.totalEvents > 1000) {
    recommendations.push({
      priority: 'medium',
      title: 'High Security Event Volume',
      description: 'Unusually high number of security events detected',
      action: 'Review security policies and consider tightening controls'
    });
  }

  return recommendations;
}

function getVulnerabilitySeverity(type: string): SecuritySeverity {
  const severityMap: Record<string, SecuritySeverity> = {
    [SecurityEventType.SQL_INJECTION_ATTEMPT]: SecuritySeverity.CRITICAL,
    [SecurityEventType.XSS_ATTEMPT]: SecuritySeverity.HIGH,
    [SecurityEventType.CSRF_ATTEMPT]: SecuritySeverity.HIGH,
    [SecurityEventType.PATH_TRAVERSAL_ATTEMPT]: SecuritySeverity.MEDIUM,
    [SecurityEventType.RATE_LIMIT_EXCEEDED]: SecuritySeverity.MEDIUM,
    [SecurityEventType.FAILED_LOGIN]: SecuritySeverity.LOW
  };

  return severityMap[type] || SecuritySeverity.LOW;
}

function getVulnerabilityDescription(type: string): string {
  const descriptions: Record<string, string> = {
    [SecurityEventType.SQL_INJECTION_ATTEMPT]: 'Attempts to inject malicious SQL code',
    [SecurityEventType.XSS_ATTEMPT]: 'Cross-site scripting attack attempts',
    [SecurityEventType.CSRF_ATTEMPT]: 'Cross-site request forgery attempts',
    [SecurityEventType.PATH_TRAVERSAL_ATTEMPT]: 'Attempts to access unauthorized files',
    [SecurityEventType.RATE_LIMIT_EXCEEDED]: 'Excessive request rate violations',
    [SecurityEventType.FAILED_LOGIN]: 'Failed authentication attempts'
  };

  return descriptions[type] || 'Security event detected';
}