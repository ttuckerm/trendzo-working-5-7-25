import { Niche, Platform } from '@/lib/types/database';

// Beehiiv API types
export interface BeehiivSubscriber {
  email: string;
  status: 'active' | 'validating' | 'inactive';
  created: number;
  subscription_tier?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  referring_site?: string;
  referral_code?: string;
  metadata?: Record<string, any>;
}

export interface BeehiivEmailData {
  to: string;
  subject: string;
  content: string;
  from_name?: string;
  preview_text?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

export interface BeehiivSegment {
  id: string;
  name: string;
  subscriber_count: number;
}

export interface BeehiivAutomation {
  id: string;
  name: string;
  trigger: 'subscriber_created' | 'tag_added' | 'custom_event';
  status: 'active' | 'paused';
}

/**
 * Beehiiv Service for TRENDZO MVP
 * Handles both transactional emails and newsletter management
 * Docs: https://developers.beehiiv.com/
 */
export class BeehiivService {
  private static instance: BeehiivService;
  private readonly apiKey: string;
  private readonly publicationId: string;
  private readonly baseUrl = 'https://api.beehiiv.com/v2';
  private isTestMode: boolean = true;

  private constructor() {
    this.apiKey = process.env.BEEHIIV_API_KEY || '';
    this.publicationId = process.env.BEEHIIV_PUBLICATION_ID || '';
    
    if (this.apiKey && this.publicationId) {
      this.isTestMode = false;
    } else {
      console.warn('⚠️ BeehiivService running in TEST MODE - no emails will be sent');
    }
  }

  static getInstance(): BeehiivService {
    if (!BeehiivService.instance) {
      BeehiivService.instance = new BeehiivService();
    }
    return BeehiivService.instance;
  }

