import { beehiivService } from './beehiivService';
import { Niche, Platform } from '@/lib/types/database';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, any>;
}

export interface MagicLinkData {
  email: string;
  token: string;
  redirectTo?: string;
  metadata?: Record<string, any>;
}

export interface ViralMetrics {
  views: number;
  likes: number;
  shares: number;
  comments: number;
  platform: string;
  templateId: string;
}

/**
 * Email Service for TRENDZO MVP
 * Wrapper around Beehiiv for all email communications
 */
export class EmailService {
  private static instance: EmailService;

  private constructor() {}

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  /**
   * Send a magic link for passwordless authentication
   */
  async sendMagicLink(data: MagicLinkData): Promise<boolean> {
    const { email, token, redirectTo = '/dashboard-view', metadata = {} } = data;
    
    // Add subscriber to Beehiiv and send magic link
    return beehiivService.sendMagicLink({
      email,
      token,
      redirectTo
    });
  }

  /**
   * Send welcome email sequence for new users
   */
  async sendWelcomeSequence(userId: string, email: string, source?: string): Promise<boolean> {
    // Add to Beehiiv with welcome automation
    const result = await beehiivService.addSubscriber({
      email,
      source: (source as any) || 'landing_page',
      metadata: {
        user_id: userId,
        welcome_sent: new Date().toISOString()
      }
    });
    
    return result.success;
  }

  /**
   * Send notification when template is ready
   */
  async sendTemplateReady(email: string, templateId: string, templateData: any): Promise<boolean> {
    return beehiivService.sendTemplateReady({
      email,
      templateId,
      viralScore: templateData.viralScore || 85,
      predictedViews: templateData.predictedViews || 250000
    });
  }

  /**
   * Send viral alert when content performs well
   */
  async sendViralAlert(userId: string, email: string, metrics: ViralMetrics): Promise<boolean> {
    return beehiivService.sendViralAlert({
      email,
      views: metrics.views,
      platform: metrics.platform,
      templateId: metrics.templateId
    });
  }

  /**
   * Send campaign performance report
   * Note: This would typically be handled by Beehiiv's campaign features
   */
  async sendCampaignReport(email: string, campaignData: any): Promise<boolean> {
    // Update subscriber with campaign data
    await beehiivService.addSubscriber({
      email,
      source: 'template_complete',
      metadata: {
        last_campaign_views: campaignData.totalViews || 0,
        last_campaign_date: new Date().toISOString()
      }
    });
    
    return true;
  }

  /**
   * Legacy compatibility - convert old email format
   */
  private async sendEmail(data: EmailData): Promise<boolean> {
    console.warn('⚠️ Using legacy sendEmail - migrate to Beehiiv methods');
    
    return beehiivService.addSubscriber({
      email: data.to,
      source: 'landing_page',
      metadata: {
        legacy_email_subject: data.subject
      }
    }).then(result => result.success);
  }
}

