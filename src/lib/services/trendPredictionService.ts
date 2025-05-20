// import { db } from '@/lib/firebase/firebase'; // db will be null
// import { collection, query, orderBy, limit as firestoreLimit, getDocs, where, updateDoc, doc, getDoc, setDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { TrendingTemplate, ManualAdjustmentLog, TrendPrediction, ExpertInsightTag } from '@/lib/types/trendingTemplate';
// import { advancedTemplateAnalysisService } from './advancedTemplateAnalysisService'; // To be handled if it uses Firebase directly
// import { trendingTemplateService } from './trendingTemplateService'; // Already neutralized
// import { expertPerformanceService } from '@/lib/services/expertPerformanceService'; // Will be neutralized separately

const SERVICE_DISABLED_MSG = "trendPredictionService: Firebase backend is removed. Method called but will not perform DB operations. Returning mock/empty data or resolving. TODO: Implement with Supabase.";

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
    console.warn(`predictEmergingTrends: ${SERVICE_DISABLED_MSG}`);
    // try {
    //   // Default option values
    //   const {
    //     timeWindow = '7d',
    //     minVelocity = 3, // Lower threshold to catch early trends
    //     minConfidence = 0.5,
    //     categories = [],
    //     limit = 20,
    //     includeExpertInsights = true
    //   } = options;

    //   console.log(`Predicting emerging trends with min velocity ${minVelocity}, min confidence ${minConfidence}...`);
      
    //   // Create base query
    //   let q = query(
    //     collection(db as any, 'templates'),
    //     where('isActive', '==', true),
    //     orderBy('trendData.velocityScore', 'desc'),
    //     firestoreLimit(limit * 2) // Get more templates to filter
    //   );
      
    //   // Add category filter if specified
    //   if (categories.length > 0) {
    //     q = query(
    //       collection(db as any, 'templates'),
    //       where('isActive', '==', true),
    //       where('category', 'in', categories),
    //       orderBy('trendData.velocityScore', 'desc'),
    //       firestoreLimit(limit * 2)
    //     );
    //   }
      
    //   // Execute query
    //   const querySnapshot = await getDocs(q);
      
    //   // Process templates
    //   const templates = querySnapshot.docs.map(doc => ({
    //     id: doc.id,
    //     ...doc.data()
    //   }) as TrendingTemplate);
      
    //   // Set of predictions to return
    //   const predictions: TrendPrediction[] = [];
      
    //   // Analyze each template for emerging trend potential
    //   for (const template of templates) {
    //     // Skip templates that are already trending significantly
    //     if (template.trendData?.velocityScore > 8) {
    //       continue;
    //     }
        
    //     // Calculate base confidence score
    //     let confidenceScore = this.calculateBaseConfidenceScore(template);
        
    //     // Skip if doesn't meet minimum confidence
    //     if (confidenceScore < minConfidence) {
    //       continue;
    //     }
        
    //     // Estimate days until peak
    //     const daysUntilPeak = this.estimateDaysUntilPeak(template);
        
    //     // Current growth trajectory
    //     const growthTrajectory = this.calculateGrowthTrajectory(template);
        
    //     // Calculate velocity patterns
    //     const velocityPatterns = this.analyzeVelocityPatterns(template);
        
    //     // Content type categorization
    //     const contentCategory = template.category || 'Unknown';
        
    //     // Determine target audience based on engagement patterns
    //     const targetAudience = this.determineTargetAudience(template);
        
    //     // Expert data
    //     let expertAdjusted = false;
    //     let expertAdjustments: ManualAdjustmentLog[] = [];
    //     let expertInsights: ExpertInsightTag[] = [];
        
    //     // Check for expert adjustments if requested
    //     if (includeExpertInsights) {
    //       // Get expert adjustments
    //       expertAdjustments = await this.getExpertAdjustments(template.id);
          
    //       // Get expert insights if available
    //       if (template.expertInsights?.tags) {
    //         expertInsights = template.expertInsights.tags;
    //       }
          
    //       // Apply expert adjustments to confidence if available
    //       if (expertAdjustments.length > 0) {
    //         confidenceScore = this.applyExpertAdjustments(
    //           confidenceScore,
    //           expertAdjustments
    //         );
    //         expertAdjusted = true;
    //       }
    //     }
        
    //     // Create prediction object
    //     const prediction: TrendPrediction = {
    //       templateId: template.id,
    //       template: {
    //         id: template.id,
    //         title: template.title,
    //         description: template.description,
    //         thumbnailUrl: template.thumbnailUrl,
    //         category: template.category,
    //         authorName: template.authorName,
    //         stats: template.stats
    //       },
    //       confidenceScore,
    //       daysUntilPeak,
    //       growthTrajectory,
    //       velocityPatterns,
    //       contentCategory,
    //       targetAudience,
    //       predictedAt: new Date().toISOString(),
    //       expertAdjusted,
    //       expertAdjustments,
    //       expertInsights
    //     };
        
    //     predictions.push(prediction);
    //   }
      
    //   // Sort by confidence score
    //   predictions.sort((a, b) => b.confidenceScore - a.confidenceScore);
      
    //   // Limit results
    //   const limitedResults = predictions.slice(0, limit);
      
    //   console.log(`Found ${predictions.length} potential emerging trends, returning top ${limitedResults.length}`);
      
    //   // Log predictions for audit
    //   this.logPredictionBatch(limitedResults, options.timeWindow || '7d');
      
    //   return {
    //     predictions: limitedResults,
    //     timeWindow: options.timeWindow || '7d'
    //   };
    // } catch (error) {
    //   console.error('Error predicting emerging trends:', error);
    //   throw error;
    // }
    return Promise.resolve({ predictions: [], timeWindow: options.timeWindow || '7d' });
  },
  
  /**
   * Log a batch of predictions for later accuracy analysis
   * @param predictions List of predictions to log
   * @param timeWindow Time window used for prediction
   */
  async logPredictionBatch(predictions: TrendPrediction[], timeWindow: string) {
    console.warn(`logPredictionBatch: ${SERVICE_DISABLED_MSG}`);
    // try {
    //   // Create a batch record for these predictions
    //   const batchId = `prediction-batch-${Date.now()}`;
    //   
    //   await setDoc(doc(db as any, 'predictionBatches', batchId), {
    //     batchId,
    //     timeWindow,
    //     createdAt: serverTimestamp(),
    //     predictionCount: predictions.length,
    //     templateIds: predictions.map(p => p.templateId)
    //   });
    //   
    //   // Log individual predictions for later accuracy tracking
    //   for (const prediction of predictions) {
    //     const predictionId = `pred-${prediction.templateId}-${Date.now()}`;
    //     
    //     await setDoc(doc(db as any, 'predictions', predictionId), {
    //       predictionId,
    //       batchId,
    //       templateId: prediction.templateId,
    //       confidenceScore: prediction.confidenceScore,
    //       daysUntilPeak: prediction.daysUntilPeak, 
    //       growthTrajectory: prediction.growthTrajectory,
    //       expertAdjusted: prediction.expertAdjusted,
    //       predictedAt: serverTimestamp(),
    //       // Fields for later accuracy verification
    //       actualPeakDate: null,
    //       actualTrajectory: null,
    //       wasAccurate: null,
    //       accuracyScore: null,
    //       verifiedAt: null
    //     });
    //   }
    // } catch (error) {
    //   console.error('Error logging prediction batch:', error);
    //   // Non-fatal error, continue execution
    // }
    return Promise.resolve();
  },
  
  /**
   * Calculates a base confidence score for trend prediction
   * @param template Template to analyze
   * @returns Confidence score between 0-1
   */
  calculateBaseConfidenceScore(template: TrendingTemplate): number {
    console.warn(`calculateBaseConfidenceScore: This method is part of a neutralized service. Its calculations might be based on data that would have come from Firebase.`);
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
    console.warn(`estimateDaysUntilPeak: This method is part of a neutralized service. Its calculations might be based on data that would have come from Firebase.`);
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
    console.warn(`calculateGrowthTrajectory: This method is part of a neutralized service. Its calculations might be based on data that would have come from Firebase.`);
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
    console.warn(`analyzeVelocityPatterns: This method is part of a neutralized service. Its calculations might be based on data that would have come from Firebase.`);
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
    console.warn(`determineTargetAudience: This method is part of a neutralized service. Its calculations might be based on data that would have come from Firebase.`);
    // Example naive implementation if needed for some call path, though predictEmergingTrends is mocked
    const audienceTags: string[] = [];
    if (template.stats && template.stats.views > 1000000) {
      audienceTags.push('broad-audience');
    }
    if (template.category) {
      audienceTags.push(template.category.toLowerCase() + '-enthusiasts');
    }
    return audienceTags.length > 0 ? audienceTags : ['general'];
  },
  
  /**
   * Retrieves expert adjustments for a given template
   * @param templateId ID of the template
   * @returns List of manual adjustment logs
   */
  async getExpertAdjustments(templateId: string): Promise<ManualAdjustmentLog[]> {
    console.warn(`getExpertAdjustments for template ${templateId}: ${SERVICE_DISABLED_MSG}`);
    // try {
    //   const q = query(
    //     collection(db as any, 'expertAdjustments'),
    //     where('templateId', '==', templateId),
    //     orderBy('adjustedAt', 'desc')
    //   );
    //   const snapshot = await getDocs(q);
    //   return snapshot.docs.map(doc => doc.data() as ManualAdjustmentLog);
    // } catch (error) {
    //   console.error(`Error fetching expert adjustments for template ${templateId}:`, error);
    //   return []; // Return empty array on error
    // }
    return Promise.resolve([]);
  },
  
  /**
   * Applies expert adjustments to a base confidence score
   * @param baseConfidence Original confidence score
   * @param adjustments List of expert adjustments
   * @returns Adjusted confidence score
   */
  applyExpertAdjustments(
    baseConfidence: number,
    adjustments: ManualAdjustmentLog[]
  ): number {
    console.warn(`applyExpertAdjustments: This method is part of a neutralized service. Its calculations might be based on data that would have come from Firebase.`);
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
   * Applies expert adjustments to a base confidence score
   * @param validityPeriod Optional validity period for the adjustment
   * @returns The updated template (or null if error/neutralized)
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
  }): Promise<TrendingTemplate | null> { // Modified to return null
    console.warn(`saveExpertAdjustment for template ${adjustment.templateId}: ${SERVICE_DISABLED_MSG}`);
    // try {
    //   const adjustmentId = `adj-${adjustment.templateId}-${Date.now()}`;
    //   const adjustmentData: ManualAdjustmentLog = {
    //     ...adjustment,
    //     adjustmentId,
    //     adjustedAt: serverTimestamp() as any, // Placeholder, serverTimestamp handled by Firestore
    //     verificationStatus: 'pending',
    //   };
      
    //   await setDoc(doc(db as any, 'expertAdjustments', adjustmentId), adjustmentData);
      
    //   console.log(`Expert adjustment ${adjustmentId} saved for template ${adjustment.templateId}.`);

    //   // Update the main template document
    //   const templateRef = doc(db as any, 'templates', adjustment.templateId);
    //   // Fetch the current template to apply changes. This could be optimized.
    //   // const currentTemplate = await trendingTemplateService.getTemplateById(adjustment.templateId); // trendingTemplateService is neutralized
      
    //   // If currentTemplate is null (due to neutralization or not found), we can't proceed with this part.
    //   // For now, assume we would have had it, and log what would have happened.
    //   console.warn(`saveExpertAdjustment: Would have attempted to update template ${adjustment.templateId} with expert insight. trendingTemplateService.getTemplateById is neutralized.`);


    //   // Update field in template if applicable (example: 'confidenceScore')
    //   // This is a simplified example; more robust logic would be needed for various fields.
    //   const updatePayload: any = {
    //     // 'expertInsights.lastAdjusted': serverTimestamp(),
    //     // 'expertInsights.tags': arrayUnion({ 
    //     //   tag: adjustment.reason, 
    //     //   source: 'expert', 
    //     //   confidence: adjustment.expertConfidence || 0.8, // Default high confidence for expert tags
    //     //   addedAt: new Date().toISOString() // Using client time as serverTimestamp is complex here
    //     // }),
    //     // [`trendData.${adjustment.field}`]: adjustment.newValue // Example direct update
    //   };
      
    //   // If adjusting confidence, update overall score (this is a placeholder logic)
    //   if (adjustment.field === 'confidenceScore') {
    //      // updatePayload['trendData.overallScore'] = adjustment.newValue; // Simplified
    //   }

    //   // Add manual adjustment log to the template.
    //   // Note: This assumes ManualAdjustmentLog has a compatible structure or we create a sub-object.
    //   // For simplicity, not directly adding the full log here to avoid deep nesting issues without full type checks.
    //   // Instead, we would typically store a reference or a summary.

    //   // Placeholder for arrayUnion or field update
    //   // await updateDoc(templateRef, updatePayload);
    //   console.warn(`saveExpertAdjustment: Would have attempted to updateDoc template ${adjustment.templateId}.`);


    //   // Update any active predictions for this template
    //   await this.updateActivePredictions(
    //     adjustment.templateId,
    //     adjustment.field,
    //     adjustment.newValue,
    //     adjustment.adjustedBy
    //   );
      
    //   // Log the impact of this adjustment
    //   // await expertPerformanceService.logAdjustmentImpact({ // expertPerformanceService to be neutralized
    //   //   templateId: adjustment.templateId,
    //   //   adjustmentId,
    //   //   expertId: adjustment.adjustedBy,
    //   //   changeDetails: `${adjustment.field} from ${adjustment.previousValue} to ${adjustment.newValue}`,
    //   //   reason: adjustment.reason,
    //   //   timestamp: new Date().toISOString(),
    //   // });
    //   console.warn(`saveExpertAdjustment: Would have called expertPerformanceService.logAdjustmentImpact for template ${adjustment.templateId}. expertPerformanceService will be neutralized separately.`);

    //   // Return the (conceptually) updated template. Since trendingTemplateService is neutralized, return a mock or null.
    //   // const updatedTemplate = await trendingTemplateService.getTemplateById(adjustment.templateId); // Would return mock/null
    //   // return updatedTemplate;
    //   return null;

    // } catch (error) {
    //   console.error(`Error saving expert adjustment for template ${adjustment.templateId}:`, error);
    //   // throw error; // Or return null/error state
    //   return null;
    // }
    return Promise.resolve(null);
  },
  
  /**
   * Verifies an expert adjustment against actual outcomes
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
    verificationStatus: 'verified' | 'rejected' | 'error'; // Added error status
  }> {
    console.warn(`verifyExpertAdjustment for adjustment ${adjustmentId}: ${SERVICE_DISABLED_MSG}`);
    // try {
    //   const adjustmentRef = doc(db as any, 'expertAdjustments', adjustmentId);
    //   const adjustmentDoc = await getDoc(adjustmentRef);

    //   if (!adjustmentDoc.exists()) {
    //     throw new Error(`Adjustment with ID ${adjustmentId} not found`);
    //   }
      
    //   const adjustment = adjustmentDoc.data() as ManualAdjustmentLog;
      
    //   // Calculate accuracy
    //   // For numeric values, we compare how close the adjustment was to the actual value
    //   // compared to the original prediction
    //   let isAccurate = false;
    //   let improvementPercent = 0;
      
    //   if (typeof actualValue === 'number' && typeof adjustment.previousValue === 'number' && typeof adjustment.newValue === 'number') {
    //     // Calculate original error
    //     const originalError = Math.abs(adjustment.previousValue - actualValue);
    //     
    //     // Calculate adjusted error
    //     const adjustedError = Math.abs(adjustment.newValue - actualValue);
    //     
    //     // Determine if the adjustment was more accurate
    //     isAccurate = adjustedError < originalError;
    //     
    //     // Calculate improvement percentage
    //     if (originalError === 0) {
    //       // If original prediction was perfect, any change would be negative
    //       improvementPercent = isAccurate ? 100 : -100;
    //     } else {
    //       improvementPercent = ((originalError - adjustedError) / originalError) * 100;
    //     }
    //   } else {
    //     // For non-numeric values, we use a simple match/no-match
    //     isAccurate = adjustment.newValue === actualValue;
    //     improvementPercent = isAccurate ? 100 : 0;
    //   }
    //   
    //   // Update the adjustment with verification
    //   const verificationStatus = isAccurate ? 'verified' : 'rejected';
    //   const now = new Date().toISOString();
    //   
    //   const updatedAdjustment: ManualAdjustmentLog = {
    //     ...adjustment,
    //     impactScore: improvementPercent,
    //     verificationStatus,
    //     lastVerifiedAt: now,
    //     verificationHistory: [
    //       ...(adjustment.verificationHistory || []),
    //       {
    //         timestamp: now,
    //         status: verificationStatus,
    //         verifiedBy: 'system',
    //         notes: `Auto-verified against actual value: ${actualValue}`
    //       }
    //     ]
    //   };
    //   
    //   // Update template document
    //   await updateDoc(adjustmentRef, updatedAdjustment);
    //   
    //   // Update expert performance metrics
    //   try {
    //     await expertPerformanceService.recordAdjustmentVerification({
    //       id: `verif-${Date.now()}`,
    //       adjustmentId,
    //       templateId,
    //       expertId: adjustment.adjustedBy,
    //       verifiedAt: now,
    //       verifiedBy: 'system',
    //       originalValue: adjustment.previousValue,
    //       adjustedValue: adjustment.newValue,
    //       actualValue,
    //       improvementPercent,
    //       isAccurate,
    //       category: adjustment.adjustmentCategory
    //     });
    //     
    //     // Update expert specialization areas based on this verification
    //     await expertPerformanceService.updateSpecializationAreas(adjustment.adjustedBy);
    //   } catch (expertServiceError) {
    //     console.error('Error updating expert performance:', expertServiceError);
    //   }
    //   
    //   return {
    //     isAccurate,
    //     improvementPercent,
    //     verificationStatus
    //   };
    // } catch (error) {
    //   const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    //   console.error('Error verifying expert adjustment:', errorMsg);
    //   throw error;
    // }
    return Promise.resolve({
        isAccurate: false,
        improvementPercent: 0,
        verificationStatus: 'error',
      });
  },
  
  /**
   * Updates active predictions when an expert makes an adjustment.
   * @param templateId ID of the template adjusted
   * @param field Field that was adjusted
   * @param newValue New value of the field
   * @param adjustedBy ID of the expert who made the adjustment
   */
  async updateActivePredictions(templateId: string, field: string, newValue: any, adjustedBy: string) {
    console.warn(`updateActivePredictions for template ${templateId}: ${SERVICE_DISABLED_MSG}`);
    // try {
    //   const q = query(
    //     collection(db as any, 'predictions'),
    //     where('templateId', '==', templateId),
    //     where('status', '==', 'active') // Assuming predictions have a status field
    //   );
      
    //   const snapshot = await getDocs(q);
      
    //   if (snapshot.empty) {
    //     console.log(`No active predictions found for template ${templateId} to update.`);
    //     return;
    //   }
      
    //   for (const predDoc of snapshot.docs) {
    //     await updateDoc(predDoc.ref, {
    //       [field]: newValue, // Update the specific field
    //       expertAdjusted: true,
    //       lastAdjustedBy: adjustedBy,
    //       lastAdjustmentAt: serverTimestamp(),
    //       // Potentially add to a log of adjustments within the prediction itself
    //       // adjustmentHistory: arrayUnion({
    //       //   field,
    //       //   oldValue: predDoc.data()[field], // Requires fetching the field first or careful handling
    //       //   newValue,
    //       //   adjustedBy,
    //       //   timestamp: serverTimestamp()
    //       // })
    //     });
    //     console.log(`Prediction ${predDoc.id} for template ${templateId} updated due to expert adjustment.`);
    //   }
    // } catch (error) {
    //   console.error(`Error updating active predictions for template ${templateId}:`, error);
    //   // Non-fatal, as main adjustment might have succeeded
    // }
    return Promise.resolve();
  }
}; 