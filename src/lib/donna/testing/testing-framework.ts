/**
 * Framework 2: Testing & Validation Framework
 *
 * Five comprehensive testing methods to validate The Donna's prediction accuracy:
 * 1. Historical Test - Test on 100 old videos with known outcomes
 * 2. Live Tracking - Scrape fresh → predict → track for 7 days
 * 3. Synthetic A/B - Create variations, test ranking consistency
 * 4. Cross-Platform - Same content on TikTok vs Instagram
 * 5. Temporal Consistency - Same input → consistent predictions
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ============================================================================
// TYPES
// ============================================================================

export interface TestResult {
  testId: string;
  testType: '1-historical' | '2-live-tracking' | '3-synthetic-ab' | '4-cross-platform' | '5-temporal-consistency';
  testName: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;

  // Results
  totalSamples: number;
  successfulPredictions: number;
  failedPredictions: number;

  // Accuracy metrics
  meanAbsoluteError?: number;
  rootMeanSquaredError?: number;
  r2Score?: number;
  classificationAccuracy?: number; // % correct viral/not-viral
  withinRangePercent?: number; // % within prediction range

  // Details
  details: any;
  errors: string[];
}

export interface HistoricalTestConfig {
  sampleSize: number; // Default: 100
  minDPS?: number; // Filter videos by minimum DPS
  maxDPS?: number; // Filter videos by maximum DPS
  randomSample?: boolean; // Random or stratified sampling
}

export interface LiveTrackingTestConfig {
  duration: '24hr' | '7day'; // How long to track
  targetCount: number; // How many videos to track
  scrapeInterval: number; // Minutes between scraping
}

export interface SyntheticABTestConfig {
  baseVideoId: string; // Source video to create variations from
  variationCount: number; // Number of variations to test
  variationType: 'caption' | 'hashtags' | 'hook' | 'combined';
}

// ============================================================================
// TEST 1: HISTORICAL VALIDATION
// ============================================================================

export class HistoricalTest {
  private static instance: HistoricalTest;

  private constructor() {}

  static getInstance(): HistoricalTest {
    if (!HistoricalTest.instance) {
      HistoricalTest.instance = new HistoricalTest();
    }
    return HistoricalTest.instance;
  }

  /**
   * Test 1: Historical Validation
   *
   * Tests The Donna on 100 videos with known outcomes.
   * These are old videos from our database with confirmed DPS scores.
   */
  async run(config: HistoricalTestConfig = { sampleSize: 100 }): Promise<TestResult> {
    const testId = `hist-${Date.now()}`;
    const result: TestResult = {
      testId,
      testType: '1-historical',
      testName: 'Historical Validation Test',
      status: 'running',
      startedAt: new Date(),
      totalSamples: 0,
      successfulPredictions: 0,
      failedPredictions: 0,
      details: {},
      errors: []
    };

    try {
      console.log(`\n🧪 TEST 1: Historical Validation`);
      console.log(`   Sample size: ${config.sampleSize} videos\n`);

      // Step 1: Fetch historical videos with known DPS
      const videos = await this.fetchHistoricalVideos(config);
      result.totalSamples = videos.length;

      console.log(`   ✓ Fetched ${videos.length} historical videos`);

      // Step 2: Generate predictions for each
      const predictions = [];
      const actuals = [];
      const errors = [];

      for (let i = 0; i < videos.length; i++) {
        const video = videos[i];

        try {
          // Call The Donna API
          const prediction = await this.predictVideo(video);

          predictions.push(prediction.predictedDPS);
          actuals.push(video.actual_dps);

          const error = Math.abs(prediction.predictedDPS - video.actual_dps);
          errors.push(error);

          result.successfulPredictions++;

          if ((i + 1) % 10 === 0) {
            console.log(`   Progress: ${i + 1}/${videos.length} predictions`);
          }

        } catch (error) {
          result.failedPredictions++;
          result.errors.push(`Video ${video.video_id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Step 3: Calculate accuracy metrics
      result.meanAbsoluteError = this.calculateMAE(errors);
      result.rootMeanSquaredError = this.calculateRMSE(errors);
      result.r2Score = this.calculateR2(predictions, actuals);
      result.classificationAccuracy = this.calculateClassificationAccuracy(predictions, actuals);
      result.withinRangePercent = this.calculateWithinRangePercent(predictions, actuals);

      result.details = {
        predictions,
        actuals,
        errors,
        avgError: result.meanAbsoluteError,
        medianError: this.calculateMedian(errors),
        minError: Math.min(...errors),
        maxError: Math.max(...errors)
      };

      result.status = 'completed';
      result.completedAt = new Date();

      // Step 4: Store results in database
      await this.storeResults(result);

      console.log(`\n   ✅ TEST 1 COMPLETE`);
      console.log(`   MAE: ${result.meanAbsoluteError?.toFixed(2)} DPS`);
      console.log(`   RMSE: ${result.rootMeanSquaredError?.toFixed(2)} DPS`);
      console.log(`   R²: ${result.r2Score?.toFixed(4)}`);
      console.log(`   Classification Accuracy: ${(result.classificationAccuracy! * 100).toFixed(1)}%`);
      console.log(`   Within Range: ${result.withinRangePercent?.toFixed(1)}%\n`);

      return result;

    } catch (error) {
      result.status = 'failed';
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
      return result;
    }
  }

  /**
   * Fetch historical videos from database
   */
  private async fetchHistoricalVideos(config: HistoricalTestConfig): Promise<any[]> {
    let query = supabase
      .from('scraped_videos')
      .select('video_id, transcript_text, title, description_text, hashtags, duration, dps_score, views_count, likes_count')
      .not('transcript_text', 'is', null)
      .not('dps_score', 'is', null);

    if (config.minDPS) {
      query = query.gte('dps_score', config.minDPS);
    }

    if (config.maxDPS) {
      query = query.lte('dps_score', config.maxDPS);
    }

    query = query.limit(config.sampleSize);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return (data || []).map(v => ({
      video_id: v.video_id,
      transcript: v.transcript_text,
      caption: v.description_text || '',
      hashtags: v.hashtags || [],
      duration: v.duration,
      actual_dps: v.dps_score,
      creatorFollowers: 0 // Historical data may not have this
    }));
  }

  /**
   * Call The Donna API to predict DPS
   */
  private async predictVideo(video: any): Promise<any> {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const response = await fetch(`${apiUrl}/api/donna/reason`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: {
          type: 'fresh_video',
          data: {
            transcript: video.transcript,
            caption: video.caption,
            hashtags: video.hashtags,
            duration: video.duration,
            creatorFollowers: video.creatorFollowers
          }
        },
        mode: 'balanced'
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const result = await response.json();
    return result.prediction;
  }

  /**
   * Calculate Mean Absolute Error
   */
  private calculateMAE(errors: number[]): number {
    return errors.reduce((sum, e) => sum + e, 0) / errors.length;
  }

  /**
   * Calculate Root Mean Squared Error
   */
  private calculateRMSE(errors: number[]): number {
    const squaredErrors = errors.map(e => e * e);
    const meanSquaredError = squaredErrors.reduce((sum, e) => sum + e, 0) / errors.length;
    return Math.sqrt(meanSquaredError);
  }

  /**
   * Calculate R² score
   */
  private calculateR2(predictions: number[], actuals: number[]): number {
    const mean = actuals.reduce((sum, a) => sum + a, 0) / actuals.length;
    const ssTotal = actuals.reduce((sum, a) => sum + Math.pow(a - mean, 2), 0);
    const ssResidual = predictions.reduce((sum, p, i) => sum + Math.pow(actuals[i] - p, 2), 0);
    return 1 - (ssResidual / ssTotal);
  }

  /**
   * Calculate classification accuracy (viral vs not-viral)
   */
  private calculateClassificationAccuracy(predictions: number[], actuals: number[]): number {
    let correct = 0;
    const threshold = 70; // Viral threshold

    for (let i = 0; i < predictions.length; i++) {
      const predictedViral = predictions[i] >= threshold;
      const actualViral = actuals[i] >= threshold;
      if (predictedViral === actualViral) {
        correct++;
      }
    }

    return correct / predictions.length;
  }

  /**
   * Calculate % of predictions within ±10% range
   */
  private calculateWithinRangePercent(predictions: number[], actuals: number[]): number {
    let withinRange = 0;

    for (let i = 0; i < predictions.length; i++) {
      const range = Math.max(actuals[i] * 0.1, 5); // ±10% or ±5 points
      const error = Math.abs(predictions[i] - actuals[i]);
      if (error <= range) {
        withinRange++;
      }
    }

    return (withinRange / predictions.length) * 100;
  }

  /**
   * Calculate median
   */
  private calculateMedian(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  /**
   * Store test results in database
   */
  private async storeResults(result: TestResult): Promise<void> {
    await supabase
      .from('test_results')
      .insert({
        test_id: result.testId,
        test_type: result.testType,
        test_name: result.testName,
        status: result.status,
        started_at: result.startedAt.toISOString(),
        completed_at: result.completedAt?.toISOString(),
        total_samples: result.totalSamples,
        successful_predictions: result.successfulPredictions,
        failed_predictions: result.failedPredictions,
        mean_absolute_error: result.meanAbsoluteError,
        rmse: result.rootMeanSquaredError,
        r2_score: result.r2Score,
        classification_accuracy: result.classificationAccuracy,
        within_range_percent: result.withinRangePercent,
        details: result.details,
        errors: result.errors
      });
  }
}

// ============================================================================
// TEST 2: LIVE TRACKING TEST
// ============================================================================

export class LiveTrackingTest {
  private static instance: LiveTrackingTest;

  private constructor() {}

  static getInstance(): LiveTrackingTest {
    if (!LiveTrackingTest.instance) {
      LiveTrackingTest.instance = new LiveTrackingTest();
    }
    return LiveTrackingTest.instance;
  }

  /**
   * Test 2: Live Tracking Validation
   *
   * Scrapes fresh videos, predicts immediately, tracks for 7 days.
   * This is already implemented in Framework 1 (ViralScrapingWorkflow).
   *
   * This test monitors the existing workflow and reports on accuracy.
   */
  async run(config: LiveTrackingTestConfig = { duration: '7day', targetCount: 50, scrapeInterval: 5 }): Promise<TestResult> {
    const testId = `live-${Date.now()}`;
    const result: TestResult = {
      testId,
      testType: '2-live-tracking',
      testName: 'Live Tracking Validation Test',
      status: 'running',
      startedAt: new Date(),
      totalSamples: 0,
      successfulPredictions: 0,
      failedPredictions: 0,
      details: {},
      errors: []
    };

    console.log(`\n🧪 TEST 2: Live Tracking Validation`);
    console.log(`   Duration: ${config.duration}`);
    console.log(`   Target: ${config.targetCount} videos\n`);

    try {
      // Check existing Framework 1 predictions
      const { data: recentPredictions, error } = await supabase
        .from('prediction_validations')
        .select('*')
        .eq('tracking_status', 'completed')
        .eq('final_checkpoint', config.duration)
        .order('validated_at', { ascending: false })
        .limit(config.targetCount);

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      result.totalSamples = recentPredictions?.length || 0;

      // Calculate accuracy from completed validations
      const predictions = [];
      const actuals = [];
      const errors = [];

      for (const pred of recentPredictions || []) {
        if (pred.predicted_dps && pred.final_dps) {
          predictions.push(pred.predicted_dps);
          actuals.push(pred.final_dps);
          errors.push(pred.error);
          result.successfulPredictions++;
        } else {
          result.failedPredictions++;
        }
      }

      // Calculate metrics
      if (errors.length > 0) {
        result.meanAbsoluteError = errors.reduce((sum, e) => sum + e, 0) / errors.length;
        result.rootMeanSquaredError = Math.sqrt(
          errors.reduce((sum, e) => sum + e * e, 0) / errors.length
        );

        result.classificationAccuracy = recentPredictions!.filter(p => p.correct_classification).length / recentPredictions!.length;
        result.withinRangePercent = (recentPredictions!.filter(p => p.within_range).length / recentPredictions!.length) * 100;
      }

      result.details = {
        predictions,
        actuals,
        errors,
        trackingDuration: config.duration
      };

      result.status = 'completed';
      result.completedAt = new Date();

      console.log(`\n   ✅ TEST 2 COMPLETE`);
      console.log(`   Validated Predictions: ${result.successfulPredictions}`);
      console.log(`   MAE: ${result.meanAbsoluteError?.toFixed(2)} DPS`);
      console.log(`   Classification Accuracy: ${(result.classificationAccuracy! * 100).toFixed(1)}%\n`);

      return result;

    } catch (error) {
      result.status = 'failed';
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
      return result;
    }
  }
}

// ============================================================================
// TESTING FRAMEWORK ORCHESTRATOR
// ============================================================================

export class TestingFramework {
  private static instance: TestingFramework;

  private constructor() {}

  static getInstance(): TestingFramework {
    if (!TestingFramework.instance) {
      TestingFramework.instance = new TestingFramework();
    }
    return TestingFramework.instance;
  }

  /**
   * Run all tests sequentially
   */
  async runAllTests(): Promise<TestResult[]> {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  THE DONNA - TESTING FRAMEWORK');
    console.log('  Running all 5 validation tests...');
    console.log('═══════════════════════════════════════════════════════════\n');

    const results: TestResult[] = [];

    // Test 1: Historical Validation
    const test1 = await HistoricalTest.getInstance().run({ sampleSize: 100 });
    results.push(test1);

    // Test 2: Live Tracking (uses existing Framework 1 data)
    const test2 = await LiveTrackingTest.getInstance().run({ duration: '24hr', targetCount: 50, scrapeInterval: 5 });
    results.push(test2);

    // TODO: Implement Tests 3, 4, 5
    console.log('\n   ⚠️  Tests 3-5 not yet implemented (synthetic A/B, cross-platform, temporal consistency)');

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  TESTING COMPLETE');
    console.log('═══════════════════════════════════════════════════════════\n');

    this.printSummary(results);

    return results;
  }

  /**
   * Print summary of all test results
   */
  private printSummary(results: TestResult[]): void {
    console.log('┌─────────────────────────────────────────────────────────┐');
    console.log('│                    TEST SUMMARY                         │');
    console.log('├─────────────────────────────────────────────────────────┤');

    for (const result of results) {
      console.log(`│ ${result.testName.padEnd(40)} │`);
      console.log(`│   Status: ${result.status.padEnd(38)} │`);
      console.log(`│   MAE: ${(result.meanAbsoluteError?.toFixed(2) || 'N/A').padEnd(41)} │`);
      console.log(`│   Accuracy: ${((result.classificationAccuracy || 0) * 100).toFixed(1)}%${''.padEnd(35)} │`);
      console.log('├─────────────────────────────────────────────────────────┤');
    }

    console.log('└─────────────────────────────────────────────────────────┘\n');
  }
}
