import { db } from '@/lib/firebase/firebase';
import { collection, doc, setDoc, getDoc, updateDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { TikTokVideo, TrendingTemplate, TemplateAnalysis } from '@/lib/types/trendingTemplate';
import { v4 as uuidv4 } from 'uuid';

/**
 * Service for storing template analysis data in Firebase
 */
export const templateStorageService = {
  /**
   * Store a new template analysis in Firebase
   * 
   * @param video The source TikTok video
   * @param analysis The analysis results
   * @returns The ID of the stored template
   */
  async storeTemplateAnalysis(
    video: TikTokVideo, 
    analysis: any
  ): Promise<string> {
    try {
      console.log('Storing template analysis in Firebase:', video.id);
      
      // Generate a unique template ID
      const templateId = `template-${uuidv4().substring(0, 8)}`;
      
      // Create template sections from the analysis structure
      const templateSections = analysis.templateStructure.sections.map((section: any, index: number) => {
        // Parse timing from string format (e.g., "0-5s") to numbers
        const [start, end] = section.timing.replace('s', '').split('-').map(Number);
        
        return {
          id: `section-${index}`,
          startTime: start,
          duration: end - start,
          type: section.type.toLowerCase(),
          textOverlays: [] // No text overlays in initial analysis
        };
      });
      
      // Format data as TrendingTemplate
      const template: TrendingTemplate = {
        id: templateId,
        sourceVideoId: video.id,
        category: analysis.templateCategory,
        title: video.text.substring(0, 50) + (video.text.length > 50 ? '...' : ''),
        description: video.text,
        thumbnailUrl: '', // TikTok doesn't provide easy thumbnail access
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
          engagementRate: analysis.keyMetrics.engagementRate
        },
        metadata: {
          duration: video.videoMeta?.duration || 0,
          hashtags: video.hashtags || [],
          aiDetectedCategory: analysis.templateCategory
        },
        templateStructure: templateSections,
        analysisData: {
          templateId: templateId,
          videoId: video.id,
          estimatedSections: templateSections,
          detectedElements: {
            hasCaption: true,
            hasCTA: analysis.templateStructure.sections.some((s: any) => 
              s.type.toLowerCase().includes('cta')),
            hasProductDisplay: false,
            hasTextOverlay: false,
            hasVoiceover: false,
            hasBgMusic: true
          },
          effectiveness: {
            engagementRate: analysis.keyMetrics.engagementRate,
            conversionRate: analysis.keyMetrics.completionRate,
            averageViewDuration: 0
          },
          engagementInsights: analysis.templateNotes,
          similarityPatterns: JSON.stringify(analysis.similarTemplates)
        },
        trendData: {
          dailyViews: {},
          growthRate: 0,
          velocityScore: analysis.viralPotential,
          dailyGrowth: 0,
          weeklyGrowth: 0,
          similarTemplates: analysis.similarTemplates?.map((t: any) => t.id) || []
        },
        isActive: true
      };
      
      // Save to Firebase Firestore
      const templatesRef = collection(db, 'templates');
      const templateDocRef = doc(templatesRef, templateId);
      
      await setDoc(templateDocRef, template);
      
      console.log(`Template ${templateId} saved to Firebase`);
      
      return templateId;
    } catch (error) {
      console.error('Error storing template analysis:', error);
      throw error;
    }
  },
  
  /**
   * Update template metrics based on latest data
   * 
   * @param templateId The template ID to update
   * @param newMetrics New metrics data
   */
  async updateTemplateMetrics(
    templateId: string, 
    newMetrics: Partial<TrendingTemplate['trendData']>
  ): Promise<void> {
    try {
      const templateDocRef = doc(db, 'templates', templateId);
      
      await updateDoc(templateDocRef, {
        'trendData': newMetrics,
        'updatedAt': new Date().toISOString()
      });
      
      console.log(`Template ${templateId} metrics updated`);
    } catch (error) {
      console.error(`Error updating template ${templateId} metrics:`, error);
      throw error;
    }
  },
  
  /**
   * Find templates similar to the given template
   * 
   * @param category The template category
   * @param limit Number of similar templates to return
   */
  async findSimilarTemplates(
    category: string,
    limit = 5
  ): Promise<TrendingTemplate[]> {
    try {
      const templatesRef = collection(db, 'templates');
      const q = query(
        templatesRef,
        where('category', '==', category),
        where('isActive', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      const templates: TrendingTemplate[] = [];
      
      querySnapshot.forEach((doc) => {
        templates.push(doc.data() as TrendingTemplate);
      });
      
      // Limit to requested number of results
      return templates.slice(0, limit);
    } catch (error) {
      console.error('Error finding similar templates:', error);
      throw error;
    }
  }
}; 