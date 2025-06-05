/**
 * TRENDZO Newsletter Link Tracking Service
 * 
 * This service manages newsletter link generation and tracking by:
 * 1. Creating trackable short links for templates
 * 2. Recording click analytics and conversion data
 * 3. Tracking geographic and device information
 * 4. Providing detailed performance reports
 * 5. Managing campaign attribution
 * 
 * Based on the comprehensive viral intelligence blueprint
 */

export interface NewsletterLink {
  id: string;
  templateId: string;
  shortCode: string;
  targetUrl: string;
  campaignName: string;
  
  // Tracking Data
  clickCount: number;
  uniqueClicks: number;
  conversionCount: number;
  
  // Analytics
  clickSources: Record<string, number>;
  geographicData: Record<string, number>;
  deviceData: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  
  // Configuration
  isActive: boolean;
  expiresAt?: Date;
  
  createdAt: Date;
  lastClickedAt?: Date;
}

export interface ClickAnalytics {
  linkId: string;
  clickId: string;
  timestamp: Date;
  
  // User Information (anonymized)
  userAgent: string;
  ipAddress: string; // Hashed for privacy
  referrer: string;
  
  // Geographic Data
  country: string;
  region: string;
  city: string;
  timezone: string;
  
  // Device Information
  deviceType: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  operatingSystem: string;
  screenResolution: string;
  
  // Tracking
  isUniqueClick: boolean;
  conversionCompleted: boolean;
  conversionValue?: number;
}

export interface NewsletterCampaign {
  id: string;
  name: string;
  description: string;
  
  // Campaign Configuration
  templateIds: string[];
  targetAudience: string[];
  sendDate: Date;
  
  // Performance Metrics
  totalLinks: number;
  totalClicks: number;
  uniqueClicks: number;
  conversionRate: number;
  
  // Analytics
  topPerformingTemplates: string[];
  clickThroughRate: number;
  averageTimeToClick: number;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface TrackingReport {
  linkId: string;
  templateName: string;
  campaignName: string;
  
  // Performance Summary
  totalClicks: number;
  uniqueClicks: number;
  conversionRate: number;
  clickThroughRate: number;
  
  // Time-based Analytics
  dailyClicks: Record<string, number>;
  hourlyDistribution: Record<string, number>;
  
  // Geographic Analytics
  topCountries: Array<{ country: string; clicks: number; percentage: number }>;
  topCities: Array<{ city: string; clicks: number; percentage: number }>;
  
  // Device Analytics
  deviceBreakdown: {
    desktop: { clicks: number; percentage: number };
    mobile: { clicks: number; percentage: number };
    tablet: { clicks: number; percentage: number };
  };
  
  // Source Analytics
  topReferrers: Array<{ source: string; clicks: number; percentage: number }>;
  
  // Conversion Analytics
  conversionFunnel: {
    clicks: number;
    templateViews: number;
    templateUses: number;
    completions: number;
  };
}

export class NewsletterTrackingService {
  private static instance: NewsletterTrackingService;
  private links: Map<string, NewsletterLink> = new Map();
  private analytics: Map<string, ClickAnalytics[]> = new Map();

  private constructor() {
    this.initializeService();
  }

  public static getInstance(): NewsletterTrackingService {
    if (!NewsletterTrackingService.instance) {
      NewsletterTrackingService.instance = new NewsletterTrackingService();
    }
    return NewsletterTrackingService.instance;
  }

