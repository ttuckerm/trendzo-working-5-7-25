// import { 
//   collection, 
//   doc, 
//   getDoc, 
//   getDocs, 
//   setDoc, 
//   updateDoc, 
//   query, 
//   where, 
//   orderBy, 
//   limit,
//   Timestamp,
//   serverTimestamp,
//   increment
// } from 'firebase/firestore';
// import { db } from '@/lib/firebase/firebase'; // Firebase db is null
import { TrendingTemplate, TikTokVideo, TemplateSection, TemplateAnalysis, ExpertInsightTag, ManualAdjustmentLog } from '@/lib/types/trendingTemplate';
import { v4 as uuidv4 } from 'uuid';

const SERVICE_DISABLED_MSG = "trendingTemplateService: Firebase backend has been removed. Method called but will not perform DB operations. Returning mock/empty data. TODO: Implement with Supabase.";

// Mock factory for TrendingTemplate
const createMockTrendingTemplate = (id: string, overrides: Partial<TrendingTemplate> = {}): TrendingTemplate => ({
  id,
  title: `Mock Template ${id.substring(0,8)} (Firebase Disabled)`,
  description: "This is a mock template because Firebase is disabled.",
  thumbnailUrl: "https://via.placeholder.com/150?text=Mock+Template",
  category: "Mock Category",
  tags: ["mock", "disabled"],
  authorName: "Mock Author",
  stats: {
    views: 0,
    likes: 0,
    usageCount: 0,
    commentCount: 0,
    shareCount: 0,
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isPremium: false,
  isVerified: false,
  trendData: {
    dailyViews: {},
    growthRate: 0,
    velocityScore: 0,
  },
  expertInsights: {
    tags: [],
    notes: "Expert insights disabled.",
    recommendedUses: [],
    performanceRating: 0,
    audienceRecommendation: [],
  },
  manualAdjustments: [],
  isActive: false, // Default to inactive for mocks from disabled service
  sourceVideoId: `mock-video-${id}`,
  authorInfo: {
    id: "mock-author-id",
    username: "mockusername",
    isVerified: false,
  },
  metadata: {
    duration: 0,
    hashtags: [],
  },
  templateStructure: [],
  ...overrides,
});

// Collection name for trending templates
// const COLLECTION_NAME = 'trendingTemplates'; // No longer used

// Service for managing trending templates
export const trendingTemplateService = {
  // Get all trending templates
  async getAllTrendingTemplates(limitCount = 50): Promise<TrendingTemplate[]> {
    console.warn(`getAllTrendingTemplates(${limitCount}): ${SERVICE_DISABLED_MSG}`);
    return Promise.resolve([]);
  },
  
  // Get trending templates by category
  async getTrendingTemplatesByCategory(category: string, limitCount = 20): Promise<TrendingTemplate[]> {
    console.warn(`getTrendingTemplatesByCategory(${category}, ${limitCount}): ${SERVICE_DISABLED_MSG}`);
    return Promise.resolve([]);
  },
  
  // Get a single trending template by ID
  async getTrendingTemplateById(id: string): Promise<TrendingTemplate | null> {
    console.warn(`getTrendingTemplateById(${id}): ${SERVICE_DISABLED_MSG}`);
    // Optionally, return a specific mock if needed for testing flows, otherwise null
    // return Promise.resolve(createMockTrendingTemplate(id)); 
    return Promise.resolve(null);
  },
  
  // Create trending template from TikTok video with analyzed template sections
  async createTrendingTemplate(
    video: TikTokVideo, 
    templateSections: TemplateSection[],
    category: string
  ): Promise<TrendingTemplate> {
    const mockId = uuidv4();
    console.warn(`createTrendingTemplate for video ${video.id}: ${SERVICE_DISABLED_MSG} Returning mock template ${mockId}.`);
    const engagementRate = video.stats.playCount > 0 ? 
      ((video.stats.diggCount + video.stats.commentCount + video.stats.shareCount) / video.stats.playCount) * 100 
      : 0;
    return Promise.resolve(createMockTrendingTemplate(mockId, {
      sourceVideoId: video.id,
      category,
      title: video.text.substring(0, 100) || `Mock Template ${mockId.substring(0, 8)}`,
      description: video.text,
      authorInfo: {
        id: video.authorMeta.id,
        username: video.authorMeta.nickname,
        isVerified: video.authorMeta.verified
      },
      stats: {
        views: video.stats.playCount,
        likes: video.stats.diggCount,
        comments: video.stats.commentCount,
        shares: video.stats.shareCount,
        usageCount: 0, // Not directly from TikTokVideo
        // engagementRate - this is not part of TrendingTemplate.stats directly, but part of a sub-object in some legacy definitions. The main mock provides a default.
      },
      metadata: {
        duration: video.videoMeta.duration,
        hashtags: video.hashtags
      },
      templateStructure: templateSections,
      isActive: true, // New creations might be active by default
    }));
  },
  
  // Update trending template
  async updateTrendingTemplate(id: string, data: Partial<TrendingTemplate>): Promise<void> {
    console.warn(`updateTrendingTemplate(${id}): ${SERVICE_DISABLED_MSG} Data:`, data);
    return Promise.resolve();
  },
  
  // Update template stats with new data from TikTok
  async updateTemplateStats(id: string, videoStats: TikTokVideo['stats']): Promise<void> {
    console.warn(`updateTemplateStats(${id}): ${SERVICE_DISABLED_MSG} Video Stats:`, videoStats);
    return Promise.resolve();
  },
  
  // Mark template as inactive
  async deactivateTemplate(id: string): Promise<void> {
    console.warn(`deactivateTemplate(${id}): ${SERVICE_DISABLED_MSG}`);
    return Promise.resolve();
  },
  
  // Get trending templates with high growth rate
  async getFastGrowingTemplates(limitCount = 10): Promise<TrendingTemplate[]> {
    console.warn(`getFastGrowingTemplates(${limitCount}): ${SERVICE_DISABLED_MSG}`);
    return Promise.resolve([]);
  },
  
  // Search trending templates
  async searchTrendingTemplates(queryText: string, limitCount = 10): Promise<TrendingTemplate[]> {
    console.warn(`searchTrendingTemplates("${queryText}", ${limitCount}): ${SERVICE_DISABLED_MSG}`);
    return Promise.resolve([]);
  },

  // Increment template usage count
  async incrementTemplateUsage(templateId: string, userId?: string): Promise<void> {
    console.warn(`incrementTemplateUsage(${templateId}, user: ${userId}): ${SERVICE_DISABLED_MSG}`);
    return Promise.resolve();
  },

  // Add template analysis data
  async addTemplateAnalysis(templateId: string, analysis: TemplateAnalysis): Promise<void> {
    console.warn(`addTemplateAnalysis(${templateId}): ${SERVICE_DISABLED_MSG} Analysis:`, analysis);
    return Promise.resolve();
  },

  // Create a template with analysis data (combines creation and analysis storage)
  async createTemplateWithAnalysis(
    video: TikTokVideo,
    analysis: any, // Using any as the original type was complex and might vary
    options: {
      createdBy?: string;
      allowExpertInput?: boolean;
    } = {}
  ): Promise<TrendingTemplate> {
    const mockId = uuidv4();
    console.warn(`createTemplateWithAnalysis for video ${video.id}: ${SERVICE_DISABLED_MSG} Returning mock template ${mockId}. Options:`, options);
    // Re-use parts of createTrendingTemplate mock logic
    const engagementRate = video.stats.playCount > 0 ? 
      ((video.stats.diggCount + video.stats.commentCount + video.stats.shareCount) / video.stats.playCount) * 100 
      : 0;
    return Promise.resolve(createMockTrendingTemplate(mockId, {
      sourceVideoId: video.id,
      category: analysis?.category || "Mock Analysis Category",
      title: video.text.substring(0, 100) || `Mock Template ${mockId.substring(0, 8)}`,
      description: video.text,
      authorInfo: {
        id: video.authorMeta.id,
        username: video.authorMeta.nickname,
        isVerified: video.authorMeta.verified
      },
      stats: {
        views: video.stats.playCount,
        likes: video.stats.diggCount,
        comments: video.stats.commentCount,
        shares: video.stats.shareCount,
        usageCount: 0,
      },
      metadata: {
        duration: video.videoMeta.duration,
        hashtags: video.hashtags,
        aiDetectedCategory: analysis?.category,
      },
      templateStructure: analysis?.templateStructure?.sections || [], // Example access
      analysisData: analysis, // Store the provided analysis as mock
      isActive: true,
    }));
  },

  // Add expert insight tag to a template
  async addExpertInsightTag(
    templateId: string,
    tag: {
      tag: string;
      category: 'content' | 'engagement' | 'trend' | 'demographic' | 'other';
      confidence: number;
    },
    userId: string
  ): Promise<void> {
    console.warn(`addExpertInsightTag(${templateId}, userId: ${userId}): ${SERVICE_DISABLED_MSG} Tag:`, tag);
    return Promise.resolve();
  },

  // Log manual adjustment to a template
  async logManualAdjustment(
    templateId: string,
    adjustment: Omit<ManualAdjustmentLog, 'id' | 'adjustedAt'>
  ): Promise<string> {
    const mockAdjustmentId = uuidv4();
    console.warn(`logManualAdjustment(${templateId}): ${SERVICE_DISABLED_MSG} Returning mock ID ${mockAdjustmentId}. Adjustment:`, adjustment);
    return Promise.resolve(mockAdjustmentId);
  },

  // Update expert insights for a template
  async updateExpertInsights(
    templateId: string,
    insights: Partial<TrendingTemplate['expertInsights']>,
    userId: string
  ): Promise<void> {
    console.warn(`updateExpertInsights(${templateId}, userId: ${userId}): ${SERVICE_DISABLED_MSG} Insights:`, insights);
    return Promise.resolve();
  },

  // Get templates requiring expert review
  async getTemplatesForExpertReview(limitCount = 10): Promise<TrendingTemplate[]> {
    console.warn(`getTemplatesForExpertReview(${limitCount}): ${SERVICE_DISABLED_MSG}`);
    return Promise.resolve([]);
  },

  // Link a sound to a template
  async linkSoundToTemplate(templateId: string, soundId: string, soundName: string): Promise<void> {
    console.warn(`linkSoundToTemplate(${templateId}, soundId: ${soundId}): ${SERVICE_DISABLED_MSG}`);
    return Promise.resolve();
  },

  // Unlink a sound from a template
  async unlinkSoundFromTemplate(templateId: string, soundId: string): Promise<void> {
    console.warn(`unlinkSoundFromTemplate(${templateId}, soundId: ${soundId}): ${SERVICE_DISABLED_MSG}`);
    return Promise.resolve();
  },
  
  // Get average engagement for a category (example of a more complex query)
  async getCategoryAverageEngagement(category: string): Promise<number> {
    console.warn(`getCategoryAverageEngagement(${category}): ${SERVICE_DISABLED_MSG}`);
    return Promise.resolve(0); // Return a mock average
  },

  // Get templates by author ID
  async getTemplatesByAuthor(authorId: string, limitCount = 10): Promise<TrendingTemplate[]> {
    console.warn(`getTemplatesByAuthor(${authorId}, ${limitCount}): ${SERVICE_DISABLED_MSG}`);
    return Promise.resolve([]);
  },

  // Get a batch of templates by IDs
  async getTemplatesByIds(ids: string[]): Promise<TrendingTemplate[]> {
    console.warn(`getTemplatesByIds([${ids.join(',')} ]): ${SERVICE_DISABLED_MSG}`);
    // For more realistic mock, could return a mix of found (mocked) and not found (nulls filtered out or handled by caller)
    // For now, just an empty array or array of mocks based on input IDs
    if (ids.length === 0) return Promise.resolve([]);
    // return Promise.resolve(ids.map(id => createMockTrendingTemplate(id)));
    return Promise.resolve([]); // simpler for now
  },

  // Get templates by multiple categories
  async getTemplatesByCategories(categories: string[], limitCount = 20): Promise<TrendingTemplate[]> {
    console.warn(`getTemplatesByCategories([${categories.join(',')}], ${limitCount}): ${SERVICE_DISABLED_MSG}`);
    return Promise.resolve([]);
  },

  // Example of a more complex update: update a field if a condition is met
  async conditionallyUpdateTemplate(
    templateId: string, 
    conditionField: keyof TrendingTemplate, 
    conditionValue: any, 
    updateData: Partial<TrendingTemplate>
  ): Promise<boolean> {
    console.warn(`conditionallyUpdateTemplate(${templateId}) on field ${String(conditionField)}: ${SERVICE_DISABLED_MSG} Update:`, updateData);
    return Promise.resolve(false); // Simulate condition not met or update failed
  },

  // Get templates created within a date range
  async getTemplatesByDateRange(startDate: string, endDate: string, limitCount = 50): Promise<TrendingTemplate[]> {
    console.warn(`getTemplatesByDateRange(${startDate} - ${endDate}, ${limitCount}): ${SERVICE_DISABLED_MSG}`);
    return Promise.resolve([]);
  },
  
  // This is a placeholder for any specific Firebase transaction logic that might have existed.
  // Transactions are complex and their neutralization would depend on specific use cases.
  // For now, any transactional function would just log a warning and do nothing or return mock.
  async runTemplateUpdateTransaction(templateId: string, updateFunction: (currentData: TrendingTemplate | null) => Partial<TrendingTemplate> | null): Promise<boolean> {
    console.warn(`runTemplateUpdateTransaction(${templateId}): ${SERVICE_DISABLED_MSG} Transaction logic skipped.`);
    // Simulate a transaction failure or no-op by default
    // In a real Supabase migration, this would be re-implemented with Supabase transaction mechanisms if needed.
    // const mockCurrent = await this.getTrendingTemplateById(templateId); // Would get a mock or null
    // const MOCK_currentData = null; // Simulate not found or pass a mock
    // const MOCK_dataToUpdate = updateFunction(MOCK_currentData);
    // if (MOCK_dataToUpdate) {
    //    console.log("Mock transaction would attempt to apply: ", MOCK_dataToUpdate);
    //    return Promise.resolve(true); // Simulate success if data would be updated
    // }
    return Promise.resolve(false); 
  }
}; 