/**
 * Comprehensive Monitoring Dashboard API
 * Real-time performance and business metrics endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRateLimiter, RateLimitTiers, KeyGenerators } from '@/lib/security/rate-limiter';
import { requireAuth, Permission } from '@/lib/security/auth-middleware';
import { metricsCollector, MetricType } from '@/lib/monitoring/metrics-collector';
import { businessMetricsCalculator, TimePeriod } from '@/lib/monitoring/business-metrics';
import { alertManager } from '@/lib/monitoring/alert-manager';

// Rate limiting for dashboard
const dashboardRateLimit = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 120, // 2 requests per second
  keyGenerator: KeyGenerators.byIPAndUser
});

/**
 * GET /api/admin/monitoring/dashboard
 * Get comprehensive monitoring dashboard data
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

    // Parse query parameters
    const url = new URL(req.url);
    const timeRange = url.searchParams.get('timeRange') as TimePeriod || TimePeriod.DAY;
    const includeDetails = url.searchParams.get('details') === 'true';

    // Get current time window
    const endTime = new Date();
    const startTime = getStartTime(endTime, timeRange);

    // Fetch all monitoring data in parallel
    const [
      performanceMetrics,
      businessDashboard,
      systemHealth,
      realTimeMetrics,
      alertSummary,
      trends
    ] = await Promise.all([
      getPerformanceMetrics(startTime, endTime),
      businessMetricsCalculator.getBusinessDashboard(timeRange),
      getSystemHealth(),
      getRealTimeMetrics(),
      getAlertSummary(),
      includeDetails ? getTrendData(startTime, endTime) : null
    ]);

    // Calculate overall health score
    const overallHealth = calculateOverallHealth(
      performanceMetrics,
      systemHealth,
      businessDashboard,
      alertSummary
    );

    const dashboard = {
      // Overview
      overview: {
        healthScore: overallHealth.score,
        status: overallHealth.status,
        lastUpdated: new Date().toISOString(),
        timeRange,
        activeCriticalAlerts: alertSummary.critical,
        totalUsers: businessDashboard.userEngagement.activeUsers.daily,
        systemUptime: systemHealth.uptime
      },

      // Performance metrics
      performance: {
        api: {
          responseTime: performanceMetrics.api.averageResponseTime,
          throughput: performanceMetrics.api.requestsPerSecond,
          errorRate: performanceMetrics.api.errorRate,
          p95ResponseTime: performanceMetrics.api.p95ResponseTime,
          totalRequests: performanceMetrics.api.totalRequests,
          availability: performanceMetrics.api.availability
        },
        system: {
          cpu: systemHealth.cpu,
          memory: systemHealth.memory,
          disk: systemHealth.disk,
          network: systemHealth.network
        },
        database: {
          connections: performanceMetrics.database.activeConnections,
          queryTime: performanceMetrics.database.averageQueryTime,
          lockWaitTime: performanceMetrics.database.lockWaitTime,
          cacheHitRate: performanceMetrics.database.cacheHitRate
        }
      },

      // Business metrics
      business: {
        kpis: businessDashboard.kpis,
        userEngagement: {
          activeUsers: businessDashboard.userEngagement.activeUsers,
          engagement: businessDashboard.userEngagement.engagement,
          retention: businessDashboard.userEngagement.retention
        },
        viralPredictions: {
          accuracy: businessDashboard.viralPredictions.accuracy.overall,
          totalPredictions: businessDashboard.viralPredictions.performance.totalPredictions,
          predictionsPerDay: businessDashboard.viralPredictions.usage.predictionsPerDay,
          popularNiches: businessDashboard.viralPredictions.usage.popularNiches.slice(0, 5)
        },
        revenue: {
          mrr: businessDashboard.revenue.subscriptions.mrr,
          totalRevenue: businessDashboard.revenue.revenue.total,
          churnRate: businessDashboard.revenue.subscriptions.churnRate,
          conversionRate: businessDashboard.revenue.conversion.trialToSubscription
        }
      },

      // Real-time metrics
      realTime: {
        currentUsers: realTimeMetrics.activeUsers,
        requestsPerMinute: realTimeMetrics.requestsPerMinute,
        errorCount: realTimeMetrics.errors,
        responseTime: realTimeMetrics.responseTime,
        queueLength: realTimeMetrics.queueLength
      },

      // Alerts summary
      alerts: {
        total: alertSummary.total,
        bySeverity: alertSummary.bySeverity,
        recent: alertSummary.recent.slice(0, 10),
        trends: alertSummary.trends
      },

      // Top endpoints performance
      endpoints: performanceMetrics.endpoints.slice(0, 10),

      // Trends (if requested)
      trends: trends ? {
        performance: trends.performance,
        business: trends.business,
        alerts: trends.alerts
      } : null
    };

    return NextResponse.json({
      success: true,
      data: dashboard,
      generatedAt: new Date().toISOString(),
      timeRange,
      dataPoints: {
        performance: performanceMetrics.dataPoints,
        business: businessDashboard.kpis.length,
        alerts: alertSummary.total
      }
    });

  } catch (error) {
    console.error('Monitoring dashboard API error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to generate monitoring dashboard'
    }, { status: 500 });
  }
}

/**
 * Helper functions for data aggregation
 */

