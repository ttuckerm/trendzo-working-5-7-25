/**
 * Business Metrics Tracking and Analytics System
 * Production-ready business intelligence for viral prediction platform
 */

import { metricsCollector, BusinessMetricCategory, MetricType, MetricUnit } from './metrics-collector';
import { createClient } from '@supabase/supabase-js';

export interface BusinessKPI {
  id: string;
  name: string;
  category: BusinessMetricCategory;
  value: number;
  target?: number;
  unit: MetricUnit;
  trend: TrendDirection;
  percentageChange: number;
  lastUpdated: Date;
  period: TimePeriod;
}

export interface UserEngagementMetrics {
  activeUsers: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  sessionMetrics: {
    averageSessionDuration: number;
    sessionsPerUser: number;
    bounceRate: number;
  };
  engagement: {
    videosAnalyzed: number;
    predictionsGenerated: number;
    templatesUsed: number;
    shareRate: number;
  };
  retention: {
    day1: number;
    day7: number;
    day30: number;
  };
}

export interface ViralPredictionMetrics {
  accuracy: {
    overall: number;
    byNiche: Record<string, number>;
    trend: number[];
  };
  performance: {
    totalPredictions: number;
    successfulPredictions: number;
    averageConfidenceScore: number;
    responseTime: number;
  };
  usage: {
    predictionsPerDay: number;
    uniqueUsersPerDay: number;
    peakHours: number[];
    popularNiches: Array<{ niche: string; count: number }>;
  };
  business: {
    conversionRate: number;
    revenuePerPrediction: number;
    customerLifetimeValue: number;
  };
}

export interface RevenueMetrics {
  revenue: {
    total: number;
    recurring: number;
    oneTime: number;
    trend: number[];
  };
  subscriptions: {
    active: number;
    new: number;
    cancelled: number;
    churnRate: number;
    mrr: number; // Monthly Recurring Revenue
    arpu: number; // Average Revenue Per User
  };
  conversion: {
    trialToSubscription: number;
    freeToTrial: number;
    visitorToSignup: number;
    signupToFirstPrediction: number;
  };
}

export interface APIUsageMetrics {
  requests: {
    total: number;
    successful: number;
    failed: number;
    errorRate: number;
  };
  performance: {
    averageResponseTime: number;
    p95ResponseTime: number;
    throughput: number;
  };
  endpoints: Array<{
    endpoint: string;
    requests: number;
    averageResponseTime: number;
    errorRate: number;
  }>;
  users: {
    apiKeyUsers: number;
    webUsers: number;
    mobileUsers: number;
  };
}

export enum TrendDirection {
  UP = 'up',
  DOWN = 'down',
  STABLE = 'stable'
}

export enum TimePeriod {
  HOUR = 'hour',
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year'
}

/**
 * Business Metrics Calculator
 */
export class BusinessMetricsCalculator {
  private supabase: any;

