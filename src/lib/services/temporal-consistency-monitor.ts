/**
 * Temporal Consistency Monitor
 *
 * Tracks component prediction accuracy over time and detects drift
 * using statistical methods:
 * - PSI (Population Stability Index)
 * - KS-Test (Kolmogorov-Smirnov Test)
 * - Rolling window analysis (7/14/30 days)
 */

import { SupabaseClient } from '@supabase/supabase-js';

export interface ComponentDriftMetrics {
  componentId: string;
  window: '7d' | '14d' | '30d';
  psi: number; // Population Stability Index (>0.25 = significant drift)
  ksStatistic: number; // KS test statistic (>0.2 = significant drift)
  pValue: number; // KS p-value (<0.05 = significant drift)
  avgAccuracy: number; // Average accuracy in window
  reliabilityChange: number; // Change in reliability score
  driftDetected: boolean;
  alertLevel: 'green' | 'yellow' | 'red';
  recommendations: string[];
}

export interface TimeWindow {
  start: Date;
  end: Date;
  label: string;
}

export class TemporalConsistencyMonitor {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Analyze component drift across all time windows
   */
  async analyzeComponentDrift(componentId: string): Promise<ComponentDriftMetrics[]> {
    const windows: Array<{ days: number; label: '7d' | '14d' | '30d' }> = [
      { days: 7, label: '7d' },
      { days: 14, label: '14d' },
      { days: 30, label: '30d' }
    ];

    const results: ComponentDriftMetrics[] = [];

    for (const window of windows) {
      const drift = await this.calculateDriftForWindow(componentId, window.days, window.label);
      results.push(drift);
    }

    return results;
  }

  /**
   * Calculate drift metrics for a specific time window
   */
  private async calculateDriftForWindow(
    componentId: string,
    windowDays: number,
    label: '7d' | '14d' | '30d'
  ): Promise<ComponentDriftMetrics> {
    const now = new Date();
    const windowStart = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);

    // Get baseline distribution (previous window)
    const baselineStart = new Date(windowStart.getTime() - windowDays * 24 * 60 * 60 * 1000);
    const baselineEnd = windowStart;

    // Get current window distribution
    const currentStart = windowStart;
    const currentEnd = now;

    // Fetch predictions from both windows
    const baselinePredictions = await this.getPredictions(componentId, baselineStart, baselineEnd);
    const currentPredictions = await this.getPredictions(componentId, currentStart, currentEnd);

    if (baselinePredictions.length === 0 || currentPredictions.length === 0) {
      return {
        componentId,
        window: label,
        psi: 0,
        ksStatistic: 0,
        pValue: 1,
        avgAccuracy: 0,
        reliabilityChange: 0,
        driftDetected: false,
        alertLevel: 'green',
        recommendations: ['Insufficient data for drift analysis']
      };
    }

    // Calculate PSI (Population Stability Index)
    const psi = this.calculatePSI(baselinePredictions, currentPredictions);

    // Calculate KS statistic and p-value
    const { ksStatistic, pValue } = this.calculateKSTest(baselinePredictions, currentPredictions);

    // Calculate accuracy metrics
    const avgAccuracy = this.calculateAvgAccuracy(currentPredictions);
    const baselineAccuracy = this.calculateAvgAccuracy(baselinePredictions);
    const reliabilityChange = avgAccuracy - baselineAccuracy;

    // Determine drift detection
    const driftDetected = psi > 0.25 || ksStatistic > 0.2 || pValue < 0.05;

    // Determine alert level
    let alertLevel: 'green' | 'yellow' | 'red' = 'green';
    if (psi > 0.25 || ksStatistic > 0.3 || reliabilityChange < -0.15) {
      alertLevel = 'red';
    } else if (psi > 0.15 || ksStatistic > 0.2 || reliabilityChange < -0.10) {
      alertLevel = 'yellow';
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      psi,
      ksStatistic,
      reliabilityChange,
      alertLevel
    );

