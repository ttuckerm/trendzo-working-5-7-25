import { supabaseClient } from '@/lib/supabase-client';
import { analyticsProcessor, ConversionFunnel } from './analyticsProcessor';
import { Platform, Niche } from '@/lib/types/database';

// Types for funnel analysis
export interface FunnelStage {
  id: string;
  name: string;
  description: string;
  events: string[];
  requiredData: string[];
  order: number;
}

export interface FunnelMetrics {
  stage: string;
  visitors: number;
  conversions: number;
  conversionRate: number;
  dropOffRate: number;
  avgTimeSpent: number;
  topExitPoints: string[];
  improvementOpportunities: string[];
  segmentBreakdown: {
    platform: Record<Platform, number>;
    niche: Record<Niche, number>;
    device: Record<string, number>;
    source: Record<string, number>;
  };
}

export interface FunnelAnalysis {
  id: string;
  name: string;
  timeframe: string;
  totalVisitors: number;
  totalConversions: number;
  overallConversionRate: number;
  stages: FunnelMetrics[];
  insights: FunnelInsight[];
  recommendations: FunnelRecommendation[];
  generatedAt: string;
}

export interface FunnelInsight {
  type: 'critical' | 'warning' | 'opportunity' | 'success';
  stage: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  dataPoints: Record<string, any>;
}

export interface FunnelRecommendation {
  id: string;
  stage: string;
  type: 'optimization' | 'content' | 'design' | 'targeting';
  title: string;
  description: string;
  expectedImpact: string;
  difficulty: 'easy' | 'medium' | 'hard';
  priority: number;
  implementation: {
    steps: string[];
    estimatedTime: string;
    resources: string[];
  };
}

export interface CohortAnalysis {
  cohortId: string;
  period: string;
  size: number;
  retentionRates: number[];
  conversionTimeline: Array<{
    timeRange: string;
    conversions: number;
    cumulativeRate: number;
  }>;
}

/**
 * Conversion Funnel Analyzer
 * Advanced funnel analysis with insights and optimization recommendations
 */
export class ConversionFunnelAnalyzer {
  private static instance: ConversionFunnelAnalyzer;
  private defaultStages: FunnelStage[];
  private isTestMode: boolean = true;

  private constructor() {
    this.defaultStages = this.initializeDefaultStages();
    
    // Check if we have analytics data
    const hasAnalytics = process.env.NEXT_PUBLIC_SUPABASE_URL;
    this.isTestMode = !hasAnalytics;
    
    if (this.isTestMode) {
      console.warn('⚠️ ConversionFunnelAnalyzer running in TEST MODE - using mock data');
    }
  }

  static getInstance(): ConversionFunnelAnalyzer {
    if (!ConversionFunnelAnalyzer.instance) {
      ConversionFunnelAnalyzer.instance = new ConversionFunnelAnalyzer();
    }
    return ConversionFunnelAnalyzer.instance;
  }

