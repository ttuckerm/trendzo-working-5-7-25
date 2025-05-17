import { apifyService } from '@/lib/services/apifyService';
import { templateAnalysisService } from '@/lib/services/templateAnalysisService';
import { trendingTemplateService } from '@/lib/services/trendingTemplateService';
import { TikTokVideo as NewTikTokVideo, Template, TemplateSection } from '@/lib/types/tiktok';
import { TikTokVideo as LegacyTikTokVideo } from '@/lib/types/trendingTemplate';
import { convertRawToLegacyFormat } from '@/lib/utils/typeAdapters';
import { etlJobService } from '@/lib/services/etlJobService';
import { ETLError, logETLEvent, ETLLogLevel } from '@/lib/utils/etlLogger';
import { etlErrorHandlingService, ETLPhase } from '@/lib/services/etlErrorHandlingService';

/**
 * ETL Coordinator for processing TikTok trending data and storing templates
 */
export const tiktokTemplateEtl = {
  /**
   * Main ETL process to fetch trending TikTok videos and create templates
   */
  async processHotTrends(options = {}) {
    // Create a job in the ETL job service to track this run
    const jobId = await etlJobService.createJob({
      name: 'TikTok Template ETL - Hot Trends',
      type: 'hot-trends',
      status: 'running',
      startTime: new Date().toISOString()
    });
    
    logETLEvent(ETLLogLevel.INFO, 'Starting TikTok trend ETL process', {
      jobId,
      options,
      timestamp: new Date().toISOString()
    });
    
    const startTime = Date.now();
    
    try {
      // Step 1: Extract - Fetch trending videos from Apify
      logETLEvent(ETLLogLevel.INFO, 'Extracting trending videos from TikTok', { jobId });
      
      let rawVideos;
      try {
        rawVideos = await apifyService.scrapeTrending(options);
      } catch (error) {
        // Use error handling service for extraction errors
        const errorResult = await etlErrorHandlingService.handleError(
          error, 
          'extraction', 
          jobId, 
          { phase: 'extraction', options }
        );
        
        // If the error wasn't handled successfully, rethrow
        if (!errorResult.handled) {
          throw error;
        }
        
        // If retry strategy was used, try again with the retry count
        if (errorResult.strategy === 'retry' && errorResult.retryCount) {
          rawVideos = await apifyService.scrapeTrending({
            ...options,
            retryCount: errorResult.retryCount
          });
        } else {
          // For other strategies like 'notify-only', we should exit
          await etlJobService.failJob(
            jobId,
            `Failed to extract videos: ${error instanceof Error ? error.message : String(error)}`,
            { processed: 0, failed: 0, templates: 0 }
          );
          
          return {
            total: 0,
            success: 0,
            failed: 1,
            skipped: 0,
            templates: []
          };
        }
      }
      
      if (!rawVideos || rawVideos.length === 0) {
        logETLEvent(ETLLogLevel.WARN, 'No videos returned from Apify scraper', { jobId });
        
        await etlJobService.completeJob(jobId, {
          processed: 0,
          failed: 0,
          templates: 0,
          message: 'No videos returned from Apify scraper'
        });
        
        return {
          total: 0,
          success: 0,
          failed: 0,
          skipped: 0,
          templates: []
        };
      }
      
      // Cast the raw data to our legacy TikTokVideo type
      const legacyVideos = rawVideos.map(video => convertRawToLegacyFormat(video));
      
      logETLEvent(ETLLogLevel.INFO, 'Extracted videos from TikTok', { 
        jobId, 
        count: legacyVideos.length 
      });
      
      // Create checkpoint data for recovery
      const checkpointData = {
        phase: 'extraction',
        timestamp: new Date().toISOString(),
        videoCount: legacyVideos.length,
        firstVideoId: legacyVideos[0]?.id
      };
      
      // Step 2: Transform - Analyze videos and extract template data
      logETLEvent(ETLLogLevel.INFO, 'Analyzing videos for template data', { 
        jobId,
        videoCount: legacyVideos.length
      });
      
      // Process videos with error handling and recovery support
      const results = await this.processVideosWithRecovery(legacyVideos, jobId, checkpointData);
      
      // Step 3: Complete the job
      const timeElapsed = (Date.now() - startTime) / 1000;
      
      logETLEvent(ETLLogLevel.INFO, 'ETL process completed', {
        jobId,
        totalVideos: results.total,
        successCount: results.success,
        failedCount: results.failed,
        skippedCount: results.skipped,
        timeElapsed: `${timeElapsed} seconds`
      });
      
      await etlJobService.completeJob(jobId, {
        processed: results.total,
        failed: results.failed,
        templates: results.templates.length,
        message: `Processed ${results.total} videos in ${timeElapsed} seconds`
      });
      
      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error in ETL process';
      
      logETLEvent(ETLLogLevel.ERROR, 'Error in TikTok ETL process', {
        jobId,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
        timeElapsed: `${(Date.now() - startTime) / 1000} seconds`
      });
      
      // Mark job as failed
      await etlJobService.failJob(
        jobId,
        errorMessage,
        { 
          processed: 0, 
          failed: 0, 
          templates: 0 
        }
      );
      
      throw error;
    }
  },
  
  /**
   * Process videos with comprehensive error handling and recovery
   */
  async processVideosWithRecovery(
    videos: LegacyTikTokVideo[], 
    jobId: string,
    checkpointData?: any
  ) {
    const results = {
      total: videos.length,
      success: 0,
      failed: 0,
      skipped: 0,
      templates: [] as string[]
    };
    
    // Process each video with error handling
    for (let i = 0; i < videos.length; i++) {
      const video = videos[i];
      
      try {
        // Skip videos with missing data
        if (!video.id || !video.videoMeta || !video.stats) {
          logETLEvent(ETLLogLevel.WARN, 'Skipping video due to missing data', {
            jobId,
            videoId: video.id || 'unknown'
          });
          
          results.skipped++;
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
          
          results.skipped++;
          continue;
        }
        
        // Update checkpoint data with current progress
        const updatedCheckpoint = {
          ...checkpointData,
          lastProcessedIndex: i,
          lastProcessedVideoId: video.id,
          processedCount: results.success + results.failed + results.skipped
        };
        
        // Analyze video for template sections with error handling
        let templateSections;
        try {
          templateSections = templateAnalysisService.analyzeVideoForTemplates(video);
        } catch (error) {
          // Use error handling service for transformation errors
          const errorResult = await etlErrorHandlingService.handleError(
            error, 
            'transformation',
            jobId,
            {
              phase: 'transformation',
              itemId: video.id,
              checkpointData: updatedCheckpoint,
              hasCheckpoint: true,
              processed: results.success,
              failed: results.failed
            }
          );
          
          // If the error was handled as 'skip', continue to the next video
          if (errorResult.handled && errorResult.strategy === 'skip') {
            results.failed++;
            continue;
          }
          
          // Otherwise, rethrow the error
          throw new ETLError(
            `Error analyzing video ${video.id} for templates: ${error instanceof Error ? error.message : 'Unknown error'}`,
            'TRANSFORM_ERROR',
            error instanceof Error ? error : undefined
          );
        }
        
        // Skip if we couldn't extract template sections
        if (templateSections.length === 0) {
          logETLEvent(ETLLogLevel.DEBUG, 'No template sections identified in video', {
            jobId,
            videoId: video.id
          });
          
          results.skipped++;
          continue;
        }
        
        // Categorize the video with error handling
        let category;
        try {
          category = templateAnalysisService.categorizeVideo(video);
        } catch (error) {
          // Use error handling service for transformation errors
          const errorResult = await etlErrorHandlingService.handleError(
            error, 
            'transformation',
            jobId,
            {
              phase: 'transformation',
              subphase: 'categorization',
              itemId: video.id,
              checkpointData: updatedCheckpoint,
              hasCheckpoint: true,
              processed: results.success,
              failed: results.failed
            }
          );
          
          // If the error was handled as 'skip', continue to the next video
          if (errorResult.handled && errorResult.strategy === 'skip') {
            results.failed++;
            continue;
          }
          
          throw new ETLError(
            `Error categorizing video ${video.id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            'TRANSFORM_ERROR',
            error instanceof Error ? error : undefined
          );
        }
        
        // Save the template to Firebase with error handling
        let template;
        try {
          template = await trendingTemplateService.createTrendingTemplate(
            video, 
            templateSections,
            category
          );
        } catch (error) {
          // Use error handling service for loading errors
          const errorResult = await etlErrorHandlingService.handleError(
            error, 
            'loading',
            jobId,
            {
              phase: 'loading',
              itemId: video.id,
              checkpointData: updatedCheckpoint,
              hasCheckpoint: true,
              processed: results.success,
              failed: results.failed
            }
          );
          
          // If the error was handled as 'skip', continue to the next video
          if (errorResult.handled && errorResult.strategy === 'skip') {
            results.failed++;
            continue;
          }
          
          // For retry strategy, attempt the operation again
          if (errorResult.handled && errorResult.strategy === 'retry') {
            template = await trendingTemplateService.createTrendingTemplate(
              video, 
              templateSections,
              category
            );
          } else {
            throw new ETLError(
              `Error saving template for video ${video.id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
              'LOAD_ERROR',
              error instanceof Error ? error : undefined
            );
          }
        }
        
        results.success++;
        results.templates.push(template.id);
        
        logETLEvent(ETLLogLevel.INFO, 'Successfully processed video into template', {
          jobId,
          videoId: video.id,
          templateId: template.id
        });
        
      } catch (error) {
        // For unexpected errors not caught by specific handlers
        logETLEvent(ETLLogLevel.ERROR, 'Failed to process video', {
          jobId,
          videoId: video?.id || 'unknown',
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
        
        results.failed++;
      }
    }
    
    return results;
  },
  
  /**
   * Process a batch of TikTok videos, analyze them, and store as templates
   * (Legacy method maintained for backward compatibility)
   */
  async processVideos(videos: LegacyTikTokVideo[], jobId?: string) {
    return this.processVideosWithRecovery(videos, jobId || 'legacy');
  },
  
  /**
   * Update stats for existing templates by re-scraping their source videos
   */
  async updateTemplateStats() {
    // Create a job in the ETL job service to track this run
    const jobId = await etlJobService.createJob({
      name: 'TikTok Template ETL - Update Stats',
      type: 'update-stats',
      status: 'running',
      startTime: new Date().toISOString()
    });
    
    logETLEvent(ETLLogLevel.INFO, 'Starting template stats update', {
      jobId,
      timestamp: new Date().toISOString()
    });
    
    const startTime = Date.now();
    
    try {
      // Get all active templates
      let templates;
      try {
        templates = await trendingTemplateService.getAllTrendingTemplates(100);
      } catch (error) {
        // Use error handling service for loading errors
        const errorResult = await etlErrorHandlingService.handleError(
          error,
          'loading',
          jobId,
          {
            phase: 'loading',
            operation: 'fetch-templates'
          }
        );
        
        // If the error wasn't handled, rethrow
        if (!errorResult.handled) {
          throw new ETLError(
            `Failed to fetch templates for stats update: ${error instanceof Error ? error.message : 'Unknown error'}`,
            'LOAD_ERROR',
            error instanceof Error ? error : undefined
          );
        }
        
        // If handled but not retried successfully, return an empty result
        return { updated: 0, failed: 1, skipped: 0, total: 0 };
      }
      
      logETLEvent(ETLLogLevel.INFO, 'Found active templates to update', { 
        jobId, 
        count: templates.length 
      });
      
      let updated = 0;
      let failed = 0;
      let skipped = 0;
      
      // Process each template
      for (const template of templates) {
        try {
          if (!template.sourceVideoId) {
            logETLEvent(ETLLogLevel.WARN, 'Skipping template - No source video ID', {
              jobId,
              templateId: template.id
            });
            
            skipped++;
            continue;
          }
          
          // Scrape the video again to get fresh stats
          let videos;
          try {
            videos = await apifyService.scrapeByHashtag(template.sourceVideoId, 1);
          } catch (error) {
            // Use error handling service for extraction errors
            const errorResult = await etlErrorHandlingService.handleError(
              error,
              'extraction',
              jobId,
              {
                phase: 'extraction',
                itemId: template.id,
                sourceVideoId: template.sourceVideoId
              }
            );
            
            // If the error was handled as 'skip', continue to the next template
            if (errorResult.handled && errorResult.strategy === 'skip') {
              skipped++;
              continue;
            }
            
            // If retry strategy was used and it was handled, try again
            if (errorResult.handled && errorResult.strategy === 'retry' && errorResult.retryCount) {
              // Attempt the operation again with retry count
              videos = await apifyService.scrapeByHashtag(template.sourceVideoId, 1);
            } else {
              throw new ETLError(
                `Failed to re-scrape source video for template ${template.id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'EXTRACT_ERROR',
                error instanceof Error ? error : undefined
              );
            }
          }
          
          if (!videos || videos.length === 0) {
            logETLEvent(ETLLogLevel.WARN, 'Could not find source video for template', {
              jobId,
              templateId: template.id,
              sourceVideoId: template.sourceVideoId
            });
            
            skipped++;
            continue;
          }
          
          // Convert to legacy format for type safety
          const legacyVideos = videos.map(video => convertRawToLegacyFormat(video));
          const video = legacyVideos[0];
          
          if (!video || !video.stats) {
            logETLEvent(ETLLogLevel.WARN, 'Invalid video data for template', {
              jobId,
              templateId: template.id,
              sourceVideoId: template.sourceVideoId
            });
            
            skipped++;
            continue;
          }
          
          // Update the template stats
          try {
            await trendingTemplateService.updateTemplateStats(template.id, video.stats);
          } catch (error) {
            // Use error handling service for loading errors
            const errorResult = await etlErrorHandlingService.handleError(
              error,
              'loading',
              jobId,
              {
                phase: 'loading',
                operation: 'update-stats',
                itemId: template.id
              }
            );
            
            // If the error was handled as 'skip', continue to the next template
            if (errorResult.handled && errorResult.strategy === 'skip') {
              failed++;
              continue;
            }
            
            // If retry strategy was used and it was handled, try again
            if (errorResult.handled && errorResult.strategy === 'retry') {
              await trendingTemplateService.updateTemplateStats(template.id, video.stats);
            } else {
              throw new ETLError(
                `Failed to update stats for template ${template.id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'LOAD_ERROR',
                error instanceof Error ? error : undefined
              );
            }
          }
          
          updated++;
          
          logETLEvent(ETLLogLevel.INFO, 'Updated stats for template', {
            jobId,
            templateId: template.id
          });
          
        } catch (error) {
          logETLEvent(ETLLogLevel.ERROR, 'Failed to update template', {
            jobId,
            templateId: template.id,
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
          });
          
          failed++;
        }
      }
      
      const timeElapsed = (Date.now() - startTime) / 1000;
      
      logETLEvent(ETLLogLevel.INFO, 'Stats update completed', {
        jobId,
        totalTemplates: templates.length,
        updatedCount: updated,
        failedCount: failed,
        skippedCount: skipped,
        timeElapsed: `${timeElapsed} seconds`
      });
      
      await etlJobService.completeJob(jobId, {
        processed: templates.length,
        failed: failed,
        templates: updated,
        message: `Updated ${updated} templates in ${timeElapsed} seconds`
      });
      
      return { updated, failed, skipped, total: templates.length };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error updating template stats';
      
      logETLEvent(ETLLogLevel.ERROR, 'Error updating template stats', {
        jobId,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
        timeElapsed: `${(Date.now() - startTime) / 1000} seconds`
      });
      
      // Mark job as failed
      await etlJobService.failJob(
        jobId,
        errorMessage,
        { processed: 0, failed: 0, templates: 0 }
      );
      
      throw error;
    }
  },
  
  /**
   * Process TikTok videos by specific categories
   */
  async processByCategories(categories: string[] = [
    'dance', 'product', 'tutorial', 'comedy', 'fashion'
  ]) {
    // Create a job in the ETL job service to track this run
    const jobId = await etlJobService.createJob({
      name: 'TikTok Template ETL - Categories',
      type: 'categories',
      status: 'running',
      startTime: new Date().toISOString(),
      parameters: { categories }
    });
    
    logETLEvent(ETLLogLevel.INFO, 'Starting category-based TikTok ETL', {
      jobId,
      categories: categories.join(', '),
      timestamp: new Date().toISOString()
    });
    
    const startTime = Date.now();
    
    try {
      const results: Record<string, any> = {
        categories: {},
        totalSuccess: 0,
        totalFailed: 0,
        totalSkipped: 0
      };
      
      // Process each category
      for (const category of categories) {
        try {
          logETLEvent(ETLLogLevel.INFO, 'Processing category', {
            jobId,
            category
          });
          
          // Create a checkpoint for this category
          const categoryCheckpoint = {
            category,
            timestamp: new Date().toISOString(),
            processed: results.totalSuccess + results.totalFailed + results.totalSkipped
          };
          
          // Scrape videos for this category with error handling
          let rawVideos;
          try {
            rawVideos = await apifyService.scrapeByCategory(category, 20);
          } catch (error) {
            // Use error handling service
            const errorResult = await etlErrorHandlingService.handleError(
              error,
              'extraction',
              jobId,
              {
                phase: 'extraction',
                category,
                checkpointData: categoryCheckpoint,
                hasCheckpoint: true
              }
            );
            
            // If the error was handled as 'skip', continue to the next category
            if (errorResult.handled && errorResult.strategy === 'skip') {
              results.categories[category] = { 
                error: `Category skipped due to extraction error: ${error instanceof Error ? error.message : String(error)}`,
                success: 0,
                failed: 1,
                skipped: 0
              };
              results.totalFailed++;
              continue;
            }
            
            // If retry strategy was used, try again
            if (errorResult.handled && errorResult.strategy === 'retry' && errorResult.retryCount) {
              rawVideos = await apifyService.scrapeByCategory(category, 20);
            } else {
              throw new ETLError(
                `Failed to extract videos for category ${category}: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'EXTRACT_ERROR',
                error instanceof Error ? error : undefined
              );
            }
          }
          
          // Convert to our legacy format
          const legacyVideos = rawVideos.map(video => convertRawToLegacyFormat(video));
          
          logETLEvent(ETLLogLevel.INFO, 'Extracted videos for category', {
            jobId,
            category,
            count: legacyVideos.length
          });
          
          // Process the videos with error handling and recovery
          const categoryResults = await this.processVideosWithRecovery(
            legacyVideos, 
            jobId,
            categoryCheckpoint
          );
          
          // Store results for this category
          results.categories[category] = categoryResults;
          results.totalSuccess += categoryResults.success;
          results.totalFailed += categoryResults.failed;
          results.totalSkipped += categoryResults.skipped;
          
          logETLEvent(ETLLogLevel.INFO, 'Completed processing for category', {
            jobId,
            category,
            success: categoryResults.success,
            failed: categoryResults.failed,
            skipped: categoryResults.skipped
          });
          
        } catch (error) {
          // Use error handling service for the entire category
          const errorResult = await etlErrorHandlingService.handleError(
            error,
            'unknown',
            jobId,
            {
              phase: 'unknown',
              category,
              processed: results.totalSuccess,
              failed: results.totalFailed
            }
          );
          
          // Even if handled, we record the category as failed
          logETLEvent(ETLLogLevel.ERROR, 'Error processing category', {
            jobId,
            category,
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            errorHandled: errorResult.handled
          });
          
          results.categories[category] = { error: (error as Error).message };
          results.totalFailed++;
        }
      }
      
      const timeElapsed = (Date.now() - startTime) / 1000;
      
      logETLEvent(ETLLogLevel.INFO, 'Category ETL completed', {
        jobId,
        categoriesProcessed: categories.length,
        totalSuccess: results.totalSuccess,
        totalFailed: results.totalFailed,
        totalSkipped: results.totalSkipped,
        timeElapsed: `${timeElapsed} seconds`
      });
      
      await etlJobService.completeJob(jobId, {
        processed: results.totalSuccess + results.totalFailed + results.totalSkipped,
        failed: results.totalFailed,
        templates: results.totalSuccess,
        message: `Processed ${categories.length} categories in ${timeElapsed} seconds`
      });
      
      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error in category ETL process';
      
      logETLEvent(ETLLogLevel.ERROR, 'Error in category-based TikTok ETL', {
        jobId,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
        timeElapsed: `${(Date.now() - startTime) / 1000} seconds`
      });
      
      // Mark job as failed
      await etlJobService.failJob(
        jobId,
        errorMessage,
        { processed: 0, failed: 0, templates: 0 }
      );
      
      throw error;
    }
  }
}; 