async function getPerformanceMetrics(startTime: Date, endTime: Date) {
  try {
    // Query API performance metrics
    const [apiMetrics, databaseMetrics] = await Promise.all([
      metricsCollector.queryMetrics({
        names: ['api_request_duration', 'api_request_count'],
        startTime,
        endTime
      }),
      metricsCollector.queryMetrics({
        names: ['database_query_time', 'database_connections'],
        startTime,
        endTime
      })
    ]);

    // Process API metrics
    const requestDurations = apiMetrics.filter(m => m.name === 'api_request_duration');
    const requestCounts = apiMetrics.filter(m => m.name === 'api_request_count');

    const totalRequests = requestCounts.reduce((sum, m) => sum + m.value, 0);
    const averageResponseTime = requestDurations.length > 0 ?
      requestDurations.reduce((sum, m) => sum + m.value, 0) / requestDurations.length : 0;

    const errorRequests = requestCounts.filter(m => {
      const statusCode = parseInt(m.labels.status_code || '200');
      return statusCode >= 400;
    }).reduce((sum, m) => sum + m.value, 0);

    const errorRate = totalRequests > 0 ? (errorRequests / totalRequests) * 100 : 0;

    // Calculate P95 response time
    const sortedDurations = requestDurations.map(m => m.value).sort((a, b) => a - b);
    const p95Index = Math.floor(sortedDurations.length * 0.95);
    const p95ResponseTime = sortedDurations[p95Index] || 0;

    // Calculate requests per second
    const timeRangeSeconds = (endTime.getTime() - startTime.getTime()) / 1000;
    const requestsPerSecond = totalRequests / Math.max(timeRangeSeconds, 1);

    // Group by endpoints
    const endpointMap = new Map<string, { 
      requests: number; 
      totalDuration: number; 
      errors: number; 
      durations: number[] 
    }>();

    requestCounts.forEach(metric => {
      const endpoint = metric.labels.endpoint || 'unknown';
      const statusCode = parseInt(metric.labels.status_code || '200');
      const isError = statusCode >= 400;

      if (!endpointMap.has(endpoint)) {
        endpointMap.set(endpoint, { requests: 0, totalDuration: 0, errors: 0, durations: [] });
      }

      const endpointData = endpointMap.get(endpoint)!;
      endpointData.requests += metric.value;
      if (isError) endpointData.errors += metric.value;
    });

    requestDurations.forEach(metric => {
      const endpoint = metric.labels.endpoint || 'unknown';
      if (endpointMap.has(endpoint)) {
        const endpointData = endpointMap.get(endpoint)!;
        endpointData.totalDuration += metric.value;
        endpointData.durations.push(metric.value);
      }
    });

    const endpoints = Array.from(endpointMap.entries()).map(([endpoint, data]) => ({
      endpoint,
      requests: data.requests,
      averageResponseTime: data.requests > 0 ? data.totalDuration / data.requests : 0,
      errorRate: data.requests > 0 ? (data.errors / data.requests) * 100 : 0,
      p95ResponseTime: calculatePercentile(data.durations, 95)
    })).sort((a, b) => b.requests - a.requests);

    // Process database metrics
    const dbQueryTimes = databaseMetrics.filter(m => m.name === 'database_query_time');
    const dbConnections = databaseMetrics.filter(m => m.name === 'database_connections');

    const averageQueryTime = dbQueryTimes.length > 0 ?
      dbQueryTimes.reduce((sum, m) => sum + m.value, 0) / dbQueryTimes.length : 0;

    const activeConnections = dbConnections.length > 0 ?
      dbConnections[dbConnections.length - 1].value : 0;

    return {
      api: {
        totalRequests,
        averageResponseTime,
        errorRate,
        p95ResponseTime,
        requestsPerSecond,
        availability: Math.max(0, 100 - errorRate) // Simplified availability calculation
      },
      database: {
        activeConnections,
        averageQueryTime,
        lockWaitTime: 0, // Would be calculated from specific metrics
        cacheHitRate: 95 // Would be calculated from cache metrics
      },
      endpoints,
      dataPoints: apiMetrics.length + databaseMetrics.length
    };

  } catch (error) {
    console.error('Failed to get performance metrics:', error);
    return {
      api: {
        totalRequests: 0,
        averageResponseTime: 0,
        errorRate: 0,
        p95ResponseTime: 0,
        requestsPerSecond: 0,
        availability: 0
      },
      database: {
        activeConnections: 0,
        averageQueryTime: 0,
        lockWaitTime: 0,
        cacheHitRate: 0
      },
      endpoints: [],
      dataPoints: 0
    };
  }
}

