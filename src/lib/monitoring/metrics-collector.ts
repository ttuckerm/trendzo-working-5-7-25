/**
 * Comprehensive Metrics Collection System
 * Production-ready metrics collection for performance, business, and system monitoring
 */

import { createClient } from '@supabase/supabase-js';
import { performance } from 'perf_hooks';

export interface Metric {
  id?: string;
  name: string;
  type: MetricType;
  value: number;
  unit: MetricUnit;
  labels: Record<string, string>;
  timestamp: Date;
  source: string;
  environment: string;
}

export interface BusinessMetric extends Metric {
  userId?: string;
  sessionId?: string;
  category: BusinessMetricCategory;
  subcategory?: string;
  metadata?: Record<string, any>;
}

export interface PerformanceMetric extends Metric {
  endpoint?: string;
  method?: string;
  statusCode?: number;
  duration: number;
  component: string;
}

export interface SystemMetric extends Metric {
  resource: SystemResource;
  instance?: string;
  region?: string;
}

export enum MetricType {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  HISTOGRAM = 'histogram',
  SUMMARY = 'summary',
  TIMER = 'timer'
}

export enum MetricUnit {
  // Time units
  MILLISECONDS = 'milliseconds',
  SECONDS = 'seconds',
  MINUTES = 'minutes',
  HOURS = 'hours',
  
  // Size units
  BYTES = 'bytes',
  KILOBYTES = 'kilobytes',
  MEGABYTES = 'megabytes',
  GIGABYTES = 'gigabytes',
  
  // Rate units
  REQUESTS_PER_SECOND = 'requests_per_second',
  REQUESTS_PER_MINUTE = 'requests_per_minute',
  
  // Percentage
  PERCENTAGE = 'percentage',
  
  // Count
  COUNT = 'count',
  
  // Currency
  DOLLARS = 'dollars',
  CENTS = 'cents'
}

export enum BusinessMetricCategory {
  USER_ENGAGEMENT = 'user_engagement',
  VIRAL_PREDICTIONS = 'viral_predictions',
  API_USAGE = 'api_usage',
  REVENUE = 'revenue',
  SUBSCRIPTIONS = 'subscriptions',
  CONVERSION = 'conversion',
  RETENTION = 'retention',
  GROWTH = 'growth',
  CONTENT = 'content',
  PERFORMANCE = 'performance'
}

export enum SystemResource {
  CPU = 'cpu',
  MEMORY = 'memory',
  DISK = 'disk',
  NETWORK = 'network',
  DATABASE = 'database',
  CACHE = 'cache',
  QUEUE = 'queue'
}

/**
 * Metrics Storage Interface
 */
interface MetricsStorage {
  store(metrics: Metric[]): Promise<void>;
  query(params: MetricsQuery): Promise<Metric[]>;
  aggregate(params: AggregationQuery): Promise<AggregatedMetric[]>;
  cleanup(olderThan: Date): Promise<number>;
}

interface MetricsQuery {
  names?: string[];
  types?: MetricType[];
  labels?: Record<string, string>;
  source?: string;
  startTime: Date;
  endTime: Date;
  limit?: number;
  offset?: number;
}

interface AggregationQuery extends MetricsQuery {
  aggregation: 'sum' | 'avg' | 'min' | 'max' | 'count' | 'percentile';
  percentile?: number;
  groupBy?: string[];
  interval?: string; // e.g., '1m', '5m', '1h'
}

interface AggregatedMetric {
  name: string;
  value: number;
  timestamp: Date;
  labels: Record<string, string>;
  count: number;
}

/**
 * Database Metrics Storage Implementation
 */
class DatabaseMetricsStorage implements MetricsStorage {
  private supabase: any;