  /**
   * Create a trackable newsletter link for a template
   */
  public async createNewsletterLink(
    templateId: string,
    campaignName: string,
    customShortCode?: string,
    expiresAt?: Date
  ): Promise<NewsletterLink> {
    try {
      const linkId = this.generateLinkId();
      const shortCode = customShortCode || this.generateShortCode();
      
      // Verify template exists and get target URL
      const targetUrl = await this.buildTemplateUrl(templateId);
      
      const link: NewsletterLink = {
        id: linkId,
        templateId,
        shortCode,
        targetUrl,
        campaignName,
        clickCount: 0,
        uniqueClicks: 0,
        conversionCount: 0,
        clickSources: {},
        geographicData: {},
        deviceData: { desktop: 0, mobile: 0, tablet: 0 },
        isActive: true,
        expiresAt,
        createdAt: new Date()
      };

      // Save to database
      await this.saveNewsletterLink(link);
      
      // Cache locally
      this.links.set(linkId, link);
      this.analytics.set(linkId, []);

      console.log(`📧 Newsletter link created: ${shortCode} -> ${templateId}`);
      return link;

    } catch (error) {
      console.error('Error creating newsletter link:', error);
      throw new Error('Failed to create newsletter link');
    }
  }

  /**
   * Track a click on a newsletter link
   */
  public async trackClick(
    shortCode: string,
    userAgent: string,
    ipAddress: string,
    referrer: string
  ): Promise<{ success: boolean; redirectUrl?: string; error?: string }> {
    try {
      // Find link by short code
      const link = await this.findLinkByShortCode(shortCode);
      if (!link) {
        return { success: false, error: 'Link not found' };
      }

      // Check if link is active and not expired
      if (!link.isActive) {
        return { success: false, error: 'Link is inactive' };
      }

      if (link.expiresAt && new Date() > link.expiresAt) {
        return { success: false, error: 'Link has expired' };
      }

      // Generate click analytics
      const clickAnalytics = await this.generateClickAnalytics(
        link.id,
        userAgent,
        ipAddress,
        referrer
      );

      // Update link statistics
      await this.updateLinkStatistics(link, clickAnalytics);

      // Record the click
      await this.recordClick(clickAnalytics);

      console.log(`📊 Click tracked: ${shortCode} from ${clickAnalytics.country}`);

      return {
        success: true,
        redirectUrl: link.targetUrl
      };

    } catch (error) {
      console.error('Error tracking click:', error);
      return { success: false, error: 'Failed to track click' };
    }
  }

  /**
   * Record a conversion (template usage completion)
   */
  public async trackConversion(
    linkId: string,
    conversionValue?: number
  ): Promise<void> {
    try {
      const link = this.links.get(linkId);
      if (!link) {
        console.error('Link not found for conversion tracking:', linkId);
        return;
      }

      // Update conversion count
      link.conversionCount++;

      // Update in database
      await this.updateNewsletterLink(link);

      // Find recent click to mark as converted
      const recentClicks = this.analytics.get(linkId) || [];
      const recentClick = recentClicks[recentClicks.length - 1];
      
      if (recentClick && !recentClick.conversionCompleted) {
        recentClick.conversionCompleted = true;
        recentClick.conversionValue = conversionValue;
        await this.updateClickAnalytics(recentClick);
      }

      console.log(`💰 Conversion tracked for link: ${linkId}`);

    } catch (error) {
      console.error('Error tracking conversion:', error);
    }
  }

  /**
   * Generate comprehensive tracking report
   */
  public async generateTrackingReport(linkId: string): Promise<TrackingReport> {
    try {
      const link = this.links.get(linkId) || await this.loadNewsletterLink(linkId);
      if (!link) {
        throw new Error('Link not found');
      }

      const clicks = this.analytics.get(linkId) || await this.loadClickAnalytics(linkId);
      const templateName = await this.getTemplateName(link.templateId);

      // Calculate performance metrics
      const conversionRate = link.clickCount > 0 ? (link.conversionCount / link.clickCount) * 100 : 0;
      const clickThroughRate = this.calculateClickThroughRate(link);

      // Generate time-based analytics
      const dailyClicks = this.calculateDailyClicks(clicks);
      const hourlyDistribution = this.calculateHourlyDistribution(clicks);

      // Generate geographic analytics
      const topCountries = this.calculateTopCountries(clicks);
      const topCities = this.calculateTopCities(clicks);

      // Generate device analytics
      const deviceBreakdown = this.calculateDeviceBreakdown(clicks);

      // Generate source analytics
      const topReferrers = this.calculateTopReferrers(clicks);

      // Generate conversion funnel
      const conversionFunnel = await this.calculateConversionFunnel(link);

      const report: TrackingReport = {
        linkId: link.id,
        templateName,
        campaignName: link.campaignName,
        totalClicks: link.clickCount,
        uniqueClicks: link.uniqueClicks,
        conversionRate,
        clickThroughRate,
        dailyClicks,
        hourlyDistribution,
        topCountries,
        topCities,
        deviceBreakdown,
        topReferrers,
        conversionFunnel
      };

      return report;

    } catch (error) {
      console.error('Error generating tracking report:', error);
      throw new Error('Failed to generate tracking report');
    }
  }