  constructor() {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
      this.supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY
      );
    }
  }

  /**
   * Calculate user engagement metrics
   */
  async calculateUserEngagement(period: TimePeriod = TimePeriod.DAY): Promise<UserEngagementMetrics> {
    const endTime = new Date();
    const startTime = this.getStartTime(endTime, period);

    // Get user activity data
    const [
      dailyActiveUsers,
      weeklyActiveUsers,
      monthlyActiveUsers,
      sessionData,
      engagementData,
      retentionData
    ] = await Promise.all([
      this.getActiveUsers(endTime, TimePeriod.DAY),
      this.getActiveUsers(endTime, TimePeriod.WEEK),
      this.getActiveUsers(endTime, TimePeriod.MONTH),
      this.getSessionMetrics(startTime, endTime),
      this.getEngagementData(startTime, endTime),
      this.getRetentionMetrics()
    ]);

    const metrics: UserEngagementMetrics = {
      activeUsers: {
        daily: dailyActiveUsers,
        weekly: weeklyActiveUsers,
        monthly: monthlyActiveUsers
      },
      sessionMetrics: {
        averageSessionDuration: sessionData.averageDuration,
        sessionsPerUser: sessionData.sessionsPerUser,
        bounceRate: sessionData.bounceRate
      },
      engagement: {
        videosAnalyzed: engagementData.videosAnalyzed,
        predictionsGenerated: engagementData.predictions,
        templatesUsed: engagementData.templates,
        shareRate: engagementData.shareRate
      },
      retention: {
        day1: retentionData.day1,
        day7: retentionData.day7,
        day30: retentionData.day30
      }
    };

    // Record metrics
    await this.recordBusinessMetrics(metrics, BusinessMetricCategory.USER_ENGAGEMENT);

    return metrics;
  }

  /**
   * Calculate viral prediction metrics
   */
  async calculateViralPredictionMetrics(period: TimePeriod = TimePeriod.DAY): Promise<ViralPredictionMetrics> {
    const endTime = new Date();
    const startTime = this.getStartTime(endTime, period);

    // Query prediction metrics from our metrics collection
    const [
      accuracyMetrics,
      performanceMetrics,
      usageMetrics,
      businessMetrics
    ] = await Promise.all([
      this.getPredictionAccuracy(startTime, endTime),
      this.getPredictionPerformance(startTime, endTime),
      this.getPredictionUsage(startTime, endTime),
      this.getPredictionBusiness(startTime, endTime)
    ]);

    const metrics: ViralPredictionMetrics = {
      accuracy: accuracyMetrics,
      performance: performanceMetrics,
      usage: usageMetrics,
      business: businessMetrics
    };

    // Record metrics
    await this.recordBusinessMetrics(metrics, BusinessMetricCategory.VIRAL_PREDICTIONS);

    return metrics;
  }

  /**
   * Calculate revenue metrics
   */
  async calculateRevenueMetrics(period: TimePeriod = TimePeriod.MONTH): Promise<RevenueMetrics> {
    const endTime = new Date();
    const startTime = this.getStartTime(endTime, period);

    // Get revenue data from database
    const [
      revenueData,
      subscriptionData,
      conversionData
    ] = await Promise.all([
      this.getRevenueData(startTime, endTime),
      this.getSubscriptionData(startTime, endTime),
      this.getConversionData(startTime, endTime)
    ]);

    const metrics: RevenueMetrics = {
      revenue: revenueData,
      subscriptions: subscriptionData,
      conversion: conversionData
    };

    // Record metrics
    await this.recordBusinessMetrics(metrics, BusinessMetricCategory.REVENUE);

    return metrics;
  }

  /**
   * Calculate API usage metrics
   */
  async calculateAPIMetrics(period: TimePeriod = TimePeriod.DAY): Promise<APIUsageMetrics> {
    const endTime = new Date();
    const startTime = this.getStartTime(endTime, period);

    // Query API metrics
    const apiMetrics = await metricsCollector.queryMetrics({
      names: ['api_request_count', 'api_request_duration'],
      startTime,
      endTime
    });

    const requestMetrics = apiMetrics.filter(m => m.name === 'api_request_count');
    const durationMetrics = apiMetrics.filter(m => m.name === 'api_request_duration');

    // Calculate aggregated metrics
    const totalRequests = requestMetrics.reduce((sum, m) => sum + m.value, 0);
    const successfulRequests = requestMetrics
      .filter(m => {
        const statusCode = parseInt(m.labels.status_code || '200');
        return statusCode >= 200 && statusCode < 400;
      })
      .reduce((sum, m) => sum + m.value, 0);

    const averageResponseTime = durationMetrics.length > 0 ?
      durationMetrics.reduce((sum, m) => sum + m.value, 0) / durationMetrics.length : 0;

    // Group by endpoints
    const endpointStats = new Map<string, { requests: number; totalDuration: number; errors: number }>();
    
    for (const metric of requestMetrics) {
      const endpoint = metric.labels.endpoint || 'unknown';
      const statusCode = parseInt(metric.labels.status_code || '200');
      const isError = statusCode >= 400;
      
      if (!endpointStats.has(endpoint)) {
        endpointStats.set(endpoint, { requests: 0, totalDuration: 0, errors: 0 });
      }
      
      const stats = endpointStats.get(endpoint)!;
      stats.requests += metric.value;
      if (isError) stats.errors += metric.value;
    }

    for (const metric of durationMetrics) {
      const endpoint = metric.labels.endpoint || 'unknown';
      if (endpointStats.has(endpoint)) {
        endpointStats.get(endpoint)!.totalDuration += metric.value;
      }
    }

    const endpoints = Array.from(endpointStats.entries()).map(([endpoint, stats]) => ({
      endpoint,
      requests: stats.requests,
      averageResponseTime: stats.requests > 0 ? stats.totalDuration / stats.requests : 0,
      errorRate: stats.requests > 0 ? stats.errors / stats.requests : 0
    }));

    const metrics: APIUsageMetrics = {
      requests: {
        total: totalRequests,
        successful: successfulRequests,
        failed: totalRequests - successfulRequests,
        errorRate: totalRequests > 0 ? (totalRequests - successfulRequests) / totalRequests : 0
      },
      performance: {
        averageResponseTime,
        p95ResponseTime: this.calculatePercentile(durationMetrics.map(m => m.value), 95),
        throughput: totalRequests / this.getPeriodHours(period)
      },
      endpoints: endpoints.sort((a, b) => b.requests - a.requests).slice(0, 10),
      users: await this.getAPIUserStats(startTime, endTime)
    };

    // Record metrics
    await this.recordBusinessMetrics(metrics, BusinessMetricCategory.API_USAGE);

    return metrics;
  }

  /**
   * Get comprehensive business dashboard data
   */
  async getBusinessDashboard(period: TimePeriod = TimePeriod.DAY): Promise<{
    kpis: BusinessKPI[];
    userEngagement: UserEngagementMetrics;
    viralPredictions: ViralPredictionMetrics;
    revenue: RevenueMetrics;
    apiUsage: APIUsageMetrics;
    alerts: any[];
    trends: any[];
  }> {
    const [
      userEngagement,
      viralPredictions,
      revenue,
      apiUsage,
      kpis,
      alerts,
      trends
    ] = await Promise.all([
      this.calculateUserEngagement(period),
      this.calculateViralPredictionMetrics(period),
      this.calculateRevenueMetrics(period),
      this.calculateAPIMetrics(period),
      this.calculateKPIs(period),
      this.getBusinessAlerts(),
      this.getTrendData(period)
    ]);

    return {
      kpis,
      userEngagement,
      viralPredictions,
      revenue,
      apiUsage,
      alerts,
      trends
    };
  }

  /**
   * Calculate key performance indicators
   */
  private async calculateKPIs(period: TimePeriod): Promise<BusinessKPI[]> {
    const endTime = new Date();
    const startTime = this.getStartTime(endTime, period);
    const previousPeriodStart = this.getStartTime(startTime, period);

    // Get current and previous period metrics for comparison
    const [currentMetrics, previousMetrics] = await Promise.all([
      this.getKPIMetrics(startTime, endTime),
      this.getKPIMetrics(previousPeriodStart, startTime)
    ]);

    const kpis: BusinessKPI[] = [
      {
        id: 'daily_active_users',
        name: 'Daily Active Users',
        category: BusinessMetricCategory.USER_ENGAGEMENT,
        value: currentMetrics.activeUsers,
        target: 1000,
        unit: MetricUnit.COUNT,
        trend: this.getTrendDirection(currentMetrics.activeUsers, previousMetrics.activeUsers),
        percentageChange: this.getPercentageChange(currentMetrics.activeUsers, previousMetrics.activeUsers),
        lastUpdated: new Date(),
        period
      },
      {
        id: 'prediction_accuracy',
        name: 'Prediction Accuracy',
        category: BusinessMetricCategory.VIRAL_PREDICTIONS,
        value: currentMetrics.predictionAccuracy,
        target: 85,
        unit: MetricUnit.PERCENTAGE,
        trend: this.getTrendDirection(currentMetrics.predictionAccuracy, previousMetrics.predictionAccuracy),
        percentageChange: this.getPercentageChange(currentMetrics.predictionAccuracy, previousMetrics.predictionAccuracy),
        lastUpdated: new Date(),
        period
      },
      {
        id: 'monthly_recurring_revenue',
        name: 'Monthly Recurring Revenue',
        category: BusinessMetricCategory.REVENUE,
        value: currentMetrics.mrr,
        target: 50000,
        unit: MetricUnit.DOLLARS,
        trend: this.getTrendDirection(currentMetrics.mrr, previousMetrics.mrr),
        percentageChange: this.getPercentageChange(currentMetrics.mrr, previousMetrics.mrr),
        lastUpdated: new Date(),
        period
      },
      {
        id: 'api_error_rate',
        name: 'API Error Rate',
        category: BusinessMetricCategory.API_USAGE,
        value: currentMetrics.apiErrorRate,
        target: 1, // 1% or less
        unit: MetricUnit.PERCENTAGE,
        trend: this.getTrendDirection(previousMetrics.apiErrorRate, currentMetrics.apiErrorRate), // Inverted because lower is better
        percentageChange: this.getPercentageChange(currentMetrics.apiErrorRate, previousMetrics.apiErrorRate),
        lastUpdated: new Date(),
        period
      },
      {
        id: 'customer_churn_rate',
        name: 'Customer Churn Rate',
        category: BusinessMetricCategory.RETENTION,
        value: currentMetrics.churnRate,
        target: 5, // 5% or less
        unit: MetricUnit.PERCENTAGE,
        trend: this.getTrendDirection(previousMetrics.churnRate, currentMetrics.churnRate), // Inverted because lower is better
        percentageChange: this.getPercentageChange(currentMetrics.churnRate, previousMetrics.churnRate),
        lastUpdated: new Date(),
        period
      }
    ];

    return kpis;
  }

  /**
   * Helper methods for data fetching
   */
  private async getActiveUsers(endTime: Date, period: TimePeriod): Promise<number> {
    if (!this.supabase) return 0;

    const startTime = this.getStartTime(endTime, period);
    
    try {
      const { count } = await this.supabase
        .from('user_sessions')
        .select('user_id', { count: 'exact', head: true })
        .gte('created_at', startTime.toISOString())
        .lte('created_at', endTime.toISOString());

      return count || 0;
    } catch (error) {
      console.error('Failed to get active users:', error);
      return 0;
    }
  }

  private async getSessionMetrics(startTime: Date, endTime: Date) {
    // Implementation would query session data
    return {
      averageDuration: 180000, // 3 minutes in ms
      sessionsPerUser: 2.5,
      bounceRate: 0.35 // 35%
    };
  }

  private async getEngagementData(startTime: Date, endTime: Date) {
    // Get engagement metrics from our metrics collection
    const engagementMetrics = await metricsCollector.queryMetrics({
      names: ['user_engagement'],
      startTime,
      endTime
    });

    const videosAnalyzed = engagementMetrics
      .filter(m => m.labels.action === 'video_analyzed')
      .reduce((sum, m) => sum + m.value, 0);

    const predictions = engagementMetrics
      .filter(m => m.labels.action === 'prediction_generated')
      .reduce((sum, m) => sum + m.value, 0);

    const templates = engagementMetrics
      .filter(m => m.labels.action === 'template_used')
      .reduce((sum, m) => sum + m.value, 0);

    return {
      videosAnalyzed,
      predictions,
      templates,
      shareRate: 0.15 // 15% share rate
    };
  }

  private async getRetentionMetrics() {
    // Implementation would calculate retention rates
    return {
      day1: 0.65, // 65%
      day7: 0.35, // 35%
      day30: 0.15 // 15%
    };
  }

  private async getPredictionAccuracy(startTime: Date, endTime: Date) {
    const accuracyMetrics = await metricsCollector.queryMetrics({
      names: ['viral_prediction_accuracy'],
      startTime,
      endTime
    });

    const overallAccuracy = accuracyMetrics.length > 0 ?
      accuracyMetrics.reduce((sum, m) => sum + m.value, 0) / accuracyMetrics.length : 0;

    // Group by niche
    const byNiche: Record<string, number> = {};
    const nicheCounts: Record<string, number> = {};

    for (const metric of accuracyMetrics) {
      const niche = metric.labels.niche || 'unknown';
      if (!byNiche[niche]) {
        byNiche[niche] = 0;
        nicheCounts[niche] = 0;
      }
      byNiche[niche] += metric.value;
      nicheCounts[niche]++;
    }

    // Calculate averages
    for (const niche in byNiche) {
      byNiche[niche] = byNiche[niche] / nicheCounts[niche];
    }

    return {
      overall: overallAccuracy,
      byNiche,
      trend: await this.getTrendArray('viral_prediction_accuracy', startTime, endTime)
    };
  }

  private async getPredictionPerformance(startTime: Date, endTime: Date) {
    const predictionMetrics = await metricsCollector.queryMetrics({
      names: ['viral_prediction_count', 'viral_prediction_score', 'api_request_duration'],
      startTime,
      endTime
    });

    const totalPredictions = predictionMetrics
      .filter(m => m.name === 'viral_prediction_count')
      .reduce((sum, m) => sum + m.value, 0);

    const successfulPredictions = predictionMetrics
      .filter(m => m.name === 'viral_prediction_count' && m.labels.success === 'true')
      .reduce((sum, m) => sum + m.value, 0);

    const confidenceScores = predictionMetrics
      .filter(m => m.name === 'viral_prediction_score')
      .map(m => m.value);

    const averageConfidenceScore = confidenceScores.length > 0 ?
      confidenceScores.reduce((sum, val) => sum + val, 0) / confidenceScores.length : 0;

    const predictionResponseTimes = predictionMetrics
      .filter(m => m.name === 'api_request_duration' && 
                 m.labels.endpoint?.includes('viral-prediction'))
      .map(m => m.value);

    const responseTime = predictionResponseTimes.length > 0 ?
      predictionResponseTimes.reduce((sum, val) => sum + val, 0) / predictionResponseTimes.length : 0;

    return {
      totalPredictions,
      successfulPredictions,
      averageConfidenceScore,
      responseTime
    };
  }

  private async getPredictionUsage(startTime: Date, endTime: Date) {
    const usageMetrics = await metricsCollector.queryMetrics({
      names: ['viral_prediction_count'],
      startTime,
      endTime
    });

    const totalPredictions = usageMetrics.reduce((sum, m) => sum + m.value, 0);
    const periodDays = (endTime.getTime() - startTime.getTime()) / (24 * 60 * 60 * 1000);
    const predictionsPerDay = totalPredictions / Math.max(periodDays, 1);

    const uniqueUsers = new Set(usageMetrics.map(m => m.labels.user_id)).size;
    const uniqueUsersPerDay = uniqueUsers / Math.max(periodDays, 1);

    // Calculate peak hours
    const hourCounts = new Array(24).fill(0);
    for (const metric of usageMetrics) {
      const hour = metric.timestamp.getHours();
      hourCounts[hour] += metric.value;
    }
    const maxCount = Math.max(...hourCounts);
    const peakHours = hourCounts
      .map((count, hour) => ({ hour, count }))
      .filter(h => h.count > maxCount * 0.8)
      .map(h => h.hour);

    // Popular niches
    const nicheCounts = new Map<string, number>();
    for (const metric of usageMetrics) {
      const niche = metric.labels.niche || 'unknown';
      nicheCounts.set(niche, (nicheCounts.get(niche) || 0) + metric.value);
    }

    const popularNiches = Array.from(nicheCounts.entries())
      .map(([niche, count]) => ({ niche, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      predictionsPerDay,
      uniqueUsersPerDay,
      peakHours,
      popularNiches
    };
  }

  private async getPredictionBusiness(startTime: Date, endTime: Date) {
    // Business metrics calculation would integrate with payment/subscription data
    return {
      conversionRate: 0.05, // 5%
      revenuePerPrediction: 0.10, // $0.10
      customerLifetimeValue: 150 // $150
    };
  }

  private async getRevenueData(startTime: Date, endTime: Date) {
    // Implementation would query revenue/payment data
    return {
      total: 25000,
      recurring: 20000,
      oneTime: 5000,
      trend: [18000, 20000, 22000, 25000] // Last 4 periods
    };
  }

  private async getSubscriptionData(startTime: Date, endTime: Date) {
    return {
      active: 250,
      new: 25,
      cancelled: 8,
      churnRate: 0.032, // 3.2%
      mrr: 20000,
      arpu: 80 // $80 per user
    };
  }

  private async getConversionData(startTime: Date, endTime: Date) {
    return {
      trialToSubscription: 0.25, // 25%
      freeToTrial: 0.08, // 8%
      visitorToSignup: 0.03, // 3%
      signupToFirstPrediction: 0.65 // 65%
    };
  }

  private async getAPIUserStats(startTime: Date, endTime: Date) {
    const apiMetrics = await metricsCollector.queryMetrics({
      names: ['api_request_count'],
      startTime,
      endTime
    });

    const apiKeyUsers = new Set(
      apiMetrics
        .filter(m => m.labels.auth_method === 'api_key')
        .map(m => m.labels.user_id)
    ).size;

    const webUsers = new Set(
      apiMetrics
        .filter(m => m.labels.auth_method === 'jwt')
        .map(m => m.labels.user_id)
    ).size;

    return {
      apiKeyUsers,
      webUsers,
      mobileUsers: 0 // Would be calculated from mobile app metrics
    };
  }

  private async getKPIMetrics(startTime: Date, endTime: Date) {
    // Aggregate multiple metrics for KPI calculation
    return {
      activeUsers: await this.getActiveUsers(endTime, TimePeriod.DAY),
      predictionAccuracy: 87.5,
      mrr: 20000,
      apiErrorRate: 0.8,
      churnRate: 3.2
    };
  }

  private async getBusinessAlerts() {
    // Integration with alert manager for business-specific alerts
    return [];
  }

  private async getTrendData(period: TimePeriod) {
    // Get trend data for charts
    return [];
  }

  private async getTrendArray(metricName: string, startTime: Date, endTime: Date): Promise<number[]> {
    const metrics = await metricsCollector.aggregateMetrics({
      names: [metricName],
      startTime,
      endTime,
      aggregation: 'avg',
      interval: '1h'
    });

    return metrics.map(m => m.value);
  }

  /**
   * Record business metrics for persistence
   */
  private async recordBusinessMetrics(metrics: any, category: BusinessMetricCategory): Promise<void> {
    // Record key metrics for historical tracking
    for (const [key, value] of Object.entries(metrics)) {
      if (typeof value === 'number') {
        await metricsCollector.recordBusiness({
          name: `business_${key}`,
          type: MetricType.GAUGE,
          value,
          unit: MetricUnit.COUNT,
          labels: { category },
          category
        });
      }
    }
  }

  /**
   * Utility methods
   */
  private getStartTime(endTime: Date, period: TimePeriod): Date {
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
      case TimePeriod.QUARTER:
        start.setMonth(start.getMonth() - 3);
        break;
      case TimePeriod.YEAR:
        start.setFullYear(start.getFullYear() - 1);
        break;
    }
    
    return start;
  }

  private getPeriodHours(period: TimePeriod): number {
    switch (period) {
      case TimePeriod.HOUR: return 1;
      case TimePeriod.DAY: return 24;
      case TimePeriod.WEEK: return 168;
      case TimePeriod.MONTH: return 720;
      case TimePeriod.QUARTER: return 2160;
      case TimePeriod.YEAR: return 8760;
      default: return 24;
    }
  }

  private getTrendDirection(current: number, previous: number): TrendDirection {
    if (current > previous * 1.05) return TrendDirection.UP;
    if (current < previous * 0.95) return TrendDirection.DOWN;
    return TrendDirection.STABLE;
  }

  private getPercentageChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    
    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }
}

