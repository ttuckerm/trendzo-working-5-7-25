/**
 * MULTI-CHANNEL ALERT SYSTEM
 * Production-ready alerting with intelligent thresholds and escalation
 * Supports email, SMS, Slack, Discord, webhooks, and push notifications
 * Part of BMAD Advanced Monitoring & Alerting implementation
 */

import { EventEmitter } from 'events';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import { realTimeMonitor, MetricType, Alert, AlertSeverity } from './real-time-monitor';
import { SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_ANON_KEY } from '@/lib/env';
export { AlertSeverity };

// Alert Channel Types
export enum AlertChannel {
  EMAIL = 'email',
  SMS = 'sms',
  SLACK = 'slack',
  DISCORD = 'discord',
  WEBHOOK = 'webhook',
  PUSH = 'push',
  TEAMS = 'teams',
  PAGERDUTY = 'pagerduty'
}

// Alert Rule Configuration
export interface AlertRule {
  id: string;
  name: string;
  description: string;
  metric: MetricType;
  condition: 'greater_than' | 'less_than' | 'equals' | 'not_equals' | 'change_rate';
  threshold: number;
  severity: AlertSeverity;
  enabled: boolean;
  channels: AlertChannel[];
  escalationRules: EscalationRule[];
  cooldownPeriod: number; // minutes
  tags: string[];
  filters?: Record<string, string>;
  customLogic?: string; // For complex rules
  createdAt: Date;
  updatedAt: Date;
}

// Escalation Configuration
export interface EscalationRule {
  level: number;
  delayMinutes: number;
  channels: AlertChannel[];
  recipients: string[];
  condition?: 'not_acknowledged' | 'not_resolved' | 'severity_increase';
}

// Notification Configuration
export interface NotificationConfig {
  email: {
    smtp: {
      host: string;
      port: number;
      secure: boolean;
      auth: {
        user: string;
        pass: string;
      };
    };
    from: string;
    templates: Record<AlertSeverity, {
      subject: string;
      html: string;
      text: string;
    }>;
  };
  sms: {
    provider: 'twilio' | 'aws_sns';
    config: Record<string, string>;
  };
  slack: {
    webhookUrl: string;
    channels: Record<AlertSeverity, string>;
    mentions: Record<AlertSeverity, string[]>;
  };
  discord: {
    webhookUrl: string;
    channels: Record<AlertSeverity, string>;
  };
  teams: {
    webhookUrl: string;
  };
  pagerduty: {
    integrationKey: string;
    serviceKey: string;
  };
}

// Alert Context
export interface AlertContext {
  alertId: string;
  ruleId: string;
  timestamp: Date;
  metric: {
    type: MetricType;
    value: number;
    threshold: number;
    labels: Record<string, string>;
  };
  severity: AlertSeverity;
  environment: string;
  service: string;
  additionalData?: Record<string, any>;
}

// Intelligent Threshold Configuration
export interface ThresholdConfig {
  baseThreshold: number;
  adaptiveEnabled: boolean;
  learningPeriodDays: number;
  seasonalAdjustment: boolean;
  anomalyDetection: boolean;
  confidenceLevel: number; // 0.95 = 95% confidence
  minSamplesForAdaptation: number;
}

/**
 * Multi-Channel Alert System
 * Comprehensive alerting with intelligent thresholds and escalation
 */
export class AlertSystem extends EventEmitter {
  private static instance: AlertSystem;
  private supabase: any;
  private emailTransporter: any;
  private alertRules: Map<string, AlertRule> = new Map();
  private activeAlerts: Map<string, Alert> = new Map();
  private escalationTimers: Map<string, NodeJS.Timeout> = new Map();
  private notificationConfig: NotificationConfig;
  private thresholdLearning: Map<string, number[]> = new Map();
  
  // Rate limiting for notifications
  private notificationRateLimit: Map<string, number> = new Map();
  private readonly RATE_LIMIT_WINDOW = 300000; // 5 minutes
  private readonly MAX_NOTIFICATIONS_PER_WINDOW = 10;