async function getSystemHealth() {
  try {
    // Get system metrics
    const systemMetrics = await metricsCollector.queryMetrics({
      names: ['system_memory_usage', 'system_uptime'],
      startTime: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
      endTime: new Date()
    });

    const memoryMetrics = systemMetrics.filter(m => m.name === 'system_memory_usage');
    const uptimeMetrics = systemMetrics.filter(m => m.name === 'system_uptime');

    // Get current memory usage
    const heapUsed = memoryMetrics
      .filter(m => m.labels.type === 'heap_used')
      .reduce((sum, m) => sum + m.value, 0) / Math.max(memoryMetrics.filter(m => m.labels.type === 'heap_used').length, 1);

    const heapTotal = memoryMetrics
      .filter(m => m.labels.type === 'heap_total')
      .reduce((sum, m) => sum + m.value, 0) / Math.max(memoryMetrics.filter(m => m.labels.type === 'heap_total').length, 1);

    const memoryUsagePercentage = heapTotal > 0 ? (heapUsed / heapTotal) * 100 : 0;

    const uptime = uptimeMetrics.length > 0 ? uptimeMetrics[uptimeMetrics.length - 1].value : process.uptime();

    return {
      cpu: {
        usage: getCPUUsage(), // Would implement actual CPU monitoring
        cores: require('os').cpus().length
      },
      memory: {
        used: heapUsed,
        total: heapTotal,
        percentage: memoryUsagePercentage
      },
      disk: {
        used: 0, // Would implement disk monitoring
        total: 0,
        percentage: 0
      },
      network: {
        bytesIn: 0, // Would implement network monitoring
        bytesOut: 0,
        packetsIn: 0,
        packetsOut: 0
      },
      uptime
    };

  } catch (error) {
    console.error('Failed to get system health:', error);
    return {
      cpu: { usage: 0, cores: 1 },
      memory: { used: 0, total: 0, percentage: 0 },
      disk: { used: 0, total: 0, percentage: 0 },
      network: { bytesIn: 0, bytesOut: 0, packetsIn: 0, packetsOut: 0 },
      uptime: 0
    };
  }
}

async function getRealTimeMetrics() {
  try {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

    const recentMetrics = await metricsCollector.queryMetrics({
      names: ['api_request_count', 'api_request_duration'],
      startTime: oneMinuteAgo,
      endTime: now
    });

    const requestsLastMinute = recentMetrics
      .filter(m => m.name === 'api_request_count')
      .reduce((sum, m) => sum + m.value, 0);

    const errorsLastMinute = recentMetrics
      .filter(m => m.name === 'api_request_count')
      .filter(m => {
        const statusCode = parseInt(m.labels.status_code || '200');
        return statusCode >= 400;
      })
      .reduce((sum, m) => sum + m.value, 0);

    const responseTimes = recentMetrics
      .filter(m => m.name === 'api_request_duration')
      .map(m => m.value);

    const currentResponseTime = responseTimes.length > 0 ?
      responseTimes.reduce((sum, val) => sum + val, 0) / responseTimes.length : 0;

    return {
      activeUsers: await getActiveUsersCount(),
      requestsPerMinute: requestsLastMinute,
      errors: errorsLastMinute,
      responseTime: currentResponseTime,
      queueLength: 0 // Would integrate with queue monitoring
    };

  } catch (error) {
    console.error('Failed to get real-time metrics:', error);
    return {
      activeUsers: 0,
      requestsPerMinute: 0,
      errors: 0,
      responseTime: 0,
      queueLength: 0
    };
  }
}