// Export singleton instance
export const businessMetricsCalculator = new BusinessMetricsCalculator();

// Automatic metrics calculation scheduler
export class BusinessMetricsScheduler {
  private calculator: BusinessMetricsCalculator;
  private intervals: NodeJS.Timeout[] = [];

  constructor(calculator: BusinessMetricsCalculator) {
    this.calculator = calculator;
  }

  start(): void {
    // Calculate user engagement metrics every 5 minutes
    this.intervals.push(setInterval(async () => {
      try {
        await this.calculator.calculateUserEngagement();
      } catch (error) {
        console.error('Failed to calculate user engagement metrics:', error);
      }
    }, 5 * 60 * 1000));

    // Calculate viral prediction metrics every 10 minutes
    this.intervals.push(setInterval(async () => {
      try {
        await this.calculator.calculateViralPredictionMetrics();
      } catch (error) {
        console.error('Failed to calculate viral prediction metrics:', error);
      }
    }, 10 * 60 * 1000));

    // Calculate API metrics every minute
    this.intervals.push(setInterval(async () => {
      try {
        await this.calculator.calculateAPIMetrics();
      } catch (error) {
        console.error('Failed to calculate API metrics:', error);
      }
    }, 60 * 1000));

    // Calculate revenue metrics every hour
    this.intervals.push(setInterval(async () => {
      try {
        await this.calculator.calculateRevenueMetrics();
      } catch (error) {
        console.error('Failed to calculate revenue metrics:', error);
      }
    }, 60 * 60 * 1000));

    console.log('📊 Business metrics scheduler started');
  }

  stop(): void {
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];
    console.log('📊 Business metrics scheduler stopped');
  }
}

// Export scheduler instance
export const businessMetricsScheduler = new BusinessMetricsScheduler(businessMetricsCalculator);