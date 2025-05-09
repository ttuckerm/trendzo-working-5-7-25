import { apifyService } from '@/lib/services/apifyService';
import { templateAnalysisService } from '@/lib/services/templateAnalysisService';
import { trendingTemplateService } from '@/lib/services/trendingTemplateService';
import { TikTokVideo as NewTikTokVideo, Template, TemplateSection } from '@/lib/types/tiktok';
import { TikTokVideo as LegacyTikTokVideo } from '@/lib/types/trendingTemplate';
import { convertRawToLegacyFormat } from '@/lib/utils/typeAdapters';

/**
 * ETL Coordinator for processing TikTok trending data and storing templates
 */
export const tiktokTemplateEtl = {
  /**
   * Main ETL process to fetch trending TikTok videos and create templates
   */
  async processHotTrends(options = {}) {
    console.log('Starting TikTok trend ETL process...');
    const startTime = Date.now();
    
    try {
      // Step 1: Extract - Fetch trending videos from Apify
      console.log('Extracting trending videos from TikTok...');
      const rawVideos = await apifyService.scrapeTrending(options);
      
      // Cast the raw data to our legacy TikTokVideo type
      const legacyVideos = rawVideos.map(video => convertRawToLegacyFormat(video));
      console.log(`Extracted ${legacyVideos.length} videos from TikTok`);
      
      // Step 2: Transform - Analyze videos and extract template data
      console.log('Analyzing videos for template data...');
      const results = await this.processVideos(legacyVideos);
      
      console.log(`
        ETL process completed in ${(Date.now() - startTime) / 1000} seconds.
        Total videos processed: ${results.total}
        Successfully processed: ${results.success}
        Failed: ${results.failed}
        Skipped: ${results.skipped}
      `);
      
      return results;
    } catch (error) {
      console.error('Error in TikTok ETL process:', error);
      throw error;
    }
  },
  
  /**
   * Process a batch of TikTok videos, analyze them, and store as templates
   */
  async processVideos(videos: LegacyTikTokVideo[]) {
    const results = {
      total: videos.length,
      success: 0,
      failed: 0,
      skipped: 0,
      templates: [] as string[]
    };
    
    // Process each video
    for (const video of videos) {
      try {
        // Skip videos with missing data
        if (!video.id || !video.videoMeta || !video.stats) {
          console.log(`Skipping video ${video.id || 'unknown'} due to missing data`);
          results.skipped++;
          continue;
        }
        
        // Skip videos with low engagement
        if (video.stats.playCount < 10000 || video.stats.diggCount < 1000) {
          console.log(`Skipping video ${video.id} due to low engagement (plays: ${video.stats.playCount}, likes: ${video.stats.diggCount})`);
          results.skipped++;
          continue;
        }
        
        // Analyze video for template sections
        const templateSections = templateAnalysisService.analyzeVideoForTemplates(video);
        
        // Skip if we couldn't extract template sections
        if (templateSections.length === 0) {
          console.log(`Skipping video ${video.id} due to no template sections identified`);
          results.skipped++;
          continue;
        }
        
        // Categorize the video
        const category = templateAnalysisService.categorizeVideo(video);
        
        // Save the template to Firebase
        const template = await trendingTemplateService.createTrendingTemplate(
          video, 
          templateSections,
          category
        );
        
        results.success++;
        results.templates.push(template.id);
        console.log(`Processed video ${video.id} into template ${template.id}`);
        
      } catch (error) {
        console.error(`Failed to process video ${video.id}:`, error);
        results.failed++;
      }
    }
    
    return results;
  },
  
  /**
   * Update stats for existing templates by re-scraping their source videos
   */
  async updateTemplateStats() {
    console.log('Starting template stats update...');
    const startTime = Date.now();
    
    try {
      // Get all active templates
      const templates = await trendingTemplateService.getAllTrendingTemplates(100);
      console.log(`Found ${templates.length} active templates to update`);
      
      let updated = 0;
      let failed = 0;
      let skipped = 0;
      
      // Process each template
      for (const template of templates) {
        try {
          if (!template.sourceVideoId) {
            console.log(`Skipping template ${template.id} - No source video ID`);
            skipped++;
            continue;
          }
          
          // Scrape the video again to get fresh stats
          const videos = await apifyService.scrapeByHashtag(template.sourceVideoId, 1);
          
          if (!videos || videos.length === 0) {
            console.log(`Could not find source video for template ${template.id}`);
            skipped++;
            continue;
          }
          
          // Convert to legacy format for type safety
          const legacyVideos = videos.map(video => convertRawToLegacyFormat(video));
          const video = legacyVideos[0];
          
          if (!video || !video.stats) {
            console.log(`Skipping template ${template.id} - Invalid video data`);
            skipped++;
            continue;
          }
          
          // Update the template stats
          await trendingTemplateService.updateTemplateStats(template.id, video.stats);
          updated++;
          console.log(`Updated stats for template ${template.id}`);
          
        } catch (error) {
          console.error(`Failed to update template ${template.id}:`, error);
          failed++;
        }
      }
      
      console.log(`
        Stats update completed in ${(Date.now() - startTime) / 1000} seconds.
        Total templates: ${templates.length}
        Updated: ${updated}
        Failed: ${failed}
        Skipped: ${skipped}
      `);
      
      return { updated, failed, skipped, total: templates.length };
      
    } catch (error) {
      console.error('Error updating template stats:', error);
      throw error;
    }
  },
  
  /**
   * Process TikTok videos by specific categories
   */
  async processByCategories(categories: string[] = [
    'dance', 'product', 'tutorial', 'comedy', 'fashion'
  ]) {
    console.log(`Starting category-based TikTok ETL for: ${categories.join(', ')}`);
    const startTime = Date.now();
    
    const results: Record<string, any> = {
      categories: {},
      totalSuccess: 0,
      totalFailed: 0,
      totalSkipped: 0
    };
    
    // Process each category
    for (const category of categories) {
      try {
        console.log(`Processing category: ${category}`);
        
        // Scrape videos for this category
        const rawVideos = await apifyService.scrapeByCategory(category, 20);
        
        // Convert to our legacy format
        const legacyVideos = rawVideos.map(video => convertRawToLegacyFormat(video));
        
        // Process the videos
        const categoryResults = await this.processVideos(legacyVideos);
        
        // Store results for this category
        results.categories[category] = categoryResults;
        results.totalSuccess += categoryResults.success;
        results.totalFailed += categoryResults.failed;
        results.totalSkipped += categoryResults.skipped;
        
      } catch (error) {
        console.error(`Error processing category ${category}:`, error);
        results.categories[category] = { error: (error as Error).message };
        results.totalFailed++;
      }
    }
    
    console.log(`
      Category ETL completed in ${(Date.now() - startTime) / 1000} seconds.
      Categories processed: ${categories.length}
      Total success: ${results.totalSuccess}
      Total failed: ${results.totalFailed}
      Total skipped: ${results.totalSkipped}
    `);
    
    return results;
  }
}; 