    return {
      componentId,
      window: label,
      psi,
      ksStatistic,
      pValue,
      avgAccuracy,
      reliabilityChange,
      driftDetected,
      alertLevel,
      recommendations
    };
  }

  /**
   * Calculate Population Stability Index (PSI)
   * Measures shift in distribution between baseline and current
   */
  private calculatePSI(baseline: number[], current: number[]): number {
    // Create bins (0-20, 20-40, 40-60, 60-80, 80-100)
    const bins = [0, 20, 40, 60, 80, 100];
    const numBins = bins.length - 1;

    // Calculate distribution for each window
    const baselineDist = this.calculateDistribution(baseline, bins);
    const currentDist = this.calculateDistribution(current, bins);

    // Calculate PSI
    let psi = 0;
    for (let i = 0; i < numBins; i++) {
      const baselinePercent = baselineDist[i] || 0.0001; // Avoid log(0)
      const currentPercent = currentDist[i] || 0.0001;

      psi += (currentPercent - baselinePercent) * Math.log(currentPercent / baselinePercent);
    }

    return psi;
  }

  /**
   * Calculate distribution across bins
   */
  private calculateDistribution(values: number[], bins: number[]): number[] {
    const distribution: number[] = new Array(bins.length - 1).fill(0);
    const total = values.length;

    for (const value of values) {
      for (let i = 0; i < bins.length - 1; i++) {
        if (value >= bins[i] && value < bins[i + 1]) {
          distribution[i]++;
          break;
        }
      }
    }

    // Convert to percentages
    return distribution.map(count => count / total);
  }

  /**
   * Calculate Kolmogorov-Smirnov test statistic
   * Measures maximum distance between CDFs
   */
  private calculateKSTest(baseline: number[], current: number[]): { ksStatistic: number; pValue: number } {
    // Sort both arrays
    const sortedBaseline = [...baseline].sort((a, b) => a - b);
    const sortedCurrent = [...current].sort((a, b) => a - b);

    const n1 = sortedBaseline.length;
    const n2 = sortedCurrent.length;

    // Calculate empirical CDFs and find maximum distance
    let maxDiff = 0;
    let i = 0, j = 0;

    while (i < n1 && j < n2) {
      const cdf1 = (i + 1) / n1;
      const cdf2 = (j + 1) / n2;
      maxDiff = Math.max(maxDiff, Math.abs(cdf1 - cdf2));

      if (sortedBaseline[i] < sortedCurrent[j]) {
        i++;
      } else {
        j++;
      }
    }

    const ksStatistic = maxDiff;

    // Calculate p-value (approximation for large samples)
    const effectiveN = (n1 * n2) / (n1 + n2);
    const lambda = (Math.sqrt(effectiveN) + 0.12 + 0.11 / Math.sqrt(effectiveN)) * ksStatistic;

    // Kolmogorov distribution approximation
    let pValue = 0;
    for (let k = 1; k <= 10; k++) {
      pValue += Math.pow(-1, k - 1) * Math.exp(-2 * k * k * lambda * lambda);
    }
    pValue *= 2;
    pValue = Math.max(0, Math.min(1, pValue));

    return { ksStatistic, pValue };
  }

  /**
   * Calculate average prediction accuracy
   */
  private calculateAvgAccuracy(predictions: number[]): number {
    if (predictions.length === 0) return 0;
    return predictions.reduce((sum, val) => sum + val, 0) / predictions.length;
  }

  /**
   * Fetch predictions for a component in a time window
   */
  private async getPredictions(
    componentId: string,
    start: Date,
    end: Date
  ): Promise<number[]> {
    try {
      // Fetch from kai_learning_loop table
      const { data, error } = await this.supabase
        .from('kai_learning_loop')
        .select('prediction, actual_dps')
        .eq('component_id', componentId)
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .not('actual_dps', 'is', null);

      if (error) throw error;

      // Return prediction values
      return data.map(row => row.prediction);
    } catch (error) {
      console.error(`Error fetching predictions for ${componentId}:`, error);
      return [];
    }
  }

  /**
   * Generate recommendations based on drift metrics
   */
  private generateRecommendations(
    psi: number,
    ksStatistic: number,
    reliabilityChange: number,
    alertLevel: 'green' | 'yellow' | 'red'
  ): string[] {
    const recommendations: string[] = [];

    if (alertLevel === 'green') {
      recommendations.push('Component is performing consistently');
      return recommendations;
    }

    if (psi > 0.25) {
      recommendations.push('Significant distribution shift detected (PSI > 0.25)');
      recommendations.push('Consider retraining or recalibrating this component');
    }

    if (ksStatistic > 0.2) {
      recommendations.push('Large change in prediction distribution (KS > 0.2)');
      recommendations.push('Review recent data quality and feature changes');
    }

    if (reliabilityChange < -0.15) {
      recommendations.push('Significant accuracy degradation detected');
      recommendations.push('Reduce component weight in ensemble until issue is resolved');
    } else if (reliabilityChange < -0.10) {
      recommendations.push('Moderate accuracy decline detected');
      recommendations.push('Monitor closely for further degradation');
    }

    if (alertLevel === 'red') {
      recommendations.push('URGENT: Consider temporarily disabling this component');
    }

    return recommendations;
  }

  /**
   * Store drift metrics in database
   */
  async storeDriftMetrics(metrics: ComponentDriftMetrics): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('kai_drift_metrics')
        .insert({
          component_id: metrics.componentId,
          time_window: metrics.window,
          psi: metrics.psi,
          ks_statistic: metrics.ksStatistic,
          p_value: metrics.pValue,
          avg_accuracy: metrics.avgAccuracy,
          reliability_change: metrics.reliabilityChange,
          drift_detected: metrics.driftDetected,
          alert_level: metrics.alertLevel,
          recommendations: metrics.recommendations,
          analyzed_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error storing drift metrics:', error);
    }
  }

  /**
   * Get latest drift metrics for all components
   */
  async getLatestDriftMetrics(): Promise<ComponentDriftMetrics[]> {
    try {
      const { data, error } = await this.supabase
        .from('kai_drift_metrics')
        .select('*')
        .order('analyzed_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      return data.map(row => ({
        componentId: row.component_id,
        window: row.time_window,
        psi: row.psi,
        ksStatistic: row.ks_statistic,
        pValue: row.p_value,
        avgAccuracy: row.avg_accuracy,
        reliabilityChange: row.reliability_change,
        driftDetected: row.drift_detected,
        alertLevel: row.alert_level,
        recommendations: row.recommendations
      }));
    } catch (error) {
      console.error('Error fetching drift metrics:', error);
      return [];
    }
  }

  /**
   * Run full drift analysis for all components
   */
  async runFullDriftAnalysis(componentIds: string[]): Promise<void> {
    console.log('[Temporal Monitor] Starting drift analysis for', componentIds.length, 'components');

    for (const componentId of componentIds) {
      console.log(`[Temporal Monitor] Analyzing ${componentId}...`);

      const driftMetrics = await this.analyzeComponentDrift(componentId);

      for (const metrics of driftMetrics) {
        await this.storeDriftMetrics(metrics);

        if (metrics.alertLevel === 'red') {
          console.warn(`[Temporal Monitor] RED ALERT for ${componentId} (${metrics.window}):`, metrics.recommendations);
        } else if (metrics.alertLevel === 'yellow') {
          console.warn(`[Temporal Monitor] YELLOW ALERT for ${componentId} (${metrics.window}):`, metrics.recommendations);
        }
      }
    }

    console.log('[Temporal Monitor] Drift analysis complete');
  }
}