async function getAlertSummary() {
  try {
    const activeAlerts = alertManager.getActiveAlerts();
    
    const bySeverity = {
      critical: activeAlerts.filter(a => a.severity === 'critical').length,
      high: activeAlerts.filter(a => a.severity === 'high').length,
      medium: activeAlerts.filter(a => a.severity === 'medium').length,
      low: activeAlerts.filter(a => a.severity === 'low').length
    };

    const recent = activeAlerts
      .sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime())
      .slice(0, 20);

    return {
      total: activeAlerts.length,
      critical: bySeverity.critical,
      bySeverity,
      recent,
      trends: await getAlertTrends()
    };

  } catch (error) {
    console.error('Failed to get alert summary:', error);
    return {
      total: 0,
      critical: 0,
      bySeverity: { critical: 0, high: 0, medium: 0, low: 0 },
      recent: [],
      trends: []
    };
  }
}

async function getTrendData(startTime: Date, endTime: Date) {
  try {
    // Get hourly aggregated data for trends
    const [performanceTrends, businessTrends, alertTrends] = await Promise.all([
      getPerformanceTrends(startTime, endTime),
      getBusinessTrends(startTime, endTime),
      getAlertTrends()
    ]);

    return {
      performance: performanceTrends,
      business: businessTrends,
      alerts: alertTrends
    };

  } catch (error) {
    console.error('Failed to get trend data:', error);
    return {
      performance: [],
      business: [],
      alerts: []
    };
  }
}

async function getPerformanceTrends(startTime: Date, endTime: Date) {
  const aggregated = await metricsCollector.aggregateMetrics({
    names: ['api_request_duration', 'api_request_count'],
    startTime,
    endTime,
    aggregation: 'avg',
    interval: '1h'
  });

  return aggregated.map(metric => ({
    timestamp: metric.timestamp,
    responseTime: metric.name === 'api_request_duration' ? metric.value : null,
    requests: metric.name === 'api_request_count' ? metric.value : null
  }));
}

async function getBusinessTrends(startTime: Date, endTime: Date) {
  const aggregated = await metricsCollector.aggregateMetrics({
    names: ['viral_prediction_count', 'viral_prediction_accuracy'],
    startTime,
    endTime,
    aggregation: 'sum',
    interval: '1h'
  });

  return aggregated.map(metric => ({
    timestamp: metric.timestamp,
    predictions: metric.name === 'viral_prediction_count' ? metric.value : null,
    accuracy: metric.name === 'viral_prediction_accuracy' ? metric.value : null
  }));
}

async function getAlertTrends() {
  // Implementation would track alert patterns over time
  return [];
}

function calculateOverallHealth(performance: any, system: any, business: any, alerts: any) {
  let score = 100;

  // Deduct for performance issues
  if (performance.api.errorRate > 5) score -= 20;
  if (performance.api.averageResponseTime > 2000) score -= 15;
  if (performance.api.availability < 99) score -= 25;

  // Deduct for system issues
  if (system.memory.percentage > 90) score -= 15;
  if (system.cpu.usage > 90) score -= 15;

  // Deduct for critical alerts
  score -= alerts.critical * 10;
  score -= alerts.bySeverity.high * 5;

  // Deduct for business metric issues
  if (business.viralPredictions.accuracy < 80) score -= 10;

  score = Math.max(0, Math.min(100, score));

  let status = 'excellent';
  if (score < 50) status = 'critical';
  else if (score < 70) status = 'warning';
  else if (score < 90) status = 'good';

  return { score, status };
}

/**
 * Utility functions
 */

function getStartTime(endTime: Date, period: TimePeriod): Date {
  const start = new Date(endTime);
  
  switch (period) {
    case TimePeriod.HOUR:
      start.setHours(start.getHours() - 1);
      break;
    case TimePeriod.DAY:
      start.setDate(start.getDate() - 1);
      break;
    case TimePeriod.WEEK:
      start.setDate(start.getDate() - 7);
      break;
    case TimePeriod.MONTH:
      start.setMonth(start.getMonth() - 1);
      break;
    default:
      start.setDate(start.getDate() - 1);
  }
  
  return start;
}

function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0;
  
  const sorted = values.sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

function getCPUUsage(): number {
  // Simplified CPU usage - in production would use proper monitoring
  const load = require('os').loadavg()[0];
  const cpus = require('os').cpus().length;
  return Math.min(100, (load / cpus) * 100);
}

async function getActiveUsersCount(): Promise<number> {
  try {
    // Get active sessions in last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const userMetrics = await metricsCollector.queryMetrics({
      names: ['user_engagement'],
      startTime: fiveMinutesAgo,
      endTime: new Date()
    });

    const uniqueUsers = new Set(userMetrics.map(m => m.labels.user_id));
    return uniqueUsers.size;
  } catch (error) {
    return 0;
  }
}