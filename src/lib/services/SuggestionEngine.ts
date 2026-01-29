import { createClient } from '@supabase/supabase-js';
import { AnalyticsService, TemplateMetrics, SystemMetrics } from './AnalyticsService';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export interface Suggestion {
  id: string;
  type: 'optimization' | 'warning' | 'opportunity' | 'insight';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  reasoning: string;
  action_items: Array<{
    action: string;
    description: string;
    estimated_impact: string;
    difficulty: 'easy' | 'moderate' | 'hard';
  }>;
  data_supporting: any;
  confidence: number;
  estimated_impact: {
    accuracy_improvement?: number;
    performance_gain?: number;
    risk_reduction?: number;
    revenue_impact?: number;
  };
  timeframe: string;
  created_at: string;
  expires_at: string;
}

export interface ContextualSuggestion extends Suggestion {
  context: {
    current_page: string;
    user_action: string;
    visible_data: any;
  };
  trigger: 'user_question' | 'data_anomaly' | 'performance_drop' | 'opportunity_detected';
}

export interface SuggestionCategories {
  performance_optimizations: Suggestion[];
  viral_predictions: Suggestion[];
  template_improvements: Suggestion[];
  pipeline_efficiency: Suggestion[];
  proactive_alerts: Suggestion[];
}

export class SuggestionEngine {
  private static instance: SuggestionEngine;
  private analyticsService = AnalyticsService.getInstance();
  private suggestionCache = new Map<string, { suggestions: Suggestion[]; timestamp: number }>();

  static getInstance(): SuggestionEngine {
    if (!SuggestionEngine.instance) {
      SuggestionEngine.instance = new SuggestionEngine();
    }
    return SuggestionEngine.instance;
  }

  // Generate contextual suggestions based on current user context
  async generateContextualSuggestions(
    userQuery: string,
    context: {
      pageName: string;
      route: string;
      visibleData: any;
      activeElements: string[];
    }
  ): Promise<ContextualSuggestion[]> {
    try {
      const suggestions: ContextualSuggestion[] = [];

      // Analyze user query for intent
      const queryIntent = this.analyzeQueryIntent(userQuery);
      
      // Generate suggestions based on context and intent
      if (context.route.includes('template')) {
        suggestions.push(...await this.generateTemplateSuggestions(context, queryIntent));
      }
      
      if (context.route.includes('pipeline')) {
        suggestions.push(...await this.generatePipelineSuggestions(context, queryIntent));
      }
      
      if (context.route.includes('analytics')) {
        suggestions.push(...await this.generateAnalyticsSuggestions(context, queryIntent));
      }

      // Add general suggestions based on system state
      suggestions.push(...await this.generateSystemSuggestions(context, queryIntent));

      return suggestions.slice(0, 5); // Return top 5 suggestions
    } catch (error) {
      console.error('Error generating contextual suggestions:', error);
      return [];
    }
  }

  // Generate proactive suggestions based on data patterns
  async generateProactiveSuggestions(): Promise<SuggestionCategories> {
    const cacheKey = 'proactive_suggestions';
    const cached = this.suggestionCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < 10 * 60 * 1000) { // 10 minutes
      return this.categorizeSuggestions(cached.suggestions);
    }

