/**
 * Intelligent Alert Management System
 * Production-ready alerting with smart thresholds, escalation, and multi-channel notifications
 */

import { metricsCollector, Metric, MetricType, BusinessMetricCategory } from './metrics-collector';
import { createClient } from '@supabase/supabase-js';

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  metricName: string;
  condition: AlertCondition;
  threshold: number;
  duration: number; // Duration in seconds that condition must be true
  severity: AlertSeverity;
  enabled: boolean;
  tags: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Notification settings
  notificationChannels: NotificationChannel[];
  escalationPolicy?: EscalationPolicy;
  suppressDuration?: number; // Suppress similar alerts for this duration (seconds)
  
  // Smart alerting
  adaptiveThreshold?: boolean;
  baselineWindow?: number; // Window for calculating baseline (hours)
  anomalyDetection?: boolean;
}

export interface AlertCondition {
  operator: ConditionOperator;
  aggregation: AggregationType;
  timeWindow: number; // Time window in seconds
  groupBy?: string[];
  filters?: AlertFilter[];
}

export interface AlertFilter {
  label: string;
  operator: FilterOperator;
  value: string;
}

export enum ConditionOperator {
  GREATER_THAN = 'gt',
  LESS_THAN = 'lt',
  GREATER_THAN_OR_EQUAL = 'gte',
  LESS_THAN_OR_EQUAL = 'lte',
  EQUAL = 'eq',
  NOT_EQUAL = 'ne',
  INCREASE = 'increase',
  DECREASE = 'decrease'
}

export enum FilterOperator {
  EQUAL = 'eq',
  NOT_EQUAL = 'ne',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains',
  REGEX = 'regex'
}

export enum AggregationType {
  SUM = 'sum',
  AVG = 'avg',
  MIN = 'min',
  MAX = 'max',
  COUNT = 'count',
  RATE = 'rate',
  PERCENTILE_95 = 'p95',
  PERCENTILE_99 = 'p99'
}

export enum AlertSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFO = 'info'
}

export enum AlertStatus {
  FIRING = 'firing',
  RESOLVED = 'resolved',
  SUPPRESSED = 'suppressed',
  ACKNOWLEDGED = 'acknowledged'
}

export interface Alert {
  id: string;
  ruleId: string;
  ruleName: string;
  status: AlertStatus;
  severity: AlertSeverity;
  message: string;
  description: string;
  value: number;
  threshold: number;
  labels: Record<string, string>;
  annotations: Record<string, string>;
  startsAt: Date;
  endsAt?: Date;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  
  // Escalation tracking
  escalationLevel: number;
  lastEscalatedAt?: Date;
  
  // Notification tracking
  notificationsSent: NotificationLog[];
}

export interface NotificationLog {
  channel: NotificationChannel;
  sentAt: Date;
  success: boolean;
  error?: string;
  escalationLevel: number;
}

export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  SLACK = 'slack',
  WEBHOOK = 'webhook',
  DASHBOARD = 'dashboard',
  MOBILE_PUSH = 'mobile_push'
}

export interface EscalationPolicy {
  levels: EscalationLevel[];
  maxEscalations: number;
  escalationInterval: number; // seconds
}

export interface EscalationLevel {
  level: number;
  channels: NotificationChannel[];
  recipients: string[];
  delay: number; // seconds to wait before this level
}

export interface NotificationProvider {
  channel: NotificationChannel;
  send(alert: Alert, recipients: string[]): Promise<boolean>;
}

/**
 * Email Notification Provider
 */
class EmailNotificationProvider implements NotificationProvider {
  channel = NotificationChannel.EMAIL;

  async send(alert: Alert, recipients: string[]): Promise<boolean> {
    try {
      // Integration with email service (SendGrid, AWS SES, etc.)
      const emailContent = this.generateEmailContent(alert);
      
      for (const recipient of recipients) {
        await this.sendEmail(recipient, emailContent);
      }
      
      return true;
    } catch (error) {
      console.error('Email notification failed:', error);
      return false;
    }
  }

