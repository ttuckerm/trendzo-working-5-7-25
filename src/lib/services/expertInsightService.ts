import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/firebase/firebase';
import { 
  doc, 
  updateDoc, 
  getDoc, 
  arrayUnion, 
  serverTimestamp,
  Timestamp,
  Firestore 
} from 'firebase/firestore';
import { 
  TrendingTemplate, 
  ExpertInsightTag, 
  ManualAdjustmentLog 
} from '@/lib/types/trendingTemplate';
import { logETLEvent, ETLLogLevel } from '@/lib/utils/etlLogger';

// Check if Firebase is properly initialized
const isFirebaseInitialized = () => {
  if (!db) {
    throw new Error('Firebase Firestore is not initialized');
  }
  return true;
};

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
    try {
      isFirebaseInitialized();
      const timestamp = new Date().toISOString();
      
      const tagsWithIds = tags.map(tag => ({
        ...tag,
        id: uuidv4(),
        addedBy: expertId,
        addedAt: timestamp
      }));

      const templateRef = doc(db as Firestore, 'templates', templateId);
      const templateDoc = await getDoc(templateRef);
      
      if (!templateDoc.exists()) {
        throw new Error(`Template with ID ${templateId} not found`);
      }
      
      // Add the audit trail entry
      const auditEntry = {
        timestamp,
        user: expertId,
        action: 'add_insight_tags',
        details: `Added ${tags.length} expert insight tags`
      };
      
      // Update the template document
      await updateDoc(templateRef, {
        'expertInsights.tags': arrayUnion(...tagsWithIds),
        'auditTrail.lastModifiedBy': expertId,
        'auditTrail.modificationHistory': arrayUnion(auditEntry),
        updatedAt: timestamp
      });
      
      logETLEvent(ETLLogLevel.INFO, 'Added expert insight tags to template', {
        templateId,
        expertId,
        tagCount: tags.length
      });
      
      return tagsWithIds;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      
      logETLEvent(ETLLogLevel.ERROR, 'Error adding expert insight tags', {
        templateId,
        expertId,
        error: errorMsg
      });
      
      throw error;
    }
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
    try {
      const timestamp = new Date().toISOString();
      
      const templateRef = doc(db, 'templates', templateId);
      const templateDoc = await getDoc(templateRef);
      
      if (!templateDoc.exists()) {
        throw new Error(`Template with ID ${templateId} not found`);
      }
      
      // Add the audit trail entry
      const auditEntry = {
        timestamp,
        user: expertId,
        action: 'update_expert_notes',
        details: 'Updated expert notes'
      };
      
      // Update the template document
      await updateDoc(templateRef, {
        'expertInsights.notes': notes,
        'auditTrail.lastModifiedBy': expertId,
        'auditTrail.modificationHistory': arrayUnion(auditEntry),
        updatedAt: timestamp
      });
      
      logETLEvent(ETLLogLevel.INFO, 'Updated expert notes for template', {
        templateId,
        expertId
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      
      logETLEvent(ETLLogLevel.ERROR, 'Error updating expert notes', {
        templateId,
        expertId,
        error: errorMsg
      });
      
      throw error;
    }
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
    try {
      const timestamp = new Date().toISOString();
      
      const templateRef = doc(db, 'templates', templateId);
      const templateDoc = await getDoc(templateRef);
      
      if (!templateDoc.exists()) {
        throw new Error(`Template with ID ${templateId} not found`);
      }
      
      // Add the audit trail entry
      const auditEntry = {
        timestamp,
        user: expertId,
        action: 'update_recommended_uses',
        details: `Updated recommended uses (${recommendedUses.length} items)`
      };
      
      // Update the template document
      await updateDoc(templateRef, {
        'expertInsights.recommendedUses': recommendedUses,
        'auditTrail.lastModifiedBy': expertId,
        'auditTrail.modificationHistory': arrayUnion(auditEntry),
        updatedAt: timestamp
      });
      
      logETLEvent(ETLLogLevel.INFO, 'Updated recommended uses for template', {
        templateId,
        expertId,
        count: recommendedUses.length
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      
      logETLEvent(ETLLogLevel.ERROR, 'Error updating recommended uses', {
        templateId,
        expertId,
        error: errorMsg
      });
      
      throw error;
    }
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
    try {
      // Validate rating is between 1-5
      if (rating < 1 || rating > 5) {
        throw new Error('Performance rating must be between 1 and 5');
      }
      
      const timestamp = new Date().toISOString();
      
      const templateRef = doc(db, 'templates', templateId);
      const templateDoc = await getDoc(templateRef);
      
      if (!templateDoc.exists()) {
        throw new Error(`Template with ID ${templateId} not found`);
      }
      
      // Get the current rating for the audit trail
      const templateData = templateDoc.data() as TrendingTemplate;
      const currentRating = templateData.expertInsights?.performanceRating;
      
      // Add the audit trail entry
      const auditEntry = {
        timestamp,
        user: expertId,
        action: 'update_performance_rating',
        details: `Updated performance rating from ${currentRating || 'N/A'} to ${rating}`
      };
      
      // Update the template document
      await updateDoc(templateRef, {
        'expertInsights.performanceRating': rating,
        'auditTrail.lastModifiedBy': expertId,
        'auditTrail.modificationHistory': arrayUnion(auditEntry),
        updatedAt: timestamp
      });
      
      logETLEvent(ETLLogLevel.INFO, 'Updated performance rating for template', {
        templateId,
        expertId,
        previousRating: currentRating,
        newRating: rating
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      
      logETLEvent(ETLLogLevel.ERROR, 'Error updating performance rating', {
        templateId,
        expertId,
        error: errorMsg
      });
      
      throw error;
    }
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
    try {
      const timestamp = new Date().toISOString();
      
      const templateRef = doc(db, 'templates', templateId);
      const templateDoc = await getDoc(templateRef);
      
      if (!templateDoc.exists()) {
        throw new Error(`Template with ID ${templateId} not found`);
      }
      
      // Add the audit trail entry
      const auditEntry = {
        timestamp,
        user: expertId,
        action: 'update_audience_recommendations',
        details: `Updated audience recommendations (${audienceRecs.length} items)`
      };
      
      // Update the template document
      await updateDoc(templateRef, {
        'expertInsights.audienceRecommendation': audienceRecs,
        'auditTrail.lastModifiedBy': expertId,
        'auditTrail.modificationHistory': arrayUnion(auditEntry),
        updatedAt: timestamp
      });
      
      logETLEvent(ETLLogLevel.INFO, 'Updated audience recommendations for template', {
        templateId,
        expertId,
        count: audienceRecs.length
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      
      logETLEvent(ETLLogLevel.ERROR, 'Error updating audience recommendations', {
        templateId,
        expertId,
        error: errorMsg
      });
      
      throw error;
    }
  },
  
  /**
   * Record a manual adjustment to a template field
   * @param templateId ID of the template
   * @param field Field that was adjusted
   * @param previousValue Previous value
   * @param newValue New value
   * @param reason Reason for the adjustment
   * @param expertId ID of the expert making the adjustment
   * @returns The created adjustment log entry
   */
  async recordManualAdjustment(
    templateId: string,
    field: string,
    previousValue: any,
    newValue: any,
    reason: string,
    expertId: string
  ): Promise<ManualAdjustmentLog> {
    try {
      const timestamp = new Date().toISOString();
      
      const adjustment: ManualAdjustmentLog = {
        id: uuidv4(),
        field,
        previousValue,
        newValue,
        reason,
        adjustedBy: expertId,
        adjustedAt: timestamp
      };
      
      const templateRef = doc(db, 'templates', templateId);
      const templateDoc = await getDoc(templateRef);
      
      if (!templateDoc.exists()) {
        throw new Error(`Template with ID ${templateId} not found`);
      }
      
      // Add the audit trail entry
      const auditEntry = {
        timestamp,
        user: expertId,
        action: 'manual_adjustment',
        details: `Manually adjusted field "${field}": ${reason}`
      };
      
      // Update the template document
      await updateDoc(templateRef, {
        manualAdjustments: arrayUnion(adjustment),
        'auditTrail.lastModifiedBy': expertId,
        'auditTrail.modificationHistory': arrayUnion(auditEntry),
        updatedAt: timestamp
      });
      
      // Also update the actual field that was changed
      // This requires special handling because the field could be nested
      const fieldPath = field.split('.');
      let updateObj: any = {};
      
      if (fieldPath.length === 1) {
        // Top-level field
        updateObj[fieldPath[0]] = newValue;
      } else {
        // Nested field
        let current = updateObj;
        for (let i = 0; i < fieldPath.length - 1; i++) {
          current[fieldPath[i]] = {};
          current = current[fieldPath[i]];
        }
        current[fieldPath[fieldPath.length - 1]] = newValue;
      }
      
      await updateDoc(templateRef, updateObj);
      
      logETLEvent(ETLLogLevel.INFO, 'Recorded manual adjustment to template', {
        templateId,
        expertId,
        field,
        reason
      });
      
      return adjustment;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      
      logETLEvent(ETLLogLevel.ERROR, 'Error recording manual adjustment', {
        templateId,
        expertId,
        field,
        error: errorMsg
      });
      
      throw error;
    }
  },
  
  /**
   * Get expert insights for a template
   * @param templateId ID of the template
   * @returns Expert insights or null if none exist
   */
  async getExpertInsights(templateId: string) {
    try {
      const templateRef = doc(db, 'templates', templateId);
      const templateDoc = await getDoc(templateRef);
      
      if (!templateDoc.exists()) {
        throw new Error(`Template with ID ${templateId} not found`);
      }
      
      const templateData = templateDoc.data() as TrendingTemplate;
      return templateData.expertInsights || null;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      
      logETLEvent(ETLLogLevel.ERROR, 'Error getting expert insights', {
        templateId,
        error: errorMsg
      });
      
      throw error;
    }
  },
  
  /**
   * Get manual adjustment logs for a template
   * @param templateId ID of the template
   * @returns Array of manual adjustment logs
   */
  async getManualAdjustments(templateId: string) {
    try {
      const templateRef = doc(db, 'templates', templateId);
      const templateDoc = await getDoc(templateRef);
      
      if (!templateDoc.exists()) {
        throw new Error(`Template with ID ${templateId} not found`);
      }
      
      const templateData = templateDoc.data() as TrendingTemplate;
      return templateData.manualAdjustments || [];
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      
      logETLEvent(ETLLogLevel.ERROR, 'Error getting manual adjustments', {
        templateId,
        error: errorMsg
      });
      
      throw error;
    }
  }
}; 