    try {
      const [
        systemMetrics,
        trendAnalysis,
        performanceAnomalies,
        opportunityDetection
      ] = await Promise.all([
        this.analyticsService.getSystemMetrics(),
        this.analyticsService.getTrendAnalysis(),
        this.detectPerformanceAnomalies(),
        this.detectOpportunities()
      ]);

      const suggestions: Suggestion[] = [];

      // Performance optimization suggestions
      suggestions.push(...await this.generatePerformanceOptimizations(systemMetrics));
      
      // Viral prediction insights
      suggestions.push(...await this.generateViralPredictionInsights(trendAnalysis));
      
      // Template improvement suggestions
      suggestions.push(...await this.generateTemplateImprovements(trendAnalysis));
      
      // Pipeline efficiency suggestions
      suggestions.push(...await this.generatePipelineEfficiencySuggestions(systemMetrics));
      
      // Proactive alerts
      suggestions.push(...await this.generateProactiveAlerts(performanceAnomalies));
      
      // Opportunity suggestions
      suggestions.push(...await this.generateOpportunitySuggestions(opportunityDetection));

      // Cache the suggestions
      this.suggestionCache.set(cacheKey, {
        suggestions,
        timestamp: Date.now()
      });

      return this.categorizeSuggestions(suggestions);
    } catch (error) {
      console.error('Error generating proactive suggestions:', error);
      return this.getDefaultSuggestions();
    }
  }

  // Generate suggestions for specific scenarios
  async generateOptimizationSuggestions(targetMetric: string, currentValue: number): Promise<Suggestion[]> {
    const suggestions: Suggestion[] = [];

    switch (targetMetric) {
      case 'accuracy':
        if (currentValue < 85) {
          suggestions.push({
            id: `accuracy_opt_${Date.now()}`,
            type: 'optimization',
            priority: 'high',
            title: 'Improve Prediction Accuracy',
            description: `Current accuracy (${currentValue}%) is below optimal. Consider retraining models with recent data.`,
            reasoning: 'Prediction accuracy has dropped below the 85% threshold, indicating model drift or data quality issues.',
            action_items: [
              {
                action: 'retrain_models',
                description: 'Retrain viral prediction models with latest 30 days of data',
                estimated_impact: '+3-5% accuracy improvement',
                difficulty: 'moderate'
              },
              {
                action: 'data_quality_audit',
                description: 'Audit input data quality and feature extraction',
                estimated_impact: '+2-3% accuracy improvement',
                difficulty: 'easy'
              }
            ],
            data_supporting: { current_accuracy: currentValue, target_accuracy: 90 },
            confidence: 0.85,
            estimated_impact: { accuracy_improvement: 5 },
            timeframe: '2-3 days',
            created_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          });
        }
        break;

      case 'processing_speed':
        if (currentValue < 2.0) {
          suggestions.push({
            id: `speed_opt_${Date.now()}`,
            type: 'optimization',
            priority: 'medium',
            title: 'Optimize Processing Speed',
            description: `Processing speed (${currentValue} videos/sec) can be improved through pipeline optimization.`,
            reasoning: 'Current processing speed is below optimal throughput, suggesting bottlenecks in the pipeline.',
            action_items: [
              {
                action: 'batch_size_optimization',
                description: 'Optimize batch sizes for video processing modules',
                estimated_impact: '+15-20% speed improvement',
                difficulty: 'easy'
              },
              {
                action: 'parallel_processing',
                description: 'Enable parallel processing for feature extraction',
                estimated_impact: '+25-30% speed improvement',
                difficulty: 'moderate'
              }
            ],
            data_supporting: { current_speed: currentValue, target_speed: 3.0 },
            confidence: 0.78,
            estimated_impact: { performance_gain: 25 },
            timeframe: '1-2 days',
            created_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          });
        }
        break;
    }

    return suggestions;
  }

  // Ask clarifying questions for complex requests
  async generateClarifyingQuestions(userQuery: string, context: any): Promise<string[]> {
    const questions: string[] = [];

    // Analyze query ambiguity
    if (userQuery.includes('template') && !this.hasSpecificTemplateId(userQuery)) {
      questions.push('Which specific template would you like me to analyze? (e.g., Template #8)');
    }

    if (userQuery.includes('improve') && !this.hasSpecificMetric(userQuery)) {
      questions.push('What metric would you like to improve? (accuracy, engagement, viral probability)');
    }

    if (userQuery.includes('when') && !this.hasTimeframe(userQuery)) {
      questions.push('What timeframe are you interested in? (last 24 hours, 7 days, 30 days)');
    }

    if (userQuery.includes('compare') && !this.hasComparisonTargets(userQuery)) {
      questions.push('What would you like me to compare? (templates, time periods, metrics)');
    }

    return questions;
  }

  // Flag potential conflicts or issues
  async flagPotentialConflicts(proposedChange: any): Promise<Array<{ type: string; severity: string; description: string }>> {
    const conflicts: Array<{ type: string; severity: string; description: string }> = [];

    // Check for conflicting rules
    if (proposedChange.type === 'threshold_change') {
      const currentThreshold = await this.getCurrentThreshold(proposedChange.target);
      
      if (Math.abs(proposedChange.new_value - currentThreshold) > 0.2) {
        conflicts.push({
          type: 'large_change',
          severity: 'warning',
          description: `Large threshold change detected (${currentThreshold} → ${proposedChange.new_value}). This may significantly impact template classification.`
        });
      }
    }

    // Check for resource conflicts
    if (proposedChange.type === 'pipeline_run' && await this.isPipelineRunning()) {
      conflicts.push({
        type: 'resource_conflict',
        severity: 'error',
        description: 'Pipeline is already running. Starting another run may cause resource conflicts.'
      });
    }

    // Check for timing conflicts
    if (proposedChange.type === 'module_restart' && await this.isModuleCritical(proposedChange.target)) {
      conflicts.push({
        type: 'timing_conflict',
        severity: 'warning',
        description: `Restarting ${proposedChange.target} during peak hours may impact system availability.`
      });
    }

    return conflicts;
  }

  // Private helper methods
  private analyzeQueryIntent(query: string): string {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('improve') || lowerQuery.includes('optimize')) return 'optimization';
    if (lowerQuery.includes('problem') || lowerQuery.includes('issue')) return 'troubleshooting';
    if (lowerQuery.includes('predict') || lowerQuery.includes('forecast')) return 'prediction';
    if (lowerQuery.includes('compare') || lowerQuery.includes('analyze')) return 'analysis';
    if (lowerQuery.includes('how') || lowerQuery.includes('why')) return 'explanation';
    
    return 'general';
  }

  private async generateTemplateSuggestions(context: any, intent: string): Promise<ContextualSuggestion[]> {
    const suggestions: ContextualSuggestion[] = [];

    if (intent === 'optimization') {
      suggestions.push({
        id: `template_opt_${Date.now()}`,
        type: 'optimization',
        priority: 'medium',
        title: 'Optimize Template Performance',
        description: 'Based on current template data, I can suggest specific improvements.',
        reasoning: 'Template performance can be enhanced through targeted optimizations.',
        action_items: [
          {
            action: 'analyze_top_performers',
            description: 'Analyze top-performing templates for common patterns',
            estimated_impact: 'Identify 3-5 optimization opportunities',
            difficulty: 'easy'
          }
        ],
        data_supporting: context.visibleData,
        confidence: 0.75,
        estimated_impact: { accuracy_improvement: 3 },
        timeframe: '1 hour',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        context: {
          current_page: context.pageName,
          user_action: intent,
          visible_data: context.visibleData
        },
        trigger: 'user_question'
      });
    }

    return suggestions;
  }

  private async generatePipelineSuggestions(context: any, intent: string): Promise<ContextualSuggestion[]> {
    return []; // Simplified for now
  }

  private async generateAnalyticsSuggestions(context: any, intent: string): Promise<ContextualSuggestion[]> {
    return []; // Simplified for now
  }

  private async generateSystemSuggestions(context: any, intent: string): Promise<ContextualSuggestion[]> {
    return []; // Simplified for now
  }

  private async detectPerformanceAnomalies(): Promise<any[]> {
    // Mock implementation - would use actual anomaly detection
    return [
      { metric: 'accuracy', current: 82.1, expected: 87.3, severity: 'medium' }
    ];
  }

  private async detectOpportunities(): Promise<any[]> {
    // Mock implementation - would use ML to detect opportunities
    return [
      { type: 'viral_pattern', description: 'New viral pattern detected in short-form content' }
    ];
  }

  private async generatePerformanceOptimizations(metrics: SystemMetrics): Promise<Suggestion[]> {
    const suggestions: Suggestion[] = [];

    if (metrics.pipeline_accuracy < 85) {
      suggestions.push(...await this.generateOptimizationSuggestions('accuracy', metrics.pipeline_accuracy));
    }

    if (metrics.processing_speed < 2.0) {
      suggestions.push(...await this.generateOptimizationSuggestions('processing_speed', metrics.processing_speed));
    }

    return suggestions;
  }

  private async generateViralPredictionInsights(trends: any): Promise<Suggestion[]> {
    return []; // Simplified for now
  }

  private async generateTemplateImprovements(trends: any): Promise<Suggestion[]> {
    return []; // Simplified for now
  }

  private async generatePipelineEfficiencySuggestions(metrics: SystemMetrics): Promise<Suggestion[]> {
    return []; // Simplified for now
  }

  private async generateProactiveAlerts(anomalies: any[]): Promise<Suggestion[]> {
    return []; // Simplified for now
  }

  private async generateOpportunitySuggestions(opportunities: any[]): Promise<Suggestion[]> {
    return []; // Simplified for now
  }

  private categorizeSuggestions(suggestions: Suggestion[]): SuggestionCategories {
    return {
      performance_optimizations: suggestions.filter(s => s.type === 'optimization'),
      viral_predictions: suggestions.filter(s => s.title.includes('viral') || s.title.includes('trend')),
      template_improvements: suggestions.filter(s => s.title.includes('template')),
      pipeline_efficiency: suggestions.filter(s => s.title.includes('pipeline')),
      proactive_alerts: suggestions.filter(s => s.type === 'warning')
    };
  }

  private getDefaultSuggestions(): SuggestionCategories {
    return {
      performance_optimizations: [],
      viral_predictions: [],
      template_improvements: [],
      pipeline_efficiency: [],
      proactive_alerts: []
    };
  }

  private hasSpecificTemplateId(query: string): boolean {
    return /template\s*#?\d+/i.test(query);
  }

  private hasSpecificMetric(query: string): boolean {
    return /accuracy|engagement|viral|performance|speed/i.test(query);
  }

  private hasTimeframe(query: string): boolean {
    return /\d+\s*(day|hour|week|month)|yesterday|today|last/i.test(query);
  }

  private hasComparisonTargets(query: string): boolean {
    return /vs|versus|against|with|to/i.test(query);
  }

  private async getCurrentThreshold(target: string): Promise<number> {
    // Mock implementation
    return 0.8;
  }

  private async isPipelineRunning(): Promise<boolean> {
    // Mock implementation
    return Math.random() > 0.7;
  }

  private async isModuleCritical(moduleId: string): Promise<boolean> {
    // Mock implementation
    return ['viral-filter', 'template-generator'].includes(moduleId);
  }
}