  /**
   * Get campaign performance summary
   */
  public async getCampaignPerformance(campaignName: string): Promise<{
    campaign: NewsletterCampaign;
    links: NewsletterLink[];
    totalClicks: number;
    totalConversions: number;
    averageConversionRate: number;
  }> {
    try {
      // Find all links for campaign
      const campaignLinks = Array.from(this.links.values())
        .filter(link => link.campaignName === campaignName);

      if (campaignLinks.length === 0) {
        // Load from database
        const dbLinks = await this.loadCampaignLinks(campaignName);
        campaignLinks.push(...dbLinks);
      }

      // Calculate aggregated metrics
      const totalClicks = campaignLinks.reduce((sum, link) => sum + link.clickCount, 0);
      const totalConversions = campaignLinks.reduce((sum, link) => sum + link.conversionCount, 0);
      const averageConversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

      // Create campaign summary
      const campaign: NewsletterCampaign = {
        id: `campaign_${campaignName.replace(/\s+/g, '_').toLowerCase()}`,
        name: campaignName,
        description: `Newsletter campaign: ${campaignName}`,
        templateIds: [...new Set(campaignLinks.map(link => link.templateId))],
        targetAudience: ['newsletter subscribers'],
        sendDate: campaignLinks.length > 0 ? campaignLinks[0].createdAt : new Date(),
        totalLinks: campaignLinks.length,
        totalClicks,
        uniqueClicks: campaignLinks.reduce((sum, link) => sum + link.uniqueClicks, 0),
        conversionRate: averageConversionRate,
        topPerformingTemplates: this.getTopPerformingTemplates(campaignLinks),
        clickThroughRate: this.calculateCampaignCTR(campaignLinks),
        averageTimeToClick: 0, // Would need additional tracking
        createdAt: campaignLinks.length > 0 ? campaignLinks[0].createdAt : new Date(),
        updatedAt: new Date()
      };

      return {
        campaign,
        links: campaignLinks,
        totalClicks,
        totalConversions,
        averageConversionRate
      };

    } catch (error) {
      console.error('Error getting campaign performance:', error);
      throw new Error('Failed to get campaign performance');
    }
  }

  // Private helper methods

  private async initializeService(): Promise<void> {
    try {
      console.log('🔧 Initializing Newsletter Tracking Service...');
      
      // Load existing links from database
      await this.loadExistingLinks();
      
      console.log(`📧 Loaded ${this.links.size} newsletter links`);
    } catch (error) {
      console.error('Error initializing newsletter tracking service:', error);
    }
  }