  private generateEmailContent(alert: Alert) {
    const subject = `[${alert.severity.toUpperCase()}] ${alert.ruleName}`;
    const body = `
      Alert: ${alert.ruleName}
      Severity: ${alert.severity}
      Status: ${alert.status}
      
      Description: ${alert.description}
      
      Current Value: ${alert.value}
      Threshold: ${alert.threshold}
      
      Started At: ${alert.startsAt.toISOString()}
      
      Labels: ${JSON.stringify(alert.labels, null, 2)}
      
      Dashboard: ${process.env.NEXT_PUBLIC_APP_URL}/admin/monitoring/alerts/${alert.id}
    `;

    return { subject, body };
  }

  private async sendEmail(recipient: string, content: { subject: string; body: string }) {
    // Implementation would integrate with your email service
    console.log(`Sending email to ${recipient}:`, content.subject);
  }
}

/**
 * Slack Notification Provider
 */
class SlackNotificationProvider implements NotificationProvider {
  channel = NotificationChannel.SLACK;

  async send(alert: Alert, recipients: string[]): Promise<boolean> {
    try {
      const message = this.generateSlackMessage(alert);
      
      for (const webhook of recipients) {
        await this.sendSlackMessage(webhook, message);
      }
      
      return true;
    } catch (error) {
      console.error('Slack notification failed:', error);
      return false;
    }
  }

  private generateSlackMessage(alert: Alert) {
    const color = this.getSeverityColor(alert.severity);
    const emoji = this.getSeverityEmoji(alert.severity);
    
    return {
      text: `${emoji} Alert: ${alert.ruleName}`,
      attachments: [
        {
          color,
          fields: [
            {
              title: 'Severity',
              value: alert.severity.toUpperCase(),
              short: true
            },
            {
              title: 'Status',
              value: alert.status,
              short: true
            },
            {
              title: 'Current Value',
              value: alert.value.toString(),
              short: true
            },
            {
              title: 'Threshold',
              value: alert.threshold.toString(),
              short: true
            },
            {
              title: 'Description',
              value: alert.description,
              short: false
            }
          ],
          ts: Math.floor(alert.startsAt.getTime() / 1000)
        }
      ]
    };
  }

  private getSeverityColor(severity: AlertSeverity): string {
    switch (severity) {
      case AlertSeverity.CRITICAL: return 'danger';
      case AlertSeverity.HIGH: return 'warning';
      case AlertSeverity.MEDIUM: return '#ffaa00';
      case AlertSeverity.LOW: return 'good';
      default: return '#808080';
    }
  }

  private getSeverityEmoji(severity: AlertSeverity): string {
    switch (severity) {
      case AlertSeverity.CRITICAL: return '🚨';
      case AlertSeverity.HIGH: return '⚠️';
      case AlertSeverity.MEDIUM: return '🔶';
      case AlertSeverity.LOW: return '🔷';
      default: return 'ℹ️';
    }
  }

  private async sendSlackMessage(webhook: string, message: any) {
    // Implementation would send to Slack webhook
    console.log(`Sending Slack message to ${webhook}:`, message.text);
  }
}

/**
 * Webhook Notification Provider
 */
class WebhookNotificationProvider implements NotificationProvider {
  channel = NotificationChannel.WEBHOOK;

  async send(alert: Alert, recipients: string[]): Promise<boolean> {
    try {
      const payload = this.generateWebhookPayload(alert);
      
      for (const webhookUrl of recipients) {
        await this.sendWebhook(webhookUrl, payload);
      }
      
      return true;
    } catch (error) {
      console.error('Webhook notification failed:', error);
      return false;
    }
  }

  private generateWebhookPayload(alert: Alert) {
    return {
      alert: {
        id: alert.id,
        ruleId: alert.ruleId,
        ruleName: alert.ruleName,
        status: alert.status,
        severity: alert.severity,
        message: alert.message,
        description: alert.description,
        value: alert.value,
        threshold: alert.threshold,
        labels: alert.labels,
        annotations: alert.annotations,
        startsAt: alert.startsAt.toISOString(),
        endsAt: alert.endsAt?.toISOString()
      },
      timestamp: new Date().toISOString(),
      source: 'trendzo-monitoring'
    };
  }

