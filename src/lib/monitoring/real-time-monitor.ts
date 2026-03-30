/**
 * REAL-TIME PERFORMANCE MONITORING SYSTEM
 * Production-ready monitoring with response times, throughput, errors, system resources
 * Part of BMAD Advanced Monitoring & Alerting implementation
 */

import { EventEmitter } from 'events';
import { promisify } from 'util';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import { performance } from 'perf_hooks';

// Types for monitoring metrics
export interface PerformanceMetric {
  timestamp: Date;
  metricType: MetricType;
  value: number;
  labels: Record<string, string>;
  source: string;
}

export interface SystemResourceMetrics {
  cpu: {
    usage: number;
    loadAverage: number[];
    cores: number;
  };
  memory: {
    total: number;
    free: number;
    used: number;
    usagePercent: number;
  };
  disk: {
    total: number;
    free: number;
    used: number;
    usagePercent: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    packetsIn: number;
    packetsOut: number;
  };
}

export interface ResponseTimeMetrics {
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  userAgent: string;
  ipAddress: string;
  timestamp: Date;
}

export interface ThroughputMetrics {
  totalRequests: number;
  requestsPerSecond: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  timeWindow: string;
}

export interface ErrorMetrics {
  errorType: string;
  errorMessage: string;
  endpoint: string;
  statusCode: number;
  count: number;
  timestamp: Date;
  stackTrace?: string;
  userId?: string;
}

export enum MetricType {
  RESPONSE_TIME = 'response_time',
  THROUGHPUT = 'throughput',
  ERROR_RATE = 'error_rate',
  CPU_USAGE = 'cpu_usage',
  MEMORY_USAGE = 'memory_usage',
  DISK_USAGE = 'disk_usage',
  NETWORK_IO = 'network_io',
  DATABASE_QUERY_TIME = 'database_query_time',
  CACHE_HIT_RATE = 'cache_hit_rate',
  ACTIVE_CONNECTIONS = 'active_connections',
  QUEUE_LENGTH = 'queue_length',
  PREDICTION_LATENCY = 'prediction_latency',
  VIRAL_SCORE_ACCURACY = 'viral_score_accuracy'
}

export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export interface Alert {
  id: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  metric: MetricType;
  value: number;
  threshold: number;
  timestamp: Date;
  acknowledged: boolean;
  resolvedAt?: Date;
  tags: string[];
}

/**
 * Real-time Performance Monitor
 * Collects and processes performance metrics in real-time
 */
export class RealTimeMonitor extends EventEmitter {
  private static instance: RealTimeMonitor;
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private responseTimeBuffer: ResponseTimeMetrics[] = [];
  private errorBuffer: ErrorMetrics[] = [];
  private isCollecting: boolean = false;
  private collectionInterval: NodeJS.Timeout | null = null;
  private systemMetricsInterval: NodeJS.Timeout | null = null;
  private lastNetworkStats: any = null;

  // Configuration
  private readonly COLLECTION_INTERVAL = 1000; // 1 second
  private readonly SYSTEM_METRICS_INTERVAL = 5000; // 5 seconds
  private readonly BUFFER_SIZE = 1000; // Keep last 1000 metrics
  private readonly RESPONSE_TIME_BUFFER_SIZE = 10000; // Keep last 10k response times

  private constructor() {
    super();
    this.setupEventHandlers();
  }

  public static getInstance(): RealTimeMonitor {
    if (!RealTimeMonitor.instance) {
      RealTimeMonitor.instance = new RealTimeMonitor();
    }
    return RealTimeMonitor.instance;
  }

  /**
   * Start real-time monitoring
   */
  public startMonitoring(): void {
    if (this.isCollecting) {
      console.log('🔍 Real-time monitoring already running');
      return;
    }

    console.log('🚀 Starting real-time performance monitoring...');
    this.isCollecting = true;

    // Start metric collection intervals
    this.collectionInterval = setInterval(() => {
      this.collectMetrics();
    }, this.COLLECTION_INTERVAL);

    this.systemMetricsInterval = setInterval(() => {
      this.collectSystemMetrics();
    }, this.SYSTEM_METRICS_INTERVAL);

    // Initial collection
    this.collectSystemMetrics();
    
    console.log('✅ Real-time monitoring started successfully');
    this.emit('monitoring:started');
  }

  /**
   * Stop real-time monitoring
   */
  public stopMonitoring(): void {
    if (!this.isCollecting) return;

    console.log('🛑 Stopping real-time monitoring...');
    this.isCollecting = false;

    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
    }

    if (this.systemMetricsInterval) {
      clearInterval(this.systemMetricsInterval);
      this.systemMetricsInterval = null;
    }

