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
//   limit as firestoreLimit,
//   Timestamp,
//   serverTimestamp,
//   increment,
//   DocumentReference,
//   Firestore,
//   runTransaction
// } from 'firebase/firestore';
// import { db } from '@/lib/firebase/firebase'; // Firebase db is null
import { TikTokSound, SoundTrendReport } from '@/lib/types/tiktok';
import { soundService } from './soundService'; // Already neutralized
import { v4 as uuidv4 } from 'uuid';

const SERVICE_DISABLED_MSG = "soundAnalysisService: Firebase backend has been removed. Method called but will not perform DB operations. TODO: Implement with Supabase.";

// Collection names (kept for context)
// const SOUNDS_COLLECTION = 'sounds';
// const SOUND_ANALYSIS_COLLECTION = 'soundAnalysis';
// const TEMPLATES_COLLECTION = 'templates';
// const TREND_REPORTS_COLLECTION = 'soundTrendReports';

// Helper function to get a safe Firestore instance
function getFirestore(): any { // Changed return type to any
  // if (!db) {
  //   throw new Error('Firestore is not initialized. This might happen in development mode.');
  // }
  // return db as Firestore;
  console.warn(`getFirestore: ${SERVICE_DISABLED_MSG}. Returning null.`);
  return null;
}

/**
 * Sound Analysis Service
 * Provides advanced analysis of TikTok sounds, including trend detection,
 * categorization, sound-template pairing, and growth prediction.
 */