  private generateLinkId(): string {
    return `nl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateShortCode(): string {
    // Generate a 6-character short code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private async buildTemplateUrl(templateId: string): Promise<string> {
    // Build the full URL to the template editor
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://trendzo.app';
    return `${baseUrl}/editor/${templateId}?utm_source=newsletter&utm_medium=email&utm_campaign=viral_templates`;
  }

  private async generateClickAnalytics(
    linkId: string,
    userAgent: string,
    ipAddress: string,
    referrer: string
  ): Promise<ClickAnalytics> {
    const clickId = `click_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    // Parse user agent for device information
    const deviceInfo = this.parseUserAgent(userAgent);
    
    // Get geographic information (in production, use a geolocation service)
    const geoInfo = await this.getGeographicInfo(ipAddress);
    
    // Check if this is a unique click
    const existingClicks = this.analytics.get(linkId) || [];
    const hashedIP = this.hashIP(ipAddress);
    const isUniqueClick = !existingClicks.some(click => 
      this.hashIP(click.ipAddress) === hashedIP && 
      click.deviceType === deviceInfo.deviceType
    );

    return {
      linkId,
      clickId,
      timestamp: new Date(),
      userAgent,
      ipAddress: hashedIP,
      referrer: referrer || 'direct',
      country: geoInfo.country,
      region: geoInfo.region,
      city: geoInfo.city,
      timezone: geoInfo.timezone,
      deviceType: deviceInfo.deviceType,
      browser: deviceInfo.browser,
      operatingSystem: deviceInfo.operatingSystem,
      screenResolution: deviceInfo.screenResolution,
      isUniqueClick,
      conversionCompleted: false
    };
  }

  private parseUserAgent(userAgent: string): {
    deviceType: 'desktop' | 'mobile' | 'tablet';
    browser: string;
    operatingSystem: string;
    screenResolution: string;
  } {
    // Simple user agent parsing (in production, use a library like ua-parser-js)
    const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
    const isTablet = /iPad|Android.*Tablet/.test(userAgent);
    
    let deviceType: 'desktop' | 'mobile' | 'tablet';
    if (isTablet) deviceType = 'tablet';
    else if (isMobile) deviceType = 'mobile';
    else deviceType = 'desktop';

    // Extract browser
    let browser = 'Unknown';
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';

    // Extract OS
    let operatingSystem = 'Unknown';
    if (userAgent.includes('Windows')) operatingSystem = 'Windows';
    else if (userAgent.includes('Mac')) operatingSystem = 'macOS';
    else if (userAgent.includes('Linux')) operatingSystem = 'Linux';
    else if (userAgent.includes('Android')) operatingSystem = 'Android';
    else if (userAgent.includes('iOS')) operatingSystem = 'iOS';

    return {
      deviceType,
      browser,
      operatingSystem,
      screenResolution: 'Unknown' // Would need client-side tracking
    };
  }

  private async getGeographicInfo(ipAddress: string): Promise<{
    country: string;
    region: string;
    city: string;
    timezone: string;
  }> {
    // In production, use a geolocation service like ipapi.co or similar
    // For development, return mock data
    return {
      country: 'United States',
      region: 'California',
      city: 'San Francisco',
      timezone: 'America/Los_Angeles'
    };
  }

  private hashIP(ipAddress: string): string {
    // Simple hash for privacy (in production, use crypto.createHash)
    return `hashed_${ipAddress.split('.').reverse().join('_')}`;
  }

  private async updateLinkStatistics(
    link: NewsletterLink,
    clickAnalytics: ClickAnalytics
  ): Promise<void> {
    // Update click count
    link.clickCount++;
    
    // Update unique clicks
    if (clickAnalytics.isUniqueClick) {
      link.uniqueClicks++;
    }

    // Update geographic data
    link.geographicData[clickAnalytics.country] = 
      (link.geographicData[clickAnalytics.country] || 0) + 1;

    // Update device data
    link.deviceData[clickAnalytics.deviceType]++;

    // Update click sources
    const source = clickAnalytics.referrer;
    link.clickSources[source] = (link.clickSources[source] || 0) + 1;

    // Update last clicked timestamp
    link.lastClickedAt = new Date();

    // Update in database
    await this.updateNewsletterLink(link);
  }