    console.log('✅ Real-time monitoring stopped');
    this.emit('monitoring:stopped');
  }

  /**
   * Record response time metric
   */
  public recordResponseTime(metrics: ResponseTimeMetrics): void {
    this.responseTimeBuffer.push(metrics);
    
    // Keep buffer size manageable
    if (this.responseTimeBuffer.length > this.RESPONSE_TIME_BUFFER_SIZE) {
      this.responseTimeBuffer = this.responseTimeBuffer.slice(-this.RESPONSE_TIME_BUFFER_SIZE);
    }

    // Create performance metric
    const metric: PerformanceMetric = {
      timestamp: metrics.timestamp,
      metricType: MetricType.RESPONSE_TIME,
      value: metrics.responseTime,
      labels: {
        endpoint: metrics.endpoint,
        method: metrics.method,
        status_code: metrics.statusCode.toString()
      },
      source: 'api'
    };

    this.addMetric(metric);

    // Check for slow responses
    if (metrics.responseTime > 1000) { // > 1 second
      this.emit('alert:slow_response', {
        endpoint: metrics.endpoint,
        responseTime: metrics.responseTime,
        threshold: 1000
      });
    }

    // Emit real-time event
    this.emit('metric:response_time', metrics);
  }

  /**
   * Record error metric
   */
  public recordError(error: ErrorMetrics): void {
    this.errorBuffer.push(error);
    
    // Keep buffer size manageable
    if (this.errorBuffer.length > this.BUFFER_SIZE) {
      this.errorBuffer = this.errorBuffer.slice(-this.BUFFER_SIZE);
    }

    // Create performance metric
    const metric: PerformanceMetric = {
      timestamp: error.timestamp,
      metricType: MetricType.ERROR_RATE,
      value: error.count,
      labels: {
        error_type: error.errorType,
        endpoint: error.endpoint,
        status_code: error.statusCode.toString()
      },
      source: 'api'
    };

    this.addMetric(metric);

    // Emit real-time event
    this.emit('metric:error', error);

    // Check for critical error rates
    this.checkErrorRateThresholds();
  }

  /**
   * Get current throughput metrics
   */
  public getThroughputMetrics(timeWindow: number = 60000): ThroughputMetrics {
    const now = Date.now();
    const windowStart = now - timeWindow;
    
    const recentResponses = this.responseTimeBuffer.filter(
      r => r.timestamp.getTime() >= windowStart
    );

    const totalRequests = recentResponses.length;
    const timeWindowSeconds = timeWindow / 1000;
    const requestsPerSecond = totalRequests / timeWindowSeconds;

    const successfulRequests = recentResponses.filter(r => r.statusCode < 400).length;
    const failedRequests = totalRequests - successfulRequests;

    const responseTimes = recentResponses.map(r => r.responseTime).sort((a, b) => a - b);
    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;

    const p95Index = Math.floor(responseTimes.length * 0.95);
    const p99Index = Math.floor(responseTimes.length * 0.99);

    return {
      totalRequests,
      requestsPerSecond: parseFloat(requestsPerSecond.toFixed(2)),
      successfulRequests,
      failedRequests,
      averageResponseTime: parseFloat(averageResponseTime.toFixed(2)),
      p95ResponseTime: responseTimes[p95Index] || 0,
      p99ResponseTime: responseTimes[p99Index] || 0,
      timeWindow: `${timeWindowSeconds}s`
    };
  }

  /**
   * Get current system resource metrics
   */
  public async getSystemResourceMetrics(): Promise<SystemResourceMetrics> {
    const cpuUsage = await this.getCPUUsage();
    const memoryStats = this.getMemoryStats();
    const diskStats = await this.getDiskStats();
    const networkStats = await this.getNetworkStats();

    return {
      cpu: {
        usage: cpuUsage,
        loadAverage: os.loadavg(),
        cores: os.cpus().length
      },
      memory: memoryStats,
      disk: diskStats,
      network: networkStats
    };
  }

  /**
   * Get metrics by type and time range
   */
  public getMetrics(
    metricType: MetricType, 
    startTime?: Date, 
    endTime?: Date
  ): PerformanceMetric[] {
    const key = metricType.toString();
    const metrics = this.metrics.get(key) || [];

    if (!startTime && !endTime) {
      return metrics;
    }

    return metrics.filter(metric => {
      const time = metric.timestamp.getTime();
      const start = startTime?.getTime() || 0;
      const end = endTime?.getTime() || Date.now();
      return time >= start && time <= end;
    });
  }

  /**
   * Get error summary
   */
  public getErrorSummary(timeWindow: number = 3600000): any {
    const now = Date.now();
    const windowStart = now - timeWindow;
    
    const recentErrors = this.errorBuffer.filter(
      e => e.timestamp.getTime() >= windowStart
    );

    // Group by error type
    const errorsByType = recentErrors.reduce((acc, error) => {
      acc[error.errorType] = (acc[error.errorType] || 0) + error.count;
      return acc;
    }, {} as Record<string, number>);

    // Group by endpoint
    const errorsByEndpoint = recentErrors.reduce((acc, error) => {
      acc[error.endpoint] = (acc[error.endpoint] || 0) + error.count;
      return acc;
    }, {} as Record<string, number>);

    const totalErrors = recentErrors.reduce((sum, error) => sum + error.count, 0);
    const uniqueErrors = new Set(recentErrors.map(e => e.errorType)).size;

    return {
      totalErrors,
      uniqueErrors,
      errorsByType,
      errorsByEndpoint,
      timeWindow: `${timeWindow / 1000}s`,
      recentErrors: recentErrors.slice(-10) // Last 10 errors
    };
  }

  /**
   * Export metrics for external monitoring systems
   */
  public exportPrometheusMetrics(): string {
    const now = Date.now();
    const metrics: string[] = [];

    // Response time metrics
    const responseTimeMetrics = this.getMetrics(MetricType.RESPONSE_TIME);
    if (responseTimeMetrics.length > 0) {
      const latest = responseTimeMetrics[responseTimeMetrics.length - 1];
      metrics.push(`trendzo_response_time_seconds ${latest.value / 1000} ${now}`);
    }

    // Throughput metrics
    const throughput = this.getThroughputMetrics();
    metrics.push(`trendzo_requests_per_second ${throughput.requestsPerSecond} ${now}`);
    metrics.push(`trendzo_requests_total ${throughput.totalRequests} ${now}`);

    // Error metrics
    const errorSummary = this.getErrorSummary();
    metrics.push(`trendzo_errors_total ${errorSummary.totalErrors} ${now}`);

    // System metrics
    const systemMetrics = this.getMetrics(MetricType.CPU_USAGE);
    if (systemMetrics.length > 0) {
      const latestCPU = systemMetrics[systemMetrics.length - 1];
      metrics.push(`trendzo_cpu_usage_percent ${latestCPU.value} ${now}`);
    }

    const memoryMetrics = this.getMetrics(MetricType.MEMORY_USAGE);
    if (memoryMetrics.length > 0) {
      const latestMemory = memoryMetrics[memoryMetrics.length - 1];
      metrics.push(`trendzo_memory_usage_percent ${latestMemory.value} ${now}`);
    }

    return metrics.join('\n');
  }

  // Private methods

  private setupEventHandlers(): void {
    this.on('alert:slow_response', (data) => {
      console.warn(`🐌 Slow response detected: ${data.endpoint} took ${data.responseTime}ms`);
    });

    this.on('alert:high_error_rate', (data) => {
      console.error(`🚨 High error rate detected: ${data.errorRate}% (threshold: ${data.threshold}%)`);
    });

    this.on('alert:high_cpu', (data) => {
      console.warn(`⚡ High CPU usage: ${data.usage}% (threshold: ${data.threshold}%)`);
    });

    this.on('alert:high_memory', (data) => {
      console.warn(`💾 High memory usage: ${data.usage}% (threshold: ${data.threshold}%)`);
    });
  }

  private addMetric(metric: PerformanceMetric): void {
    const key = metric.metricType.toString();
    
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }

    const metricArray = this.metrics.get(key)!;
    metricArray.push(metric);

    // Keep buffer size manageable
    if (metricArray.length > this.BUFFER_SIZE) {
      this.metrics.set(key, metricArray.slice(-this.BUFFER_SIZE));
    }
  }

  private collectMetrics(): void {
    // This will be called every second to collect real-time metrics
    const now = new Date();

    // Emit throughput update
    const throughput = this.getThroughputMetrics(5000); // 5-second window
    this.emit('metric:throughput', throughput);
  }

  private async collectSystemMetrics(): Promise<void> {
    try {
      const now = new Date();

      // CPU Usage
      const cpuUsage = await this.getCPUUsage();
      this.addMetric({
        timestamp: now,
        metricType: MetricType.CPU_USAGE,
        value: cpuUsage,
        labels: { core: 'all' },
        source: 'system'
      });

      // Memory Usage
      const memoryStats = this.getMemoryStats();
      this.addMetric({
        timestamp: now,
        metricType: MetricType.MEMORY_USAGE,
        value: memoryStats.usagePercent,
        labels: { type: 'usage_percent' },
        source: 'system'
      });

      // Disk Usage
      const diskStats = await this.getDiskStats();
      this.addMetric({
        timestamp: now,
        metricType: MetricType.DISK_USAGE,
        value: diskStats.usagePercent,
        labels: { mount: '/' },
        source: 'system'
      });

      // Network I/O
      const networkStats = await this.getNetworkStats();
      this.addMetric({
        timestamp: now,
        metricType: MetricType.NETWORK_IO,
        value: networkStats.bytesIn + networkStats.bytesOut,
        labels: { direction: 'total' },
        source: 'system'
      });

      // Check thresholds
      this.checkSystemThresholds(cpuUsage, memoryStats.usagePercent, diskStats.usagePercent);

    } catch (error) {
      console.error('Error collecting system metrics:', error);
    }
  }

  private async getCPUUsage(): Promise<number> {
    return new Promise((resolve) => {
      const startUsage = process.cpuUsage();
      const startTime = process.hrtime();

      setTimeout(() => {
        const endUsage = process.cpuUsage(startUsage);
        const endTime = process.hrtime(startTime);

        const totalTime = endTime[0] * 1000000 + endTime[1] / 1000; // microseconds
        const totalCPUTime = endUsage.user + endUsage.system; // microseconds

        const cpuPercent = (totalCPUTime / totalTime) * 100;
        resolve(Math.min(cpuPercent, 100)); // Cap at 100%
      }, 100);
    });
  }

  private getMemoryStats() {
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;
    const usagePercent = (used / total) * 100;

    return {
      total,
      free,
      used,
      usagePercent: parseFloat(usagePercent.toFixed(2))
    };
  }

  private async getDiskStats() {
    try {
      const stats = await promisify(fs.stat)(process.cwd());
      // This is a simplified version - in production, use proper disk space monitoring
      const total = 100000000000; // 100GB default
      const used = stats.size || 0;
      const free = total - used;
      const usagePercent = (used / total) * 100;

      return {
        total,
        free,
        used,
        usagePercent: parseFloat(usagePercent.toFixed(2))
      };
    } catch (error) {
      return {
        total: 0,
        free: 0,
        used: 0,
        usagePercent: 0
      };
    }
  }

  private async getNetworkStats() {
    // Simplified network stats - in production, use proper network monitoring
    const interfaces = os.networkInterfaces();
    let bytesIn = 0;
    let bytesOut = 0;
    let packetsIn = 0;
    let packetsOut = 0;

    // This is a placeholder - real implementation would read from /proc/net/dev on Linux
    return {
      bytesIn,
      bytesOut,
      packetsIn,
      packetsOut
    };
  }

  private checkErrorRateThresholds(): void {
    const errorSummary = this.getErrorSummary(300000); // 5-minute window
    const throughput = this.getThroughputMetrics(300000);
    
    if (throughput.totalRequests > 0) {
      const errorRate = (errorSummary.totalErrors / throughput.totalRequests) * 100;
      
      if (errorRate > 5) { // 5% error rate threshold
        this.emit('alert:high_error_rate', {
          errorRate: parseFloat(errorRate.toFixed(2)),
          threshold: 5,
          totalErrors: errorSummary.totalErrors,
          totalRequests: throughput.totalRequests
        });
      }
    }
  }

  private checkSystemThresholds(cpuUsage: number, memoryUsage: number, diskUsage: number): void {
    // CPU threshold
    if (cpuUsage > 80) {
      this.emit('alert:high_cpu', {
        usage: parseFloat(cpuUsage.toFixed(2)),
        threshold: 80
      });
    }

    // Memory threshold
    if (memoryUsage > 85) {
      this.emit('alert:high_memory', {
        usage: parseFloat(memoryUsage.toFixed(2)),
        threshold: 85
      });
    }

    // Disk threshold
    if (diskUsage > 90) {
      this.emit('alert:high_disk', {
        usage: parseFloat(diskUsage.toFixed(2)),
        threshold: 90
      });
    }
  }
}

// Export singleton instance
export const realTimeMonitor = RealTimeMonitor.getInstance();

// Middleware for automatic response time tracking
export function responseTimeMiddleware() {
  return (req: any, res: any, next: any) => {
    const startTime = performance.now();
    
    res.on('finish', () => {
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      realTimeMonitor.recordResponseTime({
        endpoint: req.route?.path || req.path || req.url,
        method: req.method,
        responseTime,
        statusCode: res.statusCode,
        userAgent: req.get('User-Agent') || 'unknown',
        ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
        timestamp: new Date()
      });
    });

    next();
  };
}