  /**
   * Add subscriber with metadata for segmentation
   */
  async addSubscriber(params: {
    email: string;
    source: 'landing_page' | 'exit_intent' | 'template_complete' | 'viral_alert';
    niche?: Niche;
    platform?: Platform;
    templateId?: string;
    metadata?: Record<string, any>;
  }): Promise<{ success: boolean; subscriberId?: string }> {
    const { email, source, niche, platform, templateId, metadata = {} } = params;

    if (this.isTestMode) {
      console.log('📧 TEST MODE - Subscriber would be added:', { email, source, niche, platform });
      return { success: true, subscriberId: 'test_' + Date.now() };
    }

    try {
      const response = await fetch(`${this.baseUrl}/publications/${this.publicationId}/subscriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          reactivate_existing: true,
          send_welcome_email: source === 'landing_page',
          utm_source: 'trendzo_app',
          utm_medium: source,
          utm_campaign: niche && platform ? `${niche}_${platform}` : 'general',
          custom_fields: [
            { name: 'source', value: source },
            { name: 'niche', value: niche || 'not_set' },
            { name: 'platform', value: platform || 'not_set' },
            { name: 'template_id', value: templateId || '' },
            { name: 'viral_score', value: '0' },
            { name: 'videos_created', value: '0' },
            ...Object.entries(metadata).map(([name, value]) => ({ name, value: String(value) }))
          ]
        }),
      });

      if (!response.ok) {
        throw new Error(`Beehiiv API error: ${response.statusText}`);
      }

      const data = await response.json();
      return { success: true, subscriberId: data.data.id };
    } catch (error) {
      console.error('❌ Beehiiv subscriber error:', error);
      return { success: false };
    }
  }

  /**
   * Send magic link email via Beehiiv custom email endpoint
   */
  async sendMagicLink(params: {
    email: string;
    token: string;
    redirectTo?: string;
  }): Promise<boolean> {
    const magicLinkUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify?token=${params.token}&email=${encodeURIComponent(params.email)}&redirect=${encodeURIComponent(params.redirectTo || '/dashboard-view')}`;

    // First ensure subscriber exists
    await this.addSubscriber({
      email: params.email,
      source: 'landing_page',
      metadata: { last_login_attempt: new Date().toISOString() }
    });

    return this.sendCustomEmail({
      email: params.email,
      subject: '🔐 Your TRENDZO Login Link',
      content: this.getMagicLinkEmailContent(magicLinkUrl),
      tags: ['magic_link', 'authentication']
    });
  }

  /**
   * Send template ready notification
   */
  async sendTemplateReady(params: {
    email: string;
    templateId: string;
    viralScore: number;
    predictedViews: number;
  }): Promise<boolean> {
    const { email, templateId, viralScore, predictedViews } = params;

    // Update subscriber's custom fields
    await this.updateSubscriberFields(email, {
      last_template_id: templateId,
      viral_score: String(viralScore),
      videos_created: 'increment' // Special handling for incrementing
    });

    return this.sendCustomEmail({
      email,
      subject: `🎬 Your Viral Video is Ready! Score: ${viralScore}/100`,
      content: this.getTemplateReadyEmailContent(templateId, viralScore, predictedViews),
      tags: ['template_ready', 'engagement']
    });
  }

  /**
   * Send viral alert when content performs well
   */
  async sendViralAlert(params: {
    email: string;
    views: number;
    platform: string;
    templateId: string;
  }): Promise<boolean> {
    const { email, views, platform, templateId } = params;

    // Update subscriber as "viral creator"
    await this.updateSubscriberFields(email, {
      is_viral_creator: 'true',
      total_viral_views: String(views),
      last_viral_platform: platform
    });

    // Add to viral creators segment
    await this.addToSegment(email, 'viral_creators');

    return this.sendCustomEmail({
      email,
      subject: `🚀 YOU'RE GOING VIRAL! ${views.toLocaleString()} views and climbing!`,
      content: this.getViralAlertEmailContent(views, platform, templateId),
      tags: ['viral_alert', 'success_story']
    });
  }

  /**
   * Create automated email sequences
   */
  async setupAutomations(): Promise<void> {
    if (this.isTestMode) {
      console.log('📧 TEST MODE - Automations would be created');
      return;
    }

    // Welcome sequence for new subscribers
    await this.createAutomation({
      name: 'TRENDZO Welcome Series',
      trigger: 'subscriber_created',
      emails: [
        { delay_hours: 0, subject: 'Welcome to TRENDZO! 🎬', template: 'welcome_1' },
        { delay_hours: 24, subject: '5 Viral Video Secrets', template: 'welcome_2' },
        { delay_hours: 72, subject: 'Your First Viral Video Awaits', template: 'welcome_3' },
        { delay_hours: 168, subject: 'Case Study: 0 to 1M Views', template: 'welcome_4' }
      ]
    });

    // Re-engagement for inactive users
    await this.createAutomation({
      name: 'Win Back Campaign',
      trigger: 'custom_event',
      event_name: 'inactive_30_days',
      emails: [
        { delay_hours: 0, subject: 'We miss you! Here\'s what\'s new', template: 'winback_1' },
        { delay_hours: 72, subject: '🎁 Special offer just for you', template: 'winback_2' }
      ]
    });
  }

  /**
   * Segment subscribers based on behavior
   */
  async createSegments(): Promise<void> {
    const segments = [
      {
        name: 'viral_creators',
        filter: { custom_field: 'is_viral_creator', value: 'true' }
      },
      {
        name: 'power_users',
        filter: { custom_field: 'videos_created', operator: 'greater_than', value: '10' }
      },
      {
        name: 'business_niche',
        filter: { custom_field: 'niche', value: 'business' }
      },
      {
        name: 'tiktok_creators',
        filter: { custom_field: 'platform', value: 'tiktok' }
      }
    ];

    for (const segment of segments) {
      await this.createSegment(segment);
    }
  }

  /**
   * Send custom email through Beehiiv
   */
  private async sendCustomEmail(params: {
    email: string;
    subject: string;
    content: string;
    tags?: string[];
  }): Promise<boolean> {
    if (this.isTestMode) {
      console.log('📧 TEST MODE - Email would be sent:', {
        to: params.email,
        subject: params.subject,
        preview: params.content.substring(0, 100) + '...'
      });
      return true;
    }

    try {
      // Note: Beehiiv's custom email API might require specific endpoint
      // This is a placeholder - check Beehiiv docs for exact implementation
      const response = await fetch(`${this.baseUrl}/publications/${this.publicationId}/emails/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: params.email,
          subject: params.subject,
          content_html: params.content,
          content_text: this.stripHtml(params.content),
          tags: params.tags || []
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('❌ Beehiiv email error:', error);
      return false;
    }
  }

  /**
   * Update subscriber custom fields
   */
  private async updateSubscriberFields(
    email: string,
    fields: Record<string, string>
  ): Promise<boolean> {
    if (this.isTestMode) return true;

    try {
      // Handle special increment case
      if (fields.videos_created === 'increment') {
        // Fetch current value and increment
        // This is simplified - implement actual fetch/increment logic
        fields.videos_created = '1';
      }

      const response = await fetch(`${this.baseUrl}/publications/${this.publicationId}/subscriptions/${email}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          custom_fields: Object.entries(fields).map(([name, value]) => ({ name, value }))
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('❌ Beehiiv update error:', error);
      return false;
    }
  }

  /**
   * Add subscriber to segment
   */
  private async addToSegment(email: string, segmentName: string): Promise<boolean> {
    if (this.isTestMode) return true;

    // Implementation depends on Beehiiv's segment API
    console.log(`Would add ${email} to segment: ${segmentName}`);
    return true;
  }

  /**
   * Create automation workflow
   */
  private async createAutomation(automation: any): Promise<boolean> {
    if (this.isTestMode) return true;

    // Implementation depends on Beehiiv's automation API
    console.log('Would create automation:', automation.name);
    return true;
  }

  /**
   * Create subscriber segment
   */
  private async createSegment(segment: any): Promise<boolean> {
    if (this.isTestMode) return true;

    // Implementation depends on Beehiiv's segment API
    console.log('Would create segment:', segment.name);
    return true;
  }

  /**
   * Email content templates
   */
  private getMagicLinkEmailContent(magicLinkUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 32px; font-weight: bold; color: #7c3aed; }
          .button { display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #ec4899 100%); 
                   color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; 
                   font-weight: 600; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🎬 TRENDZO</div>
          </div>
          <h2>Welcome back! 👋</h2>
          <p>Click the button below to log in:</p>
          <div style="text-align: center;">
            <a href="${magicLinkUrl}" class="button">Log In to TRENDZO</a>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            This link expires in 15 minutes. If you didn't request this, ignore this email.
          </p>
        </div>
      </body>
      </html>
    `;
  }

  private getTemplateReadyEmailContent(templateId: string, viralScore: number, predictedViews: number): string {
    const previewUrl = `${process.env.NEXT_PUBLIC_APP_URL}/templates/${templateId}/preview`;
    
    return `
      <!DOCTYPE html>
      <html>
      <body>
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1>🎉 Your Video is Ready!</h1>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center;">
            <p style="font-size: 18px;">Viral Score</p>
            <p style="font-size: 48px; font-weight: bold; color: #10b981;">${viralScore}/100</p>
            <p>Predicted: ${predictedViews.toLocaleString()}+ views</p>
          </div>
          <a href="${previewUrl}" style="display: inline-block; background: #7c3aed; color: white; 
            padding: 12px 30px; border-radius: 8px; text-decoration: none; margin: 20px 0;">
            Preview Video
          </a>
        </div>
      </body>
      </html>
    `;
  }

  private getViralAlertEmailContent(views: number, platform: string, templateId: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <body>
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1>🚀 YOU'RE GOING VIRAL!</h1>
          <p style="font-size: 24px;">${views.toLocaleString()} views on ${platform}!</p>
          <p>Keep the momentum going - post your next video NOW while you're hot!</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard-view" 
            style="display: inline-block; background: #7c3aed; color: white; 
            padding: 12px 30px; border-radius: 8px; text-decoration: none;">
            Create Next Video
          </a>
        </div>
      </body>
      </html>
    `;
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }
}

// Export singleton instance
export const beehiivService = BeehiivService.getInstance();