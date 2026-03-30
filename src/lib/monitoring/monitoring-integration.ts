/**
 * Monitoring & Security Integration
 * Unified integration of monitoring, alerting, and security systems
 */

import { NextRequest, NextResponse } from 'next/server';
import { metricsCollector, MetricType, MetricUnit } from './metrics-collector';
import { businessMetricsCalculator, businessMetricsScheduler } from './business-metrics';
import { alertManager, defaultAlertRules } from './alert-manager';
import { notificationService, MonitoringNotifications } from './notification-service';
import { securityMonitor, SecurityEventType, SecuritySeverity } from '../security/security-monitor';
import { getAuthService } from '../security/auth-middleware';

export interface MonitoringConfig {
  enableMetricsCollection: boolean;
  enableBusinessMetrics: boolean;
  enableAlerts: boolean;
  enableNotifications: boolean;
  enableSecurityIntegration: boolean;
  metricsRetentionDays: number;
  alertEvaluationInterval: number;
  businessMetricsInterval: number;
}

export interface SystemStatus {
  overall: 'healthy' | 'degraded' | 'critical';
  components: {
    api: ComponentStatus;
    database: ComponentStatus;
    monitoring: ComponentStatus;
    security: ComponentStatus;
    notifications: ComponentStatus;
  };
  metrics: {
    uptime: number;
    responseTime: number;
    errorRate: number;
    throughput: number;
  };
  lastCheck: Date;
}

interface ComponentStatus {
  status: 'healthy' | 'degraded' | 'critical' | 'unknown';
  message?: string;
  lastCheck: Date;
  responseTime?: number;
}

/**
 * Main Monitoring Integration Class
 */
