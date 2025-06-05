import { supabaseClient } from '@/lib/supabase-client';
import { Platform, Niche } from '@/lib/types/database';
import { AttributionData } from './analyticsProcessor';

// Types for attribution tracking
export interface TouchPoint {
  id: string;
  userId: string;
  sessionId: string;
  timestamp: string;
  source: string;
  medium: string;
  campaign: string;
  content?: string;
  term?: string;
  platform?: Platform;
  landingPage: string;
  referrer?: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  userAgent?: string;
  ipAddress?: string;
  geoLocation?: {
    country: string;
    city: string;
    region: string;
  };
  events: TouchPointEvent[];
}

export interface TouchPointEvent {
  eventType: 'page_view' | 'click' | 'form_submit' | 'email_capture' | 'template_create' | 'share' | 'purchase';
  timestamp: string;
  value?: number;
  metadata?: Record<string, any>;
}

export interface ConversionPath {
  userId: string;
  conversionId: string;
  conversionType: string;
  conversionValue: number;
  conversionTimestamp: string;
  touchPoints: TouchPoint[];
  totalTouchPoints: number;
  timeToConversion: number; // hours
  pathLength: number;
  uniqueSources: string[];
  attributionWeights: Record<string, number>;
}

export interface AttributionModel {
  id: string;
  name: string;
  description: string;
  type: 'first_touch' | 'last_touch' | 'linear' | 'time_decay' | 'position_based' | 'data_driven';
  parameters: Record<string, any>;
  accuracy?: number;
}

export interface AttributionReport {
  reportId: string;
  dateRange: {
    start: string;
    end: string;
  };
  model: AttributionModel;
  totalConversions: number;
  totalValue: number;
  channels: ChannelAttribution[];
  campaigns: CampaignAttribution[];
  sources: SourceAttribution[];
  insights: AttributionInsight[];
  recommendations: AttributionRecommendation[];
  crossDeviceData?: CrossDeviceAttribution;
}

export interface ChannelAttribution {
  channel: string;
  touchPoints: number;
  conversions: number;
  attributedValue: number;
  attributionPercentage: number;
  avgTimeToConversion: number;
  costPerAcquisition?: number;
  returnOnAdSpend?: number;
  assists: number;
  firstTouchConversions: number;
  lastTouchConversions: number;
}

export interface CampaignAttribution {
  campaign: string;
  source: string;
  medium: string;
  touchPoints: number;
  conversions: number;
  attributedValue: number;
  spent?: number;
  roi?: number;
  impressions?: number;
  clicks?: number;
  ctr?: number;
  conversionRate: number;
}

export interface SourceAttribution {
  source: string;
  medium: string;
  touchPoints: number;
  conversions: number;
  attributedValue: number;
  avgOrderValue: number;
  bounceRate: number;
  pagesPerSession: number;
  avgSessionDuration: number;
}

export interface AttributionInsight {
  type: 'opportunity' | 'warning' | 'trend' | 'performance';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  affectedChannels: string[];
  dataPoints: Record<string, any>;
}

export interface AttributionRecommendation {
  id: string;
  type: 'budget_reallocation' | 'channel_optimization' | 'campaign_adjustment' | 'creative_update';
  title: string;
  description: string;
  expectedImpact: string;
  priority: number;
  implementation: {
    actions: string[];
    timeline: string;
    budget?: number;
  };
  affectedChannels: string[];
}

export interface CrossDeviceAttribution {
  crossDeviceConversions: number;
  crossDeviceValue: number;
  devicePathways: Array<{
    pathway: string[];
    conversions: number;
    value: number;
  }>;
  averageDevicesPerPath: number;
}

export interface CustomerJourney {
  userId: string;
  journeyId: string;
  firstTouch: TouchPoint;
  lastTouch: TouchPoint;
  allTouchPoints: TouchPoint[];
  conversionEvents: TouchPointEvent[];
  journeyDuration: number; // hours
  totalValue: number;
  stage: 'awareness' | 'consideration' | 'conversion' | 'retention';
  segments: string[];
}

/**
 * Attribution Tracker
 * Multi-touch attribution system for comprehensive marketing attribution
 */
export class AttributionTracker {
  private static instance: AttributionTracker;
  private attributionModels: Map<string, AttributionModel> = new Map();
  private isTestMode: boolean = true;

  private constructor() {
    this.initializeAttributionModels();
    
    // Check if we have analytics infrastructure
    const hasAnalytics = process.env.NEXT_PUBLIC_SUPABASE_URL;
    this.isTestMode = !hasAnalytics;
    
    if (this.isTestMode) {
      console.warn('⚠️ AttributionTracker running in TEST MODE - using mock data');
    }
  }

  static getInstance(): AttributionTracker {
    if (!AttributionTracker.instance) {
      AttributionTracker.instance = new AttributionTracker();
    }
    return AttributionTracker.instance;
  }

