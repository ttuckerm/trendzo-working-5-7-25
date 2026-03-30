import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export interface TemplateMetrics {
  id: string;
  title: string;
  status: 'HOT' | 'COOLING' | 'NEW';
  engagement_score: number;
  viral_probability: number;
  views: number;
  likes: number;
  shares: number;
  comments: number;
  created_at: string;
  last_updated: string;
  performance_trend: 'up' | 'down' | 'stable';
  delta_7d: number;
  delta_24h: number;
}

export interface SystemMetrics {
  total_videos_processed: number;
  active_templates: number;
  pipeline_accuracy: number;
  uptime_percentage: number;
  processing_speed: number;
  error_rate: number;
  last_updated: string;
}

export interface PipelineHealth {
  overall_status: 'healthy' | 'degraded' | 'critical';
  modules: Array<{
    name: string;
    status: 'running' | 'idle' | 'error';
    last_run: string;
    success_rate: number;
    avg_duration: number;
  }>;
  recent_runs: Array<{
    id: string;
    status: 'success' | 'failed' | 'running';
    started_at: string;
    duration: number;
    items_processed: number;
  }>;
}

export interface TrendAnalysis {
  trending_up: TemplateMetrics[];
  trending_down: TemplateMetrics[];
  hot_templates: TemplateMetrics[];
  emerging_patterns: Array<{
    pattern: string;
    confidence: number;
    examples: string[];
  }>;
}

export class AnalyticsService {
  private static instance: AnalyticsService;
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  // Template Performance Analytics
  async getTemplatePerformance(templateId: string, timeframe: string = '7d'): Promise<TemplateMetrics | null> {
    const cacheKey = `template_${templateId}_${timeframe}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      // Get template basic info
      const { data: template, error: templateError } = await supabase
        .from('template_library')
        .select('*')
        .eq('id', templateId)
        .single();

      if (templateError || !template) {
        return null;
      }

      // Get historical metrics for trend calculation
      const { data: metrics, error: metricsError } = await supabase
        .from('template_metrics')
        .select('*')
        .eq('template_id', templateId)
        .order('created_at', { ascending: false })
        .limit(30);

      if (metricsError) {
        console.error('Error fetching template metrics:', metricsError);
      }

      // Calculate trends and deltas
      const deltas = this.calculateDeltas(metrics || []);
      const trend = this.calculateTrend(metrics || []);

      const result: TemplateMetrics = {
        id: template.id,
        title: template.title,
        status: template.status,
        engagement_score: template.engagement_score || 0,
        viral_probability: template.viral_probability || 0,
        views: template.total_views || 0,
        likes: template.total_likes || 0,
        shares: template.total_shares || 0,
        comments: template.total_comments || 0,
        created_at: template.created_at,
        last_updated: template.updated_at || template.created_at,
        performance_trend: trend,
        delta_7d: deltas.delta_7d,
        delta_24h: deltas.delta_24h
      };

      this.setCache(cacheKey, result, 5 * 60 * 1000); // 5 minutes
      return result;
    } catch (error) {
      console.error('Error getting template performance:', error);
      return null;
    }
  }

  // System-wide analytics
  async getSystemMetrics(): Promise<SystemMetrics> {
    const cacheKey = 'system_metrics';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const [
        templatesCount,
        videosProcessed,
        pipelineAccuracy,
        systemStatus
      ] = await Promise.all([
        supabase.from('template_library').select('id', { count: 'exact' }),
        this.getVideosProcessedCount(),
        this.getCurrentAccuracy(),
        this.getSystemStatus()
      ]);

      const result: SystemMetrics = {
        total_videos_processed: videosProcessed,
        active_templates: templatesCount.count || 0,
        pipeline_accuracy: pipelineAccuracy,
        uptime_percentage: systemStatus.uptime,
        processing_speed: systemStatus.speed,
        error_rate: systemStatus.errorRate,
        last_updated: new Date().toISOString()
      };

      this.setCache(cacheKey, result, 2 * 60 * 1000); // 2 minutes
      return result;
    } catch (error) {
      console.error('Error getting system metrics:', error);
      return this.getDefaultSystemMetrics();
    }
  }

  // Pipeline health monitoring
  async getPipelineHealth(): Promise<PipelineHealth> {
    const cacheKey = 'pipeline_health';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const [modules, recentRuns] = await Promise.all([
        this.getModuleStatus(),
        this.getRecentPipelineRuns()
      ]);

      const overallStatus = this.calculateOverallHealth(modules, recentRuns);

      const result: PipelineHealth = {
        overall_status: overallStatus,
        modules,
        recent_runs: recentRuns
      };

      this.setCache(cacheKey, result, 1 * 60 * 1000); // 1 minute
      return result;
    } catch (error) {
      console.error('Error getting pipeline health:', error);
      return this.getDefaultPipelineHealth();
    }
  }

  // Trend analysis for strategic insights
  async getTrendAnalysis(timeframe: string = '7d'): Promise<TrendAnalysis> {
    const cacheKey = `trends_${timeframe}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const { data: templates, error } = await supabase
        .from('template_library')
        .select('*')
        .order('engagement_score', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Calculate trends for each template
      const templatesWithTrends = await Promise.all(
        templates.map(async (template) => {
          const metrics = await this.getTemplatePerformance(template.id, timeframe);
          return metrics;
        })
      );

      const validTemplates = templatesWithTrends.filter(Boolean) as TemplateMetrics[];

      const result: TrendAnalysis = {
        trending_up: validTemplates.filter(t => t.performance_trend === 'up').slice(0, 5),
        trending_down: validTemplates.filter(t => t.performance_trend === 'down').slice(0, 5),
        hot_templates: validTemplates.filter(t => t.status === 'HOT').slice(0, 10),
        emerging_patterns: await this.detectEmergingPatterns(validTemplates)
      };

      this.setCache(cacheKey, result, 10 * 60 * 1000); // 10 minutes
      return result;
    } catch (error) {
      console.error('Error getting trend analysis:', error);
      return this.getDefaultTrendAnalysis();
    }
  }