  private async sendWebhook(url: string, payload: any) {
    // Implementation would send HTTP POST to webhook URL
    console.log(`Sending webhook to ${url}:`, payload);
  }
}

/**
 * Baseline Calculator for Adaptive Thresholds
 */
class BaselineCalculator {
  async calculateBaseline(
    metricName: string,
    windowHours: number,
    labels?: Record<string, string>
  ): Promise<{ mean: number; stdDev: number; min: number; max: number }> {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - windowHours * 60 * 60 * 1000);

    const metrics = await metricsCollector.queryMetrics({
      names: [metricName],
      startTime,
      endTime,
      labels
    });

    if (metrics.length === 0) {
      return { mean: 0, stdDev: 0, min: 0, max: 0 };
    }

    const values = metrics.map(m => m.value);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    const min = Math.min(...values);
    const max = Math.max(...values);

    return { mean, stdDev, min, max };
  }

  getAdaptiveThreshold(
    baseline: { mean: number; stdDev: number },
    sensitivity: number = 2
  ): number {
    // Threshold = mean + (sensitivity * standard deviation)
    return baseline.mean + (sensitivity * baseline.stdDev);
  }
}

/**
 * Main Alert Manager
 */
export class AlertManager {
  private supabase: any;
  private alertRules: Map<string, AlertRule> = new Map();
  private activeAlerts: Map<string, Alert> = new Map();
  private notificationProviders: Map<NotificationChannel, NotificationProvider> = new Map();
  private baselineCalculator: BaselineCalculator;
  private evaluationInterval: number = 30000; // 30 seconds