export class MonitoringIntegration {
  private config: MonitoringConfig;
  private systemStatus: SystemStatus | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<MonitoringConfig> = {}) {
    this.config = {
      enableMetricsCollection: true,
      enableBusinessMetrics: true,
      enableAlerts: true,
      enableNotifications: true,
      enableSecurityIntegration: true,
      metricsRetentionDays: 30,
      alertEvaluationInterval: 30000,
      businessMetricsInterval: 300000,
      ...config
    };

    this.initialize();
  }

  /**
   * Initialize monitoring system
   */
  private async initialize(): Promise<void> {
    console.log('🚀 Initializing Monitoring & Security Integration...');

    try {
      // Initialize alert rules
      if (this.config.enableAlerts) {
        await this.initializeDefaultAlerts();
      }

      // Start business metrics scheduler
      if (this.config.enableBusinessMetrics) {
        businessMetricsScheduler.start();
      }

      // Start health checks
      this.startHealthChecks();

      // Setup security event integration
      if (this.config.enableSecurityIntegration) {
        this.setupSecurityIntegration();
      }

      console.log('✅ Monitoring & Security Integration initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize monitoring integration:', error);
      throw error;
    }
  }

  /**
   * Initialize default alert rules
   */
  private async initializeDefaultAlerts(): Promise<void> {
    try {
      // Create default alert rules if they don't exist
      for (const [ruleName, ruleConfig] of Object.entries(defaultAlertRules)) {
        await alertManager.createAlertRule({
          ...ruleConfig,
          createdBy: 'system'
        });
      }

      console.log('📋 Default alert rules initialized');
    } catch (error) {
      console.error('Failed to initialize alert rules:', error);
    }
  }

  /**
   * Setup security event integration
   */
  private setupSecurityIntegration(): void {
    // Register callback for security events
    securityMonitor.onAlert((securityEvent) => {
      // Convert security event to monitoring alert
      this.handleSecurityEvent(securityEvent);
    });

    console.log('🔒 Security integration enabled');
  }

  /**
   * Handle security events from security monitor
   */
  private async handleSecurityEvent(securityEvent: any): Promise<void> {
    try {
      // Create monitoring alert for high/critical security events
      if (securityEvent.severity === SecuritySeverity.HIGH || 
          securityEvent.severity === SecuritySeverity.CRITICAL) {
        
        await MonitoringNotifications.sendAlertNotification(
          `Security Alert: ${securityEvent.type}`,
          securityEvent.severity,
          securityEvent.description,
          {
            source: securityEvent.source,
            ipAddress: securityEvent.ipAddress,
            endpoint: securityEvent.endpoint,
            timestamp: securityEvent.timestamp
          }
        );
      }

      // Record security metrics
      await metricsCollector.recordCustom({
        name: 'security_event_count',
        type: MetricType.COUNTER,
        value: 1,
        unit: MetricUnit.COUNT,
        labels: {
          type: securityEvent.type,
          severity: securityEvent.severity,
          source: securityEvent.source
        }
      });

    } catch (error) {
      console.error('Failed to handle security event:', error);
    }
  }

  /**
   * Middleware for request monitoring
   */
  async monitorRequest(req: NextRequest): Promise<{
    startTime: number;
    endHandler: (res: NextResponse) => Promise<void>;
  }> {
    const startTime = Date.now();
    const url = new URL(req.url);
    const endpoint = url.pathname;
    const method = req.method;

    // Get user context if available
    let userId: string | undefined;
    try {
      const authHeader = req.headers.get('authorization');
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        const svc = getAuthService();
        void token; // placeholder to avoid unused var; actual monitoring code not verifying here
        const user = await svc.createUserToken.bind(svc);
        // Extract user ID from context if available
        userId = req.headers.get('x-user-id') || undefined;
      }
    } catch (error) {
      // Ignore auth errors for monitoring
    }

    return {
      startTime,
      endHandler: async (res: NextResponse) => {
        const duration = Date.now() - startTime;
        const statusCode = res.status;

        // Record API metrics
        if (this.config.enableMetricsCollection) {
          await metricsCollector.recordAPICall(
            endpoint,
            method,
            statusCode,
            duration,
            userId
          );

          // Record business engagement if it's a user action
          if (userId && this.isUserEngagementEndpoint(endpoint)) {
            await metricsCollector.recordUserEngagement(
              this.getEngagementAction(endpoint),
              userId,
              req.headers.get('x-session-id') || 'unknown',
              { endpoint, method, statusCode, duration }
            );
          }
        }

        // Check for performance issues
        await this.checkPerformanceThresholds(endpoint, duration, statusCode);
      }
    };
  }

  /**
   * Check performance thresholds and trigger alerts
   */
  private async checkPerformanceThresholds(
    endpoint: string, 
    duration: number, 
    statusCode: number
  ): Promise<void> {
    // High response time alert
    if (duration > 5000) { // 5 seconds
      await MonitoringNotifications.sendPerformanceAlert(
        'High Response Time',
        duration,
        5000,
        'increasing'
      );
    }

    // Error rate monitoring
    if (statusCode >= 500) {
      await metricsCollector.recordCustom({
        name: 'server_error_count',
        type: MetricType.COUNTER,
        value: 1,
        unit: MetricUnit.COUNT,
        labels: {
          endpoint,
          status_code: statusCode.toString()
        }
      });
    }
  }

  /**
   * Get current system status
   */
  async getSystemStatus(): Promise<SystemStatus> {
    if (this.systemStatus && 
        Date.now() - this.systemStatus.lastCheck.getTime() < 30000) {
      return this.systemStatus;
    }

    return await this.performHealthCheck();
  }

  /**
   * Perform comprehensive health check
   */
  private async performHealthCheck(): Promise<SystemStatus> {
    const startTime = Date.now();

    try {
      // Check individual components
      const [
        apiStatus,
        databaseStatus,
        monitoringStatus,
        securityStatus,
        notificationStatus
      ] = await Promise.allSettled([
        this.checkAPIHealth(),
        this.checkDatabaseHealth(),
        this.checkMonitoringHealth(),
        this.checkSecurityHealth(),
        this.checkNotificationHealth()
      ]);

      const components = {
        api: this.getComponentStatus(apiStatus),
        database: this.getComponentStatus(databaseStatus),
        monitoring: this.getComponentStatus(monitoringStatus),
        security: this.getComponentStatus(securityStatus),
        notifications: this.getComponentStatus(notificationStatus)
      };

      // Calculate overall status
      const componentStatuses = Object.values(components).map(c => c.status);
      const overall = componentStatuses.includes('critical') ? 'critical' :
                     componentStatuses.includes('degraded') ? 'degraded' : 
                     'healthy';

      // Get system metrics
      const metrics = await this.getSystemMetrics();

      this.systemStatus = {
        overall,
        components,
        metrics,
        lastCheck: new Date()
      };

      // Record health check metrics
      await metricsCollector.recordCustom({
        name: 'system_health_score',
        type: MetricType.GAUGE,
        value: this.calculateHealthScore(components),
        unit: MetricUnit.PERCENTAGE,
        labels: { overall }
      });

      // Send alerts for critical status
      if (overall === 'critical') {
        await MonitoringNotifications.sendSystemHealthNotification(
          this.calculateHealthScore(components),
          this.getHealthIssues(components)
        );
      }

      return this.systemStatus;

    } catch (error) {
      console.error('Health check failed:', error);
      
      return {
        overall: 'critical',
        components: {
          api: { status: 'unknown', lastCheck: new Date(), message: 'Health check failed' },
          database: { status: 'unknown', lastCheck: new Date(), message: 'Health check failed' },
          monitoring: { status: 'unknown', lastCheck: new Date(), message: 'Health check failed' },
          security: { status: 'unknown', lastCheck: new Date(), message: 'Health check failed' },
          notifications: { status: 'unknown', lastCheck: new Date(), message: 'Health check failed' }
        },
        metrics: {
          uptime: process.uptime(),
          responseTime: Date.now() - startTime,
          errorRate: 100,
          throughput: 0
        },
        lastCheck: new Date()
      };
    }
  }

  /**
   * Individual component health checks
   */
  private async checkAPIHealth(): Promise<ComponentStatus> {
    const startTime = Date.now();
    
    try {
      // Check if API is responding
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/health`, {
        timeout: 5000
      });
      
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        return {
          status: responseTime > 2000 ? 'degraded' : 'healthy',
          lastCheck: new Date(),
          responseTime,
          message: responseTime > 2000 ? 'Slow response time' : undefined
        };
      } else {
        return {
          status: 'critical',
          lastCheck: new Date(),
          responseTime,
          message: `HTTP ${response.status}`
        };
      }
    } catch (error) {
      return {
        status: 'critical',
        lastCheck: new Date(),
        message: 'API unreachable'
      };
    }
  }

  private async checkDatabaseHealth(): Promise<ComponentStatus> {
    try {
      // Try to query metrics to check database connection
      const recentMetrics = await metricsCollector.queryMetrics({
        names: ['system_uptime'],
        startTime: new Date(Date.now() - 60000),
        endTime: new Date(),
        limit: 1
      });

      return {
        status: 'healthy',
        lastCheck: new Date(),
        message: `${recentMetrics.length} recent metrics`
      };
    } catch (error) {
      return {
        status: 'critical',
        lastCheck: new Date(),
        message: 'Database connection failed'
      };
    }
  }

  private async checkMonitoringHealth(): Promise<ComponentStatus> {
    try {
      // Check if metrics collection is working
      await metricsCollector.recordCustom({
        name: 'health_check_test',
        type: MetricType.COUNTER,
        value: 1,
        unit: MetricUnit.COUNT,
        labels: { test: 'health_check' }
      });

      return {
        status: 'healthy',
        lastCheck: new Date()
      };
    } catch (error) {
      return {
        status: 'degraded',
        lastCheck: new Date(),
        message: 'Metrics collection issues'
      };
    }
  }

  private async checkSecurityHealth(): Promise<ComponentStatus> {
    try {
      // Check if security monitoring is active
      const securityMetrics = await securityMonitor.getMetrics('1h');
      
      return {
        status: securityMetrics.totalEvents > 1000 ? 'degraded' : 'healthy',
        lastCheck: new Date(),
        message: securityMetrics.totalEvents > 1000 ? 'High security event volume' : undefined
      };
    } catch (error) {
      return {
        status: 'degraded',
        lastCheck: new Date(),
        message: 'Security monitoring issues'
      };
    }
  }

  private async checkNotificationHealth(): Promise<ComponentStatus> {
    try {
      const providersHealth = await notificationService.getProvidersHealth();
      const healthyProviders = Object.values(providersHealth).filter(Boolean).length;
      const totalProviders = Object.keys(providersHealth).length;

      if (healthyProviders === 0) {
        return {
          status: 'critical',
          lastCheck: new Date(),
          message: 'No notification providers available'
        };
      } else if (healthyProviders < totalProviders) {
        return {
          status: 'degraded',
          lastCheck: new Date(),
          message: `${healthyProviders}/${totalProviders} providers healthy`
        };
      } else {
        return {
          status: 'healthy',
          lastCheck: new Date()
        };
      }
    } catch (error) {
      return {
        status: 'degraded',
        lastCheck: new Date(),
        message: 'Notification health check failed'
      };
    }
  }

  /**
   * Get system-wide metrics
   */
  private async getSystemMetrics(): Promise<SystemStatus['metrics']> {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      const recentMetrics = await metricsCollector.queryMetrics({
        names: ['api_request_duration', 'api_request_count'],
        startTime: oneHourAgo,
        endTime: now
      });

      const requestDurations = recentMetrics.filter(m => m.name === 'api_request_duration');
      const requestCounts = recentMetrics.filter(m => m.name === 'api_request_count');

      const totalRequests = requestCounts.reduce((sum, m) => sum + m.value, 0);
      const errorRequests = requestCounts.filter(m => {
        const statusCode = parseInt(m.labels.status_code || '200');
        return statusCode >= 400;
      }).reduce((sum, m) => sum + m.value, 0);

      const averageResponseTime = requestDurations.length > 0 ?
        requestDurations.reduce((sum, m) => sum + m.value, 0) / requestDurations.length : 0;

      return {
        uptime: process.uptime(),
        responseTime: averageResponseTime,
        errorRate: totalRequests > 0 ? (errorRequests / totalRequests) * 100 : 0,
        throughput: totalRequests / 3600 // requests per hour
      };
    } catch (error) {
      return {
        uptime: process.uptime(),
        responseTime: 0,
        errorRate: 0,
        throughput: 0
      };
    }
  }

  /**
   * Utility methods
   */
  private getComponentStatus(result: PromiseSettledResult<ComponentStatus>): ComponentStatus {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        status: 'critical',
        lastCheck: new Date(),
        message: 'Health check failed'
      };
    }
  }

  private calculateHealthScore(components: SystemStatus['components']): number {
    const weights = { api: 30, database: 25, monitoring: 15, security: 15, notifications: 15 };
    let totalScore = 0;

    for (const [component, status] of Object.entries(components)) {
      const weight = weights[component as keyof typeof weights];
      const score = status.status === 'healthy' ? 100 :
                   status.status === 'degraded' ? 60 :
                   status.status === 'critical' ? 20 : 0;
      totalScore += (score * weight) / 100;
    }

    return Math.round(totalScore);
  }

  private getHealthIssues(components: SystemStatus['components']): string[] {
    const issues: string[] = [];
    
    for (const [component, status] of Object.entries(components)) {
      if (status.status !== 'healthy') {
        issues.push(`${component}: ${status.message || status.status}`);
      }
    }

    return issues;
  }

  private isUserEngagementEndpoint(endpoint: string): boolean {
    const engagementEndpoints = [
      '/api/viral-prediction',
      '/api/templates',
      '/api/user/profile',
      '/api/analytics'
    ];
    
    return engagementEndpoints.some(pattern => endpoint.startsWith(pattern));
  }

  private getEngagementAction(endpoint: string): string {
    if (endpoint.includes('viral-prediction')) return 'prediction_generated';
    if (endpoint.includes('templates')) return 'template_used';
    if (endpoint.includes('analytics')) return 'analytics_viewed';
    return 'page_viewed';
  }

  /**
   * Start periodic health checks
   */
  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, 60000); // Every minute

    console.log('❤️ Health checks started (60s interval)');
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    if (this.config.enableBusinessMetrics) {
      businessMetricsScheduler.stop();
    }

    console.log('🧹 Monitoring integration cleanup completed');
  }
}

/**
 * Express/Next.js middleware factory
 */
export function createMonitoringMiddleware(config?: Partial<MonitoringConfig>) {
  const monitoring = new MonitoringIntegration(config);

  return async (req: NextRequest): Promise<{
    response?: NextResponse;
    headers?: Headers;
    monitoring: {
      startTime: number;
      endHandler: (res: NextResponse) => Promise<void>;
    };
  }> => {
    try {
      const monitoringData = await monitoring.monitorRequest(req);
      
      return {
        monitoring: monitoringData
      };

    } catch (error) {
      console.error('Monitoring middleware error:', error);
      
      // Return minimal monitoring data to avoid breaking the request
      return {
        monitoring: {
          startTime: Date.now(),
          endHandler: async () => {}
        }
      };
    }
  };
}

// Export singleton instance
export const monitoringIntegration = new MonitoringIntegration();

// Export utilities
export { SystemStatus, ComponentStatus, MonitoringConfig };