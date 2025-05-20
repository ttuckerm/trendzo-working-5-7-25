import { TikTokSound, SoundTrendReport } from '@/lib/types/tiktok';

const SERVICE_DISABLED_MSG = "soundService: Firebase backend has been removed. Method called but will not perform DB operations. TODO: Implement with Supabase.";

// Collection names (kept for context, not used in disabled service)
// const SOUNDS_COLLECTION = 'sounds';
// const TEMPLATES_COLLECTION = 'templates';
// const TREND_REPORTS_COLLECTION = 'soundTrendReports';

// Helper function to get a safe Firestore instance (now neutralized)
// function getFirestore(): Firestore {
//   if (!db) {
//     throw new Error('Firestore is not initialized. This might happen in development mode.');
//   }
//   return db as Firestore;
// }

// Service for managing TikTok sounds
export const soundService = {
  /**
   * Store a sound in Firestore
   * @param sound The TikTok sound to store
   * @returns The stored sound with ID
   */
  async storeSound(sound: TikTokSound): Promise<TikTokSound> {
    console.warn(`storeSound for sound ID ${sound.id}: ${SERVICE_DISABLED_MSG}`);
    return Promise.resolve({ ...sound, id: sound.id || 'mock-stored-sound-id' });
  },
  
  /**
   * Get a sound by ID
   * @param soundId The sound ID
   * @returns The sound or null if not found
   */
  async getSoundById(soundId: string): Promise<TikTokSound | null> {
    console.warn(`getSoundById(${soundId}): ${SERVICE_DISABLED_MSG}`);
    return Promise.resolve(null);
  },
  
  /**
   * Update sound usage count and calculate growth
   * @param soundId The sound ID
   * @param currentUsageCount Current usage count
   * @returns The updated sound
   */
  async updateSoundUsage(soundId: string, currentUsageCount: number): Promise<TikTokSound> {
    console.warn(`updateSoundUsage for sound ID ${soundId}: ${SERVICE_DISABLED_MSG}`);
    const mockSound: Partial<TikTokSound> = {
      id: soundId,
      usageCount: currentUsageCount,
      stats: {
        usageCount: currentUsageCount,
        usageChange7d: 0,
        usageChange14d: 0,
        usageChange30d: 0,
      },
      updatedAt: new Date().toISOString(),
    };
    return Promise.resolve(mockSound as TikTokSound);
  },
  
  /**
   * Update sound metrics with calculated values
   * @param soundId The sound ID
   * @param metrics Object containing metrics to update
   */
  async updateSoundMetrics(soundId: string, metrics: Record<string, any>): Promise<void> {
    console.warn(`updateSoundMetrics for sound ID ${soundId}: ${SERVICE_DISABLED_MSG}`);
    return Promise.resolve();
  },
  
  /**
   * Get trending sounds based on growth metrics
   * @param timeframe The timeframe for trending ('7d', '14d', '30d')
   * @param limit Maximum number of sounds to return
   * @returns List of trending sounds
   */
  async getTrendingSounds(
    timeframe: '7d' | '14d' | '30d' = '7d', 
    limit = 20
  ): Promise<TikTokSound[]> {
    console.warn(`getTrendingSounds (timeframe: ${timeframe}, limit: ${limit}): ${SERVICE_DISABLED_MSG}`);
    return Promise.resolve([]);
  },
  
  /**
   * Get sounds by lifecycle stage
   * @param stage The lifecycle stage to query for
   * @param limit Maximum number of sounds to return
   * @returns List of sounds in the specified lifecycle stage
   */
  async getSoundsByLifecycleStage(
    stage: 'emerging' | 'growing' | 'peaking' | 'declining' | 'stable',
    limit = 20
  ): Promise<TikTokSound[]> {
    console.warn(`getSoundsByLifecycleStage (stage: ${stage}, limit: ${limit}): ${SERVICE_DISABLED_MSG}`);
    return Promise.resolve([]);
  },
  
  /**
   * Get genre distribution across all sounds
   * @returns Object mapping genre names to counts
   */
  async getGenreDistribution(): Promise<Record<string, number>> {
    console.warn(`getGenreDistribution: ${SERVICE_DISABLED_MSG}`);
    return Promise.resolve({});
  },
  
  /**
   * Link a sound to a template
   * @param soundId The sound ID
   * @param templateId The template ID
   */
  async linkSoundToTemplate(soundId: string, templateId: string): Promise<void> {
    console.warn(`linkSoundToTemplate (sound: ${soundId}, template: ${templateId}): ${SERVICE_DISABLED_MSG}`);
    return Promise.resolve();
  },
  
  /**
   * Update template correlations for a sound
   * @param soundId The sound ID
   * @param correlations Array of template correlations
   */
  async updateTemplateCorrelations(
    soundId: string, 
    correlations: Array<{
      templateId: string;
      correlationScore: number;
      engagementLift?: number;
    }>
  ): Promise<void> {
    console.warn(`updateTemplateCorrelations for sound ID ${soundId}: ${SERVICE_DISABLED_MSG}`);
    return Promise.resolve();
  },
  
  /**
   * Get templates that use a specific sound
   * @param soundId The sound ID
   * @returns Array of templates that use the sound
   */
  async getTemplatesUsingSound(soundId: string): Promise<any[]> {
    console.warn(`getTemplatesUsingSound for sound ID ${soundId}: ${SERVICE_DISABLED_MSG}`);
    return Promise.resolve([]);
  },
  
  /**
   * Add expert annotations to a sound
   * @param soundId The sound ID
   * @param annotations Object containing expert annotations
   */
  async addExpertAnnotations(
    soundId: string, 
    annotations: Record<string, any>
  ): Promise<void> {
    console.warn(`addExpertAnnotations for sound ID ${soundId}: ${SERVICE_DISABLED_MSG}`);
    return Promise.resolve();
  },
  
  /**
   * Update sound categories
   * @param soundId The sound ID
   * @param categories Array of category names
   */
  async updateSoundCategories(
    soundId: string, 
    categories: string[]
  ): Promise<void> {
    console.warn(`updateSoundCategories for sound ID ${soundId}: ${SERVICE_DISABLED_MSG}`);
    return Promise.resolve();
  },
  
  /**
   * Store a sound trend report
   * @param report The trend report to store
   */
  async storeTrendReport(report: SoundTrendReport): Promise<void> {
    console.warn(`storeTrendReport for report ID ${report.id}: ${SERVICE_DISABLED_MSG}`);
    return Promise.resolve();
  },
  
  /**
   * Get the latest sound trend report
   * @returns The latest sound trend report or null if none exists
   */
  async getLatestTrendReport(): Promise<SoundTrendReport | null> {
    console.warn(`getLatestTrendReport: ${SERVICE_DISABLED_MSG}`);
    return Promise.resolve(null);
  },
  
  /**
   * Get sounds with filtering, pagination, and sorting
   * @param options The options for filtering, pagination, and sorting
   * @returns List of sounds matching the criteria and total count
   */
  async getSounds(options: {
    filters?: Record<string, any>;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
  }): Promise<{ sounds: TikTokSound[]; total: number }> {
    console.warn(`getSounds with options: ${JSON.stringify(options)}: ${SERVICE_DISABLED_MSG}`);
    return Promise.resolve({ sounds: [], total: 0 });
  },
  
  /**
   * Get a specific trend report by ID
   * @param reportId The ID of the report to retrieve
   * @returns The trend report or null if not found
   */
  async getTrendReportById(reportId: string): Promise<SoundTrendReport | null> {
    console.warn(`getTrendReportById for report ID ${reportId}: ${SERVICE_DISABLED_MSG}`);
    return Promise.resolve(null);
  },
  
  // Add any other methods that were present in the original file, similarly disabled.
  // For example, if there was a trackSoundPerformance:
  async trackSoundPerformance(soundId: string, performanceData: any): Promise<void> {
    console.warn(`trackSoundPerformance for sound ID ${soundId}: ${SERVICE_DISABLED_MSG}`);
    return Promise.resolve();
  },

  // If there was a batchUpdateSounds:
  async batchUpdateSounds(updates: Array<{id: string, data: Partial<TikTokSound>}>): Promise<void> {
    console.warn(`batchUpdateSounds: ${SERVICE_DISABLED_MSG}`);
    return Promise.resolve();
  },

  async unlinkSoundFromTemplate(soundId: string, templateId: string): Promise<void> {
    console.warn(`unlinkSoundFromTemplate (sound: ${soundId}, template: ${templateId}): ${SERVICE_DISABLED_MSG}`);
    return Promise.resolve();
  }
}; 