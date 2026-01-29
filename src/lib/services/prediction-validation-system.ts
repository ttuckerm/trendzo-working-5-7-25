/**
 * PREDICTION VALIDATION SYSTEM
 * 
 * This system is critical for achieving ≥90% accuracy by:
 * 1. Tracking all predictions made by the system
 * 2. Validating against actual 48-hour performance
 * 3. Calculating real accuracy metrics that can be publicly displayed
 * 4. Providing feedback loops for continuous algorithm improvement
 * 
 * SUCCESS METRICS:
 * - Track accuracy: "91.3% accurate - 274/300 correct predictions"
 * - Validate within 48 hours of content posting
 * - Provide confidence intervals and error analysis
 * - Enable real-time accuracy dashboard updates
 */

import { createClient } from '@supabase/supabase-js';

export interface PredictionValidationEntry {
  id: string;
  prediction_id: string;
  video_id: string;
  predicted_viral_score: number;
  predicted_views: number;
  predicted_probability: number;
  
  // Actual performance (filled after 48 hours)
  actual_views?: number;
  actual_likes?: number;
  actual_comments?: number;
  actual_shares?: number;
  actual_viral_score?: number;
  
  // Validation results
  is_validated: boolean;
  accuracy_percentage?: number;
  prediction_error?: number;
  validation_timestamp?: string;
  validation_status: 'pending' | 'validated' | 'failed';
  
  // Metadata
  platform: string;
  content_type: string;
  creator_followers: number;
  prediction_timestamp: string;
  validation_window_hours: number;
}

export interface AccuracyMetrics {
  overall_accuracy: number;
  total_predictions: number;
  correct_predictions: number;
  accuracy_trend: {
    last_24h: number;
    last_7d: number;
    last_30d: number;
  };
  error_analysis: {
    avg_error: number;
    median_error: number;
    error_distribution: { range: string; count: number }[];
  };
  platform_breakdown: {
    [platform: string]: {
      accuracy: number;
      sample_size: number;
    };
  };
}

