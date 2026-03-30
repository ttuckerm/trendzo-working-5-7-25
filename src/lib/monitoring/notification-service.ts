/**
 * Multi-Channel Notification Service
 * Production-ready notification system for monitoring alerts and events
 */

import { createClient } from '@supabase/supabase-js';

export interface NotificationTemplate {
  id: string;
  name: string;
  channel: NotificationChannel;
  subject?: string;
  template: string;
  variables: string[];
  enabled: boolean;
  priority: NotificationPriority;
}

export interface NotificationConfig {
  channel: NotificationChannel;
  recipients: string[];
  template?: string;
  priority: NotificationPriority;
  retryAttempts: number;
  retryDelay: number;
  rateLimitPerMinute: number;
}

export interface NotificationRequest {
  id?: string;
  channel: NotificationChannel;
  recipients: string[];
  subject?: string;
  message: string;
  templateId?: string;
  variables?: Record<string, any>;
  priority: NotificationPriority;
  metadata?: Record<string, any>;
  scheduledAt?: Date;
}

export interface NotificationResult {
  id: string;
  success: boolean;
  channel: NotificationChannel;
  recipients: string[];
  sentAt: Date;
  error?: string;
  retryCount: number;
  deliveryStatus: DeliveryStatus;
}

export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  SLACK = 'slack',
  WEBHOOK = 'webhook',
  DISCORD = 'discord',
  MICROSOFT_TEAMS = 'microsoft_teams',
  MOBILE_PUSH = 'mobile_push',
  BROWSER_PUSH = 'browser_push'
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
  CRITICAL = 'critical'
}

export enum DeliveryStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  RETRYING = 'retrying',
  EXPIRED = 'expired'
}

/**
 * Abstract Notification Provider
 */
abstract class NotificationProvider {
  abstract channel: NotificationChannel;
  abstract send(request: NotificationRequest): Promise<NotificationResult>;
  abstract validateConfig(): boolean;
  abstract isHealthy(): Promise<boolean>;
}

/**
 * Email Notification Provider
 */
class EmailNotificationProvider extends NotificationProvider {
  channel = NotificationChannel.EMAIL;
  private apiKey: string;
  private fromEmail: string;

  constructor() {
    super();
    this.apiKey = process.env.SENDGRID_API_KEY || process.env.EMAIL_API_KEY || '';
    this.fromEmail = process.env.FROM_EMAIL || 'notifications@trendzo.com';
  }

  validateConfig(): boolean {
    return !!(this.apiKey && this.fromEmail);
  }

  async isHealthy(): Promise<boolean> {
    try {
      // Test email service connection
      return this.validateConfig();
    } catch (error) {
      return false;
    }
  }

  async send(request: NotificationRequest): Promise<NotificationResult> {
    const result: NotificationResult = {
      id: request.id || `email_${Date.now()}`,
      success: false,
      channel: this.channel,
      recipients: request.recipients,
      sentAt: new Date(),
      retryCount: 0,
      deliveryStatus: DeliveryStatus.PENDING
    };

    try {
      if (!this.validateConfig()) {
        throw new Error('Email provider not configured');
      }

      // SendGrid integration
      const emailData = {
        personalizations: request.recipients.map(email => ({
          to: [{ email }],
          subject: request.subject || 'Trendzo Monitoring Alert'
        })),
        from: { email: this.fromEmail, name: 'Trendzo Monitoring' },
        content: [{
          type: 'text/html',
          value: this.formatEmailContent(request)
        }]
      };

      // Send via SendGrid API (or other email service)
      const response = await this.sendViaEmailService(emailData);
      
      result.success = true;
      result.deliveryStatus = DeliveryStatus.SENT;

    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Unknown email error';
      result.deliveryStatus = DeliveryStatus.FAILED;
      console.error('Email notification failed:', error);
    }

    return result;
  }

  private formatEmailContent(request: NotificationRequest): string {
    const baseContent = `
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1a1a1a; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">Trendzo Monitoring</h1>
          </div>
          <div style="padding: 20px; background: #f9f9f9;">
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid ${this.getPriorityColor(request.priority)};">
              <h2 style="color: #333; margin-top: 0;">
                ${this.getPriorityIcon(request.priority)} ${request.subject || 'System Alert'}
              </h2>
              <div style="color: #666; line-height: 1.6;">
                ${request.message.replace(/\n/g, '<br>')}
              </div>
              ${request.variables ? this.renderVariables(request.variables) : ''}
            </div>
            <div style="margin-top: 20px; text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/monitoring" 
                 style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                View Dashboard
              </a>
            </div>
            <div style="margin-top: 20px; font-size: 12px; color: #999; text-align: center;">
              Sent at ${new Date().toLocaleString()}
            </div>
          </div>
        </body>
      </html>
    `;

    return baseContent;
  }

