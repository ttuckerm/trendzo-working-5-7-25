import { supabaseClient } from '@/lib/supabase-client';
import { realtimeService } from './realtimeService';
import { Niche, Platform } from '@/lib/types/database';

// Types for analytics processing
export interface AnalyticsEvent {
  id: string;
  event_type: string;
  visitor_id: string;
  session_id: string;
  user_id?: string;
  landing_page_id?: string;
  template_id?: string;
  metadata: Record<string, any>;
  device_type: 'desktop' | 'mobile' | 'tablet';
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  timestamp: string;
  processed_at?: string;
}

export interface ProcessedMetrics {
  timeframe: 'hour' | 'day' | 'week' | 'month';
  period: string;
  metrics: {
    page_views: number;
    unique_visitors: number;
    email_captures: number;
    template_creations: number;
    conversion_rate: number;
    avg_session_duration: number;
    bounce_rate: number;
    viral_videos: number;
    total_views: number;
    revenue: number;
  };
  breakdown: {
    by_niche: Record<Niche, number>;
    by_platform: Record<Platform, number>;
    by_source: Record<string, number>;
    by_device: Record<string, number>;
  };
  trends: {
    growth_rate: number;
    trending_templates: string[];
    declining_templates: string[];
    hot_niches: Niche[];
  };
}

export interface ViralPrediction {
  template_id: string;
  current_score: number;
  predicted_score: number;
  confidence: number;
  factors: {
    content_quality: number;
    timing_score: number;
    audio_match: number;
    platform_fit: number;
    trend_alignment: number;
  };
  recommendations: string[];
  estimated_views: {
    pessimistic: number;
    realistic: number;
    optimistic: number;
  };
  best_posting_time: string;
}

export interface ConversionFunnel {
  stage: string;
  visitors: number;
  conversions: number;
  conversion_rate: number;
  drop_off: number;
  avg_time_spent: number;
  top_exit_points: string[];
  improvement_opportunities: string[];
}

export interface AttributionData {
  source: string;
  medium: string;
  campaign: string;
  content: string;
  term: string;
  landing_page: string;
  conversions: number;
  revenue: number;
  cost_per_acquisition: number;
  lifetime_value: number;
  roi: number;
}

/**
 * Real-time Analytics Processor
 * Processes events, calculates metrics, and generates insights
 */
export class AnalyticsProcessor {
  private static instance: AnalyticsProcessor;
  private processingQueue: AnalyticsEvent[] = [];
  private isProcessing: boolean = false;
  private batchSize: number = 50;
  private processingInterval: number = 5000; // 5 seconds

  private constructor() {
    this.startProcessingLoop();
    this.setupRealtimeEventHandling();
  }

  static getInstance(): AnalyticsProcessor {
    if (!AnalyticsProcessor.instance) {
      AnalyticsProcessor.instance = new AnalyticsProcessor();
    }
    return AnalyticsProcessor.instance;
  }

  /**
   * Queue event for processing
   */
  async queueEvent(event: Omit<AnalyticsEvent, 'id' | 'timestamp'>): Promise<void> {
    const fullEvent: AnalyticsEvent = {
      ...event,
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };

    this.processingQueue.push(fullEvent);

    // Process immediately for critical events
    if (this.isCriticalEvent(event.event_type)) {
      await this.processEvents([fullEvent]);
    }
  }