  constructor() {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
      this.supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY
      );
    }
  }

  async store(metrics: Metric[]): Promise<void> {
    if (!this.supabase || metrics.length === 0) return;

    try {
      const records = metrics.map(metric => ({
        name: metric.name,
        type: metric.type,
        value: metric.value,
        unit: metric.unit,
        labels: metric.labels,
        source: metric.source,
        environment: metric.environment,
        created_at: metric.timestamp.toISOString()
      }));

      const { error } = await this.supabase
        .from('metrics')
        .insert(records);

      if (error) {
        console.error('Failed to store metrics:', error);
      }
    } catch (error) {
      console.error('Metrics storage error:', error);
    }
  }

  async query(params: MetricsQuery): Promise<Metric[]> {
    if (!this.supabase) return [];

    try {
      let query = this.supabase
        .from('metrics')
        .select('*')
        .gte('created_at', params.startTime.toISOString())
        .lte('created_at', params.endTime.toISOString())
        .order('created_at', { ascending: false });

      if (params.names && params.names.length > 0) {
        query = query.in('name', params.names);
      }

      if (params.types && params.types.length > 0) {
        query = query.in('type', params.types);
      }

      if (params.source) {
        query = query.eq('source', params.source);
      }

      if (params.limit) {
        query = query.limit(params.limit);
      }

      if (params.offset) {
        query = query.range(params.offset, params.offset + (params.limit || 100) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Failed to query metrics:', error);
        return [];
      }

      return (data || []).map(this.mapToMetric);
    } catch (error) {
      console.error('Metrics query error:', error);
      return [];
    }
  }

  async aggregate(params: AggregationQuery): Promise<AggregatedMetric[]> {
    if (!this.supabase) return [];

    try {
      // This is a simplified aggregation - in production, you'd want to use
      // a time-series database like InfluxDB or TimescaleDB for better performance
      const metrics = await this.query(params);
      
      // Group by interval and labels
      const groups = new Map<string, Metric[]>();
      
      for (const metric of metrics) {
        const groupKey = this.getGroupKey(metric, params.groupBy || [], params.interval);
        if (!groups.has(groupKey)) {
          groups.set(groupKey, []);
        }
        groups.get(groupKey)!.push(metric);
      }

      // Aggregate each group
      const aggregated: AggregatedMetric[] = [];
      
      for (const [groupKey, groupMetrics] of groups.entries()) {
        const value = this.calculateAggregation(groupMetrics, params.aggregation, params.percentile);
        const [timestamp, ...labelParts] = groupKey.split('|');
        const labels = this.parseLabels(labelParts);

        aggregated.push({
          name: groupMetrics[0]?.name || '',
          value,
          timestamp: new Date(timestamp),
          labels,
          count: groupMetrics.length
        });
      }

      return aggregated.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    } catch (error) {
      console.error('Metrics aggregation error:', error);
      return [];
    }
  }

  async cleanup(olderThan: Date): Promise<number> {
    if (!this.supabase) return 0;

    try {
      const { count, error } = await this.supabase
        .from('metrics')
        .delete()
        .lt('created_at', olderThan.toISOString());

      if (error) {
        console.error('Failed to cleanup metrics:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Metrics cleanup error:', error);
      return 0;
    }
  }

  private mapToMetric(record: any): Metric {
    return {
      id: record.id,
      name: record.name,
      type: record.type,
      value: record.value,
      unit: record.unit,
      labels: record.labels || {},
      timestamp: new Date(record.created_at),
      source: record.source,
      environment: record.environment
    };
  }

  private getGroupKey(metric: Metric, groupBy: string[], interval?: string): string {
    const timestamp = interval ? this.roundToInterval(metric.timestamp, interval) : metric.timestamp;
    const labelValues = groupBy.map(label => metric.labels[label] || 'unknown').join('|');
    return `${timestamp.toISOString()}|${labelValues}`;
  }

  private roundToInterval(timestamp: Date, interval: string): Date {
    const ms = timestamp.getTime();
    const intervalMs = this.parseInterval(interval);
    return new Date(Math.floor(ms / intervalMs) * intervalMs);
  }

  private parseInterval(interval: string): number {
    const match = interval.match(/^(\d+)([smh])$/);
    if (!match) return 60000; // Default to 1 minute

    const [, amount, unit] = match;
    const multipliers = { s: 1000, m: 60000, h: 3600000 };
    return parseInt(amount) * multipliers[unit as keyof typeof multipliers];
  }

  private calculateAggregation(metrics: Metric[], aggregation: string, percentile?: number): number {
    if (metrics.length === 0) return 0;

    const values = metrics.map(m => m.value);

    switch (aggregation) {
      case 'sum':
        return values.reduce((sum, val) => sum + val, 0);
      case 'avg':
        return values.reduce((sum, val) => sum + val, 0) / values.length;
      case 'min':
        return Math.min(...values);
      case 'max':
        return Math.max(...values);
      case 'count':
        return values.length;
      case 'percentile':
        const p = percentile || 95;
        const sorted = values.sort((a, b) => a - b);
        const index = Math.ceil((p / 100) * sorted.length) - 1;
        return sorted[Math.max(0, index)];
      default:
        return 0;
    }
  }

  private parseLabels(labelParts: string[]): Record<string, string> {
    // This is a simplified implementation
    // In practice, you'd want a more robust label parsing strategy
    return {};
  }
}

/**
 * Performance Timer for automatic metric collection
 */
export class PerformanceTimer {
  private startTime: number;
  private endTime: number | null = null;
  private name: string;
  private labels: Record<string, string>;

  constructor(name: string, labels: Record<string, string> = {}) {
    this.name = name;
    this.labels = labels;
    this.startTime = performance.now();
  }

  stop(): PerformanceMetric {
    this.endTime = performance.now();
    const duration = this.endTime - this.startTime;

    return {
      name: this.name,
      type: MetricType.TIMER,
      value: duration,
      unit: MetricUnit.MILLISECONDS,
      labels: this.labels,
      timestamp: new Date(),
      source: 'performance_timer',
      environment: process.env.NODE_ENV || 'development',
      duration,
      component: this.labels.component || 'unknown'
    };
  }
}

/**
 * Main Metrics Collector
 */
export class MetricsCollector {
  private storage: MetricsStorage;
  private buffer: Metric[] = [];
  private bufferSize: number = 100;
  private flushInterval: number = 30000; // 30 seconds
  private environment: string;

  constructor(bufferSize: number = 100, flushInterval: number = 30000) {
    this.storage = new DatabaseMetricsStorage();
    this.bufferSize = bufferSize;
    this.flushInterval = flushInterval;
    this.environment = process.env.NODE_ENV || 'development';

    // Start automatic flushing
    this.startAutoFlush();
  }

  /**
   * Record a performance metric
   */
  async recordPerformance(metric: Omit<PerformanceMetric, 'timestamp' | 'source' | 'environment'>): Promise<void> {
    const fullMetric: PerformanceMetric = {
      ...metric,
      timestamp: new Date(),
      source: 'performance_monitor',
      environment: this.environment
    };

    await this.addToBuffer(fullMetric);
  }

  /**
   * Record a business metric
   */
  async recordBusiness(metric: Omit<BusinessMetric, 'timestamp' | 'source' | 'environment'>): Promise<void> {
    const fullMetric: BusinessMetric = {
      ...metric,
      timestamp: new Date(),
      source: 'business_monitor',
      environment: this.environment
    };

    await this.addToBuffer(fullMetric);
  }

  /**
   * Record a system metric
   */
  async recordSystem(metric: Omit<SystemMetric, 'timestamp' | 'source' | 'environment'>): Promise<void> {
    const fullMetric: SystemMetric = {
      ...metric,
      timestamp: new Date(),
      source: 'system_monitor',
      environment: this.environment
    };

    await this.addToBuffer(fullMetric);
  }

  /**
   * Record a custom metric
   */
  async recordCustom(metric: Omit<Metric, 'timestamp' | 'source' | 'environment'>): Promise<void> {
    const fullMetric: Metric = {
      ...metric,
      timestamp: new Date(),
      source: 'custom',
      environment: this.environment
    };

    await this.addToBuffer(fullMetric);
  }

  /**
   * Create a performance timer
   */
  createTimer(name: string, labels: Record<string, string> = {}): PerformanceTimer {
    return new PerformanceTimer(name, labels);
  }

  /**
   * Record API call metrics
   */
  async recordAPICall(
    endpoint: string,
    method: string,
    statusCode: number,
    duration: number,
    userId?: string
  ): Promise<void> {
    await this.recordPerformance({
      name: 'api_request_duration',
      type: MetricType.TIMER,
      value: duration,
      unit: MetricUnit.MILLISECONDS,
      labels: {
        endpoint,
        method,
        status_code: statusCode.toString(),
        user_id: userId || 'anonymous'
      },
      endpoint,
      method,
      statusCode,
      duration,
      component: 'api'
    });

    await this.recordPerformance({
      name: 'api_request_count',
      type: MetricType.COUNTER,
      value: 1,
      unit: MetricUnit.COUNT,
      labels: {
        endpoint,
        method,
        status_code: statusCode.toString()
      },
      endpoint,
      method,
      statusCode,
      duration,
      component: 'api'
    });
  }

  /**
   * Record viral prediction metrics
   */
  async recordViralPrediction(
    success: boolean,
    predictionScore: number,
    actualViralScore?: number,
    userId?: string
  ): Promise<void> {
    await this.recordBusiness({
      name: 'viral_prediction_count',
      type: MetricType.COUNTER,
      value: 1,
      unit: MetricUnit.COUNT,
      labels: {
        success: success.toString(),
        user_id: userId || 'anonymous'
      },
      userId,
      category: BusinessMetricCategory.VIRAL_PREDICTIONS,
      subcategory: 'prediction_count'
    });

    await this.recordBusiness({
      name: 'viral_prediction_score',
      type: MetricType.GAUGE,
      value: predictionScore,
      unit: MetricUnit.PERCENTAGE,
      labels: {
        user_id: userId || 'anonymous'
      },
      userId,
      category: BusinessMetricCategory.VIRAL_PREDICTIONS,
      subcategory: 'prediction_score',
      metadata: { actualViralScore }
    });

    if (actualViralScore !== undefined) {
      const accuracy = Math.abs(predictionScore - actualViralScore);
      await this.recordBusiness({
        name: 'viral_prediction_accuracy',
        type: MetricType.GAUGE,
        value: 100 - accuracy,
        unit: MetricUnit.PERCENTAGE,
        labels: {
          user_id: userId || 'anonymous'
        },
        userId,
        category: BusinessMetricCategory.VIRAL_PREDICTIONS,
        subcategory: 'accuracy'
      });
    }
  }

  /**
   * Record user engagement metrics
   */
  async recordUserEngagement(
    action: string,
    userId: string,
    sessionId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.recordBusiness({
      name: 'user_engagement',
      type: MetricType.COUNTER,
      value: 1,
      unit: MetricUnit.COUNT,
      labels: {
        action,
        user_id: userId
      },
      userId,
      sessionId,
      category: BusinessMetricCategory.USER_ENGAGEMENT,
      subcategory: action,
      metadata
    });
  }

  /**
   * Get system metrics automatically
   */
  async recordSystemMetrics(): Promise<void> {
    try {
      const memUsage = process.memoryUsage();
      const uptime = process.uptime();

      // Memory metrics
      await this.recordSystem({
        name: 'system_memory_usage',
        type: MetricType.GAUGE,
        value: memUsage.heapUsed,
        unit: MetricUnit.BYTES,
        labels: { type: 'heap_used' },
        resource: SystemResource.MEMORY
      });

      await this.recordSystem({
        name: 'system_memory_usage',
        type: MetricType.GAUGE,
        value: memUsage.heapTotal,
        unit: MetricUnit.BYTES,
        labels: { type: 'heap_total' },
        resource: SystemResource.MEMORY
      });

      // Uptime metric
      await this.recordSystem({
        name: 'system_uptime',
        type: MetricType.GAUGE,
        value: uptime,
        unit: MetricUnit.SECONDS,
        labels: {},
        resource: SystemResource.CPU
      });

    } catch (error) {
      console.error('Failed to record system metrics:', error);
    }
  }

  /**
   * Query metrics
   */
  async queryMetrics(params: MetricsQuery): Promise<Metric[]> {
    return await this.storage.query(params);
  }

  /**
   * Aggregate metrics
   */
  async aggregateMetrics(params: AggregationQuery): Promise<AggregatedMetric[]> {
    return await this.storage.aggregate(params);
  }

  /**
   * Cleanup old metrics
   */
  async cleanup(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    return await this.storage.cleanup(cutoffDate);
  }

  /**
   * Add metric to buffer
   */
  private async addToBuffer(metric: Metric): Promise<void> {
    this.buffer.push(metric);

    if (this.buffer.length >= this.bufferSize) {
      await this.flush();
    }
  }

  /**
   * Flush buffer to storage
   */
  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const metricsToFlush = [...this.buffer];
    this.buffer = [];

    try {
      await this.storage.store(metricsToFlush);
    } catch (error) {
      console.error('Failed to flush metrics:', error);
      // Re-add failed metrics to buffer for retry
      this.buffer.unshift(...metricsToFlush);
    }
  }

  /**
   * Start automatic buffer flushing
   */
  private startAutoFlush(): void {
    setInterval(async () => {
      await this.flush();
    }, this.flushInterval);

    // Also record system metrics periodically
    setInterval(async () => {
      await this.recordSystemMetrics();
    }, 60000); // Every minute
  }
}

// Export singleton instance
export const metricsCollector = new MetricsCollector();

// Utility functions for middleware integration
export function createPerformanceMiddleware() {
  return async (req: any, res: any, next: any) => {
    const timer = metricsCollector.createTimer('http_request_duration', {
      method: req.method,
      endpoint: req.path || req.url
    });

    const originalSend = res.send;
    res.send = function(body: any) {
      const metric = timer.stop();
      metricsCollector.recordAPICall(
        req.path || req.url,
        req.method,
        res.statusCode,
        metric.duration
      );
      
      return originalSend.call(this, body);
    };

    next();
  };
}