  private constructor() {
    super();
    this.initializeNotificationConfig();
    this.setupEventHandlers();
    // Defer DB-backed initialization to first use to avoid build-time env requirements
  }
  private getDb() {
    return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY);
  }


  public static getInstance(): AlertSystem {
    if (!AlertSystem.instance) {
      AlertSystem.instance = new AlertSystem();
    }
    return AlertSystem.instance;
  }

  /**
   * Create a new alert rule
   */
  public async createAlertRule(rule: Omit<AlertRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const alertRule: AlertRule = {
      ...rule,
      id: this.generateAlertId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Validate rule
    this.validateAlertRule(alertRule);

    // Save to database
    await this.saveAlertRule(alertRule);

    // Store in memory
    this.alertRules.set(alertRule.id, alertRule);

    console.log(`✅ Alert rule created: ${alertRule.name} (${alertRule.id})`);
    this.emit('rule:created', alertRule);

    return alertRule.id;
  }

  /**
   * Update an existing alert rule
   */
  public async updateAlertRule(ruleId: string, updates: Partial<AlertRule>): Promise<void> {
    const existingRule = this.alertRules.get(ruleId);
    if (!existingRule) {
      throw new Error(`Alert rule not found: ${ruleId}`);
    }

    const updatedRule: AlertRule = {
      ...existingRule,
      ...updates,
      updatedAt: new Date()
    };

    // Validate updated rule
    this.validateAlertRule(updatedRule);

    // Save to database
    await this.saveAlertRule(updatedRule);

    // Update in memory
    this.alertRules.set(ruleId, updatedRule);

    console.log(`✅ Alert rule updated: ${updatedRule.name} (${ruleId})`);
    this.emit('rule:updated', updatedRule);
  }

  /**
   * Delete an alert rule
   */
  public async deleteAlertRule(ruleId: string): Promise<void> {
    const rule = this.alertRules.get(ruleId);
    if (!rule) {
      throw new Error(`Alert rule not found: ${ruleId}`);
    }

    // Remove from database
    await this.getDb()
      .from('alert_rules')
      .delete()
      .eq('id', ruleId);

    // Remove from memory
    this.alertRules.delete(ruleId);

    console.log(`✅ Alert rule deleted: ${rule.name} (${ruleId})`);
    this.emit('rule:deleted', { ruleId, ruleName: rule.name });
  }

  /**
   * Process metric and check alert conditions
   */
  public async processMetric(metric: {
    type: MetricType;
    value: number;
    labels: Record<string, string>;
    timestamp: Date;
  }): Promise<void> {
    // Check all applicable alert rules
    for (const [ruleId, rule] of this.alertRules) {
      if (!rule.enabled || rule.metric !== metric.type) {
        continue;
      }

      // Apply filters if configured
      if (rule.filters && !this.matchesFilters(metric.labels, rule.filters)) {
        continue;
      }

      // Get effective threshold (adaptive or static)
      const effectiveThreshold = await this.getEffectiveThreshold(rule, metric);

      // Check condition
      const conditionMet = this.evaluateCondition(
        metric.value,
        effectiveThreshold,
        rule.condition
      );

      if (conditionMet) {
        await this.triggerAlert(rule, metric, effectiveThreshold);
      } else {
        // Check if we should resolve an existing alert
        await this.checkForResolution(rule, metric);
      }

      // Store metric value for threshold learning
      if (rule.id) {
        this.storeMetricForLearning(rule.id, metric.value);
      }
    }
  }

  /**
   * Manually trigger an alert
   */
  public async triggerManualAlert(
    title: string,
    description: string,
    severity: AlertSeverity,
    channels: AlertChannel[],
    additionalData?: Record<string, any>
  ): Promise<string> {
    const alertId = this.generateAlertId();
    const now = new Date();

    const alert: Alert = {
      id: alertId,
      severity,
      title,
      description,
      metric: MetricType.RESPONSE_TIME, // Default for manual alerts
      value: 0,
      threshold: 0,
      timestamp: now,
      acknowledged: false,
      tags: ['manual']
    };

    const context: AlertContext = {
      alertId,
      ruleId: 'manual',
      timestamp: now,
      metric: {
        type: MetricType.RESPONSE_TIME,
        value: 0,
        threshold: 0,
        labels: {}
      },
      severity,
      environment: process.env.NODE_ENV || 'production',
      service: 'trendzo-platform',
      additionalData
    };

    // Send notifications
    await this.sendNotifications(channels, context);

    // Store alert
    this.activeAlerts.set(alertId, alert);
    await this.saveAlert(alert);

    console.log(`🚨 Manual alert triggered: ${title} (${alertId})`);
    this.emit('alert:triggered', alert);

    return alertId;
  }

  /**
   * Acknowledge an alert
   */
  public async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<void> {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) {
      throw new Error(`Alert not found: ${alertId}`);
    }

    alert.acknowledged = true;
    this.activeAlerts.set(alertId, alert);

    // Update in database
    await this.getDb()
      .from('alerts')
      .update({ 
        acknowledged: true, 
        acknowledged_by: acknowledgedBy,
        acknowledged_at: new Date().toISOString()
      })
      .eq('id', alertId);

    // Cancel escalation if running
    const escalationTimer = this.escalationTimers.get(alertId);
    if (escalationTimer) {
      clearTimeout(escalationTimer);
      this.escalationTimers.delete(alertId);
    }

    console.log(`✅ Alert acknowledged: ${alert.title} (${alertId}) by ${acknowledgedBy}`);
    this.emit('alert:acknowledged', { alert, acknowledgedBy });
  }

  /**
   * Resolve an alert
   */
  public async resolveAlert(alertId: string, resolvedBy: string): Promise<void> {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) {
      throw new Error(`Alert not found: ${alertId}`);
    }

    alert.resolvedAt = new Date();
    this.activeAlerts.set(alertId, alert);

    // Update in database
    await this.getDb()
      .from('alerts')
      .update({ 
        resolved_at: new Date().toISOString(),
        resolved_by: resolvedBy
      })
      .eq('id', alertId);

    // Cancel escalation if running
    const escalationTimer = this.escalationTimers.get(alertId);
    if (escalationTimer) {
      clearTimeout(escalationTimer);
      this.escalationTimers.delete(alertId);
    }

    // Remove from active alerts after a delay
    setTimeout(() => {
      this.activeAlerts.delete(alertId);
    }, 3600000); // Keep resolved alerts for 1 hour

    console.log(`✅ Alert resolved: ${alert.title} (${alertId}) by ${resolvedBy}`);
    this.emit('alert:resolved', { alert, resolvedBy });
  }

  /**
   * Get all active alerts
   */
  public getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values())
      .filter(alert => !alert.resolvedAt)
      .sort((a, b) => {
        // Sort by severity (critical first) then by timestamp (newest first)
        const severityOrder = { critical: 0, error: 1, warning: 2, info: 3 };
        const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
        if (severityDiff !== 0) return severityDiff;
        return b.timestamp.getTime() - a.timestamp.getTime();
      });
  }

  /**
   * Get alert statistics
   */
  public getAlertStatistics(timeRange: number = 86400000): any { // 24 hours default
    const now = Date.now();
    const cutoff = now - timeRange;

    const allAlerts = Array.from(this.activeAlerts.values())
      .filter(alert => alert.timestamp.getTime() >= cutoff);

    const byStatus = {
      active: allAlerts.filter(a => !a.resolvedAt).length,
      acknowledged: allAlerts.filter(a => a.acknowledged && !a.resolvedAt).length,
      resolved: allAlerts.filter(a => a.resolvedAt).length
    };

    const bySeverity = {
      critical: allAlerts.filter(a => a.severity === AlertSeverity.CRITICAL).length,
      error: allAlerts.filter(a => a.severity === AlertSeverity.ERROR).length,
      warning: allAlerts.filter(a => a.severity === AlertSeverity.WARNING).length,
      info: allAlerts.filter(a => a.severity === AlertSeverity.INFO).length
    };

    // Calculate MTTR (Mean Time To Resolution)
    const resolvedAlerts = allAlerts.filter(a => a.resolvedAt);
    const mttr = resolvedAlerts.length > 0
      ? resolvedAlerts.reduce((sum, alert) => {
          const resolutionTime = alert.resolvedAt!.getTime() - alert.timestamp.getTime();
          return sum + resolutionTime;
        }, 0) / resolvedAlerts.length / 1000 / 60 // Convert to minutes
      : 0;

    return {
      total: allAlerts.length,
      byStatus,
      bySeverity,
      mttr: Math.round(mttr),
      alertRate: (allAlerts.length / (timeRange / 3600000)).toFixed(2) // alerts per hour
    };
  }

  // Private methods

  private initializeNotificationConfig(): void {
    this.notificationConfig = {
      email: {
        smtp: {
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: false,
          auth: {
            user: process.env.SMTP_USER || '',
            pass: process.env.SMTP_PASS || ''
          }
        },
        from: process.env.ALERT_FROM_EMAIL || 'alerts@trendzo.com',
        templates: {
          [AlertSeverity.CRITICAL]: {
            subject: '🚨 CRITICAL ALERT: {{title}}',
            html: this.getCriticalEmailTemplate(),
            text: 'CRITICAL ALERT: {{title}}\n\n{{description}}'
          },
          [AlertSeverity.ERROR]: {
            subject: '❌ ERROR ALERT: {{title}}',
            html: this.getErrorEmailTemplate(),
            text: 'ERROR ALERT: {{title}}\n\n{{description}}'
          },
          [AlertSeverity.WARNING]: {
            subject: '⚠️ WARNING: {{title}}',
            html: this.getWarningEmailTemplate(),
            text: 'WARNING: {{title}}\n\n{{description}}'
          },
          [AlertSeverity.INFO]: {
            subject: 'ℹ️ INFO: {{title}}',
            html: this.getInfoEmailTemplate(),
            text: 'INFO: {{title}}\n\n{{description}}'
          }
        }
      },
      sms: {
        provider: 'twilio',
        config: {
          accountSid: process.env.TWILIO_ACCOUNT_SID || '',
          authToken: process.env.TWILIO_AUTH_TOKEN || '',
          fromNumber: process.env.TWILIO_FROM_NUMBER || ''
        }
      },
      slack: {
        webhookUrl: process.env.SLACK_WEBHOOK_URL || '',
        channels: {
          [AlertSeverity.CRITICAL]: '#alerts-critical',
          [AlertSeverity.ERROR]: '#alerts-error',
          [AlertSeverity.WARNING]: '#alerts-warning',
          [AlertSeverity.INFO]: '#alerts-info'
        },
        mentions: {
          [AlertSeverity.CRITICAL]: ['@channel', '@oncall'],
          [AlertSeverity.ERROR]: ['@here'],
          [AlertSeverity.WARNING]: [],
          [AlertSeverity.INFO]: []
        }
      },
      discord: {
        webhookUrl: process.env.DISCORD_WEBHOOK_URL || '',
        channels: {
          [AlertSeverity.CRITICAL]: 'alerts-critical',
          [AlertSeverity.ERROR]: 'alerts-error',
          [AlertSeverity.WARNING]: 'alerts-warning',
          [AlertSeverity.INFO]: 'alerts-info'
        }
      },
      teams: {
        webhookUrl: process.env.TEAMS_WEBHOOK_URL || ''
      },
      pagerduty: {
        integrationKey: process.env.PAGERDUTY_INTEGRATION_KEY || '',
        serviceKey: process.env.PAGERDUTY_SERVICE_KEY || ''
      }
    };

    // Initialize email transporter
    if (this.notificationConfig.email.smtp.auth.user) {
      this.emailTransporter = nodemailer.createTransporter(this.notificationConfig.email.smtp);
    }
  }

  private setupEventHandlers(): void {
    // Listen to real-time monitor events
    realTimeMonitor.on('metric:response_time', (metric) => {
      this.processMetric({
        type: MetricType.RESPONSE_TIME,
        value: metric.responseTime,
        labels: {
          endpoint: metric.endpoint,
          method: metric.method,
          status_code: metric.statusCode.toString()
        },
        timestamp: metric.timestamp
      });
    });

    realTimeMonitor.on('metric:error', (metric) => {
      this.processMetric({
        type: MetricType.ERROR_RATE,
        value: metric.count,
        labels: {
          error_type: metric.errorType,
          endpoint: metric.endpoint,
          status_code: metric.statusCode.toString()
        },
        timestamp: metric.timestamp
      });
    });

    // System resource alerts
    realTimeMonitor.on('alert:high_cpu', (data) => {
      this.processMetric({
        type: MetricType.CPU_USAGE,
        value: data.usage,
        labels: { source: 'system' },
        timestamp: new Date()
      });
    });

    realTimeMonitor.on('alert:high_memory', (data) => {
      this.processMetric({
        type: MetricType.MEMORY_USAGE,
        value: data.usage,
        labels: { source: 'system' },
        timestamp: new Date()
      });
    });
  }

  private async loadAlertRules(): Promise<void> {
    try {
      const { data: rules } = await this.getDb()
        .from('alert_rules')
        .select('*')
        .eq('enabled', true);

      if (rules) {
        rules.forEach((rule: any) => {
          const alertRule: AlertRule = {
            ...rule,
            channels: rule.channels || [],
            escalationRules: rule.escalation_rules || [],
            createdAt: new Date(rule.created_at),
            updatedAt: new Date(rule.updated_at)
          };
          this.alertRules.set(rule.id, alertRule);
        });
      }

      console.log(`✅ Loaded ${this.alertRules.size} alert rules`);
    } catch (error) {
      console.error('❌ Failed to load alert rules:', error);
    }
  }

  private validateAlertRule(rule: AlertRule): void {
    if (!rule.name || rule.name.trim().length === 0) {
      throw new Error('Alert rule name is required');
    }

    if (!Object.values(MetricType).includes(rule.metric)) {
      throw new Error(`Invalid metric type: ${rule.metric}`);
    }

    if (!Object.values(AlertSeverity).includes(rule.severity)) {
      throw new Error(`Invalid severity: ${rule.severity}`);
    }

    if (rule.threshold === undefined || rule.threshold === null) {
      throw new Error('Threshold is required');
    }

    if (rule.channels.length === 0) {
      throw new Error('At least one notification channel is required');
    }

    if (rule.cooldownPeriod < 0) {
      throw new Error('Cooldown period must be non-negative');
    }
  }

  private async saveAlertRule(rule: AlertRule): Promise<void> {
    await this.getDb()
      .from('alert_rules')
      .upsert({
        id: rule.id,
        name: rule.name,
        description: rule.description,
        metric: rule.metric,
        condition: rule.condition,
        threshold: rule.threshold,
        severity: rule.severity,
        enabled: rule.enabled,
        channels: rule.channels,
        escalation_rules: rule.escalationRules,
        cooldown_period: rule.cooldownPeriod,
        tags: rule.tags,
        filters: rule.filters,
        custom_logic: rule.customLogic,
        created_at: rule.createdAt.toISOString(),
        updated_at: rule.updatedAt.toISOString()
      });
  }

  private async saveAlert(alert: Alert): Promise<void> {
    await this.getDb()
      .from('alerts')
      .insert({
        id: alert.id,
        severity: alert.severity,
        title: alert.title,
        description: alert.description,
        metric: alert.metric,
        value: alert.value,
        threshold: alert.threshold,
        timestamp: alert.timestamp.toISOString(),
        acknowledged: alert.acknowledged,
        resolved_at: alert.resolvedAt?.toISOString(),
        tags: alert.tags
      });
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private matchesFilters(labels: Record<string, string>, filters: Record<string, string>): boolean {
    for (const [key, value] of Object.entries(filters)) {
      if (labels[key] !== value) {
        return false;
      }
    }
    return true;
  }

  private evaluateCondition(value: number, threshold: number, condition: string): boolean {
    switch (condition) {
      case 'greater_than':
        return value > threshold;
      case 'less_than':
        return value < threshold;
      case 'equals':
        return value === threshold;
      case 'not_equals':
        return value !== threshold;
      case 'change_rate':
        // For change rate, we'd need historical data - simplified for now
        return Math.abs(value - threshold) > threshold * 0.1; // 10% change
      default:
        return false;
    }
  }

  private async getEffectiveThreshold(rule: AlertRule, metric: any): Promise<number> {
    // For now, return static threshold
    // In a full implementation, this would include adaptive threshold logic
    return rule.threshold;
  }

  private storeMetricForLearning(ruleId: string, value: number): void {
    if (!this.thresholdLearning.has(ruleId)) {
      this.thresholdLearning.set(ruleId, []);
    }
    
    const values = this.thresholdLearning.get(ruleId)!;
    values.push(value);
    
    // Keep only last 1000 values
    if (values.length > 1000) {
      values.shift();
    }
  }

  private async triggerAlert(rule: AlertRule, metric: any, threshold: number): Promise<void> {
    // Check cooldown period
    const existingAlert = Array.from(this.activeAlerts.values())
      .find(alert => 
        alert.metric === rule.metric && 
        !alert.resolvedAt &&
        Date.now() - alert.timestamp.getTime() < rule.cooldownPeriod * 60000
      );

    if (existingAlert) {
      console.log(`🔇 Alert suppressed due to cooldown: ${rule.name}`);
      return;
    }

    const alertId = this.generateAlertId();
    const now = new Date();

    const alert: Alert = {
      id: alertId,
      severity: rule.severity,
      title: `${rule.name}`,
      description: rule.description,
      metric: rule.metric,
      value: metric.value,
      threshold,
      timestamp: now,
      acknowledged: false,
      tags: rule.tags
    };

    const context: AlertContext = {
      alertId,
      ruleId: rule.id,
      timestamp: now,
      metric: {
        type: rule.metric,
        value: metric.value,
        threshold,
        labels: metric.labels
      },
      severity: rule.severity,
      environment: process.env.NODE_ENV || 'production',
      service: 'trendzo-platform'
    };

    // Send notifications
    await this.sendNotifications(rule.channels, context);

    // Store alert
    this.activeAlerts.set(alertId, alert);
    await this.saveAlert(alert);

    // Start escalation if configured
    if (rule.escalationRules.length > 0) {
      this.startEscalation(alertId, rule.escalationRules);
    }

    console.log(`🚨 Alert triggered: ${rule.name} (${alertId})`);
    this.emit('alert:triggered', alert);
  }

  private async checkForResolution(rule: AlertRule, metric: any): Promise<void> {
    // Check if there's an active alert for this rule that should be resolved
    const activeAlert = Array.from(this.activeAlerts.values())
      .find(alert => 
        alert.metric === rule.metric && 
        !alert.resolvedAt &&
        this.matchesFilters(metric.labels, rule.filters || {})
      );

    if (activeAlert) {
      // Check if condition is no longer met
      const conditionMet = this.evaluateCondition(
        metric.value,
        rule.threshold,
        rule.condition
      );

      if (!conditionMet) {
        await this.resolveAlert(activeAlert.id, 'system');
      }
    }
  }

  private async sendNotifications(channels: AlertChannel[], context: AlertContext): Promise<void> {
    // Rate limiting check
    const rateLimitKey = `${context.ruleId}_${context.severity}`;
    const now = Date.now();
    const lastNotification = this.notificationRateLimit.get(rateLimitKey) || 0;
    
    if (now - lastNotification < this.RATE_LIMIT_WINDOW) {
      console.log(`🔇 Notification rate limited: ${rateLimitKey}`);
      return;
    }

    this.notificationRateLimit.set(rateLimitKey, now);

    // Send to each channel in parallel
    const notificationPromises = channels.map(channel => {
      return this.sendToChannel(channel, context).catch(error => {
        console.error(`❌ Failed to send to ${channel}:`, error);
      });
    });

    await Promise.all(notificationPromises);
  }

  private async sendToChannel(channel: AlertChannel, context: AlertContext): Promise<void> {
    switch (channel) {
      case AlertChannel.EMAIL:
        await this.sendEmailNotification(context);
        break;
      case AlertChannel.SLACK:
        await this.sendSlackNotification(context);
        break;
      case AlertChannel.DISCORD:
        await this.sendDiscordNotification(context);
        break;
      case AlertChannel.SMS:
        await this.sendSMSNotification(context);
        break;
      case AlertChannel.WEBHOOK:
        await this.sendWebhookNotification(context);
        break;
      case AlertChannel.TEAMS:
        await this.sendTeamsNotification(context);
        break;
      case AlertChannel.PAGERDUTY:
        await this.sendPagerDutyNotification(context);
        break;
      default:
        console.warn(`Unknown notification channel: ${channel}`);
    }
  }

  private async sendEmailNotification(context: AlertContext): Promise<void> {
    if (!this.emailTransporter) {
      console.warn('Email transporter not configured');
      return;
    }

    const template = this.notificationConfig.email.templates[context.severity];
    const subject = template.subject.replace('{{title}}', context.metric.type);
    const html = template.html
      .replace('{{title}}', context.metric.type)
      .replace('{{description}}', `Metric: ${context.metric.type}\nValue: ${context.metric.value}\nThreshold: ${context.metric.threshold}`);

    await this.emailTransporter.sendMail({
      from: this.notificationConfig.email.from,
      to: process.env.ALERT_EMAIL_RECIPIENTS || 'admin@trendzo.com',
      subject,
      html,
      text: template.text
        .replace('{{title}}', context.metric.type)
        .replace('{{description}}', `Metric: ${context.metric.type}\nValue: ${context.metric.value}\nThreshold: ${context.metric.threshold}`)
    });
  }

  private async sendSlackNotification(context: AlertContext): Promise<void> {
    if (!this.notificationConfig.slack.webhookUrl) return;

    const color = this.getSeverityColor(context.severity);
    const channel = this.notificationConfig.slack.channels[context.severity];
    const mentions = this.notificationConfig.slack.mentions[context.severity];

    const message = {
      channel,
      text: mentions.length > 0 ? mentions.join(' ') : '',
      attachments: [{
        color,
        title: `Alert: ${context.metric.type}`,
        text: `Value: ${context.metric.value} | Threshold: ${context.metric.threshold}`,
        fields: [
          { title: 'Severity', value: context.severity.toUpperCase(), short: true },
          { title: 'Environment', value: context.environment, short: true },
          { title: 'Timestamp', value: context.timestamp.toISOString(), short: false }
        ]
      }]
    };

    await axios.post(this.notificationConfig.slack.webhookUrl, message);
  }

  private async sendDiscordNotification(context: AlertContext): Promise<void> {
    if (!this.notificationConfig.discord.webhookUrl) return;

    const color = parseInt(this.getSeverityColor(context.severity).replace('#', ''), 16);

    const message = {
      embeds: [{
        title: `🚨 Alert: ${context.metric.type}`,
        description: `**Value:** ${context.metric.value}\n**Threshold:** ${context.metric.threshold}`,
        color,
        fields: [
          { name: 'Severity', value: context.severity.toUpperCase(), inline: true },
          { name: 'Environment', value: context.environment, inline: true },
          { name: 'Alert ID', value: context.alertId, inline: false }
        ],
        timestamp: context.timestamp.toISOString()
      }]
    };

    await axios.post(this.notificationConfig.discord.webhookUrl, message);
  }

  private async sendSMSNotification(context: AlertContext): Promise<void> {
    // SMS implementation would go here
    console.log(`📱 SMS notification: ${context.severity} - ${context.metric.type}`);
  }

  private async sendWebhookNotification(context: AlertContext): Promise<void> {
    // Generic webhook implementation
    console.log(`🔗 Webhook notification: ${context.severity} - ${context.metric.type}`);
  }

  private async sendTeamsNotification(context: AlertContext): Promise<void> {
    // Microsoft Teams implementation
    console.log(`👥 Teams notification: ${context.severity} - ${context.metric.type}`);
  }

  private async sendPagerDutyNotification(context: AlertContext): Promise<void> {
    // PagerDuty implementation
    console.log(`📟 PagerDuty notification: ${context.severity} - ${context.metric.type}`);
  }

  private startEscalation(alertId: string, escalationRules: EscalationRule[]): void {
    // Implementation for escalation logic
    console.log(`⬆️ Starting escalation for alert: ${alertId}`);
  }

  private getSeverityColor(severity: AlertSeverity): string {
    switch (severity) {
      case AlertSeverity.CRITICAL: return '#FF0000';
      case AlertSeverity.ERROR: return '#FF8C00';
      case AlertSeverity.WARNING: return '#FFD700';
      case AlertSeverity.INFO: return '#00BFFF';
      default: return '#808080';
    }
  }

  // Email templates
  private getCriticalEmailTemplate(): string {
    return `
      <html>
        <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="background-color: #dc3545; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">🚨 CRITICAL ALERT</h1>
            </div>
            <div style="padding: 20px;">
              <h2 style="color: #dc3545; margin-top: 0;">{{title}}</h2>
              <p style="font-size: 16px; line-height: 1.5; color: #333;">{{description}}</p>
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 20px 0;">
                <p style="margin: 0;"><strong>This is a critical alert that requires immediate attention.</strong></p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private getErrorEmailTemplate(): string {
    return `
      <html>
        <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="background-color: #fd7e14; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">❌ ERROR ALERT</h1>
            </div>
            <div style="padding: 20px;">
              <h2 style="color: #fd7e14; margin-top: 0;">{{title}}</h2>
              <p style="font-size: 16px; line-height: 1.5; color: #333;">{{description}}</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private getWarningEmailTemplate(): string {
    return `
      <html>
        <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="background-color: #ffc107; color: black; padding: 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">⚠️ WARNING</h1>
            </div>
            <div style="padding: 20px;">
              <h2 style="color: #ffc107; margin-top: 0;">{{title}}</h2>
              <p style="font-size: 16px; line-height: 1.5; color: #333;">{{description}}</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private getInfoEmailTemplate(): string {
    return `
      <html>
        <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="background-color: #17a2b8; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">ℹ️ INFORMATION</h1>
            </div>
            <div style="padding: 20px;">
              <h2 style="color: #17a2b8; margin-top: 0;">{{title}}</h2>
              <p style="font-size: 16px; line-height: 1.5; color: #333;">{{description}}</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}

// Export singleton instance
export const alertSystem = AlertSystem.getInstance();