  /**
   * Analyze conversion funnel for given parameters
   */
  async analyzeFunnel(params: {
    timeframe: string;
    niche?: Niche;
    platform?: Platform;
    customStages?: FunnelStage[];
    includeSegments?: boolean;
    cohortAnalysis?: boolean;
  }): Promise<FunnelAnalysis> {
    try {
      if (this.isTestMode) {
        return this.getMockFunnelAnalysis(params);
      }

      const stages = params.customStages || this.defaultStages;
      const analysisId = `funnel_${Date.now()}`;

      // Get basic funnel data
      const funnelData = await analyticsProcessor.getConversionFunnel({
        timeframe: params.timeframe,
        niche: params.niche,
        platform: params.platform
      });

      // Enhance with detailed metrics
      const enhancedStages = await this.enhanceStageMetrics(
        funnelData,
        stages,
        params
      );

      // Generate insights
      const insights = await this.generateFunnelInsights(enhancedStages);

      // Generate recommendations
      const recommendations = await this.generateRecommendations(enhancedStages, insights);

      // Calculate overall metrics
      const totalVisitors = enhancedStages[0]?.visitors || 0;
      const totalConversions = enhancedStages[enhancedStages.length - 1]?.conversions || 0;
      const overallConversionRate = totalVisitors > 0 ? (totalConversions / totalVisitors) * 100 : 0;

      return {
        id: analysisId,
        name: `Conversion Funnel Analysis - ${params.timeframe}`,
        timeframe: params.timeframe,
        totalVisitors,
        totalConversions,
        overallConversionRate,
        stages: enhancedStages,
        insights,
        recommendations,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Funnel analysis failed:', error);
      return this.getMockFunnelAnalysis(params);
    }
  }

  /**
   * Get real-time funnel metrics
   */
  async getRealtimeFunnelMetrics(): Promise<{
    currentHourVisitors: number;
    currentHourConversions: number;
    conversionRate: number;
    topDropOffStage: string;
    improvementOpportunity: string;
  }> {
    try {
      if (this.isTestMode) {
        return {
          currentHourVisitors: 234,
          currentHourConversions: 18,
          conversionRate: 7.69,
          topDropOffStage: 'Template Creation',
          improvementOpportunity: 'Simplify template selection process'
        };
      }

      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

      // Get visitors and conversions in last hour
      const [visitors, conversions] = await Promise.all([
        supabaseClient
          .from('campaign_analytics')
          .select('visitor_id')
          .eq('event_type', 'page_view')
          .gte('created_at', oneHourAgo)
          .then(({ data }) => new Set(data?.map(d => d.visitor_id) || []).size),

        supabaseClient
          .from('campaign_analytics')
          .select('*')
          .eq('event_type', 'email_capture')
          .gte('created_at', oneHourAgo)
          .then(({ data }) => data?.length || 0)
      ]);

      const conversionRate = visitors > 0 ? (conversions / visitors) * 100 : 0;

      // Analyze drop-off patterns
      const funnelData = await analyticsProcessor.getConversionFunnel({
        timeframe: 'hour'
      });

      let topDropOffStage = 'Landing Page';
      let maxDropOff = 0;

      funnelData.forEach(stage => {
        if (stage.drop_off > maxDropOff) {
          maxDropOff = stage.drop_off;
          topDropOffStage = stage.stage;
        }
      });

      const improvementOpportunity = this.getImprovementOpportunity(topDropOffStage, maxDropOff);

      return {
        currentHourVisitors: visitors,
        currentHourConversions: conversions,
        conversionRate,
        topDropOffStage,
        improvementOpportunity
      };
    } catch (error) {
      console.error('Error getting realtime funnel metrics:', error);
      return {
        currentHourVisitors: 0,
        currentHourConversions: 0,
        conversionRate: 0,
        topDropOffStage: 'Unknown',
        improvementOpportunity: 'Insufficient data'
      };
    }
  }

  /**
   * Compare funnel performance across time periods
   */
  async compareFunnelPerformance(params: {
    currentPeriod: string;
    comparisonPeriod: string;
    niche?: Niche;
    platform?: Platform;
  }): Promise<{
    current: FunnelAnalysis;
    comparison: FunnelAnalysis;
    changes: Array<{
      stage: string;
      metric: string;
      change: number;
      changePercent: number;
      significance: 'positive' | 'negative' | 'neutral';
    }>;
  }> {
    const [current, comparison] = await Promise.all([
      this.analyzeFunnel({ 
        timeframe: params.currentPeriod,
        niche: params.niche,
        platform: params.platform
      }),
      this.analyzeFunnel({ 
        timeframe: params.comparisonPeriod,
        niche: params.niche,
        platform: params.platform
      })
    ]);

    const changes = this.calculateChanges(current.stages, comparison.stages);

    return { current, comparison, changes };
  }

  /**
   * Get cohort analysis for conversion patterns
   */
  async getCohortAnalysis(params: {
    startDate: string;
    endDate: string;
    cohortType: 'weekly' | 'monthly';
    platform?: Platform;
  }): Promise<CohortAnalysis[]> {
    try {
      if (this.isTestMode) {
        return this.getMockCohortAnalysis(params);
      }

      // Implementation would query user registration/conversion data
      // Group users by cohort period and track their conversion journey
      const { data, error } = await supabaseClient.rpc('analyze_cohorts', {
        p_start_date: params.startDate,
        p_end_date: params.endDate,
        p_cohort_type: params.cohortType,
        p_platform: params.platform
      });

      if (error) {
        throw new Error(`Cohort analysis failed: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Cohort analysis error:', error);
      return [];
    }
  }

  /**
   * Generate automated funnel optimization suggestions
   */
  async generateOptimizationPlan(funnelAnalysis: FunnelAnalysis): Promise<{
    priority: 'high' | 'medium' | 'low';
    estimatedImpact: number;
    recommendations: FunnelRecommendation[];
    implementationPlan: {
      phase1: FunnelRecommendation[];
      phase2: FunnelRecommendation[];
      phase3: FunnelRecommendation[];
    };
  }> {
    const recommendations = funnelAnalysis.recommendations;
    
    // Sort by priority and impact
    const sortedRecommendations = recommendations.sort((a, b) => {
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      return (b.priority * priorityWeight[b.difficulty as keyof typeof priorityWeight]) - 
             (a.priority * priorityWeight[a.difficulty as keyof typeof priorityWeight]);
    });

    // Estimate overall impact
    const estimatedImpact = this.calculateEstimatedImpact(funnelAnalysis, sortedRecommendations);

    // Determine priority
    const criticalIssues = funnelAnalysis.insights.filter(i => i.type === 'critical').length;
    const priority = criticalIssues > 2 ? 'high' : criticalIssues > 0 ? 'medium' : 'low';

    // Create implementation phases
    const implementationPlan = {
      phase1: sortedRecommendations.filter(r => r.difficulty === 'easy').slice(0, 3),
      phase2: sortedRecommendations.filter(r => r.difficulty === 'medium').slice(0, 2),
      phase3: sortedRecommendations.filter(r => r.difficulty === 'hard').slice(0, 2)
    };

    return {
      priority,
      estimatedImpact,
      recommendations: sortedRecommendations,
      implementationPlan
    };
  }

  /**
   * Private helper methods
   */
  private async enhanceStageMetrics(
    basicFunnel: ConversionFunnel[],
    stages: FunnelStage[],
    params: any
  ): Promise<FunnelMetrics[]> {
    const enhancedStages: FunnelMetrics[] = [];

    for (const stage of stages) {
      const basicStage = basicFunnel.find(f => f.stage === stage.name);
      
      if (!basicStage) continue;

      // Get segment breakdown if requested
      const segmentBreakdown = params.includeSegments ? 
        await this.getSegmentBreakdown(stage, params) : 
        this.getEmptySegmentBreakdown();

      enhancedStages.push({
        stage: stage.name,
        visitors: basicStage.visitors,
        conversions: basicStage.conversions,
        conversionRate: basicStage.conversion_rate,
        dropOffRate: basicStage.drop_off,
        avgTimeSpent: basicStage.avg_time_spent,
        topExitPoints: basicStage.top_exit_points,
        improvementOpportunities: basicStage.improvement_opportunities,
        segmentBreakdown
      });
    }

    return enhancedStages;
  }

  private async getSegmentBreakdown(stage: FunnelStage, params: any): Promise<FunnelMetrics['segmentBreakdown']> {
    if (this.isTestMode) {
      return {
        platform: { 
          instagram: 45, tiktok: 30, linkedin: 15, 
          twitter: 5, facebook: 3, youtube: 2 
        } as Record<Platform, number>,
        niche: { 
          business: 40, fitness: 25, lifestyle: 20, finance: 15 
        } as Record<Niche, number>,
        device: { mobile: 70, desktop: 25, tablet: 5 },
        source: { organic: 45, social: 30, direct: 15, referral: 10 }
      };
    }

    // Real implementation would query segment data
    return this.getEmptySegmentBreakdown();
  }

  private getEmptySegmentBreakdown(): FunnelMetrics['segmentBreakdown'] {
    return {
      platform: {} as Record<Platform, number>,
      niche: {} as Record<Niche, number>,
      device: {},
      source: {}
    };
  }

  private async generateFunnelInsights(stages: FunnelMetrics[]): Promise<FunnelInsight[]> {
    const insights: FunnelInsight[] = [];

    stages.forEach((stage, index) => {
      // High drop-off rate insight
      if (stage.dropOffRate > 70) {
        insights.push({
          type: 'critical',
          stage: stage.stage,
          title: 'Critical Drop-off Detected',
          description: `${stage.dropOffRate.toFixed(1)}% of users are leaving at this stage`,
          impact: 'high',
          confidence: 90,
          dataPoints: {
            dropOffRate: stage.dropOffRate,
            visitors: stage.visitors,
            avgTimeSpent: stage.avgTimeSpent
          }
        });
      }

      // Low conversion rate insight
      if (stage.conversionRate < 5 && stage.visitors > 100) {
        insights.push({
          type: 'warning',
          stage: stage.stage,
          title: 'Low Conversion Rate',
          description: `Conversion rate of ${stage.conversionRate.toFixed(1)}% is below average`,
          impact: 'medium',
          confidence: 85,
          dataPoints: {
            conversionRate: stage.conversionRate,
            visitors: stage.visitors
          }
        });
      }

      // Quick exit insight
      if (stage.avgTimeSpent < 10 && stage.dropOffRate > 50) {
        insights.push({
          type: 'warning',
          stage: stage.stage,
          title: 'Users Leaving Too Quickly',
          description: `Average time spent (${stage.avgTimeSpent}s) suggests content isn't engaging`,
          impact: 'medium',
          confidence: 80,
          dataPoints: {
            avgTimeSpent: stage.avgTimeSpent,
            dropOffRate: stage.dropOffRate
          }
        });
      }

      // High performance insight
      if (stage.conversionRate > 15) {
        insights.push({
          type: 'success',
          stage: stage.stage,
          title: 'High-Performing Stage',
          description: `Excellent conversion rate of ${stage.conversionRate.toFixed(1)}%`,
          impact: 'low',
          confidence: 95,
          dataPoints: {
            conversionRate: stage.conversionRate
          }
        });
      }
    });

