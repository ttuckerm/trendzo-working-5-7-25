import { v4 as uuidv4 } from 'uuid';
// import { db } from '@/lib/firebase/firebase'; // Firebase db is null
// import { 
//   doc, 
//   updateDoc, 
//   getDoc, 
//   arrayUnion, 
//   serverTimestamp,
//   Timestamp,
//   Firestore 
// } from 'firebase/firestore'; // Firebase SDK
import { 
  TrendingTemplate, 
  ExpertInsightTag, 
  ManualAdjustmentLog 
} from '@/lib/types/trendingTemplate';
import { logETLEvent, ETLLogLevel } from '@/lib/utils/etlLogger';

const SERVICE_DISABLED_MSG = "expertInsightService: Firebase backend has been removed. Method called but will not perform DB operations. TODO: Implement with Supabase.";

// Check if Firebase is properly initialized
// const isFirebaseInitialized = () => {
//   if (!db) {
//     throw new Error('Firebase Firestore is not initialized');
//   }
//   return true;
// };

/**
 * Service for managing expert insights on template analysis
 * Provides methods for adding, updating, and retrieving expert insights
 * that augment the automated AI analysis
 */
export const expertInsightService = {
  /**
   * Add expert insight tags to a template
   * @param templateId ID of the template
   * @param tags Array of tags to add
   * @param expertId ID of the expert adding the tags
   * @returns The added tags with IDs
   */
  async addInsightTags(
    templateId: string,
    tags: Omit<ExpertInsightTag, 'id' | 'addedBy' | 'addedAt'>[],
    expertId: string
  ): Promise<ExpertInsightTag[]> {
    console.warn(`addInsightTags for template ${templateId} by expert ${expertId}: ${SERVICE_DISABLED_MSG}`);
    // try {
    //   isFirebaseInitialized();
    //   const timestamp = new Date().toISOString();
      
    //   const tagsWithIds = tags.map(tag => ({
    //     ...tag,
    //     id: uuidv4(),
    //     addedBy: expertId,
    //     addedAt: timestamp
    //   }));

    //   const templateRef = doc(db as Firestore, 'templates', templateId);
    //   const templateDoc = await getDoc(templateRef);
      
    //   if (!templateDoc.exists()) {
    //     throw new Error(`Template with ID ${templateId} not found`);
    //   }
      
    //   // Add the audit trail entry
    //   const auditEntry = {
    //     timestamp,
    //     user: expertId,
    //     action: 'add_insight_tags',
    //     details: `Added ${tags.length} expert insight tags`
    //   };
      
    //   // Update the template document
    //   await updateDoc(templateRef, {
    //     'expertInsights.tags': arrayUnion(...tagsWithIds),
    //     'auditTrail.lastModifiedBy': expertId,
    //     'auditTrail.modificationHistory': arrayUnion(auditEntry),
    //     updatedAt: timestamp
    //   });
      
    //   logETLEvent(ETLLogLevel.INFO, 'Added expert insight tags to template', {
    //     templateId,
    //     expertId,
    //     tagCount: tags.length
    //   });
      
    //   return tagsWithIds;
    // } catch (error) {
    //   const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      
    //   logETLEvent(ETLLogLevel.ERROR, 'Error adding expert insight tags', {
    //     templateId,
    //     expertId,
    //     error: errorMsg
    //   });
      
    //   throw error;
    // }
    const mockTagsWithIds = tags.map(tag => ({
      ...tag,
      id: uuidv4(),
      addedBy: expertId,
      addedAt: new Date().toISOString(),
      // Removed: templateId: templateId // templateId is not part of ExpertInsightTag type
      // Ensure other required fields from Omit<ExpertInsightTag, 'id' | 'addedBy' | 'addedAt'> are present
      // The 'tag', 'category', and 'confidence' fields come from the 'tags' input parameter.
    }));
    return Promise.resolve(mockTagsWithIds as ExpertInsightTag[]);
  },
  
  /**
   * Add expert notes to a template
   * @param templateId ID of the template
   * @param notes Expert notes text
   * @param expertId ID of the expert adding the notes
   */
  async addExpertNotes(
    templateId: string,
    notes: string,
    expertId: string
  ): Promise<void> {
    console.warn(`addExpertNotes for template ${templateId} by expert ${expertId}: ${SERVICE_DISABLED_MSG}`);
    // try {
    //   const timestamp = new Date().toISOString();
      
    //   const templateRef = doc(db, 'templates', templateId);
    //   const templateDoc = await getDoc(templateRef);
      
    //   if (!templateDoc.exists()) {
    //     throw new Error(`Template with ID ${templateId} not found`);
    //   }
      
    //   // Add the audit trail entry
    //   const auditEntry = {
    //     timestamp,
    //     user: expertId,
    //     action: 'update_expert_notes',
    //     details: 'Updated expert notes'
    //   };
      
    //   // Update the template document
    //   await updateDoc(templateRef, {
    //     'expertInsights.notes': notes,
    //     'auditTrail.lastModifiedBy': expertId,
    //     'auditTrail.modificationHistory': arrayUnion(auditEntry),
    //     updatedAt: timestamp
    //   });
      
    //   logETLEvent(ETLLogLevel.INFO, 'Updated expert notes for template', {
    //     templateId,
    //     expertId
    //   });
    // } catch (error) {
    //   const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      
    //   logETLEvent(ETLLogLevel.ERROR, 'Error updating expert notes', {
    //     templateId,
    //     expertId,
    //     error: errorMsg
    //   });
      
    //   throw error;
    // }
    return Promise.resolve();
  },
  
  /**
   * Update recommended uses for a template
   * @param templateId ID of the template
   * @param recommendedUses Array of recommended uses
   * @param expertId ID of the expert making the update
   */
  async updateRecommendedUses(
    templateId: string,
    recommendedUses: string[],
    expertId: string
  ): Promise<void> {
    console.warn(`updateRecommendedUses for template ${templateId} by expert ${expertId}: ${SERVICE_DISABLED_MSG}`);
    // try {
    //   const timestamp = new Date().toISOString();
      
    //   const templateRef = doc(db, 'templates', templateId);
    //   const templateDoc = await getDoc(templateRef);
      
    //   if (!templateDoc.exists()) {
    //     throw new Error(`Template with ID ${templateId} not found`);
    //   }
      
    //   // Add the audit trail entry
    //   const auditEntry = {
    //     timestamp,
    //     user: expertId,
    //     action: 'update_recommended_uses',
    //     details: `Updated recommended uses (${recommendedUses.length} items)`
    //   };
      
    //   // Update the template document
    //   await updateDoc(templateRef, {
    //     'expertInsights.recommendedUses': recommendedUses,
    //     'auditTrail.lastModifiedBy': expertId,
    //     'auditTrail.modificationHistory': arrayUnion(auditEntry),
    //     updatedAt: timestamp
    //   });
      
    //   logETLEvent(ETLLogLevel.INFO, 'Updated recommended uses for template', {
    //     templateId,
    //     expertId,
    //     count: recommendedUses.length
    //   });
    // } catch (error) {
    //   const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      
    //   logETLEvent(ETLLogLevel.ERROR, 'Error updating recommended uses', {
    //     templateId,
    //     expertId,
    //     error: errorMsg
    //   });
      
    //   throw error;
    // }
    return Promise.resolve();
  },
  
  /**
   * Update the performance rating of a template
   * @param templateId ID of the template
   * @param rating Performance rating (1-5)
   * @param expertId ID of the expert making the update
   */
  async updatePerformanceRating(
    templateId: string,
    rating: number,
    expertId: string
  ): Promise<void> {
    console.warn(`updatePerformanceRating for template ${templateId} by expert ${expertId}: ${SERVICE_DISABLED_MSG}`);
    // try {
    //   // Validate rating is between 1-5
    //   if (rating < 1 || rating > 5) {
    //     throw new Error('Performance rating must be between 1 and 5');
    //   }
      
    //   const timestamp = new Date().toISOString();
      
    //   const templateRef = doc(db, 'templates', templateId);
    //   const templateDoc = await getDoc(templateRef);
      
    //   if (!templateDoc.exists()) {
    //     throw new Error(`Template with ID ${templateId} not found`);
    //   }
      
    //   // Get the current rating for the audit trail
    //   const templateData = templateDoc.data() as TrendingTemplate;
    //   const currentRating = templateData.expertInsights?.performanceRating;
      
    //   // Add the audit trail entry
    //   const auditEntry = {
    //     timestamp,
    //     user: expertId,
    //     action: 'update_performance_rating',
    //     details: `Updated performance rating from ${currentRating || 'N/A'} to ${rating}`
    //   };
      
    //   // Update the template document
    //   await updateDoc(templateRef, {
    //     'expertInsights.performanceRating': rating,
    //     'auditTrail.lastModifiedBy': expertId,
    //     'auditTrail.modificationHistory': arrayUnion(auditEntry),
    //     updatedAt: timestamp
    //   });
      
    //   logETLEvent(ETLLogLevel.INFO, 'Updated performance rating for template', {
    //     templateId,
    //     expertId,
    //     newRating: rating,
    //     previousRating: currentRating
    //   });
    // } catch (error) {
    //   const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      
    //   logETLEvent(ETLLogLevel.ERROR, 'Error updating performance rating', {
    //     templateId,
    //     expertId,
    //     error: errorMsg
    //   });
      
    //   throw error;
    // }
    return Promise.resolve();
  },
  
  /**
   * Update audience recommendations for a template
   * @param templateId ID of the template
   * @param audienceRecs Array of audience recommendations
   * @param expertId ID of the expert making the update
   */
  async updateAudienceRecommendations(
    templateId: string,
    audienceRecs: string[],
    expertId: string
  ): Promise<void> {
    console.warn(`updateAudienceRecommendations for template ${templateId} by expert ${expertId}: ${SERVICE_DISABLED_MSG}`);
    // try {
    //   const timestamp = new Date().toISOString();
      
    //   const templateRef = doc(db, 'templates', templateId);
    //   const templateDoc = await getDoc(templateRef);
      
    //   if (!templateDoc.exists()) {
    //     throw new Error(`Template with ID ${templateId} not found`);
    //   }
      
    //   // Add the audit trail entry
    //   const auditEntry = {
    //     timestamp,
    //     user: expertId,
    //     action: 'update_audience_recommendations',
    //     details: `Updated audience recommendations (${audienceRecs.length} items)`
    //   };
      
    //   // Update the template document
    //   await updateDoc(templateRef, {
    //     'expertInsights.audienceRecommendations': audienceRecs,
    //     'auditTrail.lastModifiedBy': expertId,
    //     'auditTrail.modificationHistory': arrayUnion(auditEntry),
    //     updatedAt: timestamp
    //   });
      
    //   logETLEvent(ETLLogLevel.INFO, 'Updated audience recommendations for template', {
    //     templateId,
    //     expertId,
    //     count: audienceRecs.length
    //   });
    // } catch (error) {
    //   const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      
    //   logETLEvent(ETLLogLevel.ERROR, 'Error updating audience recommendations', {
    //     templateId,
    //     expertId,
    //     error: errorMsg
    //   });
      
    //   throw error;
    // }
    return Promise.resolve();
  },
  
  /**
   * Record a manual adjustment to template data by an expert
   * @param templateId ID of the template
   * @param field The field that was adjusted
   * @param previousValue The previous value of the field
   * @param newValue The new value of the field
   * @param reason Reason for the adjustment
   * @param expertId ID of the expert making the adjustment
   * @returns The logged adjustment entry
   */
  async recordManualAdjustment(
    templateId: string,
    field: string,
    previousValue: any,
    newValue: any,
    reason: string,
    expertId: string
  ): Promise<ManualAdjustmentLog> {
    console.warn(`recordManualAdjustment for template ${templateId} by expert ${expertId}: ${SERVICE_DISABLED_MSG}`);
    // try {
    //   const timestamp = new Date().toISOString();
      
    //   const logEntry: ManualAdjustmentLog = {
    //     id: uuidv4(),
    //     templateId,
    //     expertId,
    //     timestamp,
    //     fieldAdjusted: field,
    //     previousValue,
    //     newValue,
    //     reason,
    //     impactAssessment: 'pending', // Or some initial value
    //     verified: false
    //   };

    //   const templateRef = doc(db as Firestore, 'templates', templateId);
    //   const templateDoc = await getDoc(templateRef);
      
    //   if (!templateDoc.exists()) {
    //     throw new Error(`Template with ID ${templateId} not found`);
    //   }
      
    //   // Add the audit trail entry
    //   const auditEntry = {
    //     timestamp,
    //     user: expertId,
    //     action: 'record_manual_adjustment',
    //     details: `Recorded manual adjustment for field '${field}'`
    //   };
      
    //   // Add to template's manual adjustment log
    //   await updateDoc(templateRef, {
    //     'expertInsights.manualAdjustments': arrayUnion(logEntry),
    //     'auditTrail.lastModifiedBy': expertId,
    //     'auditTrail.modificationHistory': arrayUnion(auditEntry),
    //     updatedAt: timestamp
    //   });
      
    //   logETLEvent(ETLLogLevel.INFO, 'Recorded manual adjustment for template', {
    //     templateId,
    //     expertId,
    //     fieldAdjusted: field,
    //     reason
    //   });
      
    //   return logEntry;
    // } catch (error) {
    //   const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      
    //   logETLEvent(ETLLogLevel.ERROR, 'Error recording manual adjustment', {
    //     templateId,
    //     expertId,
    //     fieldAdjusted: field,
    //     error: errorMsg
    //   });
      
    //   throw error;
    // }
    const mockLogEntry: ManualAdjustmentLog = {
      id: uuidv4(),
      // templateId, // Removed: Not part of ManualAdjustmentLog type
      adjustedBy: expertId, // Corrected: was expertId
      adjustedAt: new Date().toISOString(), // Corrected: was timestamp
      field: field, // Corrected: was fieldAdjusted
      previousValue,
      newValue,
      reason,
      impactAssessment: 'pending_mock',
      verificationStatus: 'pending', // Corrected: was verified: false
      adjustmentCategory: 'other', // Added required field
      lastVerifiedAt: null, // Added required field
      verificationHistory: [], // Added required field
      // expertConfidence, dataSource, impactScore, supportingData, validityPeriod can be optional or added with mock values if needed
    };
    return Promise.resolve(mockLogEntry);
  },

  /**
   * Get expert insights for a template
   * @param templateId ID of the template
   * @returns Expert insights or null if not found
   */
  async getExpertInsights(templateId: string): Promise<TrendingTemplate['expertInsights'] | null> {
    console.warn(`getExpertInsights for template ${templateId}: ${SERVICE_DISABLED_MSG}`);
    // try {
    //   const templateRef = doc(db as Firestore, 'templates', templateId);
    //   const templateDoc = await getDoc(templateRef);

    //   if (!templateDoc.exists()) {
    //     logETLEvent(ETLLogLevel.WARN, 'Template not found for expert insights', { templateId });
    //     return null;
    //   }
      
    //   const data = templateDoc.data() as TrendingTemplate;
    //   return data.expertInsights || null;
    // } catch (error) {
    //   const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    //   logETLEvent(ETLLogLevel.ERROR, 'Error fetching expert insights', { templateId, error: errorMsg });
    //   throw error;
    // }
    return Promise.resolve(null); // Or a mock expertInsights object
  },

  /**
   * Get manual adjustments log for a template
   * @param templateId ID of the template
   * @returns Array of manual adjustment logs
   */
  async getManualAdjustments(templateId: string): Promise<ManualAdjustmentLog[]> {
    console.warn(`getManualAdjustments for template ${templateId}: ${SERVICE_DISABLED_MSG}`);
    // try {
    //   const insights = await this.getExpertInsights(templateId);
    //   return insights?.manualAdjustments || [];
    // } catch (error) {
    //   // Error already logged by getExpertInsights
    //   throw error;
    // }
    return Promise.resolve([]);
  }
}; 