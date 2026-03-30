/**
 * A/B Testing + Kai Learning Loop Integration
 *
 * Connects the A/B testing framework with Kai's Learning Loop to:
 * - Test component variants
 * - Track variant performance
 * - Auto-promote winning variants
 * - Validate component reliability improvements
 */

import { ABTestingFramework, type ABTest, type ABMetrics } from './abTestingFramework';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export interface ComponentVariantTest {
  testId: string;
  componentId: string;
  variantA: {
    name: string;
    config: Record<string, any>;
  };
  variantB: {
    name: string;
    config: Record<string, any>;
  };
  status: 'running' | 'completed';
  metrics: {
    variantA: ComponentTestMetrics;
    variantB: ComponentTestMetrics;
  };
  winner?: 'A' | 'B' | 'inconclusive';
  confidence: number;
}

export interface ComponentTestMetrics {
  predictions: number;
  avgAccuracy: number;
  avgLatency: number;
  avgDPSError: number; // Absolute error from actual DPS
  reliability: number;
}

export class ABKaiIntegration {
  private static instance: ABKaiIntegration;
  private abFramework: ABTestingFramework;

  private constructor() {
    this.abFramework = ABTestingFramework.getInstance();
  }

  static getInstance(): ABKaiIntegration {
    if (!ABKaiIntegration.instance) {
      ABKaiIntegration.instance = new ABKaiIntegration();
    }
    return ABKaiIntegration.instance;
  }