  private async saveNewsletterLink(link: NewsletterLink): Promise<void> {
    try {
      const { supabaseClient } = await import('@/lib/supabase-client');
      
      const { error } = await supabaseClient
        .from('newsletter_links')
        .insert({
          id: link.id,
          template_id: link.templateId,
          short_code: link.shortCode,
          target_url: link.targetUrl,
          campaign_name: link.campaignName,
          click_count: link.clickCount,
          unique_clicks: link.uniqueClicks,
          conversion_count: link.conversionCount,
          click_sources: link.clickSources,
          geographic_data: link.geographicData,
          device_data: link.deviceData,
          is_active: link.isActive,
          expires_at: link.expiresAt?.toISOString()
        });

      if (error) {
        console.error('Error saving newsletter link:', error);
      }
    } catch (error) {
      console.error('Error accessing database:', error);
    }
  }

  private async updateNewsletterLink(link: NewsletterLink): Promise<void> {
    try {
      const { supabaseClient } = await import('@/lib/supabase-client');
      
      const { error } = await supabaseClient
        .from('newsletter_links')
        .update({
          click_count: link.clickCount,
          unique_clicks: link.uniqueClicks,
          conversion_count: link.conversionCount,
          click_sources: link.clickSources,
          geographic_data: link.geographicData,
          device_data: link.deviceData,
          last_clicked_at: link.lastClickedAt?.toISOString()
        })
        .eq('id', link.id);

      if (error) {
        console.error('Error updating newsletter link:', error);
      }
    } catch (error) {
      console.error('Error accessing database:', error);
    }
  }

  private async recordClick(clickAnalytics: ClickAnalytics): Promise<void> {
    // Add to local analytics
    const linkAnalytics = this.analytics.get(clickAnalytics.linkId) || [];
    linkAnalytics.push(clickAnalytics);
    this.analytics.set(clickAnalytics.linkId, linkAnalytics);

    // Save to database (in production, use a separate analytics table)
    console.log(`📊 Click recorded: ${clickAnalytics.clickId}`);
  }

  private async findLinkByShortCode(shortCode: string): Promise<NewsletterLink | null> {
    // Check local cache first
    for (const link of this.links.values()) {
      if (link.shortCode === shortCode) {
        return link;
      }
    }

    // Load from database
    try {
      const { supabaseClient } = await import('@/lib/supabase-client');
      
      const { data, error } = await supabaseClient
        .from('newsletter_links')
        .select('*')
        .eq('short_code', shortCode)
        .single();

      if (error || !data) {
        return null;
      }

      const link = this.mapDatabaseToLink(data);
      this.links.set(link.id, link);
      return link;
    } catch (error) {
      console.error('Error finding link by short code:', error);
      return null;
    }
  }

  private async loadExistingLinks(): Promise<void> {
    // In production, load from database
    // For development, start with empty cache
    console.log('📧 Newsletter tracking service ready');
  }

  private async loadNewsletterLink(linkId: string): Promise<NewsletterLink | null> {
    // Load from database (mock implementation)
    return null;
  }

  private async loadClickAnalytics(linkId: string): Promise<ClickAnalytics[]> {
    // Load from database (mock implementation)
    return [];
  }

  private async loadCampaignLinks(campaignName: string): Promise<NewsletterLink[]> {
    // Load from database (mock implementation)
    return [];
  }

  private mapDatabaseToLink(data: any): NewsletterLink {
    return {
      id: data.id,
      templateId: data.template_id,
      shortCode: data.short_code,
      targetUrl: data.target_url,
      campaignName: data.campaign_name,
      clickCount: data.click_count || 0,
      uniqueClicks: data.unique_clicks || 0,
      conversionCount: data.conversion_count || 0,
      clickSources: data.click_sources || {},
      geographicData: data.geographic_data || {},
      deviceData: data.device_data || { desktop: 0, mobile: 0, tablet: 0 },
      isActive: data.is_active,
      expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
      createdAt: new Date(data.created_at),
      lastClickedAt: data.last_clicked_at ? new Date(data.last_clicked_at) : undefined
    };
  }

  // Analytics calculation methods (abbreviated implementations)
  private calculateClickThroughRate(link: NewsletterLink): number {
    // Would need impression data for real CTR calculation
    return 0;
  }