// Original email templates below this line have been moved to beehiivService.ts
// The extensive HTML templates are now handled by Beehiiv's template system
      to: email,
      subject: '🔐 Your TRENDZO Login Link',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 32px; font-weight: bold; color: #7c3aed; }
            .content { background: #f9fafb; border-radius: 12px; padding: 30px; }
            .button { display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #ec4899 100%); 
                     color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; 
                     font-weight: 600; margin: 20px 0; }
            .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
            .stats { background: white; border-radius: 8px; padding: 15px; margin: 20px 0; 
                     border: 1px solid #e5e7eb; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🎬 TRENDZO</div>
              <p style="color: #6b7280;">Create Viral Videos in 60 Seconds</p>
            </div>
            
            <div class="content">
              <h2>Welcome back! 👋</h2>
              <p>Click the button below to instantly log in to your TRENDZO account:</p>
              
              <div style="text-align: center;">
                <a href="${magicLinkUrl}" class="button">Log In to TRENDZO</a>
              </div>
              
              <div class="stats">
                <p style="margin: 0; font-weight: 600;">🔥 Today's Stats:</p>
                <p style="margin: 5px 0;">• 2,847 videos created</p>
                <p style="margin: 5px 0;">• 15 creators went viral</p>
                <p style="margin: 5px 0;">• 3.2M total views generated</p>
              </div>
              
              <p style="color: #6b7280; font-size: 14px;">
                This link will expire in 15 minutes for security. If you didn't request this, 
                you can safely ignore this email.
              </p>
            </div>
            
            <div class="footer">
              <p>© 2024 TRENDZO - Making everyone a viral creator</p>
              <p>
                <a href="${APP_URL}/unsubscribe" style="color: #6b7280;">Unsubscribe</a> | 
                <a href="${APP_URL}/help" style="color: #6b7280;">Get Help</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Welcome back to TRENDZO!\n\nClick here to log in: ${magicLinkUrl}\n\nThis link expires in 15 minutes.`
    };
    
    return this.sendEmail(emailData);
  }

  /**
   * Send welcome email sequence for new users
   */
  async sendWelcomeSequence(userId: string, email: string): Promise<boolean> {
    const emailData: EmailData = {
      to: email,
      subject: '🎉 Welcome to TRENDZO! Your First Viral Video Awaits',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 32px; font-weight: bold; color: #7c3aed; }
            .content { background: #f9fafb; border-radius: 12px; padding: 30px; }
            .step { background: white; border-radius: 8px; padding: 20px; margin: 15px 0; 
                    border: 1px solid #e5e7eb; }
            .step-number { display: inline-block; width: 30px; height: 30px; background: #7c3aed; 
                          color: white; border-radius: 50%; text-align: center; line-height: 30px; 
                          font-weight: bold; margin-right: 10px; }
            .button { display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #ec4899 100%); 
                     color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; 
                     font-weight: 600; margin: 20px 0; }
            .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🎬 TRENDZO</div>
              <p style="color: #6b7280;">Your Journey to Viral Success Starts Now!</p>
            </div>
            
            <div class="content">
              <h1 style="text-align: center;">Welcome to the TRENDZO Family! 🚀</h1>
              
              <p>You're about to join <strong>50,000+ creators</strong> who've discovered the secret 
              to viral content. Here's how to create your first viral video in the next 5 minutes:</p>
              
              <div class="step">
                <span class="step-number">1</span>
                <strong>Choose Your Template</strong>
                <p style="margin: 5px 0 0 40px; color: #6b7280;">
                  Browse our AI-curated templates that are trending RIGHT NOW
                </p>
              </div>
              
              <div class="step">
                <span class="step-number">2</span>
                <strong>Customize in 60 Seconds</strong>
                <p style="margin: 5px 0 0 40px; color: #6b7280;">
                  Our smart editor adapts to your brand and style automatically
                </p>
              </div>
              
              <div class="step">
                <span class="step-number">3</span>
                <strong>Post & Watch It Explode</strong>
                <p style="margin: 5px 0 0 40px; color: #6b7280;">
                  Our viral prediction algorithm has 87% accuracy
                </p>
              </div>
              
              <div style="text-align: center; background: #fef3c7; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <p style="margin: 0; font-weight: 600; color: #92400e;">
                  🎁 LIMITED TIME: Your first 3 videos are FREE!
                </p>
                <a href="${APP_URL}/dashboard-view/template-library" class="button">Create Your First Viral Video</a>
              </div>
              
              <p><strong>Pro Tip:</strong> Videos created in the first 24 hours have 3x higher 
              engagement rates. Don't wait!</p>
            </div>
            
            <div class="footer">
              <p>Questions? Reply to this email and our team will help you go viral!</p>
              <p>© 2024 TRENDZO | <a href="${APP_URL}/unsubscribe" style="color: #6b7280;">Unsubscribe</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Welcome to TRENDZO!\n\nCreate your first viral video in 5 minutes...`
    };
    
    return this.sendEmail(emailData);
  }

  /**
   * Send notification when template is ready
   */
  async sendTemplateReady(email: string, templateId: string, templateData: any): Promise<boolean> {
    const previewUrl = `${APP_URL}/templates/${templateId}/preview`;
    const editUrl = `${APP_URL}/editor?id=${templateId}`;
    
    const emailData: EmailData = {
      to: email,
      subject: '🎬 Your Viral Video is Ready!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .preview { background: #f3f4f6; border-radius: 12px; padding: 20px; text-align: center; }
            .metrics { display: flex; justify-content: space-around; margin: 20px 0; }
            .metric { text-align: center; }
            .metric-value { font-size: 24px; font-weight: bold; color: #7c3aed; }
            .button { display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #ec4899 100%); 
                     color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; 
                     font-weight: 600; margin: 10px 5px; }
            .button-secondary { background: #e5e7eb; color: #374151; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 style="text-align: center;">🎉 Your Video is Ready to Go Viral!</h1>
            
            <div class="preview">
              <p style="font-size: 18px; margin: 0;">Viral Score</p>
              <p style="font-size: 48px; font-weight: bold; color: #10b981; margin: 10px 0;">92/100</p>
              <p style="color: #6b7280;">Predicted: 250K+ views in first 48 hours</p>
            </div>
            
            <div class="metrics">
              <div class="metric">
                <div class="metric-value">3.2s</div>
                <div style="color: #6b7280; font-size: 14px;">Hook Time</div>
              </div>
              <div class="metric">
                <div class="metric-value">87%</div>
                <div style="color: #6b7280; font-size: 14px;">Completion Rate</div>
              </div>
              <div class="metric">
                <div class="metric-value">A+</div>
                <div style="color: #6b7280; font-size: 14px;">Trend Match</div>
              </div>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${previewUrl}" class="button">Preview Video</a>
              <a href="${editUrl}" class="button button-secondary">Make Edits</a>
            </div>
            
            <div style="background: #fef3c7; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0;"><strong>🔥 Hot Tip:</strong> Post between 6-8 PM in your 
              timezone for maximum engagement!</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Your viral video is ready! Viral Score: 92/100. Preview: ${previewUrl}`
    };
    
    return this.sendEmail(emailData);
  }

  /**
   * Send viral alert when content performs well
   */
  async sendViralAlert(userId: string, email: string, metrics: ViralMetrics): Promise<boolean> {
    const dashboardUrl = `${APP_URL}/dashboard-view/analytics`;
    
    const emailData: EmailData = {
      to: email,
      subject: `🚀 YOU'RE GOING VIRAL! ${metrics.views.toLocaleString()} views and climbing!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .alert { background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); 
                     color: white; border-radius: 12px; padding: 30px; text-align: center; }
            .metrics { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; 
                      display: grid; grid-template-columns: 1fr 1fr; gap: 15px; color: #111827; }
            .metric { text-align: center; }
            .metric-value { font-size: 28px; font-weight: bold; color: #7c3aed; }
            .button { display: inline-block; background: white; color: #7c3aed; 
                     padding: 12px 30px; border-radius: 8px; text-decoration: none; 
                     font-weight: 600; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="alert">
              <h1 style="margin: 0; font-size: 32px;">🎉 YOU'RE VIRAL!</h1>
              <p style="font-size: 18px; margin: 10px 0;">Your video is exploding on ${metrics.platform}!</p>
            </div>
            
            <div class="metrics">
              <div class="metric">
                <div class="metric-value">${metrics.views.toLocaleString()}</div>
                <div>Views</div>
              </div>
              <div class="metric">
                <div class="metric-value">${metrics.likes.toLocaleString()}</div>
                <div>Likes</div>
              </div>
              <div class="metric">
                <div class="metric-value">${metrics.shares.toLocaleString()}</div>
                <div>Shares</div>
              </div>
              <div class="metric">
                <div class="metric-value">${metrics.comments.toLocaleString()}</div>
                <div>Comments</div>
              </div>
            </div>
            
            <div style="text-align: center;">
              <p style="font-size: 18px;"><strong>Keep the momentum going!</strong></p>
              <p>Strike while you're hot - creators who post within 24 hours of going viral 
              see 5x more engagement!</p>
              <a href="${dashboardUrl}" class="button">View Full Analytics</a>
            </div>
            
            <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <p style="margin: 0;"><strong>🎯 Next Steps:</strong></p>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Reply to top comments to boost engagement</li>
                <li>Create a follow-up video while you're trending</li>
                <li>Cross-post to other platforms NOW</li>
              </ul>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `YOU'RE GOING VIRAL! ${metrics.views.toLocaleString()} views on ${metrics.platform}. Check your dashboard: ${dashboardUrl}`
    };
    
    return this.sendEmail(emailData);
  }

  /**
   * Send campaign performance report
   */
  async sendCampaignReport(email: string, campaignData: any): Promise<boolean> {
    const emailData: EmailData = {
      to: email,
      subject: '📊 Your TRENDZO Weekly Performance Report',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
            .stat-card { background: #f3f4f6; border-radius: 8px; padding: 20px; text-align: center; }
            .stat-value { font-size: 32px; font-weight: bold; color: #7c3aed; }
            .stat-label { color: #6b7280; font-size: 14px; margin-top: 5px; }
            .trend-up { color: #10b981; }
            .trend-down { color: #ef4444; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Your Weekly TRENDZO Report 📈</h1>
              <p style="color: #6b7280;">Here's how your content performed this week</p>
            </div>
            
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-value">${campaignData.totalViews || '0'}</div>
                <div class="stat-label">Total Views</div>
                <div class="trend-up">↑ ${campaignData.viewsGrowth || '0'}%</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${campaignData.videosCreated || '0'}</div>
                <div class="stat-label">Videos Created</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${campaignData.avgEngagement || '0'}%</div>
                <div class="stat-label">Avg Engagement</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${campaignData.viralCount || '0'}</div>
                <div class="stat-label">Viral Videos</div>
              </div>
            </div>
            
            <div style="background: #fef3c7; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="margin-top: 0;">🏆 Top Performing Video</h3>
              <p><strong>${campaignData.topVideo?.title || 'N/A'}</strong></p>
              <p>${campaignData.topVideo?.views || '0'} views • ${campaignData.topVideo?.engagement || '0'}% engagement</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${APP_URL}/dashboard-view/analytics" style="display: inline-block; 
                background: linear-gradient(135deg, #7c3aed 0%, #ec4899 100%); 
                color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; 
                font-weight: 600;">View Detailed Analytics</a>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Your weekly TRENDZO report: ${campaignData.totalViews || '0'} total views...`
    };
    
    return this.sendEmail(emailData);
  }

  /**
   * Core email sending function
   */
  private async sendEmail(data: EmailData): Promise<boolean> {
    try {
      if (this.isTestMode) {
        console.log('📧 TEST MODE - Email that would be sent:', {
          to: data.to,
          subject: data.subject,
          preview: data.text?.substring(0, 100) + '...'
        });
        return true;
      }

      const msg = {
        to: data.to,
        from: {
          email: SENDGRID_FROM_EMAIL,
          name: SENDGRID_FROM_NAME
        },
        subject: data.subject,
        text: data.text || this.stripHtml(data.html),
        html: data.html,
        ...(data.templateId && {
          templateId: data.templateId,
          dynamicTemplateData: data.dynamicTemplateData
        })
      };

      await sgMail.send(msg);
      console.log(`✅ Email sent successfully to ${data.to}`);
      return true;
    } catch (error) {
      console.error('❌ Email sending failed:', error);
      return false;
    }
  }

  /**
   * Strip HTML tags for text version
   */
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }
}

// Export singleton instance
export const emailService = EmailService.getInstance();