  /**
   * Process batch of events
   */
  async processBatch(events: AnalyticsEvent[]): Promise<{
    processed: number;
    failed: number;
    insights: string[];
  }> {
    let processed = 0;
    let failed = 0;
    const insights: string[] = [];

    try {
      // Store raw events
      const { error: insertError } = await supabaseClient
        .from('campaign_analytics')
        .insert(events.map(event => ({
          ...event,
          processed_at: new Date().toISOString()
        })));

      if (insertError) {
        console.error('Failed to insert events:', insertError);
        failed = events.length;
        return { processed, failed, insights };
      }

      // Process each event type
      for (const event of events) {
        try {
          await this.processEvent(event);
          processed++;

          // Generate insights from patterns
          const eventInsights = await this.generateEventInsights(event);
          insights.push(...eventInsights);
        } catch (error) {
          console.error(`Failed to process event ${event.id}:`, error);
          failed++;
        }
      }

      // Update aggregated metrics
      await this.updateAggregatedMetrics(events);

      // Trigger real-time updates
      this.broadcastMetricsUpdate(events);

    } catch (error) {
      console.error('Batch processing failed:', error);
      failed = events.length;
    }

    return { processed, failed, insights };
  }

  /**
   * Get processed metrics for timeframe
   */
  async getMetrics(params: {
    timeframe: 'hour' | 'day' | 'week' | 'month';
    start_date?: string;
    end_date?: string;
    niche?: Niche;
    platform?: Platform;
    segment?: string;
  }): Promise<ProcessedMetrics> {
    try {
      const { data, error } = await supabaseClient.rpc('get_processed_metrics', {
        p_timeframe: params.timeframe,
        p_start_date: params.start_date,
        p_end_date: params.end_date,
        p_niche: params.niche,
        p_platform: params.platform
      });

      if (error) {
        throw new Error(`Metrics fetch failed: ${error.message}`);
      }

      return data || this.getEmptyMetrics(params.timeframe);
    } catch (error) {
      console.error('Error fetching metrics:', error);
      return this.getEmptyMetrics(params.timeframe);
    }
  }

