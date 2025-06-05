import { supabaseClient } from '@/lib/supabase-client';
import { Niche, Platform } from '@/lib/types/database';

// Types for A/B testing
export interface ABTest {
  id: string;
  name: string;
  description: string;
  type: 'landing_page' | 'email' | 'template' | 'hook' | 'cta';
  status: 'draft' | 'running' | 'paused' | 'completed';
  variants: ABVariant[];
  traffic_split: number[]; // Percentage allocation for each variant
  target_metrics: string[];
  min_sample_size: number;
  confidence_level: number;
  start_date: string;
  end_date?: string;
  created_by: string;
  metadata: Record<string, any>;
}

export interface ABVariant {
  id: string;
  name: string;
  is_control: boolean;
  content: Record<string, any>;
  traffic_percentage: number;
  metrics: ABMetrics;
}

export interface ABMetrics {
  impressions: number;
  conversions: number;
  conversion_rate: number;
  revenue?: number;
  engagement_rate?: number;
  time_on_page?: number;
  bounce_rate?: number;
  viral_score?: number;
}

export interface ABTestResult {
  test_id: string;
  winning_variant: string;
  confidence: number;
  lift: number;
  statistical_significance: boolean;
  recommendation: 'continue' | 'end_test' | 'extend_test' | 'inconclusive';
  insights: string[];
  detailed_results: Array<{
    variant_id: string;
    variant_name: string;
    metrics: ABMetrics;
    confidence_interval: { lower: number; upper: number };
  }>;
}

export interface TestCreationParams {
  name: string;
  description: string;
  type: ABTest['type'];
  target_niche?: Niche;
  target_platform?: Platform;
  variants: Array<{
    name: string;
    is_control: boolean;
    content: Record<string, any>;
  }>;
  traffic_split?: number[];
  target_metrics: string[];
  duration_days: number;
  min_sample_size?: number;
  confidence_level?: number;
}

/**
 * A/B Testing Framework for TRENDZO
 * Enables systematic testing of landing pages, templates, and content variations
 */
export class ABTestingFramework {
  private static instance: ABTestingFramework;

  private constructor() {}

  static getInstance(): ABTestingFramework {
    if (!ABTestingFramework.instance) {
      ABTestingFramework.instance = new ABTestingFramework();
    }
    return ABTestingFramework.instance;
  }

