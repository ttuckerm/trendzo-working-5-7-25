import { TrendPrediction, ManualAdjustmentLog, ExpertInsightTag } from '@/lib/types/trendingTemplate';

/**
 * MLPredictionService
 * 
 * Service for machine learning-based trend predictions, pattern analysis,
 * feedback incorporation, and suggestion generation.
 */
export class MLPredictionService {
  private modelVersion: string = '1.0.0';
  private lastTrainedAt: Date | null = null;
  private feedbackLoopActive: boolean = true;
  private confidenceThreshold: number = 0.65;
  
  // Cache for pattern analysis results to improve performance
  private patternCache: Map<string, any> = new Map();
  
  /**
   * Analyzes historical adjustments to identify patterns in expert corrections
   * 
   * @param adjustments Array of manual adjustments made by experts
   * @param timeWindow Time window to consider for pattern analysis
   * @returns Pattern analysis results
   */
  public async analyzePatterns(
    adjustments: ManualAdjustmentLog[], 
    timeWindow: string = '90d'
  ): Promise<{
    patterns: Record<string, any>;
    confidenceScore: number;
    insights: string[];
  }> {
    try {
      // Generate cache key based on adjustments and time window
      const cacheKey = `patterns_${timeWindow}_${adjustments.length}`;
      
      // Return cached results if available
      if (this.patternCache.has(cacheKey)) {
        console.log('Using cached pattern analysis results');
        return this.patternCache.get(cacheKey);
      }
      
      // Group adjustments by category for pattern identification
      const categoryPatterns: Record<string, any[]> = {};
      adjustments.forEach(adjustment => {
        if (!categoryPatterns[adjustment.adjustmentCategory]) {
          categoryPatterns[adjustment.adjustmentCategory] = [];
        }
        categoryPatterns[adjustment.adjustmentCategory].push(adjustment);
      });
      
      // Analyze patterns in each category
      const patterns: Record<string, any> = {};
      const insights: string[] = [];
      
      // Process each category
      for (const [category, categoryAdjustments] of Object.entries(categoryPatterns)) {
        // Calculate average adjustment size by field
        const fieldAdjustments: Record<string, number[]> = {};
        categoryAdjustments.forEach(adj => {
          // Only consider numerical adjustments
          if (typeof adj.previousValue === 'number' && typeof adj.newValue === 'number') {
            if (!fieldAdjustments[adj.field]) {
              fieldAdjustments[adj.field] = [];
            }
            fieldAdjustments[adj.field].push(adj.newValue - adj.previousValue);
          }
        });
        
        // Calculate average adjustment for each field
        const avgAdjustments: Record<string, number> = {};
        for (const [field, adjusts] of Object.entries(fieldAdjustments)) {
          if (adjusts.length > 0) {
            avgAdjustments[field] = adjusts.reduce((sum, val) => sum + val, 0) / adjusts.length;
          }
        }
        
        // Store pattern for this category
        patterns[category] = {
          count: categoryAdjustments.length,
          avgAdjustments,
          commonReasons: this.extractCommonReasons(categoryAdjustments),
          expertConfidence: this.calculateAverageExpertConfidence(categoryAdjustments)
        };
        
        // Generate insights
        if (patterns[category].count >= 3) {
          for (const [field, avgAdjustment] of Object.entries(patterns[category].avgAdjustments as Record<string, number>)) {
            if (Math.abs(avgAdjustment) > 0.1) {
              const direction = avgAdjustment > 0 ? 'increase' : 'decrease';
              insights.push(`Experts tend to ${direction} ${field} for ${category} predictions by ${avgAdjustment.toFixed(2)}`);
            }
          }
        }
      }
      
      // Calculate overall confidence score based on pattern consistency
      const patternStrength = Object.values(patterns).reduce((sum, p) => sum + p.count, 0) / adjustments.length;
      const confidenceScore = Math.min(0.95, patternStrength * Object.keys(patterns).length / 5);
      
      // Prepare result
      const result = {
        patterns,
        confidenceScore,
        insights
      };
      
      // Cache the results
      this.patternCache.set(cacheKey, result);
      
      return result;
    } catch (error) {
      console.error('Error analyzing patterns:', error);
      return {
        patterns: {},
        confidenceScore: 0,
        insights: ['Error analyzing patterns']
      };
    }
  }
  