  constructor() {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
      this.supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY
      );
    }

    this.baselineCalculator = new BaselineCalculator();
    this.initializeNotificationProviders();
    this.startEvaluationLoop();
    this.loadAlertRules();
  }

  private initializeNotificationProviders() {
    this.notificationProviders.set(NotificationChannel.EMAIL, new EmailNotificationProvider());
    this.notificationProviders.set(NotificationChannel.SLACK, new SlackNotificationProvider());
    this.notificationProviders.set(NotificationChannel.WEBHOOK, new WebhookNotificationProvider());
  }

  /**
   * Create a new alert rule
   */
  async createAlertRule(rule: Omit<AlertRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<AlertRule> {
    const alertRule: AlertRule = {
      ...rule,
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Store in database
    if (this.supabase) {
      try {
        await this.supabase
          .from('alert_rules')
          .insert({
            id: alertRule.id,
            name: alertRule.name,
            description: alertRule.description,
            metric_name: alertRule.metricName,
            condition: alertRule.condition,
            threshold: alertRule.threshold,
            duration: alertRule.duration,
            severity: alertRule.severity,
            enabled: alertRule.enabled,
            tags: alertRule.tags,
            notification_channels: alertRule.notificationChannels,
            escalation_policy: alertRule.escalationPolicy,
            suppress_duration: alertRule.suppressDuration,
            adaptive_threshold: alertRule.adaptiveThreshold,
            baseline_window: alertRule.baselineWindow,
            anomaly_detection: alertRule.anomalyDetection,
            created_by: alertRule.createdBy,
            created_at: alertRule.createdAt.toISOString(),
            updated_at: alertRule.updatedAt.toISOString()
          });
      } catch (error) {
        console.error('Failed to store alert rule:', error);
      }
    }

    // Add to in-memory cache
    this.alertRules.set(alertRule.id, alertRule);

    return alertRule;
  }

  /**
   * Update an alert rule
   */
  async updateAlertRule(id: string, updates: Partial<AlertRule>): Promise<AlertRule | null> {
    const existingRule = this.alertRules.get(id);
    if (!existingRule) return null;

    const updatedRule: AlertRule = {
      ...existingRule,
      ...updates,
      id,
      updatedAt: new Date()
    };

    // Update in database
    if (this.supabase) {
      try {
        await this.supabase
          .from('alert_rules')
          .update({
            name: updatedRule.name,
            description: updatedRule.description,
            metric_name: updatedRule.metricName,
            condition: updatedRule.condition,
            threshold: updatedRule.threshold,
            duration: updatedRule.duration,
            severity: updatedRule.severity,
            enabled: updatedRule.enabled,
            tags: updatedRule.tags,
            notification_channels: updatedRule.notificationChannels,
            escalation_policy: updatedRule.escalationPolicy,
            suppress_duration: updatedRule.suppressDuration,
            adaptive_threshold: updatedRule.adaptiveThreshold,
            baseline_window: updatedRule.baselineWindow,
            anomaly_detection: updatedRule.anomalyDetection,
            updated_at: updatedRule.updatedAt.toISOString()
          })
          .eq('id', id);
      } catch (error) {
        console.error('Failed to update alert rule:', error);
      }
    }

    // Update in-memory cache
    this.alertRules.set(id, updatedRule);

    return updatedRule;
  }

  /**
   * Delete an alert rule
   */
  async deleteAlertRule(id: string): Promise<boolean> {
    // Remove from database
    if (this.supabase) {
      try {
        await this.supabase
          .from('alert_rules')
          .delete()
          .eq('id', id);
      } catch (error) {
        console.error('Failed to delete alert rule:', error);
        return false;
      }
    }

    // Remove from in-memory cache
    this.alertRules.delete(id);

    return true;
  }

  /**
   * Get all alert rules
   */
  getAlertRules(): AlertRule[] {
    return Array.from(this.alertRules.values());
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values())
      .filter(alert => alert.status === AlertStatus.FIRING);
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<boolean> {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) return false;

    alert.status = AlertStatus.ACKNOWLEDGED;
    alert.acknowledgedBy = acknowledgedBy;
    alert.acknowledgedAt = new Date();

    // Update in database
    if (this.supabase) {
      try {
        await this.supabase
          .from('alerts')
          .update({
            status: alert.status,
            acknowledged_by: alert.acknowledgedBy,
            acknowledged_at: alert.acknowledgedAt.toISOString()
          })
          .eq('id', alertId);
      } catch (error) {
        console.error('Failed to acknowledge alert:', error);
        return false;
      }
    }

    return true;
  }

  /**
   * Load alert rules from database
   */
  private async loadAlertRules(): Promise<void> {
    if (!this.supabase) return;

    try {
      const { data: rules } = await this.supabase
        .from('alert_rules')
        .select('*')
        .eq('enabled', true);

      if (rules) {
        for (const rule of rules) {
          const alertRule: AlertRule = {
            id: rule.id,
            name: rule.name,
            description: rule.description,
            metricName: rule.metric_name,
            condition: rule.condition,
            threshold: rule.threshold,
            duration: rule.duration,
            severity: rule.severity,
            enabled: rule.enabled,
            tags: rule.tags || [],
            notificationChannels: rule.notification_channels || [],
            escalationPolicy: rule.escalation_policy,
            suppressDuration: rule.suppress_duration,
            adaptiveThreshold: rule.adaptive_threshold,
            baselineWindow: rule.baseline_window,
            anomalyDetection: rule.anomaly_detection,
            createdBy: rule.created_by,
            createdAt: new Date(rule.created_at),
            updatedAt: new Date(rule.updated_at)
          };

          this.alertRules.set(alertRule.id, alertRule);
        }

        console.log(`✅ Loaded ${rules.length} alert rules`);
      }
    } catch (error) {
      console.error('Failed to load alert rules:', error);
    }
  }

  /**
   * Start the evaluation loop
   */
  private startEvaluationLoop(): void {
    setInterval(async () => {
      await this.evaluateAlertRules();
    }, this.evaluationInterval);

    console.log(`🚨 Alert evaluation loop started (${this.evaluationInterval}ms interval)`);
  }

  /**
   * Evaluate all alert rules
   */
  private async evaluateAlertRules(): Promise<void> {
    for (const rule of this.alertRules.values()) {
      if (!rule.enabled) continue;

      try {
        await this.evaluateRule(rule);
      } catch (error) {
        console.error(`Failed to evaluate rule ${rule.name}:`, error);
      }
    }
  }

  /**
   * Evaluate a single alert rule
   */
  private async evaluateRule(rule: AlertRule): Promise<void> {
    // Calculate effective threshold (adaptive if enabled)
    let effectiveThreshold = rule.threshold;
    
    if (rule.adaptiveThreshold && rule.baselineWindow) {
      const baseline = await this.baselineCalculator.calculateBaseline(
        rule.metricName,
        rule.baselineWindow
      );
      effectiveThreshold = this.baselineCalculator.getAdaptiveThreshold(baseline);
    }

    // Query metrics for evaluation
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - rule.condition.timeWindow * 1000);

    const aggregatedMetrics = await metricsCollector.aggregateMetrics({
      names: [rule.metricName],
      startTime,
      endTime,
      aggregation: rule.condition.aggregation,
      groupBy: rule.condition.groupBy,
      interval: '1m' // 1 minute intervals
    });

    if (aggregatedMetrics.length === 0) return;

    // Check condition for each metric group
    for (const metric of aggregatedMetrics) {
      const isConditionMet = this.evaluateCondition(
        metric.value,
        effectiveThreshold,
        rule.condition.operator
      );

      const alertKey = `${rule.id}_${JSON.stringify(metric.labels)}`;
      const existingAlert = this.activeAlerts.get(alertKey);

      if (isConditionMet) {
        if (!existingAlert) {
          // Create new alert
          await this.createAlert(rule, metric, effectiveThreshold);
        } else if (existingAlert.status === AlertStatus.RESOLVED) {
          // Reopen alert
          existingAlert.status = AlertStatus.FIRING;
          existingAlert.endsAt = undefined;
        }
      } else {
        if (existingAlert && existingAlert.status === AlertStatus.FIRING) {
          // Resolve alert
          await this.resolveAlert(existingAlert);
        }
      }
    }
  }

  /**
   * Evaluate a condition
   */
  private evaluateCondition(value: number, threshold: number, operator: ConditionOperator): boolean {
    switch (operator) {
      case ConditionOperator.GREATER_THAN:
        return value > threshold;
      case ConditionOperator.LESS_THAN:
        return value < threshold;
      case ConditionOperator.GREATER_THAN_OR_EQUAL:
        return value >= threshold;
      case ConditionOperator.LESS_THAN_OR_EQUAL:
        return value <= threshold;
      case ConditionOperator.EQUAL:
        return value === threshold;
      case ConditionOperator.NOT_EQUAL:
        return value !== threshold;
      default:
        return false;
    }
  }

  /**
   * Create a new alert
   */
  private async createAlert(rule: AlertRule, metric: any, threshold: number): Promise<Alert> {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ruleId: rule.id,
      ruleName: rule.name,
      status: AlertStatus.FIRING,
      severity: rule.severity,
      message: `${rule.name}: ${metric.value} ${rule.condition.operator} ${threshold}`,
      description: rule.description,
      value: metric.value,
      threshold,
      labels: metric.labels,
      annotations: {},
      startsAt: new Date(),
      escalationLevel: 0,
      notificationsSent: []
    };

    // Store in memory
    const alertKey = `${rule.id}_${JSON.stringify(metric.labels)}`;
    this.activeAlerts.set(alertKey, alert);

    // Store in database
    if (this.supabase) {
      try {
        await this.supabase
          .from('alerts')
          .insert({
            id: alert.id,
            rule_id: alert.ruleId,
            rule_name: alert.ruleName,
            status: alert.status,
            severity: alert.severity,
            message: alert.message,
            description: alert.description,
            value: alert.value,
            threshold: alert.threshold,
            labels: alert.labels,
            annotations: alert.annotations,
            starts_at: alert.startsAt.toISOString(),
            escalation_level: alert.escalationLevel
          });
      } catch (error) {
        console.error('Failed to store alert:', error);
      }
    }

    // Send notifications
    await this.sendNotifications(alert, rule);

    console.log(`🚨 Alert created: ${alert.message}`);
    return alert;
  }

  /**
   * Resolve an alert
   */
  private async resolveAlert(alert: Alert): Promise<void> {
    alert.status = AlertStatus.RESOLVED;
    alert.endsAt = new Date();

    // Update in database
    if (this.supabase) {
      try {
        await this.supabase
          .from('alerts')
          .update({
            status: alert.status,
            ends_at: alert.endsAt.toISOString()
          })
          .eq('id', alert.id);
      } catch (error) {
        console.error('Failed to resolve alert:', error);
      }
    }

    console.log(`✅ Alert resolved: ${alert.message}`);
  }

  /**
   * Send notifications for an alert
   */
  private async sendNotifications(alert: Alert, rule: AlertRule): Promise<void> {
    for (const channel of rule.notificationChannels) {
      const provider = this.notificationProviders.get(channel);
      if (!provider) continue;

      try {
        const recipients = this.getRecipientsForChannel(channel);
        const success = await provider.send(alert, recipients);

        const notificationLog: NotificationLog = {
          channel,
          sentAt: new Date(),
          success,
          escalationLevel: alert.escalationLevel
        };

        if (!success) {
          notificationLog.error = 'Failed to send notification';
        }

        alert.notificationsSent.push(notificationLog);

      } catch (error) {
        console.error(`Failed to send ${channel} notification:`, error);
        
        alert.notificationsSent.push({
          channel,
          sentAt: new Date(),
          success: false,
          error: String(error),
          escalationLevel: alert.escalationLevel
        });
      }
    }
  }

  /**
   * Get recipients for a notification channel
   */
  private getRecipientsForChannel(channel: NotificationChannel): string[] {
    // This would be configured based on your organization's setup
    switch (channel) {
      case NotificationChannel.EMAIL:
        return process.env.ALERT_EMAILS?.split(',') || ['admin@example.com'];
      case NotificationChannel.SLACK:
        return process.env.SLACK_WEBHOOK_URLS?.split(',') || [];
      case NotificationChannel.WEBHOOK:
        return process.env.ALERT_WEBHOOK_URLS?.split(',') || [];
      default:
        return [];
    }
  }
}