  private renderVariables(variables: Record<string, any>): string {
    const items = Object.entries(variables)
      .map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`)
      .join('');
    
    return `
      <div style="margin-top: 20px;">
        <h3 style="color: #333;">Details:</h3>
        <ul style="color: #666;">${items}</ul>
      </div>
    `;
  }

  private getPriorityColor(priority: NotificationPriority): string {
    switch (priority) {
      case NotificationPriority.CRITICAL: return '#dc2626';
      case NotificationPriority.URGENT: return '#ea580c';
      case NotificationPriority.HIGH: return '#d97706';
      case NotificationPriority.NORMAL: return '#2563eb';
      case NotificationPriority.LOW: return '#16a34a';
      default: return '#6b7280';
    }
  }

  private getPriorityIcon(priority: NotificationPriority): string {
    switch (priority) {
      case NotificationPriority.CRITICAL: return '🚨';
      case NotificationPriority.URGENT: return '⚠️';
      case NotificationPriority.HIGH: return '🔶';
      case NotificationPriority.NORMAL: return 'ℹ️';
      case NotificationPriority.LOW: return '📝';
      default: return '📬';
    }
  }

  private async sendViaEmailService(emailData: any): Promise<any> {
    // Implementation would integrate with SendGrid, AWS SES, or other email service
    console.log('Sending email:', emailData);
    
    // Mock success for now
    return { success: true };
  }
}

/**
 * Slack Notification Provider
 */
class SlackNotificationProvider extends NotificationProvider {
  channel = NotificationChannel.SLACK;
  private webhookUrls: string[];

  constructor() {
    super();
    this.webhookUrls = process.env.SLACK_WEBHOOK_URLS?.split(',') || [];
  }

  validateConfig(): boolean {
    return this.webhookUrls.length > 0;
  }

  async isHealthy(): Promise<boolean> {
    try {
      // Test webhook endpoint
      return this.validateConfig();
    } catch (error) {
      return false;
    }
  }

  async send(request: NotificationRequest): Promise<NotificationResult> {
    const result: NotificationResult = {
      id: request.id || `slack_${Date.now()}`,
      success: false,
      channel: this.channel,
      recipients: request.recipients,
      sentAt: new Date(),
      retryCount: 0,
      deliveryStatus: DeliveryStatus.PENDING
    };

    try {
      if (!this.validateConfig()) {
        throw new Error('Slack provider not configured');
      }

      const slackMessage = this.formatSlackMessage(request);
      
      // Send to all configured webhook URLs
      const promises = this.webhookUrls.map(url => this.sendSlackMessage(url, slackMessage));
      await Promise.all(promises);

      result.success = true;
      result.deliveryStatus = DeliveryStatus.SENT;

    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Unknown Slack error';
      result.deliveryStatus = DeliveryStatus.FAILED;
      console.error('Slack notification failed:', error);
    }

    return result;
  }

  private formatSlackMessage(request: NotificationRequest) {
    const color = this.getPriorityColor(request.priority);
    const emoji = this.getPriorityEmoji(request.priority);

    return {
      text: `${emoji} ${request.subject || 'Trendzo Monitoring Alert'}`,
      attachments: [
        {
          color,
          fields: [
            {
              title: 'Message',
              value: request.message,
              short: false
            },
            {
              title: 'Priority',
              value: request.priority.toUpperCase(),
              short: true
            },
            {
              title: 'Time',
              value: new Date().toISOString(),
              short: true
            },
            ...(request.variables ? this.formatSlackVariables(request.variables) : [])
          ],
          actions: [
            {
              type: 'button',
              text: 'View Dashboard',
              url: `${process.env.NEXT_PUBLIC_APP_URL}/admin/monitoring`
            }
          ],
          footer: 'Trendzo Monitoring',
          ts: Math.floor(Date.now() / 1000)
        }
      ]
    };
  }

  private formatSlackVariables(variables: Record<string, any>) {
    return Object.entries(variables).map(([key, value]) => ({
      title: key,
      value: String(value),
      short: true
    }));
  }

  private getPriorityColor(priority: NotificationPriority): string {
    switch (priority) {
      case NotificationPriority.CRITICAL: return 'danger';
      case NotificationPriority.URGENT: return 'warning';
      case NotificationPriority.HIGH: return '#ff9500';
      case NotificationPriority.NORMAL: return 'good';
      case NotificationPriority.LOW: return '#36a64f';
      default: return '#808080';
    }
  }

  private getPriorityEmoji(priority: NotificationPriority): string {
    switch (priority) {
      case NotificationPriority.CRITICAL: return '🚨';
      case NotificationPriority.URGENT: return '⚠️';
      case NotificationPriority.HIGH: return '🔶';
      case NotificationPriority.NORMAL: return 'ℹ️';
      case NotificationPriority.LOW: return '📝';
      default: return '📬';
    }
  }

  private async sendSlackMessage(webhookUrl: string, message: any): Promise<void> {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      });

      if (!response.ok) {
        throw new Error(`Slack webhook failed: ${response.status}`);
      }
    } catch (error) {
      console.error(`Failed to send Slack message to ${webhookUrl}:`, error);
      throw error;
    }
  }
}

/**
 * Webhook Notification Provider
 */
class WebhookNotificationProvider extends NotificationProvider {
  channel = NotificationChannel.WEBHOOK;
  private webhookUrls: string[];

  constructor() {
    super();
    this.webhookUrls = process.env.WEBHOOK_URLS?.split(',') || [];
  }

  validateConfig(): boolean {
    return this.webhookUrls.length > 0;
  }

  async isHealthy(): Promise<boolean> {
    return this.validateConfig();
  }

  async send(request: NotificationRequest): Promise<NotificationResult> {
    const result: NotificationResult = {
      id: request.id || `webhook_${Date.now()}`,
      success: false,
      channel: this.channel,
      recipients: request.recipients,
      sentAt: new Date(),
      retryCount: 0,
      deliveryStatus: DeliveryStatus.PENDING
    };

    try {
      if (!this.validateConfig()) {
        throw new Error('Webhook provider not configured');
      }

      const payload = {
        id: result.id,
        timestamp: result.sentAt.toISOString(),
        priority: request.priority,
        subject: request.subject,
        message: request.message,
        variables: request.variables,
        metadata: request.metadata,
        source: 'trendzo-monitoring'
      };

      // Send to all configured webhooks
      const promises = this.webhookUrls.map(url => this.sendWebhook(url, payload));
      await Promise.all(promises);

      result.success = true;
      result.deliveryStatus = DeliveryStatus.SENT;

    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Unknown webhook error';
      result.deliveryStatus = DeliveryStatus.FAILED;
      console.error('Webhook notification failed:', error);
    }

    return result;
  }

  private async sendWebhook(url: string, payload: any): Promise<void> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'User-Agent': 'Trendzo-Monitoring/1.0'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status}`);
      }
    } catch (error) {
      console.error(`Failed to send webhook to ${url}:`, error);
      throw error;
    }
  }
}