  /**
   * Extracts common reasons from adjustments
   */
  private extractCommonReasons(adjustments: ManualAdjustmentLog[]): string[] {
    // Simple implementation - in a real system this would use NLP techniques
    const reasons = adjustments.map(adj => adj.reason);
    const reasonCounts: Record<string, number> = {};
    
    reasons.forEach(reason => {
      if (!reason) return;
      
      reason.split(' ').forEach(word => {
        // Skip common words
        if (word.length < 4) return;
        
        const normalized = word.toLowerCase();
        reasonCounts[normalized] = (reasonCounts[normalized] || 0) + 1;
      });
    });
    
    // Get the top 5 most common meaningful words
    return Object.entries(reasonCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
  }
  
  /**
   * Calculates average expert confidence
   */
  private calculateAverageExpertConfidence(adjustments: ManualAdjustmentLog[]): number {
    const confidences = adjustments
      .filter(adj => typeof adj.expertConfidence === 'number')
      .map(adj => adj.expertConfidence as number);
    
    if (confidences.length === 0) return 0;
    
    return confidences.reduce((sum, val) => sum + val, 0) / confidences.length;
  }
  
  /**
   * Updates the ML model with new expert feedback
   * 
   * @param prediction Original prediction
   * @param adjustment Expert adjustment
   * @returns Updated model information
   */
  public async updateModelWithFeedback(
    prediction: TrendPrediction,
    adjustment: ManualAdjustmentLog
  ): Promise<{
    success: boolean;
    modelVersion: string;
    improvementMetrics: Record<string, any>;
  }> {
    try {
      if (!this.feedbackLoopActive) {
        return {
          success: false,
          modelVersion: this.modelVersion,
          improvementMetrics: {
            message: 'Feedback loop is currently disabled'
          }
        };
      }
      
      console.log(`Updating model with feedback for template ${prediction.templateId}`);
      
      // Calculate learning coefficient based on expert confidence
      const learningRate = adjustment.expertConfidence 
        ? Math.min(0.1, adjustment.expertConfidence / 20)
        : 0.01;
      
      // Calculate adjustment impact
      const adjustmentSize = this.calculateAdjustmentSize(adjustment);
      
      // In a real implementation, this would:
      // 1. Connect to a ML infrastructure
      // 2. Update model weights based on the feedback
      // 3. Potentially trigger retraining if enough feedback collected
      
      // For this implementation, we'll simulate model updating
      this.lastTrainedAt = new Date();
      const newModelVersion = this.incrementModelVersion();
      
      // Metrics that would be returned by the ML service
      const improvementMetrics = {
        learningRate,
        adjustmentSize,
        fieldImpact: adjustment.field,
        categoryImpact: adjustment.adjustmentCategory,
        confidenceEstimate: Math.min(0.95, 0.6 + learningRate * 2)
      };
      
      return {
        success: true,
        modelVersion: newModelVersion,
        improvementMetrics
      };
    } catch (error) {
      console.error('Error updating model with feedback:', error);
      return {
        success: false,
        modelVersion: this.modelVersion,
        improvementMetrics: {
          error: 'Failed to update model'
        }
      };
    }
  }
  
  /**
   * Calculates the size of an adjustment
   */
  private calculateAdjustmentSize(adjustment: ManualAdjustmentLog): number {
    // For numerical adjustments
    if (typeof adjustment.previousValue === 'number' && typeof adjustment.newValue === 'number') {
      // Get percent change for this field type
      if (adjustment.field === 'confidenceScore') {
        // Confidence score is 0-1, so use absolute difference
        return Math.abs(adjustment.newValue - adjustment.previousValue);
      } else {
        // For other numerical fields, use relative change
        return Math.abs((adjustment.newValue - adjustment.previousValue) / adjustment.previousValue);
      }
    }
    
    // For categorical adjustments (like growth trajectory)
    if (adjustment.field === 'growthTrajectory') {
      // Map of trajectory changes to impact scores
      const trajectoryChanges: Record<string, Record<string, number>> = {
        'exponential': {
          'linear': 0.5,
          'plateauing': 0.8,
          'volatile': 0.9
        },
        'linear': {
          'exponential': 0.5,
          'plateauing': 0.3,
          'volatile': 0.7
        },
        'plateauing': {
          'exponential': 0.9,
          'linear': 0.4,
          'volatile': 0.5
        },
        'volatile': {
          'exponential': 0.8,
          'linear': 0.6,
          'plateauing': 0.5
        }
      };
      
      const from = adjustment.previousValue as string;
      const to = adjustment.newValue as string;
      
      if (trajectoryChanges[from] && trajectoryChanges[from][to]) {
        return trajectoryChanges[from][to];
      }
      
      return 0.5; // Default impact if not specifically mapped
    }
    
    // Default size for non-numerical adjustments
    return 0.3;
  }
  
  /**
   * Increment model version for tracking
   */
  private incrementModelVersion(): string {
    const [major, minor, patch] = this.modelVersion.split('.').map(Number);
    const newVersion = `${major}.${minor}.${patch + 1}`;
    this.modelVersion = newVersion;
    return newVersion;
  }
  
  /**
   * Generates suggestions based on patterns and current template data
   * 
   * @param currentPrediction Current prediction to generate suggestions for
   * @param patternData Pattern data from analyzePatterns
   * @returns Array of suggested adjustments
   */
  public async generateSuggestions(
    currentPrediction: TrendPrediction,
    patternData?: Record<string, any>
  ): Promise<{
    suggestions: Array<{
      field: string;
      currentValue: any;
      suggestedValue: any;
      confidence: number;
      reason: string;
    }>;
    patternsApplied: string[];
  }> {
    try {
      // If pattern data wasn't provided, get it
      if (!patternData) {
        // In a real implementation, this would fetch recent adjustments
        // For now, we'll use an empty array which will result in no patterns
        const { patterns } = await this.analyzePatterns([]);
        patternData = patterns;
      }
      
      const suggestions = [];
      const patternsApplied = [];
      
      // For each category of patterns
      for (const [category, pattern] of Object.entries(patternData)) {
        // Skip patterns with low confidence or count
        if (pattern.expertConfidence < 0.7 || pattern.count < 3) continue;
        
        // Check each field with average adjustments
        for (const [field, avgAdjustment] of Object.entries(pattern.avgAdjustments as Record<string, number>)) {
          // Skip small adjustments
          if (Math.abs(avgAdjustment) < 0.05) continue;
          
          const currentValue = currentPrediction[field as keyof TrendPrediction];
          
          // Skip if field doesn't exist in current prediction
          if (currentValue === undefined) continue;
          
          // Calculate suggested value based on the pattern
          let suggestedValue;
          let reason = `Based on ${pattern.count} similar ${category} predictions`;
          
          if (typeof currentValue === 'number') {
            // For numerical fields
            suggestedValue = currentValue + avgAdjustment;
            
            // Ensure values are in valid ranges
            if (field === 'confidenceScore') {
              suggestedValue = Math.max(0, Math.min(1, suggestedValue));
            } else if (field === 'daysUntilPeak') {
              suggestedValue = Math.max(1, suggestedValue);
            }
            
            const direction = avgAdjustment > 0 ? 'higher' : 'lower';
            reason += `, experts typically adjust ${field} ${direction}`;
          } else if (field === 'growthTrajectory') {
            // For growth trajectory suggestions, we need more sophisticated logic
            // Here we're simplifying by just using the most common trajectory for this category
            // A real implementation would use a probabilistic model
            
            // Mock suggestion - in real implementation this would come from pattern analysis
            const commonTrajectories = {
              'Product': 'exponential',
              'Fashion': 'linear',
              'Food': 'plateauing',
              'Dance': 'linear',
              'Other': 'volatile'
            };
            
            const contentCategory = currentPrediction.contentCategory;
            if (contentCategory && commonTrajectories[contentCategory as keyof typeof commonTrajectories]) {
              suggestedValue = commonTrajectories[contentCategory as keyof typeof commonTrajectories];
              reason += `, experts often classify ${contentCategory} content as ${suggestedValue} growth`;
            } else {
              // Skip if we can't make a good suggestion
              continue;
            }
          } else {
            // Skip non-numerical fields other than growthTrajectory
            continue;
          }
          
          // Only add suggestion if value is different
          if (suggestedValue !== currentValue) {
            suggestions.push({
              field,
              currentValue,
              suggestedValue,
              confidence: pattern.expertConfidence,
              reason
            });
            
            patternsApplied.push(category);
          }
        }
      }
      
      return {
        suggestions,
        patternsApplied: [...new Set(patternsApplied)] // Remove duplicates
      };
    } catch (error) {
      console.error('Error generating suggestions:', error);
      return {
        suggestions: [],
        patternsApplied: []
      };
    }
  }
}

// Singleton instance
export const mlPredictionService = new MLPredictionService(); 