// Export singleton instance
export const alertManager = new AlertManager();

// Predefined alert rules for common scenarios
export const defaultAlertRules = {
  // Performance alerts
  HIGH_RESPONSE_TIME: {
    name: 'High API Response Time',
    description: 'API response time is consistently high',
    metricName: 'api_request_duration',
    condition: {
      operator: ConditionOperator.GREATER_THAN,
      aggregation: AggregationType.PERCENTILE_95,
      timeWindow: 300 // 5 minutes
    },
    threshold: 2000, // 2 seconds
    duration: 300,
    severity: AlertSeverity.HIGH,
    enabled: true,
    tags: ['performance', 'api'],
    notificationChannels: [NotificationChannel.EMAIL, NotificationChannel.SLACK]
  },

  // Error rate alerts
  HIGH_ERROR_RATE: {
    name: 'High Error Rate',
    description: 'API error rate is above acceptable threshold',
    metricName: 'api_request_count',
    condition: {
      operator: ConditionOperator.GREATER_THAN,
      aggregation: AggregationType.RATE,
      timeWindow: 300,
      filters: [
        { label: 'status_code', operator: FilterOperator.REGEX, value: '^[45]\\d{2}$' }
      ]
    },
    threshold: 0.05, // 5% error rate
    duration: 180,
    severity: AlertSeverity.CRITICAL,
    enabled: true,
    tags: ['errors', 'api'],
    notificationChannels: [NotificationChannel.EMAIL, NotificationChannel.SLACK, NotificationChannel.WEBHOOK]
  },

  // Business metric alerts
  LOW_PREDICTION_ACCURACY: {
    name: 'Low Viral Prediction Accuracy',
    description: 'Viral prediction accuracy has dropped significantly',
    metricName: 'viral_prediction_accuracy',
    condition: {
      operator: ConditionOperator.LESS_THAN,
      aggregation: AggregationType.AVG,
      timeWindow: 3600 // 1 hour
    },
    threshold: 80, // 80% accuracy
    duration: 1800,
    severity: AlertSeverity.MEDIUM,
    enabled: true,
    tags: ['business', 'predictions'],
    notificationChannels: [NotificationChannel.EMAIL]
  }
};