  /**
   * Get real-time dashboard metrics
   */
  async getRealtimeMetrics(): Promise<{
    active_users: number;
    current_conversions: number;
    live_videos_created: number;
    trending_templates: string[];
    conversion_rate_last_hour: number;
    revenue_today: number;
  }> {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const todayStart = new Date().toISOString().split('T')[0] + 'T00:00:00.000Z';

      const [activeUsers, conversions, videosCreated, revenue] = await Promise.all([
        // Active users in last hour
        supabaseClient
          .from('campaign_analytics')
          .select('visitor_id')
          .gte('created_at', oneHourAgo)
          .then(({ data }) => new Set(data?.map(d => d.visitor_id) || []).size),

        // Conversions in last hour
        supabaseClient
          .from('campaign_analytics')
          .select('*')
          .eq('event_type', 'email_capture')
          .gte('created_at', oneHourAgo)
          .then(({ data }) => data?.length || 0),

        // Videos created in last hour
        supabaseClient
          .from('campaign_analytics')
          .select('*')
          .eq('event_type', 'template_complete')
          .gte('created_at', oneHourAgo)
          .then(({ data }) => data?.length || 0),

        // Revenue today (placeholder)
        Promise.resolve(0)
      ]);

      // Get trending templates
      const { data: trendingData } = await supabaseClient
        .from('templates')
        .select('id, name, usage_count')
        .order('usage_count', { ascending: false })
        .limit(5);

      const trendingTemplates = trendingData?.map(t => t.name) || [];

      // Calculate conversion rate
      const totalVisitors = await supabaseClient
        .from('campaign_analytics')
        .select('visitor_id')
        .eq('event_type', 'page_view')
        .gte('created_at', oneHourAgo)
        .then(({ data }) => new Set(data?.map(d => d.visitor_id) || []).size);

      const conversionRate = totalVisitors > 0 ? (conversions / totalVisitors) * 100 : 0;

      return {
        active_users: activeUsers,
        current_conversions: conversions,
        live_videos_created: videosCreated,
        trending_templates: trendingTemplates,
        conversion_rate_last_hour: Math.round(conversionRate * 100) / 100,
        revenue_today: revenue
      };
    } catch (error) {
      console.error('Error fetching realtime metrics:', error);
      return {
        active_users: 0,
        current_conversions: 0,
        live_videos_created: 0,
        trending_templates: [],
        conversion_rate_last_hour: 0,
        revenue_today: 0
      };
    }
  }

  /**
   * Generate conversion funnel analysis
   */
  async getConversionFunnel(params: {
    timeframe: string;
    niche?: Niche;
    platform?: Platform;
  }): Promise<ConversionFunnel[]> {
    try {
      const { data, error } = await supabaseClient.rpc('analyze_conversion_funnel', {
        p_timeframe: params.timeframe,
        p_niche: params.niche,
        p_platform: params.platform
      });

      if (error) {
        throw new Error(`Funnel analysis failed: ${error.message}`);
      }

      return data || this.getDefaultFunnel();
    } catch (error) {
      console.error('Error analyzing funnel:', error);
      return this.getDefaultFunnel();
    }
  }

  /**
   * Get attribution analysis
   */
  async getAttributionAnalysis(params: {
    timeframe: string;
    attribution_model: 'first_touch' | 'last_touch' | 'linear' | 'time_decay';
  }): Promise<AttributionData[]> {
    try {
      const { data, error } = await supabaseClient.rpc('analyze_attribution', {
        p_timeframe: params.timeframe,
        p_model: params.attribution_model
      });

      if (error) {
        throw new Error(`Attribution analysis failed: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error analyzing attribution:', error);
      return [];
    }
  }

  /**
   * Predict viral potential for templates
   */
  async predictViralPotential(templateIds: string[]): Promise<ViralPrediction[]> {
    const predictions: ViralPrediction[] = [];

    for (const templateId of templateIds) {
      try {
        const prediction = await this.calculateViralPrediction(templateId);
        predictions.push(prediction);
      } catch (error) {
        console.error(`Failed to predict viral potential for ${templateId}:`, error);
      }
    }

    return predictions;
  }

  /**
   * Get performance insights
   */
  async getPerformanceInsights(params: {
    timeframe: string;
    focus: 'conversion' | 'engagement' | 'viral' | 'revenue';
  }): Promise<{
    insights: string[];
    recommendations: string[];
    alerts: string[];
    opportunities: string[];
  }> {
    try {
      const insights: string[] = [];
      const recommendations: string[] = [];
      const alerts: string[] = [];
      const opportunities: string[] = [];

      // Get metrics for analysis
      const metrics = await this.getMetrics({
        timeframe: 'week'
      });

      // Analyze based on focus
      switch (params.focus) {
        case 'conversion':
          await this.analyzeConversionInsights(metrics, insights, recommendations, alerts);
          break;
        case 'engagement':
          await this.analyzeEngagementInsights(metrics, insights, recommendations, alerts);
          break;
        case 'viral':
          await this.analyzeViralInsights(metrics, insights, recommendations, opportunities);
          break;
        case 'revenue':
          await this.analyzeRevenueInsights(metrics, insights, recommendations, alerts);
          break;
      }

      return { insights, recommendations, alerts, opportunities };
    } catch (error) {
      console.error('Error generating insights:', error);
      return { insights: [], recommendations: [], alerts: [], opportunities: [] };
    }
  }

  /**
   * Private helper methods
   */
  private async processEvent(event: AnalyticsEvent): Promise<void> {
    switch (event.event_type) {
      case 'page_view':
        await this.processPageView(event);
        break;
      case 'email_capture':
        await this.processEmailCapture(event);
        break;
      case 'template_complete':
        await this.processTemplateComplete(event);
        break;
      case 'viral_threshold':
        await this.processViralThreshold(event);
        break;
      default:
        // Generic event processing
        await this.processGenericEvent(event);
    }
  }

  private async processPageView(event: AnalyticsEvent): Promise<void> {
    // Update landing page metrics
    if (event.landing_page_id) {
      await supabaseClient.rpc('increment_page_views', {
        p_landing_page_id: event.landing_page_id
      });
    }

    // Track visitor journey
    await this.trackVisitorJourney(event);
  }

  private async processEmailCapture(event: AnalyticsEvent): Promise<void> {
    // Update conversion metrics
    await supabaseClient.rpc('record_conversion', {
      p_visitor_id: event.visitor_id,
      p_landing_page_id: event.landing_page_id,
      p_conversion_type: 'email_capture'
    });

    // Trigger email sequence
    if (event.metadata.email) {
      // Integration with email service would go here
      console.log(`Email captured: ${event.metadata.email}`);
    }
  }

  private async processTemplateComplete(event: AnalyticsEvent): Promise<void> {
    // Update template usage stats
    if (event.template_id) {
      await supabaseClient.rpc('increment_template_usage', {
        p_template_id: event.template_id,
        p_viral_score: event.metadata.viral_score || 0
      });
    }

    // Track user progression
    await this.trackUserProgression(event);
  }

  private async processViralThreshold(event: AnalyticsEvent): Promise<void> {
    // Send viral notifications
    await this.sendViralNotifications(event);

    // Update viral metrics
    await this.updateViralMetrics(event);
  }

  private async processGenericEvent(event: AnalyticsEvent): Promise<void> {
    // Basic event logging and counting
    await supabaseClient.rpc('increment_event_count', {
      p_event_type: event.event_type,
      p_metadata: event.metadata
    });
  }

  private async generateEventInsights(event: AnalyticsEvent): Promise<string[]> {
    const insights: string[] = [];

    // Time-based insights
    const hour = new Date(event.timestamp).getHours();
    if (hour >= 19 && hour <= 21 && event.event_type === 'email_capture') {
      insights.push('Peak conversion time detected (7-9 PM)');
    }

    // Device insights
    if (event.device_type === 'mobile' && event.event_type === 'template_complete') {
      insights.push('Mobile template completion detected');
    }

    // Source insights
    if (event.utm_source === 'tiktok' && event.event_type === 'page_view') {
      insights.push('TikTok traffic spike detected');
    }

    return insights;
  }

  private async updateAggregatedMetrics(events: AnalyticsEvent[]): Promise<void> {
    // Group events by hour for efficient aggregation
    const hourlyGroups = this.groupEventsByHour(events);

    for (const [hour, hourEvents] of Object.entries(hourlyGroups)) {
      await this.updateHourlyMetrics(hour, hourEvents);
    }
  }

  private groupEventsByHour(events: AnalyticsEvent[]): Record<string, AnalyticsEvent[]> {
    return events.reduce((groups, event) => {
      const hour = new Date(event.timestamp).toISOString().split(':')[0] + ':00:00.000Z';
      if (!groups[hour]) groups[hour] = [];
      groups[hour].push(event);
      return groups;
    }, {} as Record<string, AnalyticsEvent[]>);
  }

  private async updateHourlyMetrics(hour: string, events: AnalyticsEvent[]): Promise<void> {
    const metrics = {
      hour,
      page_views: events.filter(e => e.event_type === 'page_view').length,
      email_captures: events.filter(e => e.event_type === 'email_capture').length,
      template_completions: events.filter(e => e.event_type === 'template_complete').length,
      unique_visitors: new Set(events.map(e => e.visitor_id)).size
    };

    await supabaseClient
      .from('hourly_metrics')
      .upsert([metrics], { onConflict: 'hour' });
  }

  private broadcastMetricsUpdate(events: AnalyticsEvent[]): void {
    // Broadcast to real-time subscribers
    realtimeService.broadcastEvent('metrics_update', 'metrics_changed', {
      event_count: events.length,
      timestamp: new Date().toISOString()
    });
  }

  private async calculateViralPrediction(templateId: string): Promise<ViralPrediction> {
    // Get template data
    const { data: template } = await supabaseClient
      .from('templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (!template) {
      throw new Error('Template not found');
    }

    // Calculate factors
    const factors = {
      content_quality: this.calculateContentQuality(template),
      timing_score: this.calculateTimingScore(template),
      audio_match: this.calculateAudioMatch(template),
      platform_fit: this.calculatePlatformFit(template),
      trend_alignment: this.calculateTrendAlignment(template)
    };

    // Calculate predicted score
    const currentScore = template.viral_score || 50;
    const predictedScore = Math.round(
      Object.values(factors).reduce((sum, score) => sum + score, 0) / 5
    );

    // Calculate confidence
    const confidence = Math.min(95, Math.max(60, 
      100 - Math.abs(predictedScore - currentScore) * 2
    ));

    // Generate recommendations
    const recommendations = this.generateViralRecommendations(factors);

    // Estimate views
    const baseViews = predictedScore * 1000;
    const estimated_views = {
      pessimistic: Math.round(baseViews * 0.5),
      realistic: Math.round(baseViews),
      optimistic: Math.round(baseViews * 2.5)
    };

    return {
      template_id: templateId,
      current_score: currentScore,
      predicted_score: predictedScore,
      confidence,
      factors,
      recommendations,
      estimated_views,
      best_posting_time: this.calculateBestPostingTime(template.platform)
    };
  }

  private calculateContentQuality(template: any): number {
    let score = 50;
    
    if (template.script && template.script.length > 100) score += 10;
    if (template.metadata?.has_hook) score += 15;
    if (template.metadata?.has_cta) score += 10;
    if (template.usage_count > 10) score += 15;
    
    return Math.min(100, score);
  }

  private calculateTimingScore(template: any): number {
    const duration = template.metadata?.duration || 30;
    
    // Optimal duration scoring
    if (template.platform === 'tiktok' && duration <= 15) return 90;
    if (template.platform === 'instagram' && duration <= 30) return 85;
    if (template.platform === 'linkedin' && duration <= 60) return 80;
    
    return 60;
  }

  private calculateAudioMatch(template: any): number {
    if (template.metadata?.audio_track) return 85;
    if (template.metadata?.has_audio) return 70;
    return 40;
  }

  private calculatePlatformFit(template: any): number {
    const platformScores: Record<string, number> = {
      tiktok: 90,
      instagram: 85,
      linkedin: 75,
      facebook: 70,
      twitter: 65,
      youtube: 80
    };
    
    return platformScores[template.platform] || 60;
  }

  private calculateTrendAlignment(template: any): number {
    const createdDate = new Date(template.created_at);
    const daysSinceCreated = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
    
    // Newer templates align better with current trends
    if (daysSinceCreated <= 7) return 90;
    if (daysSinceCreated <= 30) return 75;
    if (daysSinceCreated <= 90) return 60;
    return 40;
  }

  private generateViralRecommendations(factors: any): string[] {
    const recommendations: string[] = [];
    
    if (factors.content_quality < 70) {
      recommendations.push('Improve hook strength and call-to-action clarity');
    }
    
    if (factors.audio_match < 70) {
      recommendations.push('Add trending audio track for better engagement');
    }
    
    if (factors.timing_score < 70) {
      recommendations.push('Optimize video duration for target platform');
    }
    
    if (factors.trend_alignment < 70) {
      recommendations.push('Update content to reflect current trends');
    }
    
    return recommendations;
  }

  private calculateBestPostingTime(platform: string): string {
    const times: Record<string, string> = {
      tiktok: '6-10 PM (peak engagement)',
      instagram: '11 AM-1 PM, 7-9 PM',
      linkedin: '8-10 AM, 12-2 PM (business hours)',
      facebook: '1-4 PM (afternoon engagement)',
      twitter: '9-10 AM, 7-9 PM',
      youtube: '2-4 PM, 8-10 PM'
    };
    
    return times[platform] || '7-9 PM (general peak)';
  }

  private async trackVisitorJourney(event: AnalyticsEvent): Promise<void> {
    // Implementation for visitor journey tracking
  }

  private async trackUserProgression(event: AnalyticsEvent): Promise<void> {
    // Implementation for user progression tracking
  }

  private async sendViralNotifications(event: AnalyticsEvent): Promise<void> {
    // Implementation for viral notifications
  }

  private async updateViralMetrics(event: AnalyticsEvent): Promise<void> {
    // Implementation for viral metrics update
  }

  private async analyzeConversionInsights(
    metrics: ProcessedMetrics,
    insights: string[],
    recommendations: string[],
    alerts: string[]
  ): Promise<void> {
    if (metrics.metrics.conversion_rate < 10) {
      alerts.push('Conversion rate below 10% - immediate attention needed');
      recommendations.push('A/B test landing page headlines and CTAs');
    }
    
    if (metrics.metrics.bounce_rate > 70) {
      alerts.push('High bounce rate detected');
      recommendations.push('Improve page load speed and content relevance');
    }
  }

  private async analyzeEngagementInsights(
    metrics: ProcessedMetrics,
    insights: string[],
    recommendations: string[],
    alerts: string[]
  ): Promise<void> {
    if (metrics.metrics.avg_session_duration < 30) {
      insights.push('Users are leaving quickly - content may not be engaging enough');
      recommendations.push('Add more compelling hooks and interactive elements');
    }
  }

  private async analyzeViralInsights(
    metrics: ProcessedMetrics,
    insights: string[],
    recommendations: string[],
    opportunities: string[]
  ): Promise<void> {
    if (metrics.metrics.viral_videos > 0) {
      insights.push(`${metrics.metrics.viral_videos} videos went viral this period`);
      opportunities.push('Analyze viral video patterns for template optimization');
    }
  }

  private async analyzeRevenueInsights(
    metrics: ProcessedMetrics,
    insights: string[],
    recommendations: string[],
    alerts: string[]
  ): Promise<void> {
    if (metrics.metrics.revenue === 0) {
      alerts.push('No revenue generated this period');
      recommendations.push('Implement monetization features');
    }
  }

  private startProcessingLoop(): void {
    setInterval(async () => {
      if (this.processingQueue.length > 0 && !this.isProcessing) {
        this.isProcessing = true;
        
        const batch = this.processingQueue.splice(0, this.batchSize);
        await this.processBatch(batch);
        
        this.isProcessing = false;
      }
    }, this.processingInterval);
  }

  private setupRealtimeEventHandling(): void {
    // Listen for new events from other sources
    realtimeService.subscribeToBroadcast(
      'analytics_events',
      'new_event',
      (payload) => {
        this.queueEvent(payload);
      }
    );
  }

  private isCriticalEvent(eventType: string): boolean {
    return ['viral_threshold', 'payment_completed', 'error_occurred'].includes(eventType);
  }

  private getEmptyMetrics(timeframe: string): ProcessedMetrics {
    return {
      timeframe: timeframe as any,
      period: new Date().toISOString(),
      metrics: {
        page_views: 0,
        unique_visitors: 0,
        email_captures: 0,
        template_creations: 0,
        conversion_rate: 0,
        avg_session_duration: 0,
        bounce_rate: 0,
        viral_videos: 0,
        total_views: 0,
        revenue: 0
      },
      breakdown: {
        by_niche: {} as Record<Niche, number>,
        by_platform: {} as Record<Platform, number>,
        by_source: {},
        by_device: {}
      },
      trends: {
        growth_rate: 0,
        trending_templates: [],
        declining_templates: [],
        hot_niches: []
      }
    };
  }

  private getDefaultFunnel(): ConversionFunnel[] {
    return [
      {
        stage: 'Landing Page View',
        visitors: 0,
        conversions: 0,
        conversion_rate: 0,
        drop_off: 0,
        avg_time_spent: 0,
        top_exit_points: [],
        improvement_opportunities: []
      }
    ];
  }
}

// Export singleton instance
export const analyticsProcessor = AnalyticsProcessor.getInstance();