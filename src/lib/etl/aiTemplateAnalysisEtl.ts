import { TikTokVideo, TrendingTemplate } from '@/lib/types/trendingTemplate';
import { advancedTemplateAnalysisService } from '@/lib/services/advancedTemplateAnalysisService';
import { trendingTemplateService } from '@/lib/services/trendingTemplateService';
import { apifyService } from '@/lib/services/apifyService';
import { etlJobService } from '@/lib/services/etlJobService';
import { ETLError, logETLEvent, ETLLogLevel } from '@/lib/utils/etlLogger';

/**
 * ETL module for AI-enhanced template analysis
 * This module processes TikTok videos from Apify, uses the advanced template
 * analysis service to extract and analyze templates, and stores results in Firebase
 */
export const aiTemplateAnalysisEtl = {
  /**
   * Process trending videos with AI analysis
   * @param maxItems Maximum number of videos to process
   */
  async processTrendingWithAI(maxItems = 30): Promise<{ 
    processed: number; 
    templates: TrendingTemplate[] 
  }> {
    const jobId = await etlJobService.createJob({
      name: 'AI-Enhanced Template Analysis - Trending',
      type: 'ai-trending',
      status: 'running',
      startTime: new Date().toISOString()
    });
    
    logETLEvent(ETLLogLevel.INFO, 'Starting AI-enhanced trending template analysis ETL', {
      jobId,
      maxItems,
      timestamp: new Date().toISOString()
    });
    
    try {
      // Extract - Fetch trending videos from Apify
      logETLEvent(ETLLogLevel.INFO, 'Extracting trending videos from TikTok', { jobId });
      const videos = await apifyService.scrapeTrending({ maxItems });
      
      if (!videos || videos.length === 0) {
        throw new ETLError('No videos returned from Apify scraper', 'EXTRACT_ERROR');
      }
      
      logETLEvent(ETLLogLevel.INFO, 'Successfully extracted videos from TikTok', { 
        jobId, 
        count: videos.length 
      });
      
      // Transform - Process videos with AI analysis
      logETLEvent(ETLLogLevel.INFO, 'Starting AI analysis of extracted videos', { 
        jobId,
        videoCount: videos.length
      });
      
      const processedTemplates: TrendingTemplate[] = [];
      const failedVideos: { id: string; reason: string }[] = [];
      
      for (const video of videos) {
        try {
          // Skip videos with missing data
          if (!video.id || !video.videoMeta || !video.stats) {
            logETLEvent(ETLLogLevel.WARN, 'Skipping video due to missing data', {
              jobId,
              videoId: video.id || 'unknown'
            });
            failedVideos.push({ 
              id: video.id || 'unknown', 
              reason: 'Missing required data fields' 
            });
            continue;
          }
          
          // Skip videos with low engagement
          if (video.stats.playCount < 10000 || video.stats.diggCount < 1000) {
            logETLEvent(ETLLogLevel.DEBUG, 'Skipping video due to low engagement', {
              jobId,
              videoId: video.id,
              playCount: video.stats.playCount,
              likeCount: video.stats.diggCount
            });
            continue;
          }
          
          // Analyze video with AI
          logETLEvent(ETLLogLevel.DEBUG, 'Analyzing video with AI', {
            jobId,
            videoId: video.id
          });
          
          const analysisResult = await advancedTemplateAnalysisService.analyzeVideoContent(video);
          
          // Clean data before storing
          const cleanedAnalysis = this.sanitizeAnalysisData(analysisResult);
          
          // Create template with analysis result
          const template = await trendingTemplateService.createTemplateWithAnalysis(
            video,
            cleanedAnalysis,
            {
              createdBy: 'ai-etl-system',
              allowExpertInput: true
            }
          );
          
          processedTemplates.push(template);
          
          logETLEvent(ETLLogLevel.INFO, 'Successfully processed and stored template', {
            jobId,
            videoId: video.id,
            templateId: template.id
          });
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          
          logETLEvent(ETLLogLevel.ERROR, 'Error processing individual video', {
            jobId,
            videoId: video.id,
            error: errorMsg,
            stack: error instanceof Error ? error.stack : undefined
          });
          
          failedVideos.push({ id: video.id, reason: errorMsg });
        }
      }
      
      // Load - Complete job with results
      const result = {
        processed: processedTemplates.length,
        failed: failedVideos.length,
        skipped: videos.length - processedTemplates.length - failedVideos.length,
        templates: processedTemplates.map(t => t.id)
      };
      
      await etlJobService.completeJob(jobId, result);
      
      logETLEvent(ETLLogLevel.INFO, 'AI template analysis ETL process completed', {
        jobId,
        processedCount: processedTemplates.length,
        failedCount: failedVideos.length,
        skippedCount: videos.length - processedTemplates.length - failedVideos.length
      });
      
      return {
        processed: processedTemplates.length,
        templates: processedTemplates
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      
      logETLEvent(ETLLogLevel.ERROR, 'Error in AI template analysis ETL process', {
        jobId,
        error: errorMsg,
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Mark job as failed
      await etlJobService.failJob(
        jobId,
        errorMsg,
        { processed: 0, failed: 0, templates: 0 }
      );
      
      throw error;
    }
  },
  
  /**
   * Sanitize analysis data to prevent errors when storing in Firebase
   * @param analysisData The raw analysis data from the AI service
   * @returns Cleaned analysis data
   */
  sanitizeAnalysisData(analysisData: any): any {
    try {
      // Create a deep copy to avoid modifying the original
      const cleanedData = JSON.parse(JSON.stringify(analysisData));
      
      // Handle undefined values
      const replaceUndefined = (obj: any) => {
        for (const key in obj) {
          if (obj[key] === undefined) {
            obj[key] = null;
          } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            replaceUndefined(obj[key]);
          }
        }
      };
      
      replaceUndefined(cleanedData);
      
      // Convert non-string values that should be strings
      if (cleanedData.similarityPatterns && typeof cleanedData.similarityPatterns !== 'string') {
        cleanedData.similarityPatterns = JSON.stringify(cleanedData.similarityPatterns);
      }
      
      // Ensure engagementInsights is an array
      if (!Array.isArray(cleanedData.engagementInsights)) {
        cleanedData.engagementInsights = cleanedData.engagementInsights
          ? [cleanedData.engagementInsights.toString()]
          : [];
      }
      
      return cleanedData;
    } catch (error) {
      logETLEvent(ETLLogLevel.WARN, 'Error sanitizing analysis data', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Return original data if cleaning fails
      return analysisData;
    }
  },
  
  /**
   * Process videos by category with AI analysis
   * @param category Category to process
   * @param maxItems Maximum number of videos to process
   */
  async processCategoryWithAI(category: string, maxItems = 30): Promise<{
    processed: number;
    templates: TrendingTemplate[]
  }> {
    try {
      console.log(`Starting AI template analysis ETL process for ${maxItems} videos in category "${category}"...`);
      
      // 1. Extract - Get videos from Apify by category
      const rawVideos = await apifyService.scrapeByCategory(category, maxItems);
      console.log(`Extracted ${rawVideos.length} videos from Apify for category "${category}"`);
      
      // 2. Transform - Analyze each video with AI (same logic as processTrendingWithAI)
      const processedTemplates: TrendingTemplate[] = [];
      
      for (let i = 0; i < rawVideos.length; i++) {
        // Validate the video has the required structure before processing
        const rawVideo = rawVideos[i];
        if (!this.validateTikTokVideo(rawVideo)) {
          console.warn(`Skipping invalid video at index ${i}`);
          continue;
        }
        
        const video = rawVideo as TikTokVideo;
        console.log(`Processing video ${i + 1}/${rawVideos.length}: ${video.id}`);
        
        try {
          // Perform AI analysis
          const { templateSections, category: detectedCategory, analysis } = 
            await advancedTemplateAnalysisService.analyzeVideoWithAI(video);
          
          // Use the input category, but store detected category in metadata
          const template = await trendingTemplateService.createTrendingTemplate(
            video,
            templateSections,
            category
          );
          
          // Update with AI analysis and detected category
          await trendingTemplateService.updateTrendingTemplate(template.id, {
            analysisData: {
              ...analysis,
              templateId: template.id
            },
            // Store AI-detected category in metadata
            metadata: {
              ...template.metadata,
              aiDetectedCategory: detectedCategory
            }
          });
          
          // Add to processed list
          processedTemplates.push({
            ...template,
            analysisData: {
              ...analysis,
              templateId: template.id
            },
            metadata: {
              ...template.metadata,
              aiDetectedCategory: detectedCategory
            }
          });
          
          console.log(`Successfully processed template ${template.id}`);
        } catch (error) {
          console.error(`Error processing video ${video.id}:`, error);
          // Continue with the next video
        }
      }
      
      console.log(`AI template analysis ETL process completed for category "${category}". Processed ${processedTemplates.length} templates.`);
      
      return {
        processed: processedTemplates.length,
        templates: processedTemplates
      };
    } catch (error) {
      console.error('Error in AI template analysis ETL process:', error);
      throw error;
    }
  },
  
  /**
   * Update template analysis and popularity metrics
   * @param templateId The ID of the template to update
   */
  async updateTemplateAnalysisAndMetrics(templateId: string): Promise<void> {
    try {
      console.log(`Updating template analysis and metrics for template ${templateId}...`);
      
      // 1. Get the template from Firebase
      const template = await trendingTemplateService.getTrendingTemplateById(templateId);
      if (!template) {
        throw new Error(`Template with ID ${templateId} not found`);
      }
      
      // 2. Calculate template velocity metrics
      const velocityMetrics = await advancedTemplateAnalysisService.trackTemplateVelocity(templateId);
      
      // 3. Find similar templates
      const similarTemplates = await advancedTemplateAnalysisService.findSimilarTemplates(
        templateId, 
        5 // Top 5 similar templates
      );
      
      // 4. Update template with velocity metrics and similar templates
      await trendingTemplateService.updateTrendingTemplate(templateId, {
        // Store velocity metrics in trendData
        trendData: {
          ...template.trendData,
          velocityScore: velocityMetrics.velocityScore,
          dailyGrowth: velocityMetrics.dailyGrowth,
          weeklyGrowth: velocityMetrics.weeklyGrowth,
          similarTemplates: similarTemplates.map(t => t.id)
        }
      });
      
      console.log(`Successfully updated template analysis and metrics for template ${templateId}`);
    } catch (error) {
      console.error(`Error updating template analysis and metrics for template ${templateId}:`, error);
      throw error;
    }
  },
  
  /**
   * Process all templates to update metrics
   * @param limit Maximum number of templates to process
   */
  async updateAllTemplateMetrics(limit = 50): Promise<{ processed: number }> {
    try {
      console.log(`Updating metrics for up to ${limit} templates...`);
      
      // 1. Get templates to update
      const templates = await trendingTemplateService.getAllTrendingTemplates(limit);
      console.log(`Found ${templates.length} templates to update`);
      
      // 2. Update each template's metrics
      let processed = 0;
      
      for (const template of templates) {
        try {
          await this.updateTemplateAnalysisAndMetrics(template.id);
          processed++;
        } catch (error) {
          console.error(`Error updating template ${template.id}:`, error);
          // Continue with the next template
        }
      }
      
      console.log(`Template metrics update completed. Processed ${processed} templates.`);
      
      return { processed };
    } catch (error) {
      console.error('Error updating template metrics:', error);
      throw error;
    }
  },
  
  /**
   * Process a batch of videos by their IDs
   * @param videoIds Array of TikTok video IDs to process
   * @param batchSize Number of videos to process in parallel
   * @returns Results of batch processing
   */
  async processBatchVideos(videoIds: string[], batchSize = 5): Promise<{
    processed: number;
    failed: number;
    templates: TrendingTemplate[];
  }> {
    try {
      console.log(`Starting batch processing of ${videoIds.length} videos with batch size ${batchSize}...`);
      
      const results = {
        processed: 0,
        failed: 0,
        templates: [] as TrendingTemplate[]
      };
      
      // Process videos in batches for better performance and to avoid rate limits
      for (let i = 0; i < videoIds.length; i += batchSize) {
        const batchIds = videoIds.slice(i, i + batchSize);
        console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(videoIds.length / batchSize)}`);
        
        // Use Promise.allSettled to handle failures gracefully
        const batchPromises = batchIds.map(async (videoId) => {
          try {
            // Fetch video data using Apify
            const videos = await apifyService.scrapeByHashtag(videoId, 1);
            
            if (!videos || videos.length === 0) {
              console.warn(`Video not found: ${videoId}`);
              return { status: 'failed', id: videoId, reason: 'Video not found' };
            }
            
            // Safely cast to TikTokVideo after validation by first converting to unknown type
            const videoData = videos[0];
            if (!videoData || typeof videoData !== 'object') {
              console.warn(`Invalid video data format for: ${videoId}`);
              return { status: 'failed', id: videoId, reason: 'Invalid video data format' };
            }
            
            // Type assertion with validation
            const video = videoData as TikTokVideo;
            if (!this.validateTikTokVideo(video)) {
              console.warn(`Invalid video data for: ${videoId}`);
              return { status: 'failed', id: videoId, reason: 'Invalid video data' };
            }
            
            // Perform AI analysis
            const { templateSections, category, analysis } = 
              await advancedTemplateAnalysisService.analyzeVideoWithAI(video);
            
            // Create template
            const template = await trendingTemplateService.createTrendingTemplate(
              video,
              templateSections,
              category
            );
            
            // We need to update the template with analysis data
            if (template && template.id) {
              await trendingTemplateService.updateTrendingTemplate(template.id, {
                analysisData: {
                  ...analysis,
                  templateId: template.id
                }
              });
              
              // Update the template object with analysis data for return value
              const updatedTemplate: TrendingTemplate = {
                ...template,
                analysisData: {
                  ...analysis,
                  templateId: template.id
                }
              };
              
              return { 
                status: 'fulfilled', 
                template: updatedTemplate
              };
            } else {
              return { status: 'failed', id: videoId, reason: 'Failed to create template' };
            }
          } catch (error) {
            console.error(`Error processing video ${videoId}:`, error);
            return { status: 'failed', id: videoId, reason: (error as Error).message };
          }
        });
        
        const batchResults = await Promise.allSettled(batchPromises);
        
        // Process batch results
        for (const result of batchResults) {
          if (result.status === 'fulfilled') {
            const batchResult = result.value;
            if (batchResult.status === 'fulfilled') {
              results.processed++;
              results.templates.push(batchResult.template);
            } else {
              results.failed++;
            }
          } else {
            results.failed++;
          }
        }
        
        // Add a small delay between batches to avoid rate limiting
        if (i + batchSize < videoIds.length) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      console.log(`Batch processing completed. Processed: ${results.processed}, Failed: ${results.failed}`);
      return results;
    } catch (error) {
      console.error('Error in batch processing:', error);
      throw error;
    }
  },
  
  /**
   * Find all similar templates across the database
   * @param categoryFilter Optional category to filter results
   * @param minSimilarity Minimum similarity score (0-1)
   * @param maxResults Maximum number of similar template pairs to return
   * @returns List of similar template pairs with similarity scores
   */
  async findAllSimilarTemplates(
    categoryFilter?: string,
    minSimilarity = 0.6,
    maxResults = 20
  ): Promise<{
    similarPairs: Array<{
      template1Id: string;
      template2Id: string;
      similarityScore: number;
      category: string;
    }>;
    totalPairs: number;
  }> {
    try {
      console.log(`Finding similar templates with min similarity ${minSimilarity}...`);
      
      // Get all templates, filtered by category if specified
      let templates: TrendingTemplate[];
      if (categoryFilter) {
        templates = await trendingTemplateService.getTrendingTemplatesByCategory(categoryFilter, 100);
        console.log(`Found ${templates.length} templates in category "${categoryFilter}"`);
      } else {
        templates = await trendingTemplateService.getAllTrendingTemplates(200);
        console.log(`Found ${templates.length} templates across all categories`);
      }
      
      // Check all pairs for similarity
      const similarPairs: Array<{
        template1Id: string;
        template2Id: string;
        similarityScore: number;
        category: string;
      }> = [];
      
      // Using a nested loop to compare each template with every other
      for (let i = 0; i < templates.length; i++) {
        const template1 = templates[i];
        
        for (let j = i + 1; j < templates.length; j++) {
          const template2 = templates[j];
          
          // Calculate similarity
          const similarityScore = 
            advancedTemplateAnalysisService.calculateTemplateSimilarity(template1, template2) / 100;
          
          // Add to results if above threshold
          if (similarityScore >= minSimilarity) {
            similarPairs.push({
              template1Id: template1.id,
              template2Id: template2.id,
              similarityScore,
              category: template1.category
            });
          }
        }
      }
      
      // Sort by similarity score (descending)
      similarPairs.sort((a, b) => b.similarityScore - a.similarityScore);
      
      // Limit results
      const limitedPairs = similarPairs.slice(0, maxResults);
      
      console.log(`Found ${similarPairs.length} similar template pairs, returning top ${limitedPairs.length}`);
      
      return {
        similarPairs: limitedPairs,
        totalPairs: similarPairs.length
      };
    } catch (error) {
      console.error('Error finding similar templates:', error);
      throw error;
    }
  },
  
  /**
   * Detect trending templates based on velocity scores
   * @param timeWindow Time window for trend detection ('1d', '7d', '30d')
   * @param minVelocity Minimum velocity score to consider
   * @param limit Maximum number of trending templates to return
   * @returns List of trending templates with velocity data
   */
  async detectTrendingTemplates(
    timeWindow = '7d',
    minVelocity = 5,
    limit = 10
  ): Promise<{
    trendingTemplates: Array<{
      template: TrendingTemplate;
      velocityScore: number;
      growthRate: number;
    }>;
    timeWindow: string;
  }> {
    try {
      console.log(`Detecting trending templates with min velocity ${minVelocity} in time window ${timeWindow}...`);
      
      // Get all templates
      const templates = await trendingTemplateService.getAllTrendingTemplates(100);
      
      // Filter for templates with sufficient data
      const validTemplates = templates.filter(template => 
        template.trendData && 
        Object.keys(template.trendData.dailyViews || {}).length > 0
      );
      
      // Calculate days for time window
      let days = 7;
      if (timeWindow === '1d') days = 1;
      if (timeWindow === '30d') days = 30;
      
      // Get current date for comparison
      const now = new Date();
      const results: Array<{
        template: TrendingTemplate;
        velocityScore: number;
        growthRate: number;
      }> = [];
      
      // Calculate velocity for each template
      for (const template of validTemplates) {
        // Check if we already have a velocity score
        if (template.trendData.velocityScore && template.trendData.velocityScore >= minVelocity) {
          results.push({
            template,
            velocityScore: template.trendData.velocityScore,
            growthRate: template.trendData.growthRate
          });
          continue;
        }
        
        // Calculate velocity if not available
        try {
          const velocityMetrics = await advancedTemplateAnalysisService.trackTemplateVelocity(template.id);
          
          if (velocityMetrics.velocityScore >= minVelocity) {
            // Update template with velocity data
            const updatedTrendData = {
              ...template.trendData,
              velocityScore: velocityMetrics.velocityScore,
              dailyGrowth: velocityMetrics.dailyGrowth,
              weeklyGrowth: velocityMetrics.weeklyGrowth,
              growthRate: velocityMetrics.weeklyGrowth
            };
            
            // Update in Firebase
            await trendingTemplateService.updateTrendingTemplate(template.id, {
              trendData: updatedTrendData
            });
            
            // Create updated template object for return value
            const updatedTemplate: TrendingTemplate = {
              ...template,
              trendData: updatedTrendData
            };
            
            results.push({
              template: updatedTemplate,
              velocityScore: velocityMetrics.velocityScore,
              growthRate: velocityMetrics.weeklyGrowth
            });
          }
        } catch (error) {
          console.error(`Error calculating velocity for template ${template.id}:`, error);
          // Continue with next template
        }
      }
      
      // Sort by velocity score (descending)
      results.sort((a, b) => b.velocityScore - a.velocityScore);
      
      // Limit results
      const limitedResults = results.slice(0, limit);
      
      console.log(`Found ${results.length} trending templates, returning top ${limitedResults.length}`);
      
      return {
        trendingTemplates: limitedResults,
        timeWindow
      };
    } catch (error) {
      console.error('Error detecting trending templates:', error);
      throw error;
    }
  },
  
  /**
   * Validate that a raw object has the required TikTokVideo structure
   * @param obj Object to validate
   * @returns True if the object has the required properties
   */
  validateTikTokVideo(obj: any): boolean {
    if (!obj) return false;
    
    // Check for required fields
    const requiredProps = [
      'id', 'text', 'createTime', 'authorMeta',
      'videoMeta', 'hashtags', 'stats', 'videoUrl'
    ];
    
    for (const prop of requiredProps) {
      if (!(prop in obj)) {
        console.warn(`Validation failed: missing property ${prop}`);
        return false;
      }
    }
    
    // Check nested fields
    if (!obj.authorMeta.id || !obj.authorMeta.nickname) {
      console.warn('Validation failed: missing authorMeta properties');
      return false;
    }
    
    if (!obj.videoMeta.duration) {
      console.warn('Validation failed: missing videoMeta.duration');
      return false;
    }
    
    if (!obj.stats.playCount && obj.stats.playCount !== 0) {
      console.warn('Validation failed: missing stats.playCount');
      return false;
    }
    
    return true;
  }
}; 