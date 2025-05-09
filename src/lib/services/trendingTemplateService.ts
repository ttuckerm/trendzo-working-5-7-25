import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { TrendingTemplate, TikTokVideo, TemplateSection, TemplateAnalysis } from '@/lib/types/trendingTemplate';
import { v4 as uuidv4 } from 'uuid';

// Collection name for trending templates
const COLLECTION_NAME = 'trendingTemplates';

// Service for managing trending templates
export const trendingTemplateService = {
  // Get all trending templates
  async getAllTrendingTemplates(limitCount = 50): Promise<TrendingTemplate[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        orderBy('stats.engagementRate', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        ...doc.data() as TrendingTemplate,
        id: doc.id
      }));
    } catch (error) {
      console.error('Error fetching trending templates:', error);
      throw error;
    }
  },
  
  // Get trending templates by category
  async getTrendingTemplatesByCategory(category: string, limitCount = 20): Promise<TrendingTemplate[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('category', '==', category),
        orderBy('stats.engagementRate', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        ...doc.data() as TrendingTemplate,
        id: doc.id
      }));
    } catch (error) {
      console.error(`Error fetching trending templates for category ${category}:`, error);
      throw error;
    }
  },
  
  // Get a single trending template by ID
  async getTrendingTemplateById(id: string): Promise<TrendingTemplate | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      return {
        ...docSnap.data() as TrendingTemplate,
        id: docSnap.id
      };
    } catch (error) {
      console.error(`Error fetching trending template with ID ${id}:`, error);
      throw error;
    }
  },
  
  // Create trending template from TikTok video with analyzed template sections
  async createTrendingTemplate(
    video: TikTokVideo, 
    templateSections: TemplateSection[],
    category: string
  ): Promise<TrendingTemplate> {
    try {
      // Generate a unique ID for the template
      const templateId = uuidv4();
      
      // Calculate engagement rate
      const totalViews = video.stats.playCount || 1;
      const engagementRate = (
        (video.stats.diggCount + video.stats.commentCount + video.stats.shareCount) / 
        totalViews
      ) * 100;
      
      // Create the trending template object
      const template: TrendingTemplate = {
        id: templateId,
        sourceVideoId: video.id,
        category,
        title: video.text.substring(0, 100) || `Template ${templateId.substring(0, 8)}`,
        description: video.text,
        thumbnailUrl: '', // Would need to be generated
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
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
          engagementRate
        },
        metadata: {
          duration: video.videoMeta.duration,
          hashtags: video.hashtags
        },
        templateStructure: templateSections,
        trendData: {
          dailyViews: { 
            [new Date().toISOString().split('T')[0]]: video.stats.playCount 
          },
          growthRate: 0,
        },
        isActive: true
      };
      
      // Save to Firestore
      await setDoc(doc(db, COLLECTION_NAME, templateId), template);
      
      return template;
    } catch (error) {
      console.error('Error creating trending template:', error);
      throw error;
    }
  },
  
  // Update trending template
  async updateTrendingTemplate(id: string, data: Partial<TrendingTemplate>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      
      // Add updated timestamp
      const updateData = {
        ...data,
        updatedAt: new Date().toISOString()
      };
      
      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error(`Error updating trending template ${id}:`, error);
      throw error;
    }
  },
  
  // Update template stats with new data from TikTok
  async updateTemplateStats(id: string, videoStats: TikTokVideo['stats']): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const templateDoc = await getDoc(docRef);
      
      if (!templateDoc.exists()) {
        throw new Error(`Template with ID ${id} not found`);
      }
      
      const template = templateDoc.data() as TrendingTemplate;
      const today = new Date().toISOString().split('T')[0];
      
      // Calculate engagement rate
      const totalViews = videoStats.playCount || 1;
      const engagementRate = (
        (videoStats.diggCount + videoStats.commentCount + videoStats.shareCount) / 
        totalViews
      ) * 100;
      
      // Update daily views
      const dailyViews = {
        ...template.trendData.dailyViews,
        [today]: videoStats.playCount
      };
      
      // Calculate growth rate (last 7 days)
      const dates = Object.keys(dailyViews).sort();
      const lastWeekDates = dates.slice(-7);
      
      let growthRate = 0;
      if (lastWeekDates.length > 1) {
        const firstValue = dailyViews[lastWeekDates[0]] || 0;
        const lastValue = dailyViews[lastWeekDates[lastWeekDates.length - 1]] || 0;
        
        if (firstValue > 0) {
          growthRate = ((lastValue - firstValue) / firstValue) * 100;
        }
      }
      
      // Update the document
      await updateDoc(docRef, {
        'stats.views': videoStats.playCount,
        'stats.likes': videoStats.diggCount,
        'stats.comments': videoStats.commentCount,
        'stats.shares': videoStats.shareCount,
        'stats.engagementRate': engagementRate,
        'trendData.dailyViews': dailyViews,
        'trendData.growthRate': growthRate,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error(`Error updating stats for template ${id}:`, error);
      throw error;
    }
  },
  
  // Mark template as inactive
  async deactivateTemplate(id: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, {
        isActive: false,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error(`Error deactivating template ${id}:`, error);
      throw error;
    }
  },
  
  // Get trending templates with high growth rate
  async getFastGrowingTemplates(limitCount = 10): Promise<TrendingTemplate[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('isActive', '==', true),
        orderBy('trendData.growthRate', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        ...doc.data() as TrendingTemplate,
        id: doc.id
      }));
    } catch (error) {
      console.error('Error fetching fast growing templates:', error);
      throw error;
    }
  },
  
  /**
   * Create a trending template with analysis and support for expert input
   * @param video The source TikTok video
   * @param analysis The analysis results
   * @param options Additional options for template creation
   * @returns The created trending template
   */
  async createTemplateWithAnalysis(
    video: TikTokVideo,
    analysis: any,
    options: {
      createdBy?: string;
      allowExpertInput?: boolean;
    } = {}
  ): Promise<TrendingTemplate> {
    try {
      // Generate a unique ID for the template
      const templateId = uuidv4();
      
      // Default creator ID
      const createdBy = options.createdBy || 'system';
      
      // Calculate engagement rate
      const totalViews = video.stats.playCount || 1;
      const engagementRate = (
        (video.stats.diggCount + video.stats.commentCount + video.stats.shareCount) / 
        totalViews
      ) * 100;
      
      // Extract template sections from analysis
      const templateSections: TemplateSection[] = analysis.templateStructure?.sections || [];
      
      // Create the trending template object with enhanced structure
      const template: TrendingTemplate = {
        id: templateId,
        sourceVideoId: video.id,
        category: analysis.templateCategory || 'uncategorized',
        title: video.text.substring(0, 100) || `Template ${templateId.substring(0, 8)}`,
        description: video.text,
        thumbnailUrl: '', // Would need to be generated
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
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
          engagementRate
        },
        metadata: {
          duration: video.videoMeta.duration,
          hashtags: video.hashtags
        },
        templateStructure: templateSections,
        analysisData: {
          templateId,
          videoId: video.id,
          estimatedSections: templateSections,
          detectedElements: analysis.detectedElements || {
            hasCaption: true,
            hasCTA: false,
            hasProductDisplay: false,
            hasTextOverlay: false,
            hasVoiceover: false,
            hasBgMusic: true
          },
          effectiveness: {
            engagementRate,
            conversionRate: analysis.keyMetrics?.conversionRate || 0,
            averageViewDuration: analysis.keyMetrics?.averageViewDuration || 0
          },
          engagementInsights: Array.isArray(analysis.engagementInsights) 
            ? analysis.engagementInsights 
            : [String(analysis.engagementInsights || '')],
          similarityPatterns: typeof analysis.similarityPatterns === 'string'
            ? analysis.similarityPatterns
            : JSON.stringify(analysis.similarityPatterns || {})
        },
        trendData: {
          dailyViews: { 
            [new Date().toISOString().split('T')[0]]: video.stats.playCount 
          },
          growthRate: 0,
          velocityScore: analysis.velocityScore || 0,
          dailyGrowth: 0,
          weeklyGrowth: 0,
          similarTemplates: analysis.similarTemplates || []
        },
        // Expert input fields
        expertInsights: options.allowExpertInput ? {
          tags: [],
          notes: '',
          recommendedUses: [],
          performanceRating: 0,
          audienceRecommendation: []
        } : undefined,
        // Audit trail for tracking modifications
        auditTrail: {
          createdBy,
          lastModifiedBy: createdBy,
          modificationHistory: [
            {
              timestamp: new Date().toISOString(),
              user: createdBy,
              action: 'create',
              details: 'Template created from TikTok video'
            }
          ]
        },
        isActive: true
      };
      
      // Save to Firestore
      await setDoc(doc(db, COLLECTION_NAME, templateId), template);
      
      return template;
    } catch (error) {
      console.error('Error creating trending template with analysis:', error);
      throw error;
    }
  },
  
  /**
   * Add expert insight tag to a template
   * @param templateId The template ID
   * @param tag The expert insight tag to add
   * @param userId ID of the user adding the tag
   * @returns The updated template
   */
  async addExpertInsightTag(
    templateId: string,
    tag: {
      tag: string;
      category: 'content' | 'engagement' | 'trend' | 'demographic' | 'other';
      confidence: number;
    },
    userId: string
  ): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, templateId);
      const templateDoc = await getDoc(docRef);
      
      if (!templateDoc.exists()) {
        throw new Error(`Template with ID ${templateId} not found`);
      }
      
      const template = templateDoc.data() as TrendingTemplate;
      
      // Create the tag object
      const newTag = {
        id: uuidv4(),
        ...tag,
        addedBy: userId,
        addedAt: new Date().toISOString()
      };
      
      // Initialize expertInsights if it doesn't exist
      const expertInsights = template.expertInsights || {
        tags: [],
        notes: '',
        recommendedUses: [],
        performanceRating: 0,
        audienceRecommendation: []
      };
      
      // Add the tag
      expertInsights.tags = [...expertInsights.tags, newTag];
      
      // Add audit trail entry
      const auditTrail = template.auditTrail || {
        createdBy: 'system',
        lastModifiedBy: userId,
        modificationHistory: []
      };
      
      auditTrail.lastModifiedBy = userId;
      auditTrail.modificationHistory.push({
        timestamp: new Date().toISOString(),
        user: userId,
        action: 'add_expert_tag',
        details: `Added expert tag: ${tag.tag}`
      });
      
      // Update the document
      await updateDoc(docRef, {
        expertInsights,
        auditTrail,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error(`Error adding expert insight tag to template ${templateId}:`, error);
      throw error;
    }
  },
  
  /**
   * Update expert insights for a template
   * @param templateId The template ID
   * @param insights The expert insights to update
   * @param userId ID of the user updating the insights
   */
  async updateExpertInsights(
    templateId: string,
    insights: Partial<TrendingTemplate['expertInsights']>,
    userId: string
  ): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, templateId);
      const templateDoc = await getDoc(docRef);
      
      if (!templateDoc.exists()) {
        throw new Error(`Template with ID ${templateId} not found`);
      }
      
      const template = templateDoc.data() as TrendingTemplate;
      
      // Initialize expertInsights if it doesn't exist
      const currentInsights = template.expertInsights || {
        tags: [],
        notes: '',
        recommendedUses: [],
        performanceRating: 0,
        audienceRecommendation: []
      };
      
      // Merge the insights
      const updatedInsights = {
        ...currentInsights,
        ...insights
      };
      
      // Add audit trail entry
      const auditTrail = template.auditTrail || {
        createdBy: 'system',
        lastModifiedBy: userId,
        modificationHistory: []
      };
      
      auditTrail.lastModifiedBy = userId;
      auditTrail.modificationHistory.push({
        timestamp: new Date().toISOString(),
        user: userId,
        action: 'update_expert_insights',
        details: `Updated expert insights: ${Object.keys(insights).join(', ')}`
      });
      
      // Update the document
      await updateDoc(docRef, {
        expertInsights: updatedInsights,
        auditTrail,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error(`Error updating expert insights for template ${templateId}:`, error);
      throw error;
    }
  },
  
  /**
   * Get average engagement for a template category
   * @param category The category to get average engagement for
   * @returns Average engagement (likes + shares) for the category
   */
  async getCategoryAverageEngagement(category: string): Promise<number> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('category', '==', category),
        limit(50)
      );
      
      const querySnapshot = await getDocs(q);
      const templates = querySnapshot.docs.map(doc => doc.data() as TrendingTemplate);
      
      if (templates.length === 0) {
        return 0;
      }
      
      // Calculate total engagement for each template (likes + shares)
      const totalEngagement = templates.reduce((sum, template) => {
        const likes = template.stats?.likes || 0;
        const shares = template.stats?.shares || 0;
        return sum + likes + shares;
      }, 0);
      
      // Return average
      return totalEngagement / templates.length;
    } catch (error) {
      console.error(`Error getting average engagement for category ${category}:`, error);
      return 0;
    }
  }
}; 