export const soundAnalysisService = {
  /**
   * Process and analyze a sound to extract insights
   * @param sound The TikTok sound to analyze
   * @returns The analyzed sound with additional metadata
   */
  async analyzeSoundData(sound: TikTokSound): Promise<TikTokSound> {
    try {
      console.log(`Analyzing sound: ${sound.title} by ${sound.authorName}`);
      
      let soundData = await soundService.getSoundById(sound.id); // soundService is neutralized
      if (!soundData) {
        soundData = await soundService.storeSound(sound); // soundService is neutralized
        if (!soundData) { 
            console.warn(`analyzeSoundData: Could not get or store sound ${sound.id} due to service neutralization. Returning input sound.`);
            return sound;
        }
      }
      
      const categorizedSound = await this.categorizeSoundByAudioFeatures(soundData);
      const withGrowthMetrics = await this.calculateSoundGrowthMetrics(categorizedSound);
      const withLifecycle = await this.determineLifecycleStage(withGrowthMetrics);
      
      await soundService.updateSoundMetrics(withLifecycle.id, { // soundService is neutralized
        soundCategory: withLifecycle.soundCategory,
        categories: withLifecycle.categories,
        mood: withLifecycle.mood,
        tempo: withLifecycle.tempo,
        classification: withLifecycle.classification,
        lifecycle: withLifecycle.lifecycle,
        viralityScore: withLifecycle.viralityScore,
        'stats.growthVelocity7d': withLifecycle.stats?.growthVelocity7d,
        'stats.growthVelocity14d': withLifecycle.stats?.growthVelocity14d, 
        'stats.growthVelocity30d': withLifecycle.stats?.growthVelocity30d,
        'stats.trend': withLifecycle.stats?.trend
      });
      
      return withLifecycle;
    } catch (error) {
      console.error('Error analyzing sound:', error);
      throw error;
    }
  },
  
  /**
   * Categorize a sound based on audio features
   * @param sound The sound to categorize
   * @returns The sound with updated categorization
   */
  async categorizeSoundByAudioFeatures(sound: TikTokSound): Promise<TikTokSound> {
    try {
      const currentStats = sound.stats || { 
        usageCount: 0, usageChange7d: 0, usageChange14d: 0, usageChange30d: 0
      };

      let soundCategory = sound.soundCategory || 'music';
      if (!sound.soundCategory) {
        if (sound.original) {
          soundCategory = 'original';
        } else if (sound.isRemix) {
          soundCategory = 'remix';
        }
      }
      
      const possibleMoods = ['energetic', 'calm', 'happy', 'sad', 'intense', 'relaxed'];
      const mood = sound.mood || [possibleMoods[Math.floor(Math.random() * possibleMoods.length)]];
      
      let tempo = sound.tempo;
      if (!tempo && sound.duration) {
        if (sound.duration < 15) {
          tempo = 'fast';
        } else if (sound.duration < 30) {
          tempo = 'medium';
        } else {
          tempo = 'slow';
        }
      } else if (!tempo) {
        tempo = 'medium';
      }
      
      const classification = sound.classification || {
        genre: sound.genre ? [sound.genre] : [],
        style: [],
        instruments: [],
        vocals: sound.soundCategory !== 'soundEffect',
        commercial: false,
        explicit: false
      };
      
      return {
        ...sound,
        soundCategory,
        mood,
        tempo,
        classification,
        categories: [...(sound.categories || []), soundCategory]
      };
    } catch (error) {
      console.error('Error categorizing sound:', error);
      return sound;
    }
  },
  
  /**
   * Calculate growth metrics for a sound
   * @param sound The sound to analyze
   * @returns The sound with calculated growth metrics
   */
  async calculateSoundGrowthMetrics(sound: TikTokSound): Promise<TikTokSound> {
    try {
      const usageHistory = sound.usageHistory || {};
      const dates = Object.keys(usageHistory).sort();
      
      const currentStats = sound.stats || { 
        usageCount: 0, usageChange7d: 0, usageChange14d: 0, usageChange30d: 0
      };

      if (dates.length < 2) {
        return {
          ...sound,
          stats: {
            ...currentStats,
            growthVelocity7d: 0,
            growthVelocity14d: 0,
            growthVelocity30d: 0,
            trend: 'stable'
          },
          viralityScore: 0
        };
      }
      
      const currentDate = dates[dates.length - 1];
      const currentUsage = usageHistory[currentDate] ?? 0;
      
      const sevenDaysAgo = findClosestDateBefore(dates, currentDate, 7);
      const fourteenDaysAgo = findClosestDateBefore(dates, currentDate, 14);
      const thirtyDaysAgo = findClosestDateBefore(dates, currentDate, 30);
      
      const growthVelocity7d = sevenDaysAgo && usageHistory[sevenDaysAgo] !== undefined ? 
        (currentUsage - (usageHistory[sevenDaysAgo] ?? 0)) / daysBetween(sevenDaysAgo, currentDate) : 0;
      
      const growthVelocity14d = fourteenDaysAgo && usageHistory[fourteenDaysAgo] !== undefined ? 
        (currentUsage - (usageHistory[fourteenDaysAgo] ?? 0)) / daysBetween(fourteenDaysAgo, currentDate) : 0;
      
      const growthVelocity30d = thirtyDaysAgo && usageHistory[thirtyDaysAgo] !== undefined ? 
        (currentUsage - (usageHistory[thirtyDaysAgo] ?? 0)) / daysBetween(thirtyDaysAgo, currentDate) : 0;
      
      const acceleration = sevenDaysAgo && fourteenDaysAgo ? 
        (growthVelocity7d - growthVelocity14d) : 0;
      
      let trend: 'rising' | 'stable' | 'falling' = 'stable';
      if (growthVelocity7d > 5) trend = 'rising';
      else if (growthVelocity7d < -5) trend = 'falling';
      
      const viralityScore = Math.min(
        100, 
        Math.max(
          0, 
          Math.round(
            (growthVelocity7d * 5) + 
            (acceleration * 10) + 
            ((sound.usageCount || 0) / 1000)
          )
        )
      );
      
      return {
        ...sound,
        stats: {
          ...currentStats,
          growthVelocity7d,
          growthVelocity14d,
          growthVelocity30d,
          trend
        },
        viralityScore
      };
    } catch (error) {
      console.error('Error calculating growth metrics:', error);
      return sound;
    }
  },
  
  /**
   * Determine the lifecycle stage of a sound
   * @param sound The sound to analyze
   * @returns The sound with updated lifecycle information
   */
  async determineLifecycleStage(sound: TikTokSound): Promise<TikTokSound> {
    try {
      const usageHistory = sound.usageHistory || {};
      const dates = Object.keys(usageHistory).sort();
      
      const currentStats = sound.stats || { 
        usageCount: 0, usageChange7d: 0, usageChange14d: 0, usageChange30d: 0, trend: 'stable'
      };
      const growthVelocity7d = currentStats.growthVelocity7d || 0;

      if (dates.length < 2) {
        return {
          ...sound,
          lifecycle: sound.lifecycle || {
            stage: 'emerging',
            discoveryDate: dates[0] || new Date().toISOString().split('T')[0],
            lastDetectedDate: dates[0] || new Date().toISOString().split('T')[0]
          }
        };
      }
      
      const { trend } = currentStats;
      const growthVelocity = growthVelocity7d;
      
      const currentUsage = dates.length > 0 ? (usageHistory[dates[dates.length - 1]] ?? 0) : 0;
      const maxUsage = Math.max(...Object.values(usageHistory).map(val => val ?? 0));
      const maxUsageDate = Object.keys(usageHistory).find(
        date => (usageHistory[date] ?? 0) === maxUsage
      ) || (dates.length > 0 ? dates[dates.length - 1] : new Date().toISOString().split('T')[0]);
      
      let stage: 'emerging' | 'growing' | 'peaking' | 'declining' | 'stable' = 'stable';
      
      if (trend === 'rising' && growthVelocity > 10) {
        stage = 'growing';
      } else if (trend === 'rising' && currentUsage < 1000) {
        stage = 'emerging';
      } else if (trend === 'falling' && currentUsage < maxUsage * 0.8) {
        stage = 'declining';
      } else if (currentUsage >= maxUsage * 0.9 && maxUsage > 0) { // Ensure maxUsage is not 0 to prevent peaking on new sounds
        stage = 'peaking';
      }
      
      let estimatedPeakDate: string | undefined;
      let estimatedDeclineDate: string | undefined;
      
      if (stage === 'emerging' || stage === 'growing') {
        const daysToProjectForPeak = 
          stage === 'emerging' ? 14 : (stage === 'growing' ? 7 : 3);
        
        const daysToProjectForDecline = 
          stage === 'emerging' ? 28 : (stage === 'growing' ? 14 : 7);
        
        const peakDate = new Date();
        peakDate.setDate(peakDate.getDate() + daysToProjectForPeak);
        estimatedPeakDate = peakDate.toISOString().split('T')[0];
        
        const declineDate = new Date();
        declineDate.setDate(declineDate.getDate() + daysToProjectForDecline);
        estimatedDeclineDate = declineDate.toISOString().split('T')[0];
      } else if (stage === 'peaking') {
        const declineDate = new Date();
        declineDate.setDate(declineDate.getDate() + 3);
        estimatedDeclineDate = declineDate.toISOString().split('T')[0];
        estimatedPeakDate = new Date().toISOString().split('T')[0];
      }
      
      const lifecycle = {
        stage,
        estimatedPeakDate,
        estimatedDeclineDate,
        discoveryDate: sound.lifecycle?.discoveryDate || (dates.length > 0 ? dates[0] : new Date().toISOString().split('T')[0]),
        lastDetectedDate: dates.length > 0 ? dates[dates.length - 1] : new Date().toISOString().split('T')[0]
      };
      
      return {
        ...sound,
        lifecycle,
        stats: {
          ...currentStats,
          peakUsage: maxUsage,
          peakDate: maxUsageDate
        }
      };
    } catch (error) {
      console.error('Error determining lifecycle stage:', error);
      return sound;
    }
  },
  
  /**
   * Find optimal template pairings for a sound
   * @param soundId The ID of the sound to analyze
   * @returns Array of template correlations with scores
   */
  async findOptimalTemplatePairings(soundId: string): Promise<Array<{
    templateId: string;
    correlationScore: number;
    engagementLift: number;
  }>> {
    console.warn(`findOptimalTemplatePairings (soundId: ${soundId}): ${SERVICE_DISABLED_MSG}`);
    return Promise.resolve([]);
  },
  
  /**
   * Build sound-template pairing recommendation
   * @param soundId Sound ID
   * @param templateId Template ID
   * @returns Recommendation object with details
   */
  async buildPairingRecommendation(soundId: string, templateId: string): Promise<any> {
    console.warn(`buildPairingRecommendation (soundId: ${soundId}, templateId: ${templateId}): ${SERVICE_DISABLED_MSG}`);
    return Promise.resolve(null);
  },
  
  /**
   * Generate a comprehensive sound trend report
   * @returns The generated trend report
   */
  async generateSoundTrendReport(): Promise<SoundTrendReport> {
    console.warn(`generateSoundTrendReport: ${SERVICE_DISABLED_MSG}`);
    const generationDate = new Date().toISOString();
    const mockReport: SoundTrendReport = {
      id: uuidv4(),
      date: generationDate,
      topSounds: { daily: [], weekly: [], monthly: [] },
      emergingSounds: [], 
      peakingSounds: [],
      decliningTrends: [],
      genreDistribution: {},
      createdAt: generationDate as any, 
    };
    return Promise.resolve(mockReport);
  }
};

// Helper functions

/**
 * Find the closest date before the reference date within the given number of days
 */
function findClosestDateBefore(
  dates: string[], 
  referenceDate: string, 
  daysLimit: number
): string | null {
  const refDate = new Date(referenceDate);
  let closest: string | null = null;
  let closestDiff = Number.MAX_SAFE_INTEGER;
  
  for (const date of dates) {
    const currentDate = new Date(date);
    const diff = Math.floor((refDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diff > 0 && diff <= daysLimit && diff < closestDiff) {
      closest = date;
      closestDiff = diff;
    }
  }
  
  return closest;
}

/**
 * Calculate days between two dates
 */
function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return Math.abs(Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));
} 