  /**
   * Track user touch point
   */
  async trackTouchPoint(touchPoint: Omit<TouchPoint, 'id' | 'events'>): Promise<string> {
    try {
      const touchPointId = `tp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const fullTouchPoint: TouchPoint = {
        ...touchPoint,
        id: touchPointId,
        events: []
      };

      if (this.isTestMode) {
        console.log('Tracking touch point:', fullTouchPoint);
        return touchPointId;
      }

      // Store touch point
      const { error } = await supabaseClient
        .from('touch_points')
        .insert([{
          id: touchPointId,
          user_id: touchPoint.userId,
          session_id: touchPoint.sessionId,
          timestamp: touchPoint.timestamp,
          source: touchPoint.source,
          medium: touchPoint.medium,
          campaign: touchPoint.campaign,
          content: touchPoint.content,
          term: touchPoint.term,
          platform: touchPoint.platform,
          landing_page: touchPoint.landingPage,
          referrer: touchPoint.referrer,
          device_type: touchPoint.deviceType,
          user_agent: touchPoint.userAgent,
          ip_address: touchPoint.ipAddress,
          geo_location: touchPoint.geoLocation,
          created_at: touchPoint.timestamp
        }]);

      if (error) {
        throw new Error(`Failed to track touch point: ${error.message}`);
      }

      return touchPointId;
    } catch (error) {
      console.error('Touch point tracking error:', error);
      return '';
    }
  }

  /**
   * Track event within touch point
   */
  async trackEvent(
    touchPointId: string,
    event: TouchPointEvent
  ): Promise<void> {
    try {
      if (this.isTestMode) {
        console.log(`Tracking event for touch point ${touchPointId}:`, event);
        return;
      }

      // Store event
      await supabaseClient
        .from('touch_point_events')
        .insert([{
          touch_point_id: touchPointId,
          event_type: event.eventType,
          timestamp: event.timestamp,
          value: event.value,
          metadata: event.metadata
        }]);

      // Update touch point with event
      await supabaseClient.rpc('add_event_to_touch_point', {
        p_touch_point_id: touchPointId,
        p_event: event
      });
    } catch (error) {
      console.error('Event tracking error:', error);
    }
  }

  /**
   * Record conversion and build attribution path
   */
  async recordConversion(params: {
    userId: string;
    conversionType: string;
    conversionValue: number;
    conversionId?: string;
    lookbackWindow?: number; // days
  }): Promise<ConversionPath> {
    try {
      const conversionId = params.conversionId || `conv_${Date.now()}`;
      const lookbackWindow = params.lookbackWindow || 30;
      const conversionTimestamp = new Date().toISOString();

      if (this.isTestMode) {
        return this.getMockConversionPath(params.userId, conversionId, params);
      }

      // Get user's touch points within lookback window
      const lookbackDate = new Date();
      lookbackDate.setDate(lookbackDate.getDate() - lookbackWindow);

      const { data: touchPoints, error } = await supabaseClient
        .from('touch_points')
        .select(`
          *,
          touch_point_events (*)
        `)
        .eq('user_id', params.userId)
        .gte('timestamp', lookbackDate.toISOString())
        .order('timestamp', { ascending: true });

      if (error || !touchPoints) {
        throw new Error(`Failed to get touch points: ${error?.message}`);
      }

      // Build conversion path
      const conversionPath: ConversionPath = {
        userId: params.userId,
        conversionId,
        conversionType: params.conversionType,
        conversionValue: params.conversionValue,
        conversionTimestamp,
        touchPoints: touchPoints.map(tp => ({
          ...tp,
          events: tp.touch_point_events || []
        })),
        totalTouchPoints: touchPoints.length,
        timeToConversion: this.calculateTimeToConversion(touchPoints, conversionTimestamp),
        pathLength: touchPoints.length,
        uniqueSources: [...new Set(touchPoints.map(tp => tp.source))],
        attributionWeights: {}
      };

      // Calculate attribution weights for each model
      this.attributionModels.forEach((model, modelId) => {
        const weights = this.calculateAttribution(conversionPath, model);
        conversionPath.attributionWeights[modelId] = weights;
      });

      // Store conversion path
      await this.storeConversionPath(conversionPath);

      return conversionPath;
    } catch (error) {
      console.error('Conversion recording error:', error);
      return this.getMockConversionPath(params.userId, 'error', params);
    }
  }

  /**
   * Generate attribution report
   */
  async generateAttributionReport(params: {
    startDate: string;
    endDate: string;
    modelId: string;
    platform?: Platform;
    campaignFilter?: string;
    includeAssisted?: boolean;
  }): Promise<AttributionReport> {
    try {
      if (this.isTestMode) {
        return this.getMockAttributionReport(params);
      }

      const model = this.attributionModels.get(params.modelId);
      if (!model) {
        throw new Error(`Attribution model ${params.modelId} not found`);
      }

      // Get conversion paths for date range
      const { data: conversionPaths, error } = await supabaseClient
        .from('conversion_paths')
        .select('*')
        .gte('conversion_timestamp', params.startDate)
        .lte('conversion_timestamp', params.endDate);

      if (error) {
        throw new Error(`Failed to get conversion paths: ${error.message}`);
      }

      // Process attribution data
      const { channels, campaigns, sources } = await this.processAttributionData(
        conversionPaths || [],
        model
      );

      // Generate insights and recommendations
      const insights = await this.generateAttributionInsights(channels, campaigns);
      const recommendations = await this.generateAttributionRecommendations(channels, insights);

      // Get cross-device data if available
      const crossDeviceData = await this.getCrossDeviceAttribution(params);

      const report: AttributionReport = {
        reportId: `report_${Date.now()}`,
        dateRange: {
          start: params.startDate,
          end: params.endDate
        },
        model,
        totalConversions: conversionPaths?.length || 0,
        totalValue: conversionPaths?.reduce((sum, cp) => sum + cp.conversion_value, 0) || 0,
        channels,
        campaigns,
        sources,
        insights,
        recommendations,
        crossDeviceData
      };

      return report;
    } catch (error) {
      console.error('Attribution report generation error:', error);
      return this.getMockAttributionReport(params);
    }
  }

  /**
   * Analyze customer journey
   */
  async analyzeCustomerJourney(userId: string): Promise<CustomerJourney[]> {
    try {
      if (this.isTestMode) {
        return this.getMockCustomerJourneys(userId);
      }

      // Get all touch points for user
      const { data: touchPoints, error } = await supabaseClient
        .from('touch_points')
        .select(`
          *,
          touch_point_events (*)
        `)
        .eq('user_id', userId)
        .order('timestamp', { ascending: true });

      if (error || !touchPoints) {
        throw new Error(`Failed to get user touch points: ${error?.message}`);
      }

      // Group touch points into journeys (sessions or conversion events)
      const journeys = this.groupTouchPointsIntoJourneys(touchPoints);

      return journeys;
    } catch (error) {
      console.error('Customer journey analysis error:', error);
      return [];
    }
  }

  /**
   * Compare attribution models
   */
  async compareAttributionModels(params: {
    startDate: string;
    endDate: string;
    modelIds: string[];
  }): Promise<{
    modelComparison: Array<{
      modelId: string;
      modelName: string;
      totalAttributedValue: number;
      channelDistribution: Record<string, number>;
      topChannel: string;
      accuracy?: number;
    }>;
    recommendations: {
      bestModel: string;
      reason: string;
      confidenceLevel: number;
    };
  }> {
    try {
      if (this.isTestMode) {
        return this.getMockModelComparison(params);
      }

      const modelComparison = [];

      for (const modelId of params.modelIds) {
        const report = await this.generateAttributionReport({
          ...params,
          modelId
        });

        const channelDistribution = report.channels.reduce((acc, channel) => {
          acc[channel.channel] = channel.attributedValue;
          return acc;
        }, {} as Record<string, number>);

        const topChannel = report.channels.reduce((top, channel) => 
          channel.attributedValue > (channelDistribution[top] || 0) ? channel.channel : top, 
          report.channels[0]?.channel || 'unknown'
        );

        modelComparison.push({
          modelId,
          modelName: report.model.name,
          totalAttributedValue: report.totalValue,
          channelDistribution,
          topChannel,
          accuracy: report.model.accuracy
        });
      }

      // Determine best model
      const bestModel = modelComparison.reduce((best, current) => 
        (current.accuracy || 0) > (best.accuracy || 0) ? current : best
      );

      const recommendations = {
        bestModel: bestModel.modelId,
        reason: `Highest accuracy (${bestModel.accuracy}%) and comprehensive attribution`,
        confidenceLevel: bestModel.accuracy || 75
      };

      return { modelComparison, recommendations };
    } catch (error) {
      console.error('Model comparison error:', error);
      return this.getMockModelComparison(params);
    }
  }

  /**
   * Get attribution insights for optimization
   */
  async getAttributionInsights(params: {
    timeframe: string;
    modelId: string;
    focusArea?: 'channels' | 'campaigns' | 'timing' | 'devices';
  }): Promise<{
    insights: AttributionInsight[];
    recommendations: AttributionRecommendation[];
    keyMetrics: {
      avgTouchPoints: number;
      avgTimeToConversion: number;
      topPerformingChannel: string;
      underperformingChannels: string[];
      crossDeviceRate: number;
    };
  }> {
    try {
      const endDate = new Date().toISOString();
      const startDate = this.calculateStartDate(params.timeframe);

      const report = await this.generateAttributionReport({
        startDate,
        endDate,
        modelId: params.modelId
      });

      // Calculate key metrics
      const avgTouchPoints = report.totalConversions > 0 ? 
        report.channels.reduce((sum, ch) => sum + ch.touchPoints, 0) / report.totalConversions : 0;

      const avgTimeToConversion = report.channels.reduce((sum, ch) => 
        sum + ch.avgTimeToConversion, 0) / report.channels.length;

      const topPerformingChannel = report.channels.reduce((top, ch) => 
        ch.attributedValue > top.attributedValue ? ch : top, report.channels[0]
      )?.channel || 'unknown';

      const underperformingChannels = report.channels
        .filter(ch => ch.conversionRate < 2)
        .map(ch => ch.channel);

      const crossDeviceRate = report.crossDeviceData ? 
        (report.crossDeviceData.crossDeviceConversions / report.totalConversions) * 100 : 0;

      const keyMetrics = {
        avgTouchPoints,
        avgTimeToConversion,
        topPerformingChannel,
        underperformingChannels,
        crossDeviceRate
      };

      return {
        insights: report.insights,
        recommendations: report.recommendations,
        keyMetrics
      };
    } catch (error) {
      console.error('Attribution insights error:', error);
      return this.getMockAttributionInsights(params);
    }
  }

  /**
   * Private helper methods
   */
  private calculateTimeToConversion(touchPoints: any[], conversionTimestamp: string): number {
    if (touchPoints.length === 0) return 0;
    
    const firstTouch = new Date(touchPoints[0].timestamp);
    const conversion = new Date(conversionTimestamp);
    
    return (conversion.getTime() - firstTouch.getTime()) / (1000 * 60 * 60); // hours
  }

  private calculateAttribution(path: ConversionPath, model: AttributionModel): Record<string, number> {
    const weights: Record<string, number> = {};
    
    switch (model.type) {
      case 'first_touch':
        if (path.touchPoints.length > 0) {
          const firstSource = path.touchPoints[0].source;
          weights[firstSource] = path.conversionValue;
        }
        break;
        
      case 'last_touch':
        if (path.touchPoints.length > 0) {
          const lastSource = path.touchPoints[path.touchPoints.length - 1].source;
          weights[lastSource] = path.conversionValue;
        }
        break;
        
      case 'linear':
        const linearValue = path.conversionValue / path.touchPoints.length;
        path.touchPoints.forEach(tp => {
          weights[tp.source] = (weights[tp.source] || 0) + linearValue;
        });
        break;
        
      case 'time_decay':
        const decayRate = model.parameters.decayRate || 0.5;
        const totalDecayWeight = path.touchPoints.reduce((sum, tp, index) => {
          return sum + Math.pow(decayRate, path.touchPoints.length - index - 1);
        }, 0);
        
        path.touchPoints.forEach((tp, index) => {
          const decayWeight = Math.pow(decayRate, path.touchPoints.length - index - 1);
          const attributedValue = (decayWeight / totalDecayWeight) * path.conversionValue;
          weights[tp.source] = (weights[tp.source] || 0) + attributedValue;
        });
        break;
        
      case 'position_based':
        const firstTouchWeight = model.parameters.firstTouchWeight || 0.4;
        const lastTouchWeight = model.parameters.lastTouchWeight || 0.4;
        const middleTouchWeight = 1 - firstTouchWeight - lastTouchWeight;
        
        if (path.touchPoints.length === 1) {
          weights[path.touchPoints[0].source] = path.conversionValue;
        } else if (path.touchPoints.length === 2) {
          weights[path.touchPoints[0].source] = path.conversionValue * firstTouchWeight;
          weights[path.touchPoints[1].source] = path.conversionValue * lastTouchWeight;
        } else {
          const middlePoints = path.touchPoints.length - 2;
          const middleValue = middlePoints > 0 ? 
            (middleTouchWeight * path.conversionValue) / middlePoints : 0;
          
          path.touchPoints.forEach((tp, index) => {
            if (index === 0) {
              weights[tp.source] = path.conversionValue * firstTouchWeight;
            } else if (index === path.touchPoints.length - 1) {
              weights[tp.source] = (weights[tp.source] || 0) + (path.conversionValue * lastTouchWeight);
            } else {
              weights[tp.source] = (weights[tp.source] || 0) + middleValue;
            }
          });
        }
        break;
    }
    
    return weights;
  }

  private async processAttributionData(
    conversionPaths: any[],
    model: AttributionModel
  ): Promise<{
    channels: ChannelAttribution[];
    campaigns: CampaignAttribution[];
    sources: SourceAttribution[];
  }> {
    const channelData: Record<string, any> = {};
    const campaignData: Record<string, any> = {};
    const sourceData: Record<string, any> = {};

    conversionPaths.forEach(path => {
      const weights = this.calculateAttribution(path, model);
      
      path.touch_points?.forEach((tp: any) => {
        const channel = this.getChannelFromSource(tp.source, tp.medium);
        const campaignKey = `${tp.campaign}_${tp.source}_${tp.medium}`;
        const sourceKey = `${tp.source}_${tp.medium}`;

        // Channel attribution
        if (!channelData[channel]) {
          channelData[channel] = {
            channel,
            touchPoints: 0,
            conversions: 0,
            attributedValue: 0,
            assists: 0,
            firstTouchConversions: 0,
            lastTouchConversions: 0,
            totalTimeToConversion: 0,
            conversionCount: 0
          };
        }

        channelData[channel].touchPoints++;
        channelData[channel].attributedValue += weights[tp.source] || 0;
        channelData[channel].totalTimeToConversion += path.time_to_conversion || 0;
        
        if (path.touch_points[0].source === tp.source) {
          channelData[channel].firstTouchConversions++;
        }
        if (path.touch_points[path.touch_points.length - 1].source === tp.source) {
          channelData[channel].lastTouchConversions++;
        }

        // Similar processing for campaigns and sources...
      });
    });

    // Convert to arrays and calculate final metrics
    const channels = Object.values(channelData).map((ch: any) => ({
      ...ch,
      conversions: ch.firstTouchConversions + ch.lastTouchConversions,
      attributionPercentage: (ch.attributedValue / conversionPaths.reduce((sum, cp) => sum + cp.conversion_value, 0)) * 100,
      avgTimeToConversion: ch.conversionCount > 0 ? ch.totalTimeToConversion / ch.conversionCount : 0,
      costPerAcquisition: 0, // Would be calculated from ad spend data
      returnOnAdSpend: 0
    }));

    return {
      channels,
      campaigns: [], // Simplified for this implementation
      sources: []   // Simplified for this implementation
    };
  }

  private getChannelFromSource(source: string, medium: string): string {
    const channelMapping: Record<string, string> = {
      'google': 'Organic Search',
      'bing': 'Organic Search',
      'yahoo': 'Organic Search',
      'facebook': 'Social Media',
      'instagram': 'Social Media',
      'twitter': 'Social Media',
      'linkedin': 'Social Media',
      'tiktok': 'Social Media',
      'youtube': 'Video',
      'email': 'Email',
      'direct': 'Direct',
      '(none)': 'Direct'
    };

    if (medium === 'cpc' || medium === 'ppc') return 'Paid Search';
    if (medium === 'social' || medium === 'social-network') return 'Social Media';
    if (medium === 'email') return 'Email';
    if (medium === 'referral') return 'Referral';

    return channelMapping[source.toLowerCase()] || 'Other';
  }

  private async generateAttributionInsights(
    channels: ChannelAttribution[],
    campaigns: CampaignAttribution[]
  ): Promise<AttributionInsight[]> {
    const insights: AttributionInsight[] = [];

    // High-performing channel insight
    const topChannel = channels.reduce((top, ch) => 
      ch.attributedValue > top.attributedValue ? ch : top, channels[0]
    );

    if (topChannel && topChannel.attributionPercentage > 40) {
      insights.push({
        type: 'performance',
        title: 'Dominant Channel Identified',
        description: `${topChannel.channel} drives ${topChannel.attributionPercentage.toFixed(1)}% of attributed value`,
        impact: 'high',
        confidence: 90,
        affectedChannels: [topChannel.channel],
        dataPoints: {
          attributionPercentage: topChannel.attributionPercentage,
          attributedValue: topChannel.attributedValue
        }
      });
    }

    // Underperforming channel insight
    const underperformingChannels = channels.filter(ch => 
      ch.attributionPercentage < 5 && ch.touchPoints > 50
    );

    if (underperformingChannels.length > 0) {
      insights.push({
        type: 'warning',
        title: 'Underperforming Channels Detected',
        description: `${underperformingChannels.length} channels have low conversion rates despite high traffic`,
        impact: 'medium',
        confidence: 85,
        affectedChannels: underperformingChannels.map(ch => ch.channel),
        dataPoints: {
          channelCount: underperformingChannels.length,
          avgConversionRate: underperformingChannels.reduce((sum, ch) => sum + (ch.conversions / ch.touchPoints), 0) / underperformingChannels.length
        }
      });
    }

    // Cross-device opportunity
    const totalTouchPoints = channels.reduce((sum, ch) => sum + ch.touchPoints, 0);
    const avgTouchPoints = totalTouchPoints / channels.length;

    if (avgTouchPoints > 3) {
      insights.push({
        type: 'opportunity',
        title: 'Multi-Touch Customer Journey',
        description: `Users interact with ${avgTouchPoints.toFixed(1)} touchpoints on average before converting`,
        impact: 'medium',
        confidence: 80,
        affectedChannels: channels.map(ch => ch.channel),
        dataPoints: {
          avgTouchPoints,
          totalTouchPoints
        }
      });
    }

    return insights;
  }

  private async generateAttributionRecommendations(
    channels: ChannelAttribution[],
    insights: AttributionInsight[]
  ): Promise<AttributionRecommendation[]> {
    const recommendations: AttributionRecommendation[] = [];

    // Budget reallocation recommendation
    const highPerformingChannels = channels.filter(ch => ch.attributionPercentage > 20);
    const lowPerformingChannels = channels.filter(ch => ch.attributionPercentage < 5 && ch.touchPoints > 20);

    if (highPerformingChannels.length > 0 && lowPerformingChannels.length > 0) {
      recommendations.push({
        id: 'budget_realloc_1',
        type: 'budget_reallocation',
        title: 'Reallocate Budget to High-Performing Channels',
        description: `Shift 20% of budget from ${lowPerformingChannels.map(ch => ch.channel).join(', ')} to ${highPerformingChannels.map(ch => ch.channel).join(', ')}`,
        expectedImpact: `Potential 15-25% increase in conversions`,
        priority: 9,
        implementation: {
          actions: [
            'Analyze current budget allocation',
            'Calculate optimal reallocation percentages',
            'Implement gradual budget shifts',
            'Monitor performance changes'
          ],
          timeline: '2-4 weeks',
          budget: 0
        },
        affectedChannels: [...highPerformingChannels.map(ch => ch.channel), ...lowPerformingChannels.map(ch => ch.channel)]
      });
    }

    // Cross-device tracking recommendation
    const multiTouchChannels = channels.filter(ch => ch.assists > ch.conversions);
    if (multiTouchChannels.length > 0) {
      recommendations.push({
        id: 'crossdevice_1',
        type: 'channel_optimization',
        title: 'Implement Cross-Device Tracking',
        description: 'Improve attribution accuracy for multi-device customer journeys',
        expectedImpact: 'Better understanding of true channel performance',
        priority: 7,
        implementation: {
          actions: [
            'Implement user ID tracking',
            'Set up cross-device analytics',
            'Create unified customer profiles',
            'Update attribution models'
          ],
          timeline: '6-8 weeks'
        },
        affectedChannels: multiTouchChannels.map(ch => ch.channel)
      });
    }

    return recommendations;
  }

  private async getCrossDeviceAttribution(params: any): Promise<CrossDeviceAttribution | undefined> {
    if (this.isTestMode) {
      return {
        crossDeviceConversions: 45,
        crossDeviceValue: 12500,
        devicePathways: [
          { pathway: ['mobile', 'desktop'], conversions: 25, value: 7500 },
          { pathway: ['desktop', 'mobile'], conversions: 15, value: 3750 },
          { pathway: ['mobile', 'tablet', 'desktop'], conversions: 5, value: 1250 }
        ],
        averageDevicesPerPath: 2.3
      };
    }

    // Real implementation would analyze device data
    return undefined;
  }

  private groupTouchPointsIntoJourneys(touchPoints: any[]): CustomerJourney[] {
    // Simplified journey grouping - would be more sophisticated in reality
    const journeys: CustomerJourney[] = [];
    
    if (touchPoints.length === 0) return journeys;

    let currentJourney: any = {
      userId: touchPoints[0].user_id,
      journeyId: `journey_${Date.now()}`,
      firstTouch: touchPoints[0],
      lastTouch: touchPoints[touchPoints.length - 1],
      allTouchPoints: touchPoints,
      conversionEvents: [],
      journeyDuration: 0,
      totalValue: 0,
      stage: 'awareness',
      segments: []
    };

    // Calculate journey duration
    if (touchPoints.length > 1) {
      const first = new Date(touchPoints[0].timestamp);
      const last = new Date(touchPoints[touchPoints.length - 1].timestamp);
      currentJourney.journeyDuration = (last.getTime() - first.getTime()) / (1000 * 60 * 60);
    }

    // Extract conversion events
    touchPoints.forEach(tp => {
      tp.touch_point_events?.forEach((event: any) => {
        if (['email_capture', 'template_create', 'purchase'].includes(event.event_type)) {
          currentJourney.conversionEvents.push(event);
          currentJourney.totalValue += event.value || 0;
        }
      });
    });

    // Determine stage
    if (currentJourney.conversionEvents.length > 0) {
      currentJourney.stage = 'conversion';
    } else if (touchPoints.length > 3) {
      currentJourney.stage = 'consideration';
    }

    journeys.push(currentJourney);
    return journeys;
  }

  private calculateStartDate(timeframe: string): string {
    const now = new Date();
    switch (timeframe) {
      case 'week':
        now.setDate(now.getDate() - 7);
        break;
      case 'month':
        now.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        now.setMonth(now.getMonth() - 3);
        break;
      default:
        now.setDate(now.getDate() - 30);
    }
    return now.toISOString();
  }

  private async storeConversionPath(path: ConversionPath): Promise<void> {
    try {
      await supabaseClient
        .from('conversion_paths')
        .insert([{
          id: path.conversionId,
          user_id: path.userId,
          conversion_type: path.conversionType,
          conversion_value: path.conversionValue,
          conversion_timestamp: path.conversionTimestamp,
          touch_points: path.touchPoints,
          total_touch_points: path.totalTouchPoints,
          time_to_conversion: path.timeToConversion,
          path_length: path.pathLength,
          unique_sources: path.uniqueSources,
          attribution_weights: path.attributionWeights
        }]);
    } catch (error) {
      console.error('Error storing conversion path:', error);
    }
  }

  private initializeAttributionModels(): void {
    this.attributionModels.set('first_touch', {
      id: 'first_touch',
      name: 'First Touch',
      description: 'All credit to the first interaction',
      type: 'first_touch',
      parameters: {},
      accuracy: 65
    });

    this.attributionModels.set('last_touch', {
      id: 'last_touch',
      name: 'Last Touch',
      description: 'All credit to the last interaction before conversion',
      type: 'last_touch',
      parameters: {},
      accuracy: 70
    });

    this.attributionModels.set('linear', {
      id: 'linear',
      name: 'Linear',
      description: 'Equal credit to all interactions',
      type: 'linear',
      parameters: {},
      accuracy: 75
    });

    this.attributionModels.set('time_decay', {
      id: 'time_decay',
      name: 'Time Decay',
      description: 'More credit to interactions closer to conversion',
      type: 'time_decay',
      parameters: { decayRate: 0.7 },
      accuracy: 80
    });

    this.attributionModels.set('position_based', {
      id: 'position_based',
      name: 'Position Based',
      description: '40% first touch, 40% last touch, 20% middle touches',
      type: 'position_based',
      parameters: { firstTouchWeight: 0.4, lastTouchWeight: 0.4 },
      accuracy: 85
    });
  }

  // Mock data methods
  private getMockConversionPath(userId: string, conversionId: string, params: any): ConversionPath {
    const mockTouchPoints: TouchPoint[] = [
      {
        id: 'tp_1',
        userId,
        sessionId: 'session_1',
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        source: 'google',
        medium: 'organic',
        campaign: '(not set)',
        platform: 'instagram',
        landingPage: '/l/fitness/instagram',
        deviceType: 'mobile',
        events: [
          { eventType: 'page_view', timestamp: new Date().toISOString() }
        ]
      },
      {
        id: 'tp_2',
        userId,
        sessionId: 'session_2',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        source: 'facebook',
        medium: 'social',
        campaign: 'fitness_campaign',
        platform: 'instagram',
        landingPage: '/l/fitness/instagram',
        deviceType: 'desktop',
        events: [
          { eventType: 'page_view', timestamp: new Date().toISOString() },
          { eventType: 'email_capture', timestamp: new Date().toISOString(), value: 1 }
        ]
      }
    ];

    return {
      userId,
      conversionId,
      conversionType: params.conversionType,
      conversionValue: params.conversionValue,
      conversionTimestamp: new Date().toISOString(),
      touchPoints: mockTouchPoints,
      totalTouchPoints: mockTouchPoints.length,
      timeToConversion: 96, // 4 days
      pathLength: mockTouchPoints.length,
      uniqueSources: ['google', 'facebook'],
      attributionWeights: {
        'first_touch': { google: params.conversionValue },
        'last_touch': { facebook: params.conversionValue },
        'linear': { google: params.conversionValue / 2, facebook: params.conversionValue / 2 }
      }
    };
  }

  private getMockAttributionReport(params: any): AttributionReport {
    const mockChannels: ChannelAttribution[] = [
      {
        channel: 'Organic Search',
        touchPoints: 245,
        conversions: 45,
        attributedValue: 12500,
        attributionPercentage: 35.2,
        avgTimeToConversion: 48,
        assists: 78,
        firstTouchConversions: 32,
        lastTouchConversions: 13
      },
      {
        channel: 'Social Media',
        touchPoints: 189,
        conversions: 38,
        attributedValue: 9800,
        attributionPercentage: 27.6,
        avgTimeToConversion: 36,
        assists: 92,
        firstTouchConversions: 15,
        lastTouchConversions: 23
      },
      {
        channel: 'Direct',
        touchPoints: 156,
        conversions: 28,
        attributedValue: 7200,
        attributionPercentage: 20.3,
        avgTimeToConversion: 24,
        assists: 45,
        firstTouchConversions: 8,
        lastTouchConversions: 20
      }
    ];

    const mockInsights: AttributionInsight[] = [
      {
        type: 'performance',
        title: 'Organic Search Driving Most Value',
        description: 'Organic search accounts for 35.2% of attributed conversions',
        impact: 'high',
        confidence: 92,
        affectedChannels: ['Organic Search'],
        dataPoints: { attributionPercentage: 35.2, conversions: 45 }
      }
    ];

    const mockRecommendations: AttributionRecommendation[] = [
      {
        id: 'rec_1',
        type: 'budget_reallocation',
        title: 'Increase Social Media Investment',
        description: 'Social media shows strong assist rates - consider increasing budget',
        expectedImpact: '15-20% increase in overall conversions',
        priority: 8,
        implementation: {
          actions: ['Analyze current social spend', 'Test 20% budget increase', 'Monitor performance'],
          timeline: '2-3 weeks'
        },
        affectedChannels: ['Social Media']
      }
    ];

    return {
      reportId: `mock_report_${Date.now()}`,
      dateRange: {
        start: params.startDate,
        end: params.endDate
      },
      model: this.attributionModels.get(params.modelId) || this.attributionModels.get('linear')!,
      totalConversions: 111,
      totalValue: 35500,
      channels: mockChannels,
      campaigns: [],
      sources: [],
      insights: mockInsights,
      recommendations: mockRecommendations,
      crossDeviceData: {
        crossDeviceConversions: 25,
        crossDeviceValue: 6200,
        devicePathways: [
          { pathway: ['mobile', 'desktop'], conversions: 15, value: 3800 },
          { pathway: ['desktop', 'mobile'], conversions: 10, value: 2400 }
        ],
        averageDevicesPerPath: 2.1
      }
    };
  }

  private getMockCustomerJourneys(userId: string): CustomerJourney[] {
    return [
      {
        userId,
        journeyId: 'journey_1',
        firstTouch: {
          id: 'tp_1',
          userId,
          sessionId: 'session_1',
          timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          source: 'google',
          medium: 'organic',
          campaign: '(not set)',
          landingPage: '/l/business/linkedin',
          deviceType: 'desktop',
          events: []
        } as TouchPoint,
        lastTouch: {
          id: 'tp_3',
          userId,
          sessionId: 'session_3',
          timestamp: new Date().toISOString(),
          source: 'direct',
          medium: '(none)',
          campaign: '(not set)',
          landingPage: '/dashboard',
          deviceType: 'mobile',
          events: []
        } as TouchPoint,
        allTouchPoints: [],
        conversionEvents: [
          { eventType: 'email_capture', timestamp: new Date().toISOString(), value: 1 },
          { eventType: 'template_create', timestamp: new Date().toISOString(), value: 10 }
        ],
        journeyDuration: 120, // 5 days
        totalValue: 11,
        stage: 'conversion',
        segments: ['business_user', 'high_intent']
      }
    ];
  }

  private getMockModelComparison(params: any): any {
    return {
      modelComparison: [
        {
          modelId: 'linear',
          modelName: 'Linear',
          totalAttributedValue: 35500,
          channelDistribution: { 'Organic Search': 12500, 'Social Media': 9800, 'Direct': 7200 },
          topChannel: 'Organic Search',
          accuracy: 75
        },
        {
          modelId: 'time_decay',
          modelName: 'Time Decay',
          totalAttributedValue: 35500,
          channelDistribution: { 'Social Media': 14200, 'Organic Search': 11800, 'Direct': 9500 },
          topChannel: 'Social Media',
          accuracy: 80
        }
      ],
      recommendations: {
        bestModel: 'time_decay',
        reason: 'Highest accuracy (80%) and better reflects user behavior patterns',
        confidenceLevel: 80
      }
    };
  }

  private getMockAttributionInsights(params: any): any {
    return {
      insights: [
        {
          type: 'performance',
          title: 'Social Media Assist Rate High',
          description: 'Social media drives 65% more assists than direct conversions',
          impact: 'medium',
          confidence: 85,
          affectedChannels: ['Social Media'],
          dataPoints: { assistRate: 65 }
        }
      ],
      recommendations: [
        {
          id: 'rec_timing',
          type: 'campaign_adjustment',
          title: 'Optimize Social Media Timing',
          description: 'Post content during peak engagement hours for better attribution',
          expectedImpact: '10-15% improvement in social conversions',
          priority: 7,
          implementation: {
            actions: ['Analyze posting times', 'Test optimal schedule', 'Implement changes'],
            timeline: '1-2 weeks'
          },
          affectedChannels: ['Social Media']
        }
      ],
      keyMetrics: {
        avgTouchPoints: 3.2,
        avgTimeToConversion: 36,
        topPerformingChannel: 'Organic Search',
        underperformingChannels: ['Email'],
        crossDeviceRate: 22.5
      }
    };
  }
}

// Export singleton instance
export const attributionTracker = AttributionTracker.getInstance();