    return insights;
  }

  private async generateRecommendations(
    stages: FunnelMetrics[],
    insights: FunnelInsight[]
  ): Promise<FunnelRecommendation[]> {
    const recommendations: FunnelRecommendation[] = [];

    insights.forEach((insight, index) => {
      if (insight.type === 'critical' || insight.type === 'warning') {
        const rec = this.createRecommendationFromInsight(insight, index);
        if (rec) recommendations.push(rec);
      }
    });

    // Add general optimization recommendations
    recommendations.push(...this.getGeneralOptimizationRecommendations(stages));

    return recommendations;
  }

  private createRecommendationFromInsight(insight: FunnelInsight, index: number): FunnelRecommendation | null {
    if (insight.title.includes('Drop-off')) {
      return {
        id: `rec_${index}`,
        stage: insight.stage,
        type: 'optimization',
        title: 'Reduce Stage Drop-off',
        description: 'Implement exit-intent popups and improve user experience',
        expectedImpact: `Reduce drop-off by 15-25%`,
        difficulty: 'medium',
        priority: 9,
        implementation: {
          steps: [
            'Add exit-intent popup with value proposition',
            'Simplify form fields and reduce friction',
            'A/B test different page layouts',
            'Add progress indicators'
          ],
          estimatedTime: '2-3 weeks',
          resources: ['Developer', 'Designer', 'Copywriter']
        }
      };
    }

    if (insight.title.includes('Low Conversion')) {
      return {
        id: `rec_${index}`,
        stage: insight.stage,
        type: 'content',
        title: 'Improve Conversion Elements',
        description: 'Optimize headlines, CTAs, and value propositions',
        expectedImpact: `Increase conversion rate by 20-40%`,
        difficulty: 'easy',
        priority: 8,
        implementation: {
          steps: [
            'A/B test headlines and copy',
            'Optimize CTA button text and placement',
            'Add social proof elements',
            'Clarify value proposition'
          ],
          estimatedTime: '1-2 weeks',
          resources: ['Copywriter', 'Designer']
        }
      };
    }

    if (insight.title.includes('Leaving Too Quickly')) {
      return {
        id: `rec_${index}`,
        stage: insight.stage,
        type: 'design',
        title: 'Improve Content Engagement',
        description: 'Make content more engaging and reduce cognitive load',
        expectedImpact: `Increase time on page by 30-50%`,
        difficulty: 'medium',
        priority: 7,
        implementation: {
          steps: [
            'Add interactive elements',
            'Improve page load speed',
            'Use more compelling visuals',
            'Break content into digestible sections'
          ],
          estimatedTime: '2-4 weeks',
          resources: ['Designer', 'Developer', 'Content Creator']
        }
      };
    }

    return null;
  }

  private getGeneralOptimizationRecommendations(stages: FunnelMetrics[]): FunnelRecommendation[] {
    const recommendations: FunnelRecommendation[] = [];

    // Mobile optimization
    const mobileTraffic = stages[0]?.segmentBreakdown?.device?.mobile || 0;
    if (mobileTraffic > 60) {
      recommendations.push({
        id: 'rec_mobile',
        stage: 'All Stages',
        type: 'design',
        title: 'Mobile-First Optimization',
        description: 'Optimize all funnel stages for mobile experience',
        expectedImpact: 'Improve mobile conversion by 25-35%',
        difficulty: 'medium',
        priority: 8,
        implementation: {
          steps: [
            'Audit mobile user experience',
            'Optimize touch targets and forms',
            'Improve mobile page speed',
            'Test on various devices'
          ],
          estimatedTime: '3-4 weeks',
          resources: ['Mobile Developer', 'UX Designer']
        }
      });
    }

    // Personalization recommendation
    recommendations.push({
      id: 'rec_personalization',
      stage: 'Landing Page',
      type: 'targeting',
      title: 'Implement Personalization',
      description: 'Personalize content based on traffic source and user behavior',
      expectedImpact: 'Increase overall conversion by 15-30%',
      difficulty: 'hard',
      priority: 6,
      implementation: {
        steps: [
          'Set up dynamic content system',
          'Create audience segments',
          'Develop personalization rules',
          'A/B test personalized vs generic content'
        ],
        estimatedTime: '6-8 weeks',
        resources: ['Full-stack Developer', 'Data Analyst', 'Marketing Manager']
      }
    });

    return recommendations;
  }

  private calculateChanges(
    current: FunnelMetrics[],
    comparison: FunnelMetrics[]
  ): Array<{
    stage: string;
    metric: string;
    change: number;
    changePercent: number;
    significance: 'positive' | 'negative' | 'neutral';
  }> {
    const changes: any[] = [];

    current.forEach(currentStage => {
      const comparisonStage = comparison.find(c => c.stage === currentStage.stage);
      if (!comparisonStage) return;

      // Conversion rate change
      const conversionChange = currentStage.conversionRate - comparisonStage.conversionRate;
      const conversionChangePercent = comparisonStage.conversionRate > 0 ? 
        (conversionChange / comparisonStage.conversionRate) * 100 : 0;

      changes.push({
        stage: currentStage.stage,
        metric: 'Conversion Rate',
        change: conversionChange,
        changePercent: conversionChangePercent,
        significance: Math.abs(conversionChangePercent) > 5 ? 
          (conversionChangePercent > 0 ? 'positive' : 'negative') : 'neutral'
      });

      // Visitors change
      const visitorsChange = currentStage.visitors - comparisonStage.visitors;
      const visitorsChangePercent = comparisonStage.visitors > 0 ? 
        (visitorsChange / comparisonStage.visitors) * 100 : 0;

      changes.push({
        stage: currentStage.stage,
        metric: 'Visitors',
        change: visitorsChange,
        changePercent: visitorsChangePercent,
        significance: Math.abs(visitorsChangePercent) > 10 ? 
          (visitorsChangePercent > 0 ? 'positive' : 'negative') : 'neutral'
      });
    });

    return changes;
  }

  private calculateEstimatedImpact(
    analysis: FunnelAnalysis,
    recommendations: FunnelRecommendation[]
  ): number {
    // Simple impact calculation based on recommendation priorities and current performance
    const baseConversionRate = analysis.overallConversionRate;
    const highPriorityRecs = recommendations.filter(r => r.priority >= 8).length;
    const mediumPriorityRecs = recommendations.filter(r => r.priority >= 6 && r.priority < 8).length;

    // Estimated improvement: high priority = 5% each, medium = 2% each
    const estimatedImprovement = (highPriorityRecs * 5) + (mediumPriorityRecs * 2);
    
    return Math.min(baseConversionRate + estimatedImprovement, baseConversionRate * 2);
  }

  private getImprovementOpportunity(stage: string, dropOff: number): string {
    const opportunities: Record<string, string> = {
      'Landing Page': 'Improve headline and value proposition clarity',
      'Email Capture': 'Reduce form friction and add trust signals',
      'Template Selection': 'Simplify template categories and add search',
      'Template Creation': 'Provide better onboarding and tutorials',
      'Video Generation': 'Optimize processing time and add progress indicators'
    };

    return opportunities[stage] || 'Analyze user feedback and behavior patterns';
  }

  private initializeDefaultStages(): FunnelStage[] {
    return [
      {
        id: 'landing',
        name: 'Landing Page',
        description: 'Initial page visit',
        events: ['page_view'],
        requiredData: ['visitor_id', 'landing_page_id'],
        order: 1
      },
      {
        id: 'engagement',
        name: 'Engagement',
        description: 'User interacts with content',
        events: ['scroll', 'click', 'time_spent'],
        requiredData: ['visitor_id', 'engagement_type'],
        order: 2
      },
      {
        id: 'email_capture',
        name: 'Email Capture',
        description: 'User provides email address',
        events: ['email_capture'],
        requiredData: ['visitor_id', 'email', 'source'],
        order: 3
      },
      {
        id: 'template_selection',
        name: 'Template Selection',
        description: 'User selects a template',
        events: ['template_view', 'template_select'],
        requiredData: ['user_id', 'template_id'],
        order: 4
      },
      {
        id: 'template_creation',
        name: 'Template Creation',
        description: 'User customizes template',
        events: ['template_edit', 'template_complete'],
        requiredData: ['user_id', 'template_id', 'completion_status'],
        order: 5
      }
    ];
  }

  // Mock data methods
  private getMockFunnelAnalysis(params: any): FunnelAnalysis {
    const mockStages: FunnelMetrics[] = [
      {
        stage: 'Landing Page',
        visitors: 1000,
        conversions: 850,
        conversionRate: 85.0,
        dropOffRate: 15.0,
        avgTimeSpent: 45,
        topExitPoints: ['Header CTA', 'Below fold'],
        improvementOpportunities: ['Improve headline clarity', 'Add trust signals'],
        segmentBreakdown: {
          platform: { instagram: 45, tiktok: 30, linkedin: 15, twitter: 5, facebook: 3, youtube: 2 } as Record<Platform, number>,
          niche: { business: 40, fitness: 25, lifestyle: 20, finance: 15 } as Record<Niche, number>,
          device: { mobile: 70, desktop: 25, tablet: 5 },
          source: { organic: 45, social: 30, direct: 15, referral: 10 }
        }
      },
      {
        stage: 'Email Capture',
        visitors: 850,
        conversions: 255,
        conversionRate: 30.0,
        dropOffRate: 70.0,
        avgTimeSpent: 25,
        topExitPoints: ['Email form', 'Privacy policy'],
        improvementOpportunities: ['Reduce form fields', 'Add value proposition'],
        segmentBreakdown: {
          platform: { instagram: 42, tiktok: 32, linkedin: 16, twitter: 5, facebook: 3, youtube: 2 } as Record<Platform, number>,
          niche: { business: 45, fitness: 22, lifestyle: 18, finance: 15 } as Record<Niche, number>,
          device: { mobile: 68, desktop: 27, tablet: 5 },
          source: { organic: 48, social: 28, direct: 14, referral: 10 }
        }
      },
      {
        stage: 'Template Selection',
        visitors: 255,
        conversions: 204,
        conversionRate: 80.0,
        dropOffRate: 20.0,
        avgTimeSpent: 90,
        topExitPoints: ['Template grid', 'Category filter'],
        improvementOpportunities: ['Better template previews', 'Improved search'],
        segmentBreakdown: {
          platform: { instagram: 40, tiktok: 35, linkedin: 15, twitter: 5, facebook: 3, youtube: 2 } as Record<Platform, number>,
          niche: { business: 50, fitness: 20, lifestyle: 15, finance: 15 } as Record<Niche, number>,
          device: { mobile: 65, desktop: 30, tablet: 5 },
          source: { organic: 50, social: 25, direct: 15, referral: 10 }
        }
      },
      {
        stage: 'Template Creation',
        visitors: 204,
        conversions: 122,
        conversionRate: 59.8,
        dropOffRate: 40.2,
        avgTimeSpent: 180,
        topExitPoints: ['Editor interface', 'Export options'],
        improvementOpportunities: ['Simplify editor', 'Better tutorials'],
        segmentBreakdown: {
          platform: { instagram: 38, tiktok: 37, linkedin: 15, twitter: 5, facebook: 3, youtube: 2 } as Record<Platform, number>,
          niche: { business: 55, fitness: 18, lifestyle: 12, finance: 15 } as Record<Niche, number>,
          device: { mobile: 60, desktop: 35, tablet: 5 },
          source: { organic: 52, social: 23, direct: 15, referral: 10 }
        }
      }
    ];

    const mockInsights: FunnelInsight[] = [
      {
        type: 'critical',
        stage: 'Email Capture',
        title: 'Critical Drop-off Detected',
        description: '70.0% of users are leaving at this stage',
        impact: 'high',
        confidence: 90,
        dataPoints: { dropOffRate: 70.0, visitors: 850 }
      },
      {
        type: 'warning',
        stage: 'Template Creation',
        title: 'Moderate Drop-off Rate',
        description: '40.2% drop-off suggests editor complexity issues',
        impact: 'medium',
        confidence: 85,
        dataPoints: { dropOffRate: 40.2, avgTimeSpent: 180 }
      },
      {
        type: 'success',
        stage: 'Template Selection',
        title: 'High-Performing Stage',
        description: 'Excellent conversion rate of 80.0%',
        impact: 'low',
        confidence: 95,
        dataPoints: { conversionRate: 80.0 }
      }
    ];

    const mockRecommendations: FunnelRecommendation[] = [
      {
        id: 'rec_email_capture',
        stage: 'Email Capture',
        type: 'optimization',
        title: 'Reduce Email Form Friction',
        description: 'Simplify email capture with single-field form and instant value',
        expectedImpact: 'Increase conversion by 25-40%',
        difficulty: 'easy',
        priority: 9,
        implementation: {
          steps: [
            'Reduce to single email field',
            'Add immediate template preview',
            'Include privacy assurance',
            'A/B test form placement'
          ],
          estimatedTime: '1 week',
          resources: ['Frontend Developer', 'Copywriter']
        }
      }
    ];

    return {
      id: `mock_funnel_${Date.now()}`,
      name: `Mock Funnel Analysis - ${params.timeframe}`,
      timeframe: params.timeframe,
      totalVisitors: 1000,
      totalConversions: 122,
      overallConversionRate: 12.2,
      stages: mockStages,
      insights: mockInsights,
      recommendations: mockRecommendations,
      generatedAt: new Date().toISOString()
    };
  }

  private getMockCohortAnalysis(params: any): CohortAnalysis[] {
    const cohorts: CohortAnalysis[] = [];
    const periods = params.cohortType === 'weekly' ? 8 : 6;

    for (let i = 0; i < periods; i++) {
      const baseSize = 100 + Math.floor(Math.random() * 200);
      const retentionRates = [];
      
      // Generate decreasing retention rates
      for (let week = 0; week < 12; week++) {
        const baseRetention = 100 - (week * 8) - Math.random() * 10;
        retentionRates.push(Math.max(10, baseRetention));
      }

      cohorts.push({
        cohortId: `cohort_${i}`,
        period: params.cohortType === 'weekly' ? `Week ${i + 1}` : `Month ${i + 1}`,
        size: baseSize,
        retentionRates,
        conversionTimeline: [
          { timeRange: '0-1 days', conversions: Math.floor(baseSize * 0.15), cumulativeRate: 15 },
          { timeRange: '1-3 days', conversions: Math.floor(baseSize * 0.08), cumulativeRate: 23 },
          { timeRange: '3-7 days', conversions: Math.floor(baseSize * 0.05), cumulativeRate: 28 },
          { timeRange: '1-2 weeks', conversions: Math.floor(baseSize * 0.03), cumulativeRate: 31 },
          { timeRange: '2-4 weeks', conversions: Math.floor(baseSize * 0.02), cumulativeRate: 33 }
        ]
      });
    }

    return cohorts;
  }
}

// Export singleton instance
export const conversionFunnelAnalyzer = ConversionFunnelAnalyzer.getInstance();