export class PredictionValidationSystem {
  private supabase;
  private readonly VALIDATION_WINDOW_HOURS = 48;
  private readonly VIRAL_THRESHOLD = 0.7; // 70% probability threshold for "viral" classification

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );
  }

  /**
   * Store a new prediction for future validation
   */
  async storePredictionForValidation(
    predictionId: string,
    videoId: string,
    prediction: {
      viral_score: number;
      viral_probability: number;
      estimated_views: { expected: number };
      platform: string;
      creator_followers: number;
      content_type?: string;
    }
  ): Promise<void> {
    try {
      const validationEntry: Partial<PredictionValidationEntry> = {
        prediction_id: predictionId,
        video_id: videoId,
        predicted_viral_score: prediction.viral_score,
        predicted_views: prediction.estimated_views.expected,
        predicted_probability: prediction.viral_probability,
        is_validated: false,
        validation_status: 'pending',
        platform: prediction.platform,
        content_type: prediction.content_type || 'general',
        creator_followers: prediction.creator_followers,
        prediction_timestamp: new Date().toISOString(),
        validation_window_hours: this.VALIDATION_WINDOW_HOURS
      };

      const { error } = await this.supabase
        .from('prediction_validation')
        .insert(validationEntry);

      if (error) {
        console.error('Failed to store prediction for validation:', error);
      } else {
        console.log(`📊 Stored prediction ${predictionId} for validation tracking`);
      }
    } catch (error) {
      console.error('Prediction validation storage error:', error);
    }
  }

  /**
   * Validate predictions that are ready (48+ hours old)
   */
  async validatePendingPredictions(): Promise<{
    validated: number;
    failed: number;
    accuracy_update: number;
  }> {
    try {
      // Get predictions ready for validation (48+ hours old)
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - this.VALIDATION_WINDOW_HOURS);

      const { data: pendingPredictions, error } = await this.supabase
        .from('prediction_validation')
        .select('*')
        .eq('validation_status', 'pending')
        .lt('prediction_timestamp', cutoffTime.toISOString())
        .limit(50); // Process in batches

      if (error) {
        console.error('Error fetching pending predictions:', error);
        return { validated: 0, failed: 0, accuracy_update: 0 };
      }

      let validatedCount = 0;
      let failedCount = 0;

      for (const prediction of pendingPredictions || []) {
        try {
          // Get actual performance data
          const actualPerformance = await this.getActualPerformance(prediction.video_id, prediction.platform);
          
          if (actualPerformance) {
            // Calculate validation metrics
            const validation = this.calculateValidationMetrics(prediction, actualPerformance);
            
            // Update prediction with validation results
            await this.updatePredictionValidation(prediction.id, validation);
            validatedCount++;
            
            console.log(`✅ Validated prediction ${prediction.prediction_id}: ${validation.accuracy_percentage.toFixed(1)}% accuracy`);
          } else {
            // Mark as failed if we can't get actual data
            await this.markValidationFailed(prediction.id, 'Unable to retrieve actual performance data');
            failedCount++;
          }
                 } catch (error) {
           console.error(`Error validating prediction ${prediction.prediction_id}:`, error);
           await this.markValidationFailed(prediction.id, error instanceof Error ? error.message : 'Unknown validation error');
           failedCount++;
         }
      }

      // Calculate updated overall accuracy
      const newAccuracy = await this.calculateOverallAccuracy();

      console.log(`📊 Validation batch complete: ${validatedCount} validated, ${failedCount} failed`);
      console.log(`🎯 Updated system accuracy: ${newAccuracy.toFixed(1)}%`);

      return {
        validated: validatedCount,
        failed: failedCount,
        accuracy_update: newAccuracy
      };

    } catch (error) {
      console.error('Validation batch processing error:', error);
      return { validated: 0, failed: 0, accuracy_update: 0 };
    }
  }

  /**
   * Get actual performance data for a video (implementation depends on platform)
   */
  private async getActualPerformance(videoId: string, platform: string): Promise<{
    views: number;
    likes: number;
    comments: number;
    shares: number;
  } | null> {
    try {
      // First, try to get updated data from our scraped_data table
      const { data: videoData } = await this.supabase
        .from('scraped_data')
        .select('view_count, like_count, comment_count, share_count')
        .eq('tiktok_id', videoId)
        .single();

      if (videoData) {
        return {
          views: videoData.view_count || 0,
          likes: videoData.like_count || 0,
          comments: videoData.comment_count || 0,
          shares: videoData.share_count || 0
        };
      }

      // TODO: In a production system, you might:
      // 1. Re-scrape the specific video using Apify
      // 2. Use platform APIs to get updated metrics
      // 3. Track metrics over time automatically
      
      // For now, return null if we don't have the data
      return null;

    } catch (error) {
      console.error(`Error getting actual performance for video ${videoId}:`, error);
      return null;
    }
  }

  /**
   * Calculate validation metrics comparing prediction vs actual performance
   */
  private calculateValidationMetrics(
    prediction: PredictionValidationEntry,
    actual: { views: number; likes: number; comments: number; shares: number }
  ): {
    actual_viral_score: number;
    accuracy_percentage: number;
    prediction_error: number;
    was_prediction_correct: boolean;
  } {
    // Calculate actual viral score based on performance
    const actualViralScore = this.calculateActualViralScore(actual, prediction.creator_followers);
    
    // Calculate accuracy (how close was the prediction?)
    const predictionError = Math.abs(prediction.predicted_viral_score - actualViralScore);
    const accuracyPercentage = Math.max(0, 100 - (predictionError * 2)); // Max 2% penalty per point off
    
    // Determine if prediction was "correct" (within reasonable range)
    const wasPredictionCorrect = this.wasPredictionCorrect(
      prediction.predicted_probability,
      actualViralScore,
      actual.views,
      prediction.predicted_views
    );

    return {
      actual_viral_score: actualViralScore,
      accuracy_percentage: accuracyPercentage,
      prediction_error: predictionError,
      was_prediction_correct: wasPredictionCorrect
    };
  }

  /**
   * Calculate actual viral score from performance metrics
   */
  private calculateActualViralScore(
    performance: { views: number; likes: number; comments: number; shares: number },
    creatorFollowers: number
  ): number {
    // Engagement rate calculation
    const totalEngagement = performance.likes + performance.comments + (performance.shares * 2);
    const engagementRate = performance.views > 0 ? totalEngagement / performance.views : 0;
    
    // View-to-follower ratio (viral indicator)
    const viewRatio = creatorFollowers > 0 ? performance.views / creatorFollowers : performance.views / 1000;
    
    // Viral score calculation (0-100)
    let viralScore = 0;
    
    // Engagement component (40% weight)
    if (engagementRate > 0.08) viralScore += 40; // 8%+ engagement = excellent
    else if (engagementRate > 0.05) viralScore += 30; // 5%+ engagement = good
    else if (engagementRate > 0.03) viralScore += 20; // 3%+ engagement = average
    else viralScore += engagementRate * 333; // Linear scale below 3%
    
    // View ratio component (35% weight)
    if (viewRatio > 10) viralScore += 35; // 10x follower reach = viral
    else if (viewRatio > 5) viralScore += 25; // 5x follower reach = high performing
    else if (viewRatio > 2) viralScore += 15; // 2x follower reach = good
    else viralScore += viewRatio * 7.5; // Linear scale below 2x
    
    // Absolute view threshold component (25% weight)
    if (performance.views > 1000000) viralScore += 25; // 1M+ views
    else if (performance.views > 500000) viralScore += 20; // 500K+ views
    else if (performance.views > 100000) viralScore += 15; // 100K+ views
    else if (performance.views > 50000) viralScore += 10; // 50K+ views
    else viralScore += (performance.views / 50000) * 10; // Linear scale below 50K
    
    return Math.min(100, Math.max(0, viralScore));
  }

  /**
   * Determine if a prediction was "correct" within acceptable parameters
   */
  private wasPredictionCorrect(
    predictedProbability: number,
    actualViralScore: number,
    actualViews: number,
    predictedViews: number
  ): boolean {
    // Check if viral prediction was correct (within ±15% threshold)
    const predictedViral = predictedProbability >= this.VIRAL_THRESHOLD;
    const actualViral = actualViralScore >= 70; // 70+ score = viral
    
    if (predictedViral === actualViral) {
      // Correct viral/non-viral classification
      
      // For viral content, check if view prediction was reasonable (within 3x range)
      if (actualViral && actualViews > 0) {
        const viewAccuracy = Math.min(actualViews / predictedViews, predictedViews / actualViews);
        return viewAccuracy >= 0.33; // Within 3x range
      }
      
      return true; // Correct classification for non-viral content
    }
    
    return false; // Incorrect viral/non-viral classification
  }

  /**
   * Update prediction with validation results
   */
  private async updatePredictionValidation(
    predictionId: string,
    validation: {
      actual_viral_score: number;
      accuracy_percentage: number;
      prediction_error: number;
      was_prediction_correct: boolean;
    }
  ): Promise<void> {
    const { error } = await this.supabase
      .from('prediction_validation')
      .update({
        actual_viral_score: validation.actual_viral_score,
        accuracy_percentage: validation.accuracy_percentage,
        prediction_error: validation.prediction_error,
        is_validated: true,
        validation_status: 'validated',
        validation_timestamp: new Date().toISOString()
      })
      .eq('id', predictionId);

    if (error) {
      console.error('Error updating prediction validation:', error);
    }
  }

  /**
   * Mark a prediction validation as failed
   */
  private async markValidationFailed(predictionId: string, reason: string): Promise<void> {
    const { error } = await this.supabase
      .from('prediction_validation')
      .update({
        validation_status: 'failed',
        validation_timestamp: new Date().toISOString(),
        // Store reason in a metadata field if available
      })
      .eq('id', predictionId);

    if (error) {
      console.error('Error marking validation as failed:', error);
    }
  }

  /**
   * Calculate overall system accuracy metrics
   */
  async calculateOverallAccuracy(): Promise<number> {
    try {
      const { data: validatedPredictions } = await this.supabase
        .from('prediction_validation')
        .select('accuracy_percentage, prediction_error')
        .eq('validation_status', 'validated');

      if (!validatedPredictions || validatedPredictions.length === 0) {
        return 0;
      }

      // Calculate average accuracy
      const totalAccuracy = validatedPredictions.reduce(
        (sum, pred) => sum + (pred.accuracy_percentage || 0), 0
      );

      return totalAccuracy / validatedPredictions.length;
    } catch (error) {
      console.error('Error calculating overall accuracy:', error);
      return 0;
    }
  }

  /**
   * Get comprehensive accuracy metrics for dashboard display
   */
  async getAccuracyMetrics(): Promise<AccuracyMetrics> {
    try {
      // Get all validated predictions
      const { data: allValidated } = await this.supabase
        .from('prediction_validation')
        .select('*')
        .eq('validation_status', 'validated')
        .order('validation_timestamp', { ascending: false });

      if (!allValidated || allValidated.length === 0) {
        return this.getEmptyMetrics();
      }

      const totalPredictions = allValidated.length;
      const correctPredictions = allValidated.filter(p => p.accuracy_percentage >= 80).length;
      const overallAccuracy = (correctPredictions / totalPredictions) * 100;

      // Calculate time-based accuracy trends
      const now = new Date();
      const last24h = allValidated.filter(p => 
        new Date(p.validation_timestamp) > new Date(now.getTime() - 24 * 60 * 60 * 1000)
      );
      const last7d = allValidated.filter(p => 
        new Date(p.validation_timestamp) > new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      );
      const last30d = allValidated.filter(p => 
        new Date(p.validation_timestamp) > new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      );

      // Error analysis
      const errors = allValidated.map(p => p.prediction_error || 0);
      const avgError = errors.reduce((sum, err) => sum + err, 0) / errors.length;
      const sortedErrors = [...errors].sort((a, b) => a - b);
      const medianError = sortedErrors[Math.floor(sortedErrors.length / 2)];

             // Platform breakdown
       const platformBreakdown: { [key: string]: { accuracy: number; sample_size: number } } = {};
       const platformGroups = allValidated.reduce((groups, pred) => {
         const platform = pred.platform;
         if (!groups[platform]) groups[platform] = [];
         groups[platform].push(pred);
         return groups;
       }, {} as { [key: string]: typeof allValidated });

       for (const [platform, predictions] of Object.entries(platformGroups)) {
         const typedPredictions = predictions as any[];
         const platformCorrect = typedPredictions.filter((p: any) => p.accuracy_percentage >= 80).length;
         platformBreakdown[platform] = {
           accuracy: (platformCorrect / typedPredictions.length) * 100,
           sample_size: typedPredictions.length
         };
       }

      return {
        overall_accuracy: overallAccuracy,
        total_predictions: totalPredictions,
        correct_predictions: correctPredictions,
        accuracy_trend: {
          last_24h: last24h.length > 0 ? (last24h.filter(p => p.accuracy_percentage >= 80).length / last24h.length) * 100 : 0,
          last_7d: last7d.length > 0 ? (last7d.filter(p => p.accuracy_percentage >= 80).length / last7d.length) * 100 : 0,
          last_30d: last30d.length > 0 ? (last30d.filter(p => p.accuracy_percentage >= 80).length / last30d.length) * 100 : 0
        },
        error_analysis: {
          avg_error: avgError,
          median_error: medianError,
          error_distribution: this.calculateErrorDistribution(errors)
        },
        platform_breakdown: platformBreakdown
      };

    } catch (error) {
      console.error('Error calculating accuracy metrics:', error);
      return this.getEmptyMetrics();
    }
  }

  /**
   * Get display-ready accuracy text for dashboard
   */
  async getAccuracyDisplayText(): Promise<string> {
    const metrics = await this.getAccuracyMetrics();
    
    if (metrics.total_predictions === 0) {
      return "Building accuracy data - predictions pending validation";
    }

    return `${metrics.overall_accuracy.toFixed(1)}% accurate - ${metrics.correct_predictions}/${metrics.total_predictions} correct predictions`;
  }

  /**
   * Helper methods
   */
  private getEmptyMetrics(): AccuracyMetrics {
    return {
      overall_accuracy: 0,
      total_predictions: 0,
      correct_predictions: 0,
      accuracy_trend: { last_24h: 0, last_7d: 0, last_30d: 0 },
      error_analysis: { avg_error: 0, median_error: 0, error_distribution: [] },
      platform_breakdown: {}
    };
  }

  private calculateErrorDistribution(errors: number[]): { range: string; count: number }[] {
    const distribution = [
      { range: '0-5%', count: 0 },
      { range: '5-10%', count: 0 },
      { range: '10-20%', count: 0 },
      { range: '20%+', count: 0 }
    ];

    errors.forEach(error => {
      if (error <= 5) distribution[0].count++;
      else if (error <= 10) distribution[1].count++;
      else if (error <= 20) distribution[2].count++;
      else distribution[3].count++;
    });

    return distribution;
  }

  /**
   * Schedule automatic validation runs
   */
  async runAutomaticValidation(): Promise<void> {
    console.log('🔄 Running automatic prediction validation...');
    
    try {
      const result = await this.validatePendingPredictions();
      
      if (result.validated > 0) {
        // Update system health monitoring
        await this.updateSystemHealthMetrics(result);
      }
      
      console.log(`✅ Automatic validation complete - system accuracy: ${result.accuracy_update.toFixed(1)}%`);
    } catch (error) {
      console.error('Automatic validation failed:', error);
    }
  }

  /**
   * Update system health monitoring with validation results
   */
  private async updateSystemHealthMetrics(validationResult: {
    validated: number;
    failed: number;
    accuracy_update: number;
  }): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('system_health_logs')
        .insert({
          module_name: 'Performance_Validator',
          status: 'active',
          metrics: {
            validations_completed: validationResult.validated,
            validation_failures: validationResult.failed,
            current_accuracy: validationResult.accuracy_update,
            last_validation_run: new Date().toISOString()
          },
          timestamp: new Date().toISOString()
        });

      if (error) {
        console.error('Error updating system health metrics:', error);
      }
    } catch (error) {
      console.error('System health update error:', error);
    }
  }
} 