import { db } from '@/lib/firebase/firebase';
import { collection, query, orderBy, limit as firestoreLimit, getDocs, where, updateDoc, doc, getDoc, setDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { TrendingTemplate, ManualAdjustmentLog, TrendPrediction, ExpertInsightTag } from '@/lib/types/trendingTemplate';
import { advancedTemplateAnalysisService } from './advancedTemplateAnalysisService';
import { trendingTemplateService } from './trendingTemplateService';
import { expertPerformanceService } from '@/lib/services/expertPerformanceService';

/**
 * Service for predicting trending templates and handling expert adjustments
 */
export const trendPredictionService = {
  /**
   * Identifies early-stage trending templates before they go viral
   * Uses growth patterns, engagement trends, and content characteristics
   * 
   * @param options Configuration options for prediction
   * @returns List of predicted trending templates with confidence scores
   */
  async predictEmergingTrends(options: {
    timeWindow?: string;
    minVelocity?: number;
    minConfidence?: number;
    categories?: string[];
    limit?: number;
    includeExpertInsights?: boolean;
  } = {}): Promise<{
    predictions: TrendPrediction[];
    timeWindow: string;
  }> {
    try {
      // Default option values
      const {
        timeWindow = '7d',
        minVelocity = 3, // Lower threshold to catch early trends
        minConfidence = 0.5,
        categories = [],
        limit = 20,
        includeExpertInsights = true
      } = options;

      console.log(`Predicting emerging trends with min velocity ${minVelocity}, min confidence ${minConfidence}...`);
      
      // Create base query
      let q = query(
        collection(db as any, 'templates'),
        where('isActive', '==', true),
        orderBy('trendData.velocityScore', 'desc'),
        firestoreLimit(limit * 2) // Get more templates to filter
      );
      
      // Add category filter if specified
      if (categories.length > 0) {
        q = query(
          collection(db as any, 'templates'),
          where('isActive', '==', true),
          where('category', 'in', categories),
          orderBy('trendData.velocityScore', 'desc'),
          firestoreLimit(limit * 2)
        );
      }
      
      // Execute query
      const querySnapshot = await getDocs(q);
      
      // Process templates
      const templates = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }) as TrendingTemplate);
      
      // Set of predictions to return
      const predictions: TrendPrediction[] = [];
      
      // Analyze each template for emerging trend potential
      for (const template of templates) {
        // Skip templates that are already trending significantly
        if (template.trendData?.velocityScore > 8) {
          continue;
        }
        
        // Calculate base confidence score
        let confidenceScore = this.calculateBaseConfidenceScore(template);
        
        // Skip if doesn't meet minimum confidence
        if (confidenceScore < minConfidence) {
          continue;
        }
        
        // Estimate days until peak
        const daysUntilPeak = this.estimateDaysUntilPeak(template);
        
        // Current growth trajectory
        const growthTrajectory = this.calculateGrowthTrajectory(template);
        
        // Calculate velocity patterns
        const velocityPatterns = this.analyzeVelocityPatterns(template);
        
        // Content type categorization
        const contentCategory = template.category || 'Unknown';
        
        // Determine target audience based on engagement patterns
        const targetAudience = this.determineTargetAudience(template);
        
        // Expert data
        let expertAdjusted = false;
        let expertAdjustments: ManualAdjustmentLog[] = [];
        let expertInsights: ExpertInsightTag[] = [];
        
        // Check for expert adjustments if requested
        if (includeExpertInsights) {
          // Get expert adjustments
          expertAdjustments = await this.getExpertAdjustments(template.id);
          
          // Get expert insights if available
          if (template.expertInsights?.tags) {
            expertInsights = template.expertInsights.tags;
          }
          
          // Apply expert adjustments to confidence if available
          if (expertAdjustments.length > 0) {
            confidenceScore = this.applyExpertAdjustments(
              confidenceScore,
              expertAdjustments
            );
            expertAdjusted = true;
          }
        }
        
        // Create prediction object
        const prediction: TrendPrediction = {
          templateId: template.id,
          template: {
            id: template.id,
            title: template.title,
            description: template.description,
            thumbnailUrl: template.thumbnailUrl,
            category: template.category,
            authorName: template.authorName,
            stats: template.stats
          },
          confidenceScore,
          daysUntilPeak,
          growthTrajectory,
          velocityPatterns,
          contentCategory,
          targetAudience,
          predictedAt: new Date().toISOString(),
          expertAdjusted,
          expertAdjustments,
          expertInsights
        };
        
        predictions.push(prediction);
      }
      
      // Sort by confidence score
      predictions.sort((a, b) => b.confidenceScore - a.confidenceScore);
      
      // Limit results
      const limitedResults = predictions.slice(0, limit);
      
      console.log(`Found ${predictions.length} potential emerging trends, returning top ${limitedResults.length}`);
      
      // Log predictions for audit
      this.logPredictionBatch(limitedResults, timeWindow);
      
      return {
        predictions: limitedResults,
        timeWindow
      };
    } catch (error) {
      console.error('Error predicting emerging trends:', error);
      throw error;
    }
  },
  
  /**
   * Log a batch of predictions for later accuracy analysis
   * @param predictions List of predictions to log
   * @param timeWindow Time window used for prediction
   */
  async logPredictionBatch(predictions: TrendPrediction[], timeWindow: string) {
    try {
      // Create a batch record for these predictions
      const batchId = `prediction-batch-${Date.now()}`;
      
      await setDoc(doc(db as any, 'predictionBatches', batchId), {
        batchId,
        timeWindow,
        createdAt: serverTimestamp(),
        predictionCount: predictions.length,
        templateIds: predictions.map(p => p.templateId)
      });
      
      // Log individual predictions for later accuracy tracking
      for (const prediction of predictions) {
        const predictionId = `pred-${prediction.templateId}-${Date.now()}`;
        
        await setDoc(doc(db as any, 'predictions', predictionId), {
          predictionId,
          batchId,
          templateId: prediction.templateId,
          confidenceScore: prediction.confidenceScore,
          daysUntilPeak: prediction.daysUntilPeak, 
          growthTrajectory: prediction.growthTrajectory,
          expertAdjusted: prediction.expertAdjusted,
          predictedAt: serverTimestamp(),
          // Fields for later accuracy verification
          actualPeakDate: null,
          actualTrajectory: null,
          wasAccurate: null,
          accuracyScore: null,
          verifiedAt: null
        });
      }
    } catch (error) {
      console.error('Error logging prediction batch:', error);
      // Non-fatal error, continue execution
    }
  },
  
  /**
   * Calculates a base confidence score for trend prediction
   * @param template Template to analyze
   * @returns Confidence score between 0-1
   */
  calculateBaseConfidenceScore(template: TrendingTemplate): number {
    // Start with base confidence derived from velocity score (if exists)
    let confidence = template.trendData?.velocityScore 
      ? Math.min(template.trendData.velocityScore / 10, 0.9) 
      : 0.5;
    
    // Factors that can increase confidence
    
    // 1. Consistent daily growth patterns
    if (template.trendData?.dailyViews) {
      const dailyViews = template.trendData.dailyViews;
      const dates = Object.keys(dailyViews).sort();
      
      // Need at least 3 days of data
      if (dates.length >= 3) {
        let consistentGrowth = true;
        let previousValue = dailyViews[dates[0]];
        
        // Check if views consistently increase
        for (let i = 1; i < dates.length; i++) {
          const currentValue = dailyViews[dates[i]];
          if (currentValue <= previousValue) {
            consistentGrowth = false;
            break;
          }
          previousValue = currentValue;
        }
        
        if (consistentGrowth) {
          confidence += 0.1;
        }
      }
    }
    
    // 2. High engagement rate relative to view count
    if (template.stats?.views && template.stats?.likes) {
      const engagementRate = template.stats.likes / template.stats.views;
      if (engagementRate > 0.2) confidence += 0.1;
    }
    
    // 3. Positive growth trend
    if (template.trendData?.growthRate && template.trendData.growthRate > 0.5) {
      confidence += 0.05;
    }
    
    // 4. Content is in a currently trending category
    // This would ideally check against a list of trending categories
    
    // 5. Similar to other templates that went viral
    if (template.trendData?.similarTemplates && template.trendData.similarTemplates.length > 0) {
      confidence += 0.1;
    }
    
    // Factors that can decrease confidence
    
    // 1. Inconsistent or declining view patterns
    if (template.trendData?.dailyViews) {
      const dailyViews = template.trendData.dailyViews;
      const dates = Object.keys(dailyViews).sort();
      
      if (dates.length >= 3) {
        const lastDate = dates[dates.length - 1];
        const secondLastDate = dates[dates.length - 2];
        
        if (dailyViews[lastDate] < dailyViews[secondLastDate]) {
          confidence -= 0.15; // Recent decline is a strong negative signal
        }
      }
    }
    
    // 2. Low comment count despite high views
    if (template.stats?.views && template.stats?.commentCount) {
      const commentRate = template.stats.commentCount / template.stats.views;
      if (commentRate < 0.01 && template.stats.views > 10000) {
        confidence -= 0.05;
      }
    }
    
    // Ensure confidence stays within 0-1 range
    return Math.max(0, Math.min(1, confidence));
  },
  
  /**
   * Estimates the number of days until a template reaches peak popularity
   * @param template Template to analyze
   * @returns Estimated days until peak
   */
  estimateDaysUntilPeak(template: TrendingTemplate): number {
    // Simple estimation based on current velocity
    if (!template.trendData) {
      return 14; // Default to two weeks if no trend data
    }
    
    // Higher velocity means faster to peak
    const velocityScore = template.trendData.velocityScore || 0;
    
    if (velocityScore > 7) {
      return 3; // Very fast trending
    } else if (velocityScore > 5) {
      return 7; // Fast trending
    } else if (velocityScore > 3) {
      return 14; // Moderate trending
    } else {
      return 30; // Slow burn
    }
  },
  
  /**
   * Calculates the growth trajectory of a template
   * @param template Template to analyze
   * @returns Growth trajectory description
   */
  calculateGrowthTrajectory(template: TrendingTemplate): 'exponential' | 'linear' | 'plateauing' | 'volatile' {
    if (!template.trendData?.dailyViews) {
      return 'linear'; // Default without data
    }
    
    const dailyViews = template.trendData.dailyViews;
    const dates = Object.keys(dailyViews).sort();
    
    // Need at least 3 data points
    if (dates.length < 3) {
      return 'linear';
    }
    
    // Calculate day-to-day growth rates
    const growthRates: number[] = [];
    for (let i = 1; i < dates.length; i++) {
      const prevViews = dailyViews[dates[i-1]];
      const currViews = dailyViews[dates[i]];
      
      if (prevViews > 0) {
        growthRates.push((currViews - prevViews) / prevViews);
      }
    }
    
    // Check for patterns
    
    // Exponential: growth rates are increasing
    let increasingRates = true;
    for (let i = 1; i < growthRates.length; i++) {
      if (growthRates[i] < growthRates[i-1]) {
        increasingRates = false;
        break;
      }
    }
    if (increasingRates) return 'exponential';
    
    // Plateauing: recent growth rates decreasing but still positive
    let plateauing = true;
    for (let i = 1; i < growthRates.length; i++) {
      if (growthRates[i] > growthRates[i-1] || growthRates[i] < 0) {
        plateauing = false;
        break;
      }
    }
    if (plateauing) return 'plateauing';
    
    // Volatile: mix of positive and negative growth
    const hasPositive = growthRates.some(rate => rate > 0);
    const hasNegative = growthRates.some(rate => rate < 0);
    if (hasPositive && hasNegative) return 'volatile';
    
    // Default to linear
    return 'linear';
  },
  
  /**
   * Analyzes velocity patterns to detect early trend signals
   * @param template Template to analyze
   * @returns Velocity pattern analysis
   */
  analyzeVelocityPatterns(template: TrendingTemplate): {
    pattern: 'accelerating' | 'steady' | 'decelerating' | 'spiky';
    confidence: number;
  } {
    if (!template.trendData?.dailyViews) {
      return { pattern: 'steady', confidence: 0.5 };
    }
    
    const dailyViews = template.trendData.dailyViews;
    const dates = Object.keys(dailyViews).sort();
    
    // Need at least 3 data points
    if (dates.length < 3) {
      return { pattern: 'steady', confidence: 0.5 };
    }
    
    // Calculate day-to-day acceleration
    const accelerations: number[] = [];
    const growthRates: number[] = [];
    
    for (let i = 1; i < dates.length; i++) {
      const prevViews = dailyViews[dates[i-1]];
      const currViews = dailyViews[dates[i]];
      
      if (prevViews > 0) {
        growthRates.push((currViews - prevViews) / prevViews);
      }
    }
    
    for (let i = 1; i < growthRates.length; i++) {
      accelerations.push(growthRates[i] - growthRates[i-1]);
    }
    
    // Analyze patterns
    
    // Count positive and negative accelerations
    const positiveAccel = accelerations.filter(a => a > 0).length;
    const negativeAccel = accelerations.filter(a => a < 0).length;
    
    // Calculate average acceleration magnitude
    const avgMagnitude = accelerations.reduce((sum, a) => sum + Math.abs(a), 0) / accelerations.length;
    
    // Determine pattern
    let pattern: 'accelerating' | 'steady' | 'decelerating' | 'spiky';
    let confidence: number;
    
    if (positiveAccel > negativeAccel * 2) {
      // Mostly accelerating
      pattern = 'accelerating';
      confidence = 0.7 + Math.min(0.2, avgMagnitude);
    } else if (negativeAccel > positiveAccel * 2) {
      // Mostly decelerating
      pattern = 'decelerating';
      confidence = 0.7 + Math.min(0.2, avgMagnitude);
    } else if (avgMagnitude > 0.2) {
      // High variability
      pattern = 'spiky';
      confidence = 0.6;
    } else {
      // Low variability
      pattern = 'steady';
      confidence = 0.8;
    }
    
    return { pattern, confidence };
  },
  
  /**
   * Determines likely target audience based on template engagement
   * @param template Template to analyze
   * @returns Target audience categories
   */
  determineTargetAudience(template: TrendingTemplate): string[] {
    const audiences: string[] = [];
    
    // This is a simplified approach
    // In a real system, this would use more sophisticated analysis of
    // engagement demographics, content, hashtags, and more
    
    if (template.category) {
      switch(template.category.toLowerCase()) {
        case 'beauty':
        case 'fashion':
          audiences.push('Beauty/Fashion Enthusiasts');
          break;
        case 'gaming':
          audiences.push('Gamers');
          break;
        case 'food':
        case 'cooking':
          audiences.push('Food Lovers');
          break;
        case 'tech':
          audiences.push('Tech Enthusiasts');
          break;
        case 'fitness':
          audiences.push('Fitness Enthusiasts');
          break;
        case 'educational':
        case 'education':
          audiences.push('Lifelong Learners');
          break;
      }
    }
    
    // Analyze tags
    if (template.tags) {
      if (template.tags.some(tag => 
        ['howto', 'tutorial', 'tips', 'learn', 'diy'].includes(tag.toLowerCase())
      )) {
        audiences.push('DIY/Self-Improvement');
      }
      
      if (template.tags.some(tag => 
        ['funny', 'humor', 'comedy', 'joke', 'laugh'].includes(tag.toLowerCase())
      )) {
        audiences.push('Entertainment Seekers');
      }
    }
    
    // Default audience if none detected
    if (audiences.length === 0) {
      audiences.push('General');
    }
    
    return audiences;
  },
  
  /**
   * Get expert adjustments for a template
   * @param templateId Template ID to get adjustments for
   * @returns List of adjustment logs
   */
  async getExpertAdjustments(templateId: string): Promise<ManualAdjustmentLog[]> {
    try {
      const templateDoc = await getDoc(doc(db, 'templates', templateId));
      if (!templateDoc.exists()) {
        return [];
      }
      
      const template = templateDoc.data() as TrendingTemplate;
      return template.manualAdjustments || [];
    } catch (error) {
      console.error(`Error getting expert adjustments for template ${templateId}:`, error);
      return [];
    }
  },
  
  /**
   * Apply expert adjustments to confidence score
   * @param baseConfidence Original confidence score
   * @param adjustments List of expert adjustments
   * @returns Adjusted confidence score
   */
  applyExpertAdjustments(
    baseConfidence: number,
    adjustments: ManualAdjustmentLog[]
  ): number {
    let adjustedConfidence = baseConfidence;
    
    // Find confidence score adjustments
    const confidenceAdjustments = adjustments.filter(adj => 
      adj.field === 'confidenceScore' || adj.field === 'trendData.confidenceScore'
    );
    
    if (confidenceAdjustments.length > 0) {
      // Use most recent adjustment
      const latestAdjustment = confidenceAdjustments.sort((a, b) => 
        new Date(b.adjustedAt).getTime() - new Date(a.adjustedAt).getTime()
      )[0];
      
      // Set to manually adjusted value
      adjustedConfidence = parseFloat(latestAdjustment.newValue);
    } else {
      // Apply indirect adjustments 
      
      // Growth trajectory adjustments
      const trajectoryAdjustments = adjustments.filter(adj => 
        adj.field === 'growthTrajectory' || adj.field === 'trendData.growthTrajectory'
      );
      
      if (trajectoryAdjustments.length > 0) {
        const latestAdjustment = trajectoryAdjustments.sort((a, b) => 
          new Date(b.adjustedAt).getTime() - new Date(a.adjustedAt).getTime()
        )[0];
        
        // Modify confidence based on trajectory adjustment
        if (latestAdjustment.newValue === 'exponential') {
          adjustedConfidence += 0.1;
        } else if (latestAdjustment.newValue === 'plateauing') {
          adjustedConfidence -= 0.1;
        } else if (latestAdjustment.newValue === 'volatile') {
          adjustedConfidence -= 0.15;
        }
      }
      
      // Days until peak adjustments
      const daysAdjustments = adjustments.filter(adj => 
        adj.field === 'daysUntilPeak' || adj.field === 'trendData.daysUntilPeak'
      );
      
      if (daysAdjustments.length > 0) {
        const latestAdjustment = daysAdjustments.sort((a, b) => 
          new Date(b.adjustedAt).getTime() - new Date(a.adjustedAt).getTime()
        )[0];
        
        const oldDays = parseInt(latestAdjustment.previousValue);
        const newDays = parseInt(latestAdjustment.newValue);
        
        // If expert predicts faster trending, increase confidence
        if (newDays < oldDays) {
          adjustedConfidence += 0.05;
        } else if (newDays > oldDays) {
          adjustedConfidence -= 0.05;
        }
      }
    }
    
    // Ensure confidence stays within 0-1 range
    return Math.max(0, Math.min(1, adjustedConfidence));
  },
  
  /**
   * Save expert adjustment to a template prediction with enhanced tracking
   * @param adjustment Adjustment data with expert information
   * @returns Updated template with adjustment
   */
  async saveExpertAdjustment(adjustment: {
    templateId: string;
    field: string;
    previousValue: any;
    newValue: any;
    reason: string;
    adjustedBy: string;
    expertConfidence?: number;
    dataSource?: string;
    adjustmentCategory?: 'growth' | 'engagement' | 'audience' | 'content' | 'other';
    supportingData?: string;
    impactAssessment?: string;
    validityPeriod?: { start: string; end: string };
  }): Promise<TrendingTemplate> {
    try {
      const { 
        templateId, 
        field, 
        previousValue, 
        newValue, 
        reason, 
        adjustedBy,
        expertConfidence = 0.8,
        dataSource = 'manual',
        adjustmentCategory = 'other',
        supportingData,
        impactAssessment,
        validityPeriod
      } = adjustment;
      
      // Get template
      const templateDoc = await getDoc(doc(db, 'templates', templateId));
      if (!templateDoc.exists()) {
        throw new Error(`Template with ID ${templateId} not found`);
      }
      
      const template = templateDoc.data() as TrendingTemplate;
      
      // Validate the adjustment
      if (typeof newValue === 'undefined' || newValue === null) {
        throw new Error('New value cannot be null or undefined');
      }
      
      if (expertConfidence < 0 || expertConfidence > 1) {
        throw new Error('Expert confidence must be between 0 and 1');
      }
      
      // Create adjustment log with enhanced tracking
      const adjustmentLog: ManualAdjustmentLog = {
        id: `adj-${Date.now()}`,
        field,
        previousValue,
        newValue,
        reason,
        adjustedBy,
        adjustedAt: new Date().toISOString(),
        expertConfidence,
        dataSource,
        adjustmentCategory,
        supportingData,
        impactAssessment,
        validityPeriod,
        impactScore: 0, // Will be calculated later when we verify accuracy
        verificationStatus: 'pending',
        lastVerifiedAt: null,
        verificationHistory: []
      };
      
      // Update template with adjustment
      const manualAdjustments = template.manualAdjustments || [];
      manualAdjustments.push(adjustmentLog);
      
      // Create an audit trail entry
      const auditEntry = {
        timestamp: new Date().toISOString(),
        user: adjustedBy,
        action: 'expert_adjustment',
        details: {
          field,
          reason,
          category: adjustmentCategory,
          confidence: expertConfidence
        }
      };
      
      // Update template
      await updateDoc(doc(db, 'templates', templateId), {
        manualAdjustments,
        lastModified: serverTimestamp(),
        lastModifiedBy: adjustedBy,
        'auditTrail.modificationHistory': arrayUnion(auditEntry)
      });
      
      // Apply updates to specific fields
      if (field.startsWith('trendData.')) {
        const subField = field.split('.')[1];
        if (template.trendData) {
          // Update the specific subfield
          await updateDoc(doc(db, 'templates', templateId), {
            [`trendData.${subField}`]: newValue,
            [`trendData.lastExpertUpdate`]: serverTimestamp(),
            [`trendData.expertConfidence`]: expertConfidence
          });
        }
      }
      
      // Update active predictions for this template
      await this.updateActivePredictions(templateId, field, newValue, adjustedBy);
      
      // Record expert activity for performance tracking
      try {
        await expertPerformanceService.recordActivity({
          expertId: adjustedBy,
          type: 'adjustment',
          description: `Adjusted ${field.replace('trendData.', '')} from ${previousValue} to ${newValue} (${adjustmentCategory})`,
          timestamp: new Date().toISOString(),
          templateId,
          templateTitle: template.title,
          category: adjustmentCategory,
          impactScore: 0, // Initial impact score, will be updated on verification
          metadata: {
            adjustmentId: adjustmentLog.id,
            field,
            reason,
            confidence: expertConfidence,
            supportingData,
            impactAssessment
          }
        });
        
        // Schedule a task to auto-verify this adjustment after a period
        // This would be implemented separately with a background job
        // For now, we just log that this should happen
        console.log(`Scheduled verification for adjustment ${adjustmentLog.id} on template ${templateId}`);
      } catch (expertServiceError) {
        // Don't fail the main operation if expert tracking fails
        console.error('Error recording expert activity:', expertServiceError);
      }
      
      // Return the updated template
      return {
        ...template,
        manualAdjustments
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error saving expert adjustment:', errorMsg);
      throw error;
    }
  },
  
  /**
   * Verify the accuracy of an expert adjustment after actual data is available
   * @param adjustmentId ID of the adjustment to verify
   * @param templateId Template ID
   * @param actualValue The actual observed value
   * @returns Updated verification status
   */
  async verifyExpertAdjustment(
    adjustmentId: string,
    templateId: string,
    actualValue: any
  ): Promise<{
    isAccurate: boolean;
    improvementPercent: number;
    verificationStatus: 'verified' | 'rejected';
  }> {
    try {
      // Get the template
      const templateDoc = await getDoc(doc(db, 'templates', templateId));
      if (!templateDoc.exists()) {
        throw new Error(`Template with ID ${templateId} not found`);
      }
      
      const template = templateDoc.data() as TrendingTemplate;
      
      // Find the adjustment
      const manualAdjustments = template.manualAdjustments || [];
      const adjustmentIndex = manualAdjustments.findIndex(adj => adj.id === adjustmentId);
      
      if (adjustmentIndex === -1) {
        throw new Error(`Adjustment with ID ${adjustmentId} not found`);
      }
      
      const adjustment = manualAdjustments[adjustmentIndex];
      
      // Calculate accuracy
      // For numeric values, we compare how close the adjustment was to the actual value
      // compared to the original prediction
      let isAccurate = false;
      let improvementPercent = 0;
      
      if (typeof actualValue === 'number' && typeof adjustment.previousValue === 'number' && typeof adjustment.newValue === 'number') {
        // Calculate original error
        const originalError = Math.abs(adjustment.previousValue - actualValue);
        
        // Calculate adjusted error
        const adjustedError = Math.abs(adjustment.newValue - actualValue);
        
        // Determine if the adjustment was more accurate
        isAccurate = adjustedError < originalError;
        
        // Calculate improvement percentage
        if (originalError === 0) {
          // If original prediction was perfect, any change would be negative
          improvementPercent = isAccurate ? 100 : -100;
        } else {
          improvementPercent = ((originalError - adjustedError) / originalError) * 100;
        }
      } else {
        // For non-numeric values, we use a simple match/no-match
        isAccurate = adjustment.newValue === actualValue;
        improvementPercent = isAccurate ? 100 : 0;
      }
      
      // Update the adjustment with verification
      const verificationStatus = isAccurate ? 'verified' : 'rejected';
      const now = new Date().toISOString();
      
      manualAdjustments[adjustmentIndex] = {
        ...adjustment,
        impactScore: improvementPercent,
        verificationStatus,
        lastVerifiedAt: now,
        verificationHistory: [
          ...(adjustment.verificationHistory || []),
          {
            timestamp: now,
            status: verificationStatus,
            verifiedBy: 'system',
            notes: `Auto-verified against actual value: ${actualValue}`
          }
        ]
      };
      
      // Update template document
      await updateDoc(doc(db, 'templates', templateId), {
        manualAdjustments
      });
      
      // Update expert performance metrics
      try {
        await expertPerformanceService.recordAdjustmentVerification({
          id: `verif-${Date.now()}`,
          adjustmentId,
          templateId,
          expertId: adjustment.adjustedBy,
          verifiedAt: now,
          verifiedBy: 'system',
          originalValue: adjustment.previousValue,
          adjustedValue: adjustment.newValue,
          actualValue,
          improvementPercent,
          isAccurate,
          category: adjustment.adjustmentCategory
        });
        
        // Update expert specialization areas based on this verification
        await expertPerformanceService.updateSpecializationAreas(adjustment.adjustedBy);
      } catch (expertServiceError) {
        console.error('Error updating expert performance:', expertServiceError);
      }
      
      return {
        isAccurate,
        improvementPercent,
        verificationStatus
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error verifying expert adjustment:', errorMsg);
      throw error;
    }
  },
  
  /**
   * Update active predictions when an expert makes an adjustment
   * This ensures all predictions stay in sync with expert adjustments
   */
  async updateActivePredictions(templateId: string, field: string, newValue: any, adjustedBy: string) {
    try {
      // Find active predictions for this template
      const q = query(
        collection(db, 'predictions'),
        where('templateId', '==', templateId),
        where('verifiedAt', '==', null) // Not yet verified = still active
      );
      
      const querySnapshot = await getDocs(q);
      
      // Update each prediction
      for (const predDoc of querySnapshot.docs) {
        const predId = predDoc.id;
        
        // Map template field to prediction field
        let predictionField = field;
        if (field === 'trendData.confidenceScore') predictionField = 'confidenceScore';
        if (field === 'trendData.daysUntilPeak') predictionField = 'daysUntilPeak';
        if (field === 'trendData.growthTrajectory') predictionField = 'growthTrajectory';
        
        // Update the prediction
        await updateDoc(doc(db, 'predictions', predId), {
          [predictionField]: newValue,
          expertAdjusted: true,
          lastModified: serverTimestamp(),
          lastModifiedBy: adjustedBy
        });
      }
    } catch (error) {
      console.error('Error updating active predictions:', error);
      // Non-fatal error, continue execution
    }
  }
}; 