  /**
   * Create a new A/B test
   */
  async createTest(params: TestCreationParams, userId: string): Promise<{ success: boolean; testId?: string; error?: string }> {
    try {
      // Validate parameters
      const validation = this.validateTestParams(params);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Generate test ID
      const testId = `ab_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Set default traffic split if not provided
      const trafficSplit = params.traffic_split || 
        Array(params.variants.length).fill(100 / params.variants.length);

      // Create test object
      const test: ABTest = {
        id: testId,
        name: params.name,
        description: params.description,
        type: params.type,
        status: 'draft',
        variants: params.variants.map((variant, index) => ({
          id: `${testId}_variant_${index}`,
          name: variant.name,
          is_control: variant.is_control,
          content: variant.content,
          traffic_percentage: trafficSplit[index],
          metrics: {
            impressions: 0,
            conversions: 0,
            conversion_rate: 0
          }
        })),
        traffic_split: trafficSplit,
        target_metrics: params.target_metrics,
        min_sample_size: params.min_sample_size || 100,
        confidence_level: params.confidence_level || 95,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + params.duration_days * 24 * 60 * 60 * 1000).toISOString(),
        created_by: userId,
        metadata: {
          target_niche: params.target_niche,
          target_platform: params.target_platform,
          created_at: new Date().toISOString()
        }
      };

      // Save to database
      const { error } = await supabaseClient
        .from('ab_tests')
        .insert([test]);

      if (error) {
        console.error('Failed to create A/B test:', error);
        return { success: false, error: 'Failed to save test to database' };
      }

      return { success: true, testId };
    } catch (error) {
      console.error('Error creating A/B test:', error);
      return { success: false, error: 'Unexpected error occurred' };
    }
  }

  /**
   * Start an A/B test
   */
  async startTest(testId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabaseClient
        .from('ab_tests')
        .update({ 
          status: 'running',
          start_date: new Date().toISOString()
        })
        .eq('id', testId);

      if (error) {
        return { success: false, error: 'Failed to start test' };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Unexpected error occurred' };
    }
  }

  /**
   * Get variant for user (handles traffic allocation)
   */
  async getVariantForUser(testId: string, userId: string): Promise<{ variant?: ABVariant; error?: string }> {
    try {
      // Get test details
      const { data: test, error } = await supabaseClient
        .from('ab_tests')
        .select('*')
        .eq('id', testId)
        .eq('status', 'running')
        .single();

      if (error || !test) {
        return { error: 'Test not found or not running' };
      }

      // Check if user already has a variant assigned
      const { data: assignment } = await supabaseClient
        .from('ab_test_assignments')
        .select('variant_id')
        .eq('test_id', testId)
        .eq('user_id', userId)
        .single();

      if (assignment) {
        // Return existing assignment
        const variant = test.variants.find((v: ABVariant) => v.id === assignment.variant_id);
        return { variant };
      }

      // Assign new variant based on traffic split
      const variant = this.assignVariant(test.variants, test.traffic_split, userId);

      // Save assignment
      await supabaseClient
        .from('ab_test_assignments')
        .insert([{
          test_id: testId,
          user_id: userId,
          variant_id: variant.id,
          assigned_at: new Date().toISOString()
        }]);

      return { variant };
    } catch (error) {
      console.error('Error getting variant for user:', error);
      return { error: 'Failed to assign variant' };
    }
  }

  /**
   * Track conversion for A/B test
   */
  async trackConversion(
    testId: string,
    variantId: string,
    userId: string,
    conversionType: string,
    value?: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Record conversion event
      const { error: eventError } = await supabaseClient
        .from('ab_test_events')
        .insert([{
          test_id: testId,
          variant_id: variantId,
          user_id: userId,
          event_type: 'conversion',
          conversion_type: conversionType,
          value: value || 0,
          timestamp: new Date().toISOString()
        }]);

      if (eventError) {
        return { success: false, error: 'Failed to record conversion' };
      }

      // Update variant metrics
      await this.updateVariantMetrics(testId, variantId);

      return { success: true };
    } catch (error) {
      console.error('Error tracking conversion:', error);
      return { success: false, error: 'Failed to track conversion' };
    }
  }

  /**
   * Track impression for A/B test
   */
  async trackImpression(
    testId: string,
    variantId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Record impression event
      const { error } = await supabaseClient
        .from('ab_test_events')
        .insert([{
          test_id: testId,
          variant_id: variantId,
          user_id: userId,
          event_type: 'impression',
          timestamp: new Date().toISOString()
        }]);

      if (error) {
        return { success: false, error: 'Failed to record impression' };
      }

      // Update variant metrics
      await this.updateVariantMetrics(testId, variantId);

      return { success: true };
    } catch (error) {
      console.error('Error tracking impression:', error);
      return { success: false, error: 'Failed to track impression' };
    }
  }

  /**
   * Get test results and analysis
   */
  async getTestResults(testId: string): Promise<{ results?: ABTestResult; error?: string }> {
    try {
      // Get test data
      const { data: test, error } = await supabaseClient
        .from('ab_tests')
        .select('*')
        .eq('id', testId)
        .single();

      if (error || !test) {
        return { error: 'Test not found' };
      }

      // Calculate statistical significance
      const results = await this.calculateTestResults(test);

      return { results };
    } catch (error) {
      console.error('Error getting test results:', error);
      return { error: 'Failed to get test results' };
    }
  }

  /**
   * Get all tests for a user
   */
  async getUserTests(userId: string): Promise<{ tests?: ABTest[]; error?: string }> {
    try {
      const { data: tests, error } = await supabaseClient
        .from('ab_tests')
        .select('*')
        .eq('created_by', userId)
        .order('created_at', { ascending: false });

      if (error) {
        return { error: 'Failed to fetch tests' };
      }

      return { tests: tests || [] };
    } catch (error) {
      return { error: 'Failed to fetch tests' };
    }
  }

  /**
   * End a test and determine winner
   */
  async endTest(testId: string): Promise<{ success: boolean; results?: ABTestResult; error?: string }> {
    try {
      // Get final results
      const { results, error: resultsError } = await this.getTestResults(testId);
      if (resultsError || !results) {
        return { success: false, error: resultsError || 'Failed to get results' };
      }

      // Update test status
      const { error } = await supabaseClient
        .from('ab_tests')
        .update({ 
          status: 'completed',
          end_date: new Date().toISOString()
        })
        .eq('id', testId);

      if (error) {
        return { success: false, error: 'Failed to end test' };
      }

      return { success: true, results };
    } catch (error) {
      console.error('Error ending test:', error);
      return { success: false, error: 'Failed to end test' };
    }
  }

  /**
   * Create landing page test variants
   */
  async createLandingPageTest(params: {
    name: string;
    niche: Niche;
    platform: Platform;
    controlContent: any;
    testVariants: Array<{ name: string; content: any }>;
    duration_days: number;
  }): Promise<{ success: boolean; testId?: string; error?: string }> {
    const variants = [
      {
        name: 'Control',
        is_control: true,
        content: params.controlContent
      },
      ...params.testVariants.map(variant => ({
        name: variant.name,
        is_control: false,
        content: variant.content
      }))
    ];

    return this.createTest({
      name: params.name,
      description: `Landing page test for ${params.niche} on ${params.platform}`,
      type: 'landing_page',
      target_niche: params.niche,
      target_platform: params.platform,
      variants,
      target_metrics: ['conversion_rate', 'time_on_page', 'bounce_rate'],
      duration_days: params.duration_days
    }, 'system');
  }

  /**
   * Create template hook test
   */
  async createHookTest(params: {
    name: string;
    templateId: string;
    hooks: Array<{ name: string; content: string; is_control?: boolean }>;
    duration_days: number;
  }): Promise<{ success: boolean; testId?: string; error?: string }> {
    const variants = params.hooks.map(hook => ({
      name: hook.name,
      is_control: hook.is_control || false,
      content: { hook: hook.content, templateId: params.templateId }
    }));

    return this.createTest({
      name: params.name,
      description: `Hook test for template ${params.templateId}`,
      type: 'hook',
      variants,
      target_metrics: ['conversion_rate', 'viral_score', 'engagement_rate'],
      duration_days: params.duration_days
    }, 'system');
  }

  /**
   * Private helper methods
   */
  private validateTestParams(params: TestCreationParams): { valid: boolean; error?: string } {
    if (params.variants.length < 2) {
      return { valid: false, error: 'At least 2 variants required' };
    }

    const controlVariants = params.variants.filter(v => v.is_control);
    if (controlVariants.length !== 1) {
      return { valid: false, error: 'Exactly one control variant required' };
    }

    if (params.traffic_split && params.traffic_split.length !== params.variants.length) {
      return { valid: false, error: 'Traffic split must match number of variants' };
    }

    if (params.traffic_split && Math.abs(params.traffic_split.reduce((a, b) => a + b, 0) - 100) > 0.01) {
      return { valid: false, error: 'Traffic split must sum to 100%' };
    }

    return { valid: true };
  }

  private assignVariant(variants: ABVariant[], trafficSplit: number[], userId: string): ABVariant {
    // Use user ID hash for consistent assignment
    const hash = this.hashString(userId);
    const random = (hash % 10000) / 100; // 0-99.99

    let cumulative = 0;
    for (let i = 0; i < variants.length; i++) {
      cumulative += trafficSplit[i];
      if (random < cumulative) {
        return variants[i];
      }
    }

    return variants[0]; // Fallback
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private async updateVariantMetrics(testId: string, variantId: string): Promise<void> {
    try {
      // Get event counts
      const { data: events } = await supabaseClient
        .from('ab_test_events')
        .select('event_type, value')
        .eq('test_id', testId)
        .eq('variant_id', variantId);

      if (!events) return;

      const impressions = events.filter(e => e.event_type === 'impression').length;
      const conversions = events.filter(e => e.event_type === 'conversion').length;
      const conversionRate = impressions > 0 ? (conversions / impressions) * 100 : 0;
      const revenue = events
        .filter(e => e.event_type === 'conversion')
        .reduce((sum, e) => sum + (e.value || 0), 0);

      // Update metrics in test record
      const { data: test } = await supabaseClient
        .from('ab_tests')
        .select('variants')
        .eq('id', testId)
        .single();

      if (test) {
        const updatedVariants = test.variants.map((v: ABVariant) => {
          if (v.id === variantId) {
            return {
              ...v,
              metrics: {
                ...v.metrics,
                impressions,
                conversions,
                conversion_rate: conversionRate,
                revenue
              }
            };
          }
          return v;
        });

        await supabaseClient
          .from('ab_tests')
          .update({ variants: updatedVariants })
          .eq('id', testId);
      }
    } catch (error) {
      console.error('Error updating variant metrics:', error);
    }
  }

  private async calculateTestResults(test: ABTest): Promise<ABTestResult> {
    const controlVariant = test.variants.find(v => v.is_control);
    const testVariants = test.variants.filter(v => !v.is_control);

    if (!controlVariant) {
      throw new Error('No control variant found');
    }

    let winningVariant = controlVariant;
    let maxLift = 0;
    let maxConfidence = 0;

    const detailedResults = test.variants.map(variant => {
      const confidence = this.calculateConfidence(variant, controlVariant);
      const lift = this.calculateLift(variant, controlVariant);

      if (lift > maxLift && confidence > 90) {
        winningVariant = variant;
        maxLift = lift;
        maxConfidence = confidence;
      }

      return {
        variant_id: variant.id,
        variant_name: variant.name,
        metrics: variant.metrics,
        confidence_interval: this.calculateConfidenceInterval(variant)
      };
    });

    const statisticalSignificance = maxConfidence >= test.confidence_level;
    const recommendation = this.getRecommendation(test, maxConfidence, maxLift);

    return {
      test_id: test.id,
      winning_variant: winningVariant.id,
      confidence: maxConfidence,
      lift: maxLift,
      statistical_significance: statisticalSignificance,
      recommendation,
      insights: this.generateInsights(test, detailedResults),
      detailed_results: detailedResults
    };
  }

  private calculateConfidence(variant: ABVariant, control: ABVariant): number {
    // Simplified confidence calculation (in production, use proper statistical tests)
    const variantRate = variant.metrics.conversion_rate / 100;
    const controlRate = control.metrics.conversion_rate / 100;
    const variantSample = variant.metrics.impressions;
    const controlSample = control.metrics.impressions;

    if (variantSample < 30 || controlSample < 30) return 0;

    // Basic z-test approximation
    const pooledRate = (variant.metrics.conversions + control.metrics.conversions) / 
                      (variantSample + controlSample);
    
    const standardError = Math.sqrt(
      pooledRate * (1 - pooledRate) * (1/variantSample + 1/controlSample)
    );

    if (standardError === 0) return 0;

    const zScore = Math.abs(variantRate - controlRate) / standardError;
    
    // Convert z-score to confidence level (simplified)
    if (zScore > 2.58) return 99;
    if (zScore > 1.96) return 95;
    if (zScore > 1.65) return 90;
    if (zScore > 1.28) return 80;
    return Math.max(0, Math.min(100, zScore * 40));
  }

  private calculateLift(variant: ABVariant, control: ABVariant): number {
    if (control.metrics.conversion_rate === 0) return 0;
    return ((variant.metrics.conversion_rate - control.metrics.conversion_rate) / 
            control.metrics.conversion_rate) * 100;
  }

  private calculateConfidenceInterval(variant: ABVariant): { lower: number; upper: number } {
    const rate = variant.metrics.conversion_rate / 100;
    const n = variant.metrics.impressions;

    if (n < 30) return { lower: 0, upper: 0 };

    const margin = 1.96 * Math.sqrt((rate * (1 - rate)) / n);
    return {
      lower: Math.max(0, (rate - margin) * 100),
      upper: Math.min(100, (rate + margin) * 100)
    };
  }

  private getRecommendation(
    test: ABTest, 
    confidence: number, 
    lift: number
  ): ABTestResult['recommendation'] {
    const minSampleReached = test.variants.every(v => v.metrics.impressions >= test.min_sample_size);
    const testEnded = test.end_date ? new Date() > new Date(test.end_date) : false;

    if (!minSampleReached && !testEnded) {
      return 'continue';
    }

    if (confidence >= test.confidence_level && lift > 5) {
      return 'end_test';
    }

    if (confidence < 80 && !testEnded) {
      return 'extend_test';
    }

    return 'inconclusive';
  }

  private generateInsights(test: ABTest, results: any[]): string[] {
    const insights = [];

    const bestVariant = results.reduce((best, current) => 
      current.metrics.conversion_rate > best.metrics.conversion_rate ? current : best
    );

    insights.push(`Best performing variant: ${bestVariant.variant_name}`);

    const totalImpressions = results.reduce((sum, r) => sum + r.metrics.impressions, 0);
    insights.push(`Total impressions: ${totalImpressions.toLocaleString()}`);

    const avgConversionRate = results.reduce((sum, r) => sum + r.metrics.conversion_rate, 0) / results.length;
    insights.push(`Average conversion rate: ${avgConversionRate.toFixed(2)}%`);

    if (test.type === 'landing_page') {
      insights.push('Consider testing different headlines or CTAs next');
    }

    return insights;
  }
}

// Export singleton instance
export const abTestingFramework = ABTestingFramework.getInstance();