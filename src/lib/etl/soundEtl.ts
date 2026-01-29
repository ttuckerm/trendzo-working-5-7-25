import { apifyService } from '@/lib/services/apifyService';
import { soundService } from '@/lib/services/soundService';
import { trendingTemplateService } from '@/lib/services/trendingTemplateService';
import { TikTokVideo, TikTokSound, SoundTrendReport } from '@/lib/types/tiktok';
import { extractSoundData } from '@/lib/utils/typeAdapters';
import { convertRawToNewFormat } from '@/lib/utils/typeAdapters';
import { TrendingTemplate, TemplateDetail } from '@/lib/types/trendingTemplate';
import { v4 as uuidv4 } from 'uuid';

/**
 * ETL Coordinator for processing TikTok sound data
 */
export const soundEtl = {
  /**
   * Main ETL process to fetch TikTok sounds from videos and store them
   * @param options Options to pass to the Apify scraper
   */
  async processSoundsFromTrending(options = {}) {
    console.log('Starting TikTok sound ETL process...');
    const startTime = Date.now();
    
    try {
      // Step 1: Extract - Fetch trending videos from Apify
      console.log('Extracting trending videos from TikTok...');
      const rawVideos = await apifyService.scrapeTrending(options);
      
      // Convert to our new TikTok video format with enhanced music data
      const videos = rawVideos.map(video => convertRawToNewFormat(video));
      console.log(`Extracted ${videos.length} videos from TikTok`);
      
      // Step 2: Get trending templates to prioritize related sounds
      console.log('Getting trending templates to prioritize sound processing...');
      const trendingTemplates = await trendingTemplateService.getAllTrendingTemplates();
      console.log(`Found ${trendingTemplates.length} trending templates for prioritization`);
      
      // Create a map of trending template IDs for quick lookup
      const trendingTemplateMap = new Map<string, TrendingTemplate>();
      trendingTemplates.forEach(template => {
        trendingTemplateMap.set(template.id, template);
      });
      
      // Step 3: Prioritize videos associated with trending templates
      const prioritizedVideos = this.prioritizeVideoProcessing(videos, trendingTemplates);
      
      // Step 4: Transform - Extract sound data from videos with progressive loading
      console.log('Extracting sound data with progressive loading...');
      const results = await this.processSoundsProgressively(prioritizedVideos);
      
      // Step 5: Calculate growth metrics
      console.log('Calculating growth metrics...');
      await this.calculateGrowthMetrics(results.sounds);
      
      // Step 6: Update template correlations
      console.log('Updating sound-template correlations...');
      await this.updateTemplateCorrelations(results.sounds);
      
      // Step 7: Generate trend report
      console.log('Generating sound trend report...');
      await this.generateSoundTrendReport();
      
      console.log(`
        Sound ETL process completed in ${(Date.now() - startTime) / 1000} seconds.
        Total videos processed: ${results.totalVideos}
        Sounds extracted: ${results.soundsExtracted}
        Sounds stored: ${results.soundsStored}
        Failed: ${results.failed}
        High priority sounds: ${results.highPrioritySounds || 0}
        Medium priority sounds: ${results.mediumPrioritySounds || 0}
        Low priority sounds: ${results.lowPrioritySounds || 0}
      `);
      
      return results;
    } catch (error) {
      console.error('Error in TikTok sound ETL process:', error);
      throw error;
    }
  },
  
  /**
   * Prioritize video processing based on trending templates and engagement metrics
   * @param videos The TikTok videos to prioritize
   * @param trendingTemplates Current trending templates
   * @returns Prioritized videos array with metadata
   */
  prioritizeVideoProcessing(videos: TikTokVideo[], trendingTemplates: TrendingTemplate[]) {
    // Create a map of trending template IDs for quick lookup
    const trendingTemplateMap = new Map<string, TrendingTemplate>();
    trendingTemplates.forEach(template => {
      trendingTemplateMap.set(template.id, template);
    });
    
    // Map to track which trending templates have associated videos
    const videoByTemplateId = new Map<string, TikTokVideo>();
    
    // First pass - identify videos directly referenced by trending templates
    for (const video of videos) {
      // Check if this video's ID matches any trending template's source
      if (trendingTemplateMap.has(video.id)) {
        videoByTemplateId.set(video.id, video);
      }
    }
    
    // Prioritize videos
    return videos.map(video => {
      let priority = 'low';
      let reason = 'Standard processing';
      
      // Check if this video is associated with a trending template
      if (trendingTemplateMap.has(video.id)) {
        priority = 'high';
        reason = 'Associated with trending template';
      } 
      // Check engagement metrics
      else if (video.stats.playCount > 500000 || video.stats.diggCount > 100000) {
        priority = 'high';
        reason = 'High engagement metrics';
      }
      // Check for music with high usage
      else if (video.music?.usageCount && video.music.usageCount > 50000) {
        priority = 'medium';
        reason = 'Popular sound with high usage';
      }
      
      return {
        video,
        priority,
        reason,
        processingOrder: priority === 'high' ? 1 : priority === 'medium' ? 2 : 3
      };
    }).sort((a, b) => a.processingOrder - b.processingOrder);
  },
  
  /**
   * Process videos to extract and store sound data with progressive loading
   * @param prioritizedVideos The prioritized TikTok videos to process
   */
  async processSoundsProgressively(prioritizedVideos: any[]) {
    const results = {
      totalVideos: prioritizedVideos.length,
      soundsExtracted: 0,
      soundsStored: 0,
      failed: 0,
      sounds: [] as TikTokSound[],
      highPrioritySounds: 0,
      mediumPrioritySounds: 0,
      lowPrioritySounds: 0
    };
    
    const processedSoundIds = new Set<string>();
    const batchSize = 10; // Process in small batches for progressive loading
    
    // Process in batches based on priority
    for (let i = 0; i < prioritizedVideos.length; i += batchSize) {
      const batch = prioritizedVideos.slice(i, i + batchSize);
      
      console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(prioritizedVideos.length/batchSize)} (${batch.length} videos)`);
      
      // Process this batch
      for (const { video, priority, reason } of batch) {
        try {
          // Extract sound data from the video
          const soundData = extractSoundData(video);
          
          if (!soundData || !soundData.id) {
            console.log(`No valid sound data found in video ${video.id}`);
            continue;
          }
          
          // Skip if we've already processed this sound
          if (processedSoundIds.has(soundData.id)) {
            console.log(`Sound ${soundData.id} already processed in this batch`);
            continue;
          }
          
          // Validate sound data before storing
          const validationResult = this.validateSoundData(soundData);
          if (!validationResult.valid) {
            console.log(`Sound ${soundData.id} validation failed: ${validationResult.reason}`);
            results.failed++;
            continue;
          }
          
          // Track processing stats by priority
          if (priority === 'high') results.highPrioritySounds++;
          else if (priority === 'medium') results.mediumPrioritySounds++;
          else results.lowPrioritySounds++;
          
          // Add provenance tracking
          soundData.metadata = {
            ...(soundData.metadata || {}),
            extractedFrom: video.id,
            extractionPriority: priority,
            extractionReason: reason,
            processingTimestamp: new Date().toISOString()
          };
          
          // Add bidirectional relationship with the template/video
          const existingTemplateUsage = soundData.templateUsage || [];
          const templateEntry = existingTemplateUsage.find(t => t.templateId === video.id);
          
          if (!templateEntry) {
            // New template usage
            soundData.templateUsage = [
              ...existingTemplateUsage,
              {
                templateId: video.id,
                useCount: 1,
                averageEngagement: (video.stats.diggCount + video.stats.shareCount + video.stats.commentCount) / 3,
                lastUsed: new Date().toISOString().split('T')[0]
              }
            ];
          }
          
          processedSoundIds.add(soundData.id);
          results.soundsExtracted++;
          
          // Store the sound in Firestore
          const storedSound = await soundService.storeSound(soundData);
          results.soundsStored++;
          results.sounds.push(storedSound);
          
          console.log(`Processed sound "${soundData.title}" from video ${video.id} (priority: ${priority})`);
          
        } catch (error) {
          console.error(`Failed to process sound from video ${video.id}:`, error);
          results.failed++;
        }
      }
      
      // Pause briefly between batches to prevent overwhelming the system
      if (i + batchSize < prioritizedVideos.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    return results;
  },
  
  /**
   * Validate sound data before storage
   * @param sound The sound data to validate
   * @returns Validation result with status and reason
   */
  validateSoundData(sound: TikTokSound) {
    // Check for required fields
    if (!sound.id || !sound.title) {
      return { valid: false, reason: 'Missing required fields (id, title)' };
    }
    
    // Validate title length (prevent garbage data)
    if (sound.title.length < 2 || sound.title.length > 200) {
      return { valid: false, reason: 'Invalid title length' };
    }
    
    // Check for suspicious data that might indicate scraping errors
    if (sound.title.includes('[object Object]') || sound.title.includes('undefined')) {
      return { valid: false, reason: 'Title contains suspicious values' };
    }
    
    // Validate duration (if provided)
    if (sound.duration !== undefined && (sound.duration <= 0 || sound.duration > 600)) {
      return { valid: false, reason: 'Invalid duration' };
    }
    
    // Validate usageCount (if provided)
    if (sound.usageCount !== undefined && (sound.usageCount < 0 || sound.usageCount > 1000000000)) {
      return { valid: false, reason: 'Invalid usage count' };
    }
    
    // Check for at least one URL (play URL or cover)
    if (!sound.playUrl && !sound.coverThumb && !sound.coverMedium && !sound.coverLarge) {
      return { valid: false, reason: 'No media URLs provided' };
    }
    
    return { valid: true };
  },
  
  /**
   * Calculate growth velocity and trend indicators for sounds
   * @param sounds List of sounds to calculate metrics for
   */
  async calculateGrowthMetrics(sounds: TikTokSound[]) {
    console.log(`Calculating growth metrics for ${sounds.length} sounds...`);
    let updated = 0;
    let failed = 0;
    
    for (const sound of sounds) {
      try {
        // Get the sound with its history
        const soundData = await soundService.getSoundById(sound.id);
        
        if (!soundData || !soundData.usageHistory) {
          console.log(`No history found for sound ${sound.id}`);
          continue;
        }
        
        const { usageHistory } = soundData;
        const dates = Object.keys(usageHistory).sort();
        
        // Need at least 2 data points to calculate velocity
        if (dates.length < 2) {
          console.log(`Not enough history for sound ${sound.id}`);
          continue;
        }
        
        // Calculate velocities - how fast the usage is changing
        const latest = dates[dates.length - 1];
        const latestUsage = usageHistory[latest];
        
        // Calculate 7-day growth velocity
        let velocity7d = 0;
        const date7dAgo = this.findDateDaysAgo(dates, latest, 7);
        if (date7dAgo) {
          const usage7dAgo = usageHistory[date7dAgo];
          const daysDiff = this.daysBetween(date7dAgo, latest);
          velocity7d = daysDiff > 0 ? (latestUsage - usage7dAgo) / daysDiff : 0;
        }
        
        // Calculate 14-day growth velocity
        let velocity14d = 0;
        const date14dAgo = this.findDateDaysAgo(dates, latest, 14);
        if (date14dAgo) {
          const usage14dAgo = usageHistory[date14dAgo];
          const daysDiff = this.daysBetween(date14dAgo, latest);
          velocity14d = daysDiff > 0 ? (latestUsage - usage14dAgo) / daysDiff : 0;
        }
        
        // Calculate 30-day growth velocity
        let velocity30d = 0;
        const date30dAgo = this.findDateDaysAgo(dates, latest, 30);
        if (date30dAgo) {
          const usage30dAgo = usageHistory[date30dAgo];
          const daysDiff = this.daysBetween(date30dAgo, latest);
          velocity30d = daysDiff > 0 ? (latestUsage - usage30dAgo) / daysDiff : 0;
        }
        
        // Determine trend direction
        let trend: 'rising' | 'stable' | 'falling' = 'stable';
        if (velocity7d > 0) {
          trend = 'rising';
        } else if (velocity7d < 0) {
          trend = 'falling';
        }
        
        // Find peak usage
        let peakUsage = 0;
        let peakDate = latest;
        for (const date of dates) {
          if (usageHistory[date] > peakUsage) {
            peakUsage = usageHistory[date];
            peakDate = date;
          }
        }
        
        // Determine lifecycle stage
        let stage: 'emerging' | 'growing' | 'peaking' | 'declining' | 'stable' = 'stable';
        
        if (peakDate === latest && velocity7d > 0) {
          if (velocity7d > velocity14d) {
            // Accelerating growth
            stage = 'growing';
          } else {
            // Still growing but slowing down
            stage = 'peaking';
          }
        } else if (peakDate !== latest) {
          // Already past peak
          stage = 'declining';
        } else if (dates.length <= 3) {
          // New sound with limited history
          stage = 'emerging';
        }
        
        // Update the sound with calculated metrics
        await soundService.updateSoundMetrics(sound.id, {
          'stats.growthVelocity7d': velocity7d,
          'stats.growthVelocity14d': velocity14d,
          'stats.growthVelocity30d': velocity30d,
          'stats.trend': trend,
          'stats.peakUsage': peakUsage,
          'stats.peakDate': peakDate,
          'lifecycle.stage': stage,
          
          // Update social context based on lifecycle
          'socialContext.trendCycle': stage === 'emerging' ? 'emerging' :
                                      stage === 'growing' ? 'growing' :
                                      stage === 'peaking' ? 'peaking' :
                                      stage === 'declining' && peakUsage > 100000 ? 'mainstream' :
                                      'declining'
        });
        
        updated++;
        
      } catch (error) {
        console.error(`Failed to calculate metrics for sound ${sound.id}:`, error);
        failed++;
      }
    }
    
    console.log(`
      Growth metrics calculation completed.
      Updated: ${updated}
      Failed: ${failed}
    `);
    
    return { updated, failed };
  },
  
  /**
   * Helper to find date closest to N days ago
   */
  findDateDaysAgo(dates: string[], fromDate: string, daysAgo: number): string | null {
    const targetDate = new Date(fromDate);
    targetDate.setDate(targetDate.getDate() - daysAgo);
    
    // Find closest date
    let closestDate = null;
    let minDiff = Infinity;
    
    for (const date of dates) {
      const diff = Math.abs(this.daysBetween(date, targetDate.toISOString().split('T')[0]));
      if (diff < minDiff) {
        minDiff = diff;
        closestDate = date;
      }
    }
    
    // Only return if it's reasonably close (within 3 days of target)
    return minDiff <= 3 ? closestDate : null;
  },
  
  /**
   * Calculate days between two dates in YYYY-MM-DD format
   */
  daysBetween(date1: string, date2: string): number {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return Math.round(Math.abs((d2.getTime() - d1.getTime()) / (24 * 60 * 60 * 1000)));
  },
  
  /**
   * Update sound usage statistics
   * @param limit Maximum number of sounds to update
   */
  async updateSoundStats(limit = 50) {
    console.log(`Updating usage statistics for up to ${limit} sounds...`);
    const startTime = Date.now();
    
    try {
      // Get trending sounds
      const trendingSounds = await soundService.getTrendingSounds('7d', limit);
      console.log(`Found ${trendingSounds.length} sounds to update`);
      
      let updated = 0;
      let failed = 0;
      
      // Update each sound's usage count by searching for videos with that sound
      for (const sound of trendingSounds) {
        try {
          // Search for videos using this sound
          // Note: This is an approximation, as Apify doesn't directly support searching by sound ID
          // We're using the sound title as a proxy
          const videos = await apifyService.scrapeByHashtag(sound.title, 10);
          
          if (!videos || videos.length === 0) {
            console.log(`No videos found for sound ${sound.id}`);
            continue;
          }
          
          // Count videos that actually use this sound
          let usageCount = 0;
          
          for (const video of videos) {
            const videoWithSound = convertRawToNewFormat(video);
            if (videoWithSound.music?.id === sound.id) {
              usageCount++;
            }
          }
          
          // If we found videos using this sound, update the usage count
          if (usageCount > 0) {
            await soundService.updateSoundUsage(sound.id, sound.usageCount + usageCount);
            updated++;
            console.log(`Updated usage count for sound ${sound.id}`);
          }
          
        } catch (error) {
          console.error(`Failed to update sound ${sound.id}:`, error);
          failed++;
        }
      }
      
      console.log(`
        Sound stats update completed in ${(Date.now() - startTime) / 1000} seconds.
        Total sounds: ${trendingSounds.length}
        Updated: ${updated}
        Failed: ${failed}
      `);
      
      return { updated, failed, total: trendingSounds.length };
      
    } catch (error) {
      console.error('Error updating sound stats:', error);
      throw error;
    }
  },
  
  /**
   * Link sounds to templates
   */
  async linkSoundsToTemplates() {
    console.log('Linking sounds to templates...');
    const startTime = Date.now();
    
    try {
      // Get all templates with detailed information
      const templates = await trendingTemplateService.getAllTrendingTemplates(100);
      console.log(`Found ${templates.length} templates`);
      
      let linked = 0;
      let failed = 0;
      
      // Process each template
      for (const template of templates) {
        try {
          // Get detailed template info to access sourceVideoId
          const templateDetail = await trendingTemplateService.getTrendingTemplateById(template.id);
          
          // Check if the template has metadata with sourceVideoId
          const sourceVideoId = templateDetail?.metadata?.sourceVideoId;
          
          // Skip templates without source videos
          if (!templateDetail || !sourceVideoId) {
            console.log(`Skipping template ${template.id} - No source video ID`);
            continue;
          }
          
          // Get the source video to extract the sound ID
          const videos = await apifyService.scrapeByHashtag(sourceVideoId, 1);
          
          if (!videos || videos.length === 0) {
            console.log(`Could not find source video for template ${template.id}`);
            continue;
          }
          
          // Convert to our format and extract sound data
          const video = convertRawToNewFormat(videos[0]);
          const sound = extractSoundData(video);
          
          if (!sound || !sound.id) {
            console.log(`No valid sound found for template ${template.id}`);
            continue;
          }
          
          // Link the sound to the template
          await soundService.linkSoundToTemplate(sound.id, template.id);
          linked++;
          
          console.log(`Linked sound ${sound.id} to template ${template.id}`);
          
        } catch (error) {
          console.error(`Failed to link sound for template ${template.id}:`, error);
          failed++;
        }
      }
      
      console.log(`
        Sound-template linking completed in ${(Date.now() - startTime) / 1000} seconds.
        Total templates: ${templates.length}
        Successfully linked: ${linked}
        Failed: ${failed}
      `);
      
      return { linked, failed, total: templates.length };
      
    } catch (error) {
      console.error('Error linking sounds to templates:', error);
      throw error;
    }
  },
  
  /**
   * Generate daily sound trend report
   */
  async generateSoundTrendReport() {
    console.log('Generating sound trend report...');
    
    try {
      // Get trending sounds for different timeframes
      const trending7d = await soundService.getTrendingSounds('7d', 10);
      const trending14d = await soundService.getTrendingSounds('14d', 10);
      const trending30d = await soundService.getTrendingSounds('30d', 10);
      
      // Get sounds by lifecycle stage
      const emergingSounds = await soundService.getSoundsByLifecycleStage('emerging', 10);
      const peakingSounds = await soundService.getSoundsByLifecycleStage('peaking', 10);
      const decliningTrends = await soundService.getSoundsByLifecycleStage('declining', 10);
      
      // Get genre distribution
      const genreDistribution = await soundService.getGenreDistribution();
      
      // Create report
      const report: SoundTrendReport = {
        id: uuidv4(),
        date: new Date().toISOString().split('T')[0],
        topSounds: {
          daily: trending7d.map(sound => sound.id),
          weekly: trending14d.map(sound => sound.id),
          monthly: trending30d.map(sound => sound.id)
        },
        emergingSounds: emergingSounds.map(sound => sound.id),
        peakingSounds: peakingSounds.map(sound => sound.id),
        decliningTrends: decliningTrends.map(sound => sound.id),
        genreDistribution,
        createdAt: new Date()
      };
      
      // Store report
      await soundService.storeTrendReport(report);
      
      console.log('Sound trend report generated successfully');
      return report;
    } catch (error) {
      console.error('Error generating sound trend report:', error);
      throw error;
    }
  },
  
  /**
   * Update sound-template correlations by analyzing which sounds work best with which templates
   */
  async updateTemplateCorrelations(sounds: TikTokSound[]) {
    console.log(`Analyzing template correlations for ${sounds.length} sounds...`);
    let updated = 0;
    let failed = 0;
    
    for (const sound of sounds) {
      try {
        // Get templates that use this sound
        const templates = await soundService.getTemplatesUsingSound(sound.id);
        
        if (templates.length === 0) {
          console.log(`No templates found for sound ${sound.id}`);
          continue;
        }
        
        // Calculate average engagement for templates using this sound
        const templateCorrelations = [];
        
        for (const template of templates) {
          try {
            // Get template performance data
            const templateWithStats = await trendingTemplateService.getTrendingTemplateById(template.id);
            
            if (!templateWithStats || !templateWithStats.stats) {
              continue;
            }
            
            // Get benchmark engagement for the template category
            const categoryAvgEngagement = await trendingTemplateService.getCategoryAverageEngagement(templateWithStats.category);
            
            // Calculate correlation score (simple version - can be enhanced with more sophisticated algorithms)
            const templateEngagement = templateWithStats.stats.likes + (templateWithStats.stats.shareCount || 0);
            const engagementLift = categoryAvgEngagement > 0 
              ? (templateEngagement / categoryAvgEngagement) - 1 
              : 0;
            
            // Score from 0-1 based on relative engagement
            const correlationScore = Math.min(1, Math.max(0, 0.5 + (engagementLift / 2)));
            
            templateCorrelations.push({
              templateId: template.id,
              correlationScore,
              engagementLift
            });
          } catch (error) {
            console.error(`Error processing template ${template.id} for sound ${sound.id}:`, error);
          }
        }
        
        // Update sound with template correlations (sorted by score)
        if (templateCorrelations.length > 0) {
          const sortedCorrelations = templateCorrelations.sort((a, b) => b.correlationScore - a.correlationScore);
          await soundService.updateTemplateCorrelations(sound.id, sortedCorrelations);
          updated++;
        }
        
      } catch (error) {
        console.error(`Failed to update template correlations for sound ${sound.id}:`, error);
        failed++;
      }
    }
    
    console.log(`
      Template correlation analysis completed.
      Updated: ${updated}
      Failed: ${failed}
    `);
    
    return { updated, failed };
  }
}; 