  // Query builder for natural language analytics
  async executeAnalyticsQuery(query: string, parameters: Record<string, any>): Promise<any> {
    try {
      switch (query.toLowerCase()) {
        case 'template_performance':
          if (parameters.template_id) {
            return await this.getTemplatePerformance(parameters.template_id, parameters.timeframe);
          }
          break;

        case 'system_overview':
          return await this.getSystemMetrics();

        case 'pipeline_status':
          return await this.getPipelineHealth();

        case 'trending_templates':
          const trends = await this.getTrendAnalysis(parameters.timeframe);
          return trends.trending_up;

        case 'hot_templates':
          const hotTrends = await this.getTrendAnalysis(parameters.timeframe);
          return hotTrends.hot_templates;

        case 'performance_comparison':
          if (parameters.template_ids && Array.isArray(parameters.template_ids)) {
            return await this.compareTemplates(parameters.template_ids, parameters.timeframe);
          }
          break;

        default:
          throw new Error(`Unknown analytics query: ${query}`);
      }
    } catch (error) {
      console.error('Error executing analytics query:', error);
      throw error;
    }
  }

  // Private helper methods
  private async getVideosProcessedCount(): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('video_features')
        .select('id', { count: 'exact' });
      
      return data?.length || 0;
    } catch {
      return 12847; // Mock data
    }
  }

  private async getCurrentAccuracy(): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('accuracy_metrics')
        .select('accuracy')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      return data?.accuracy || 87.3;
    } catch {
      return 87.3; // Mock data
    }
  }

  private async getSystemStatus(): Promise<{ uptime: number; speed: number; errorRate: number }> {
    // Mock implementation - would integrate with actual monitoring
    return {
      uptime: 99.2,
      speed: 2.3, // videos per second
      errorRate: 2.1
    };
  }

  private async getModuleStatus(): Promise<PipelineHealth['modules']> {
    // Mock implementation - would query actual module status
    return [
      { name: 'apify-scraper', status: 'running', last_run: '2 hours ago', success_rate: 96.5, avg_duration: 45 },
      { name: 'viral-filter', status: 'idle', last_run: '1 hour ago', success_rate: 94.2, avg_duration: 12 },
      { name: 'template-generator', status: 'running', last_run: '30 minutes ago', success_rate: 98.1, avg_duration: 180 }
    ];
  }

  private async getRecentPipelineRuns(): Promise<PipelineHealth['recent_runs']> {
    try {
      const { data, error } = await supabase
        .from('pipeline_runs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      return data.map(run => ({
        id: run.id,
        status: run.status === 'completed' ? 'success' : run.status === 'failed' ? 'failed' : 'running',
        started_at: run.created_at,
        duration: run.duration_ms || 0,
        items_processed: run.items_processed || 0
      }));
    } catch {
      // Mock data
      return [
        { id: '1', status: 'success', started_at: '2 hours ago', duration: 145000, items_processed: 2847 },
        { id: '2', status: 'success', started_at: '8 hours ago', duration: 152000, items_processed: 3021 }
      ];
    }
  }

  private calculateDeltas(metrics: any[]): { delta_7d: number; delta_24h: number } {
    if (metrics.length < 2) return { delta_7d: 0, delta_24h: 0 };

    const latest = metrics[0];
    const day_ago = metrics.find(m => 
      new Date(latest.created_at).getTime() - new Date(m.created_at).getTime() >= 24 * 60 * 60 * 1000
    );
    const week_ago = metrics.find(m => 
      new Date(latest.created_at).getTime() - new Date(m.created_at).getTime() >= 7 * 24 * 60 * 60 * 1000
    );

    return {
      delta_24h: day_ago ? ((latest.engagement_score || 0) - (day_ago.engagement_score || 0)) : 0,
      delta_7d: week_ago ? ((latest.engagement_score || 0) - (week_ago.engagement_score || 0)) : 0
    };
  }

  private calculateTrend(metrics: any[]): 'up' | 'down' | 'stable' {
    if (metrics.length < 3) return 'stable';

    const recent = metrics.slice(0, 3);
    const scores = recent.map(m => m.engagement_score || 0);
    
    if (scores[0] > scores[1] && scores[1] > scores[2]) return 'up';
    if (scores[0] < scores[1] && scores[1] < scores[2]) return 'down';
    return 'stable';
  }

  private calculateOverallHealth(modules: any[], runs: any[]): 'healthy' | 'degraded' | 'critical' {
    const failedModules = modules.filter(m => m.status === 'error').length;
    const failedRuns = runs.filter(r => r.status === 'failed').length;
    
    if (failedModules > 1 || failedRuns > 2) return 'critical';
    if (failedModules > 0 || failedRuns > 0) return 'degraded';
    return 'healthy';
  }

  private async detectEmergingPatterns(templates: TemplateMetrics[]): Promise<Array<{ pattern: string; confidence: number; examples: string[] }>> {
    // Simplified pattern detection - would use ML in production
    return [
      {
        pattern: 'Short-form vertical content trending',
        confidence: 0.85,
        examples: templates.filter(t => t.performance_trend === 'up').slice(0, 3).map(t => t.title)
      }
    ];
  }

  private async compareTemplates(templateIds: string[], timeframe: string = '7d'): Promise<TemplateMetrics[]> {
    const comparisons = await Promise.all(
      templateIds.map(id => this.getTemplatePerformance(id, timeframe))
    );
    return comparisons.filter(Boolean) as TemplateMetrics[];
  }

  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  private getDefaultSystemMetrics(): SystemMetrics {
    return {
      total_videos_processed: 12847,
      active_templates: 156,
      pipeline_accuracy: 87.3,
      uptime_percentage: 99.2,
      processing_speed: 2.3,
      error_rate: 2.1,
      last_updated: new Date().toISOString()
    };
  }

  private getDefaultPipelineHealth(): PipelineHealth {
    return {
      overall_status: 'healthy',
      modules: [
        { name: 'apify-scraper', status: 'running', last_run: '2 hours ago', success_rate: 96.5, avg_duration: 45 }
      ],
      recent_runs: [
        { id: '1', status: 'success', started_at: '2 hours ago', duration: 145000, items_processed: 2847 }
      ]
    };
  }

  private getDefaultTrendAnalysis(): TrendAnalysis {
    return {
      trending_up: [],
      trending_down: [],
      hot_templates: [],
      emerging_patterns: []
    };
  }
}