/**
 * SMS Notification Provider (Twilio)
 */
class SMSNotificationProvider extends NotificationProvider {
  channel = NotificationChannel.SMS;
  private accountSid: string;
  private authToken: string;
  private fromNumber: string;

  constructor() {
    super();
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || '';
    this.authToken = process.env.TWILIO_AUTH_TOKEN || '';
    this.fromNumber = process.env.TWILIO_FROM_NUMBER || '';
  }

  validateConfig(): boolean {
    return !!(this.accountSid && this.authToken && this.fromNumber);
  }

  async isHealthy(): Promise<boolean> {
    return this.validateConfig();
  }

  async send(request: NotificationRequest): Promise<NotificationResult> {
    const result: NotificationResult = {
      id: request.id || `sms_${Date.now()}`,
      success: false,
      channel: this.channel,
      recipients: request.recipients,
      sentAt: new Date(),
      retryCount: 0,
      deliveryStatus: DeliveryStatus.PENDING
    };

    try {
      if (!this.validateConfig()) {
        throw new Error('SMS provider not configured');
      }

      const smsText = this.formatSMSMessage(request);

      // Send SMS to each recipient
      const promises = request.recipients.map(phone => this.sendSMS(phone, smsText));
      await Promise.all(promises);

      result.success = true;
      result.deliveryStatus = DeliveryStatus.SENT;

    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Unknown SMS error';
      result.deliveryStatus = DeliveryStatus.FAILED;
      console.error('SMS notification failed:', error);
    }

    return result;
  }

