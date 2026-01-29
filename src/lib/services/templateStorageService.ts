// import { db } from '@/lib/firebase/firebase'; // db will be null
// import { collection, doc, setDoc, getDoc, updateDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { TikTokVideo, TrendingTemplate, TemplateAnalysis } from '@/lib/types/trendingTemplate';
import { v4 as uuidv4 } from 'uuid';

const SERVICE_DISABLED_MSG = "templateStorageService: Firebase backend has been removed. Method called but will not perform DB operations. TODO: Implement with Supabase.";

/**
 * Service for storing template analysis data
 */
export const templateStorageService = {
  /**
   * Store a new template analysis (mocked operation)
   */
  async storeTemplateAnalysis(
    video: TikTokVideo, 
    analysis: any
  ): Promise<string> {
    const mockTemplateId = `mock-tpl-id-${uuidv4().substring(0, 8)}`;
    console.warn(`storeTemplateAnalysis for video ${video.id}: ${SERVICE_DISABLED_MSG} Returning mock template ID: ${mockTemplateId}. Analysis data:`, analysis);
    // Original data processing logic can be kept for reference if useful, but no DB write.
    // const templateId = `template-${uuidv4().substring(0, 8)}`;
    // ... (rest of template object creation) ...
    // console.log(`Generated (but not stored) template object for video ${video.id}:`, template);
    return Promise.resolve(mockTemplateId);
  },
  
  /**
   * Update template metrics (mocked operation)
   */
  async updateTemplateMetrics(
    templateId: string, 
    newMetrics: Partial<TrendingTemplate['trendData']>
  ): Promise<void> {
    console.warn(`updateTemplateMetrics for template ${templateId}: ${SERVICE_DISABLED_MSG} Metrics:`, newMetrics);
    return Promise.resolve();
  },
  
  /**
   * Find similar templates (mocked operation)
   */
  async findSimilarTemplates(
    category: string,
    limit = 5
  ): Promise<TrendingTemplate[]> {
    console.warn(`findSimilarTemplates for category ${category} (limit ${limit}): ${SERVICE_DISABLED_MSG}`);
    return Promise.resolve([]);
  }
}; 