  private calculateDailyClicks(clicks: ClickAnalytics[]): Record<string, number> {
    const daily: Record<string, number> = {};
    clicks.forEach(click => {
      const date = click.timestamp.toISOString().split('T')[0];
      daily[date] = (daily[date] || 0) + 1;
    });
    return daily;
  }

  private calculateHourlyDistribution(clicks: ClickAnalytics[]): Record<string, number> {
    const hourly: Record<string, number> = {};
    clicks.forEach(click => {
      const hour = click.timestamp.getHours().toString();
      hourly[hour] = (hourly[hour] || 0) + 1;
    });
    return hourly;
  }

  private calculateTopCountries(clicks: ClickAnalytics[]): Array<{ country: string; clicks: number; percentage: number }> {
    const countries: Record<string, number> = {};
    clicks.forEach(click => {
      countries[click.country] = (countries[click.country] || 0) + 1;
    });

    const total = clicks.length;
    return Object.entries(countries)
      .map(([country, count]) => ({
        country,
        clicks: count,
        percentage: (count / total) * 100
      }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10);
  }

  private calculateTopCities(clicks: ClickAnalytics[]): Array<{ city: string; clicks: number; percentage: number }> {
    const cities: Record<string, number> = {};
    clicks.forEach(click => {
      cities[click.city] = (cities[click.city] || 0) + 1;
    });

    const total = clicks.length;
    return Object.entries(cities)
      .map(([city, count]) => ({
        city,
        clicks: count,
        percentage: (count / total) * 100
      }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10);
  }

  private calculateDeviceBreakdown(clicks: ClickAnalytics[]): TrackingReport['deviceBreakdown'] {
    const devices = { desktop: 0, mobile: 0, tablet: 0 };
    clicks.forEach(click => {
      devices[click.deviceType]++;
    });

    const total = clicks.length;
    return {
      desktop: { clicks: devices.desktop, percentage: (devices.desktop / total) * 100 },
      mobile: { clicks: devices.mobile, percentage: (devices.mobile / total) * 100 },
      tablet: { clicks: devices.tablet, percentage: (devices.tablet / total) * 100 }
    };
  }

  private calculateTopReferrers(clicks: ClickAnalytics[]): Array<{ source: string; clicks: number; percentage: number }> {
    const referrers: Record<string, number> = {};
    clicks.forEach(click => {
      const source = click.referrer || 'direct';
      referrers[source] = (referrers[source] || 0) + 1;
    });

    const total = clicks.length;
    return Object.entries(referrers)
      .map(([source, count]) => ({
        source,
        clicks: count,
        percentage: (count / total) * 100
      }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10);
  }

  private async calculateConversionFunnel(link: NewsletterLink): Promise<TrackingReport['conversionFunnel']> {
    return {
      clicks: link.clickCount,
      templateViews: Math.floor(link.clickCount * 0.8), // Estimate 80% view rate
      templateUses: Math.floor(link.clickCount * 0.3), // Estimate 30% use rate
      completions: link.conversionCount
    };
  }

  private async getTemplateName(templateId: string): Promise<string> {
    // In production, fetch from templates table
    return `Template ${templateId.slice(-6)}`;
  }

  private async updateClickAnalytics(clickAnalytics: ClickAnalytics): Promise<void> {
    // Update click analytics in database
    console.log(`📊 Updated click analytics: ${clickAnalytics.clickId}`);
  }

  private getTopPerformingTemplates(links: NewsletterLink[]): string[] {
    return links
      .sort((a, b) => b.clickCount - a.clickCount)
      .slice(0, 5)
      .map(link => link.templateId);
  }

  private calculateCampaignCTR(links: NewsletterLink[]): number {
    // Would need impression data for real CTR calculation
    return 0;
  }
}

// Export singleton instance
export const newsletterTrackingService = NewsletterTrackingService.getInstance();