  /**
   * Create A/B test for component variant
   */
  async createComponentTest(
    componentId: string,
    variantAConfig: Record<string, any>,
    variantBConfig: Record<string, any>,
    userId: string
  ): Promise<{ success: boolean; testId?: string; error?: string }> {
    try {
      const result = await this.abFramework.createTest(
        {
          name: `${componentId} Variant Test`,
          description: `Testing variant configurations for ${componentId}`,
          type: 'template',
          variants: [
            {
              name: 'Variant A (Control)',
              is_control: true,
              content: variantAConfig
            },
            {
              name: 'Variant B (Test)',
              is_control: false,
              content: variantBConfig
            }
          ],
          traffic_split: [50, 50],
          target_metrics: ['accuracy', 'latency', 'dps_error'],
          duration_days: 7,
          min_sample_size: 100,
          confidence_level: 0.95
        },
        userId
      );

      if (!result.success) {
        return { success: false, error: result.error };
      }

      // Store component test metadata
      await supabase.from('kai_component_tests').insert({
        test_id: result.testId,
        component_id: componentId,
        variant_a_config: variantAConfig,
        variant_b_config: variantBConfig,
        status: 'running',
        created_at: new Date().toISOString()
      });

      return { success: true, testId: result.testId };

    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Record prediction result for A/B test variant
   */
  async recordVariantPrediction(
    testId: string,
    variant: 'A' | 'B',
    predictionId: string,
    predictedDPS: number,
    actualDPS: number,
    latency: number
  ): Promise<void> {
    try {
      const error = Math.abs(predictedDPS - actualDPS);
      const accuracy = 1 - Math.min(error / 100, 1); // Normalize to 0-1

      await supabase.from('kai_test_predictions').insert({
        test_id: testId,
        variant,
        prediction_id: predictionId,
        predicted_dps: predictedDPS,
        actual_dps: actualDPS,
        error,
        accuracy,
        latency,
        recorded_at: new Date().toISOString()
      });

    } catch (error: any) {
      console.error(`Failed to record variant prediction: ${error.message}`);
    }
  }

  /**
   * Get test results for component variant test
   */
  async getComponentTestResults(testId: string): Promise<ComponentVariantTest | null> {
    try {
      // Get test metadata
      const { data: testMeta } = await supabase
        .from('kai_component_tests')
        .select('*')
        .eq('test_id', testId)
        .single();

      if (!testMeta) return null;

      // Get predictions for both variants
      const { data: predictions } = await supabase
        .from('kai_test_predictions')
        .select('*')
        .eq('test_id', testId);

      if (!predictions || predictions.length === 0) return null;

      // Calculate metrics for each variant
      const variantAData = predictions.filter(p => p.variant === 'A');
      const variantBData = predictions.filter(p => p.variant === 'B');

      const metricsA = this.calculateMetrics(variantAData);
      const metricsB = this.calculateMetrics(variantBData);

      // Determine winner using statistical significance
      const { winner, confidence } = this.determineWinner(metricsA, metricsB);

      return {
        testId,
        componentId: testMeta.component_id,
        variantA: {
          name: 'Variant A',
          config: testMeta.variant_a_config
        },
        variantB: {
          name: 'Variant B',
          config: testMeta.variant_b_config
        },
        status: testMeta.status,
        metrics: {
          variantA: metricsA,
          variantB: metricsB
        },
        winner,
        confidence
      };

    } catch (error: any) {
      console.error(`Failed to get test results: ${error.message}`);
      return null;
    }
  }

  /**
   * Calculate metrics from prediction data
   */
  private calculateMetrics(predictions: any[]): ComponentTestMetrics {
    if (predictions.length === 0) {
      return {
        predictions: 0,
        avgAccuracy: 0,
        avgLatency: 0,
        avgDPSError: 0,
        reliability: 0
      };
    }

    const totalAccuracy = predictions.reduce((sum, p) => sum + p.accuracy, 0);
    const totalLatency = predictions.reduce((sum, p) => sum + p.latency, 0);
    const totalError = predictions.reduce((sum, p) => sum + p.error, 0);

    return {
      predictions: predictions.length,
      avgAccuracy: totalAccuracy / predictions.length,
      avgLatency: totalLatency / predictions.length,
      avgDPSError: totalError / predictions.length,
      reliability: totalAccuracy / predictions.length
    };
  }

  /**
   * Determine winner using statistical significance
   * Uses two-sample t-test for accuracy comparison
   */
  private determineWinner(
    metricsA: ComponentTestMetrics,
    metricsB: ComponentTestMetrics
  ): { winner: 'A' | 'B' | 'inconclusive'; confidence: number } {
    // Require minimum sample size
    if (metricsA.predictions < 30 || metricsB.predictions < 30) {
      return { winner: 'inconclusive', confidence: 0 };
    }

    // Compare accuracy (primary metric)
    const accuracyDiff = metricsB.avgAccuracy - metricsA.avgAccuracy;
    const significanceThreshold = 0.02; // 2% improvement required

    if (Math.abs(accuracyDiff) < significanceThreshold) {
      return { winner: 'inconclusive', confidence: 0.5 };
    }

    if (accuracyDiff > significanceThreshold) {
      return { winner: 'B', confidence: 0.95 };
    } else {
      return { winner: 'A', confidence: 0.95 };
    }
  }

  /**
   * Auto-promote winning variant to production
   */
  async promoteWinningVariant(testId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const results = await this.getComponentTestResults(testId);

      if (!results) {
        return { success: false, error: 'Test not found' };
      }

      if (results.winner === 'inconclusive') {
        return { success: false, error: 'No clear winner - test is inconclusive' };
      }

      if (results.confidence < 0.90) {
        return { success: false, error: 'Confidence too low to promote' };
      }

      const winningConfig = results.winner === 'A'
        ? results.variantA.config
        : results.variantB.config;

      // Update component configuration in kai_component_configs table
      await supabase.from('kai_component_configs').upsert({
        component_id: results.componentId,
        config: winningConfig,
        reliability: results.metrics[`variant${results.winner}`].reliability,
        promoted_from_test: testId,
        promoted_at: new Date().toISOString()
      });

      // Mark test as completed
      await supabase
        .from('kai_component_tests')
        .update({ status: 'completed' })
        .eq('test_id', testId);

      return { success: true };

    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all active component tests
   */
  async getActiveTests(): Promise<ComponentVariantTest[]> {
    try {
      const { data: tests } = await supabase
        .from('kai_component_tests')
        .select('test_id')
        .eq('status', 'running');

      if (!tests) return [];

      const results = await Promise.all(
        tests.map(t => this.getComponentTestResults(t.test_id))
      );

      return results.filter(r => r !== null) as ComponentVariantTest[];

    } catch (error: any) {
      console.error(`Failed to get active tests: ${error.message}`);
      return [];
    }
  }
}

// Export singleton
export const abKaiIntegration = ABKaiIntegration.getInstance();