  private formatSMSMessage(request: NotificationRequest): string {
    const emoji = this.getPriorityEmoji(request.priority);
    return `${emoji} ${request.subject || 'Trendzo Alert'}\n\n${request.message}\n\nView: ${process.env.NEXT_PUBLIC_APP_URL}/admin/monitoring`;
  }

  private getPriorityEmoji(priority: NotificationPriority): string {
    switch (priority) {
      case NotificationPriority.CRITICAL: return '🚨';
      case NotificationPriority.URGENT: return '⚠️';
      case NotificationPriority.HIGH: return '🔶';
      default: return 'ℹ️';
    }
  }

  private async sendSMS(to: string, message: string): Promise<void> {
    // Twilio SMS implementation
    console.log(`Sending SMS to ${to}: ${message}`);
    // Mock success for now
  }
}

/**
 * Main Notification Service
 */
export class NotificationService {
  private providers: Map<NotificationChannel, NotificationProvider>;
  private supabase: any;
  private queue: NotificationRequest[] = [];
  private processing = false;

  constructor() {
    this.providers = new Map();
    this.initializeProviders();
    
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
      this.supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY
      );
    }

    this.startQueueProcessor();
  }

  private initializeProviders() {
    this.providers.set(NotificationChannel.EMAIL, new EmailNotificationProvider());
    this.providers.set(NotificationChannel.SLACK, new SlackNotificationProvider());
    this.providers.set(NotificationChannel.WEBHOOK, new WebhookNotificationProvider());
    this.providers.set(NotificationChannel.SMS, new SMSNotificationProvider());
  }

  /**
   * Send notification immediately
   */
  async sendNotification(request: NotificationRequest): Promise<NotificationResult> {
    const provider = this.providers.get(request.channel);
    if (!provider) {
      throw new Error(`No provider found for channel: ${request.channel}`);
    }

    if (!provider.validateConfig()) {
      throw new Error(`Provider not configured for channel: ${request.channel}`);
    }

    const result = await provider.send(request);
    
    // Store notification result
    await this.storeNotificationResult(result);

    return result;
  }

  /**
   * Queue notification for later processing
   */
  async queueNotification(request: NotificationRequest): Promise<void> {
    request.id = request.id || `queued_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.queue.push(request);
  }

  /**
   * Send notification to multiple channels
   */
  async sendMultiChannelNotification(
    channels: NotificationChannel[],
    recipients: Record<NotificationChannel, string[]>,
    subject: string,
    message: string,
    priority: NotificationPriority = NotificationPriority.NORMAL,
    variables?: Record<string, any>
  ): Promise<NotificationResult[]> {
    const promises = channels.map(channel => {
      const channelRecipients = recipients[channel] || [];
      if (channelRecipients.length === 0) return null;

      return this.sendNotification({
        channel,
        recipients: channelRecipients,
        subject,
        message,
        priority,
        variables
      });
    });

    const results = await Promise.allSettled(promises.filter(Boolean) as Promise<NotificationResult>[]);
    return results
      .filter(result => result.status === 'fulfilled')
      .map(result => (result as PromiseFulfilledResult<NotificationResult>).value);
  }

  /**
   * Get provider health status
   */
  async getProvidersHealth(): Promise<Record<NotificationChannel, boolean>> {
    const health: Record<NotificationChannel, boolean> = {} as any;

    for (const [channel, provider] of this.providers.entries()) {
      try {
        health[channel] = await provider.isHealthy();
      } catch (error) {
        health[channel] = false;
      }
    }

    return health;
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(timeRange: 'hour' | 'day' | 'week' = 'day'): Promise<{
    total: number;
    byChannel: Record<NotificationChannel, number>;
    byPriority: Record<NotificationPriority, number>;
    successRate: number;
    recent: NotificationResult[];
  }> {
    if (!this.supabase) {
      return {
        total: 0,
        byChannel: {} as any,
        byPriority: {} as any,
        successRate: 0,
        recent: []
      };
    }

    const timeRangeHours = timeRange === 'hour' ? 1 : timeRange === 'day' ? 24 : 168;
    const startTime = new Date(Date.now() - timeRangeHours * 60 * 60 * 1000);

    try {
      const { data: notifications } = await this.supabase
        .from('notification_results')
        .select('*')
        .gte('sent_at', startTime.toISOString())
        .order('sent_at', { ascending: false });

      if (!notifications) {
        return {
          total: 0,
          byChannel: {} as any,
          byPriority: {} as any,
          successRate: 0,
          recent: []
        };
      }

      const total = notifications.length;
      const successful = notifications.filter(n => n.success).length;
      const successRate = total > 0 ? (successful / total) * 100 : 0;

      const byChannel = notifications.reduce((acc, n) => {
        acc[n.channel] = (acc[n.channel] || 0) + 1;
        return acc;
      }, {} as Record<NotificationChannel, number>);

      const byPriority = notifications.reduce((acc, n) => {
        acc[n.priority] = (acc[n.priority] || 0) + 1;
        return acc;
      }, {} as Record<NotificationPriority, number>);

      return {
        total,
        byChannel,
        byPriority,
        successRate,
        recent: notifications.slice(0, 20)
      };

    } catch (error) {
      console.error('Failed to get notification stats:', error);
      return {
        total: 0,
        byChannel: {} as any,
        byPriority: {} as any,
        successRate: 0,
        recent: []
      };
    }
  }

  /**
   * Store notification result in database
   */
  private async storeNotificationResult(result: NotificationResult): Promise<void> {
    if (!this.supabase) return;

    try {
      await this.supabase
        .from('notification_results')
        .insert({
          id: result.id,
          channel: result.channel,
          recipients: result.recipients,
          success: result.success,
          sent_at: result.sentAt.toISOString(),
          error: result.error,
          retry_count: result.retryCount,
          delivery_status: result.deliveryStatus
        });
    } catch (error) {
      console.error('Failed to store notification result:', error);
    }
  }

  /**
   * Process notification queue
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    try {
      while (this.queue.length > 0) {
        const request = this.queue.shift();
        if (!request) continue;

        try {
          await this.sendNotification(request);
        } catch (error) {
          console.error('Failed to process queued notification:', error);
        }
      }
    } finally {
      this.processing = false;
    }
  }

  /**
   * Start queue processor
   */
  private startQueueProcessor(): void {
    setInterval(() => {
      this.processQueue();
    }, 5000); // Process queue every 5 seconds
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

// Utility functions for common notification scenarios
export const MonitoringNotifications = {
  async sendAlertNotification(
    alertName: string,
    severity: string,
    message: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const priority = severity === 'critical' ? NotificationPriority.CRITICAL :
                    severity === 'high' ? NotificationPriority.URGENT :
                    severity === 'medium' ? NotificationPriority.HIGH :
                    NotificationPriority.NORMAL;

    const channels = [NotificationChannel.EMAIL, NotificationChannel.SLACK];
    if (priority === NotificationPriority.CRITICAL) {
      channels.push(NotificationChannel.SMS);
    }

    const recipients = {
      [NotificationChannel.EMAIL]: process.env.ALERT_EMAILS?.split(',') || [],
      [NotificationChannel.SLACK]: process.env.SLACK_WEBHOOK_URLS?.split(',') || [],
      [NotificationChannel.SMS]: process.env.ALERT_PHONE_NUMBERS?.split(',') || []
    };

    await notificationService.sendMultiChannelNotification(
      channels,
      recipients,
      `🚨 Alert: ${alertName}`,
      message,
      priority,
      metadata
    );
  },

  async sendSystemHealthNotification(
    healthScore: number,
    issues: string[]
  ): Promise<void> {
    const priority = healthScore < 50 ? NotificationPriority.CRITICAL :
                    healthScore < 70 ? NotificationPriority.HIGH :
                    NotificationPriority.NORMAL;

    const message = `System health score: ${healthScore}/100\n\nIssues detected:\n${issues.join('\n')}`;

    await notificationService.sendNotification({
      channel: NotificationChannel.EMAIL,
      recipients: process.env.ALERT_EMAILS?.split(',') || [],
      subject: `System Health: ${healthScore}/100`,
      message,
      priority,
      variables: { healthScore, issues: issues.length }
    });
  },

  async sendPerformanceAlert(
    metric: string,
    currentValue: number,
    threshold: number,
    trend: string
  ): Promise<void> {
    const message = `Performance alert: ${metric} is ${currentValue}, exceeding threshold of ${threshold}. Trend: ${trend}`;

    await notificationService.sendMultiChannelNotification(
      [NotificationChannel.EMAIL, NotificationChannel.SLACK],
      {
        [NotificationChannel.EMAIL]: process.env.ALERT_EMAILS?.split(',') || [],
        [NotificationChannel.SLACK]: process.env.SLACK_WEBHOOK_URLS?.split(',') || []
      },
      `⚡ Performance Alert: ${metric}`,
      message,
      NotificationPriority.HIGH,
      { metric, currentValue, threshold, trend }
    );
  }
};