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
  limit as firestoreLimit,
  Timestamp,
  serverTimestamp,
  increment,
  DocumentReference,
  Firestore,
  runTransaction
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { TikTokSound, SoundTrendReport } from '@/lib/types/tiktok';
import { soundService } from './soundService';
import { v4 as uuidv4 } from 'uuid';

// Collection names
const SOUNDS_COLLECTION = 'sounds';
const SOUND_ANALYSIS_COLLECTION = 'soundAnalysis';
const TEMPLATES_COLLECTION = 'templates';
const TREND_REPORTS_COLLECTION = 'soundTrendReports';

// Helper function to get a safe Firestore instance
function getFirestore(): Firestore {
  if (!db) {
    throw new Error('Firestore is not initialized. This might happen in development mode.');
  }
  return db as Firestore;
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
      
      // Store the sound first if it doesn't exist
      let soundData = await soundService.getSoundById(sound.id);
      if (!soundData) {
        soundData = await soundService.storeSound(sound);
      }
      
      // Run various analysis algorithms
      const categorizedSound = await this.categorizeSoundByAudioFeatures(soundData);
      const withGrowthMetrics = await this.calculateSoundGrowthMetrics(categorizedSound);
      const withLifecycle = await this.determineLifecycleStage(withGrowthMetrics);
      
      // Store the updated sound with analysis results
      await soundService.updateSoundMetrics(withLifecycle.id, {
        soundCategory: withLifecycle.soundCategory,
        categories: withLifecycle.categories,
        mood: withLifecycle.mood,
        tempo: withLifecycle.tempo,
        classification: withLifecycle.classification,
        lifecycle: withLifecycle.lifecycle,
        viralityScore: withLifecycle.viralityScore,
        'stats.growthVelocity7d': withLifecycle.stats.growthVelocity7d,
        'stats.growthVelocity14d': withLifecycle.stats.growthVelocity14d, 
        'stats.growthVelocity30d': withLifecycle.stats.growthVelocity30d,
        'stats.trend': withLifecycle.stats.trend
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
      // This would ideally use an audio analysis API or ML model
      // For now, using a simplified approach based on metadata
      
      // 1. Determine primary sound category
      let soundCategory = sound.soundCategory || 'music';
      if (!sound.soundCategory) {
        if (sound.original) {
          soundCategory = 'original';
        } else if (sound.isRemix) {
          soundCategory = 'remix';
        }
      }
      
      // 2. Determine mood based on simple heuristics
      // In a real implementation, this would use audio analysis or ML
      const possibleMoods = ['energetic', 'calm', 'happy', 'sad', 'intense', 'relaxed'];
      const mood = sound.mood || [possibleMoods[Math.floor(Math.random() * possibleMoods.length)]];
      
      // 3. Determine tempo if not already set
      let tempo = sound.tempo;
      if (!tempo && sound.duration) {
        // Simplified logic - would use real audio analysis in production
        if (sound.duration < 15) {
          tempo = 'fast';
        } else if (sound.duration < 30) {
          tempo = 'medium';
        } else {
          tempo = 'slow';
        }
      } else if (!tempo) {
        tempo = 'medium'; // Default
      }
      
      // 4. Enhance classification
      const classification = sound.classification || {
        genre: sound.genre ? [sound.genre] : [],
        style: [],
        instruments: [],
        vocals: sound.soundCategory !== 'soundEffect',
        commercial: false,
        explicit: false
      };
      
      // Return enhanced sound object
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
      return sound; // Return original sound if categorization fails
    }
  },
  
  /**
   * Calculate growth metrics for a sound
   * @param sound The sound to analyze
   * @returns The sound with calculated growth metrics
   */
  async calculateSoundGrowthMetrics(sound: TikTokSound): Promise<TikTokSound> {
    try {
      // Get usage history for calculations
      const usageHistory = sound.usageHistory || {};
      const dates = Object.keys(usageHistory).sort();
      
      if (dates.length < 2) {
        // Not enough historical data for meaningful calculations
        return {
          ...sound,
          stats: {
            ...sound.stats,
            growthVelocity7d: 0,
            growthVelocity14d: 0,
            growthVelocity30d: 0,
            trend: 'stable'
          },
          viralityScore: 0
        };
      }
      
      // Current date and usage
      const currentDate = dates[dates.length - 1];
      const currentUsage = usageHistory[currentDate];
      
      // Find reference dates for growth calculations
      const sevenDaysAgo = findClosestDateBefore(dates, currentDate, 7);
      const fourteenDaysAgo = findClosestDateBefore(dates, currentDate, 14);
      const thirtyDaysAgo = findClosestDateBefore(dates, currentDate, 30);
      
      // Calculate growth velocities (change per day)
      const growthVelocity7d = sevenDaysAgo ? 
        (currentUsage - usageHistory[sevenDaysAgo]) / daysBetween(sevenDaysAgo, currentDate) : 0;
      
      const growthVelocity14d = fourteenDaysAgo ? 
        (currentUsage - usageHistory[fourteenDaysAgo]) / daysBetween(fourteenDaysAgo, currentDate) : 0;
      
      const growthVelocity30d = thirtyDaysAgo ? 
        (currentUsage - usageHistory[thirtyDaysAgo]) / daysBetween(thirtyDaysAgo, currentDate) : 0;
      
      // Calculate growth acceleration (change in velocity)
      const acceleration = sevenDaysAgo && fourteenDaysAgo ? 
        (growthVelocity7d - growthVelocity14d) : 0;
      
      // Determine trend direction
      let trend: 'rising' | 'stable' | 'falling' = 'stable';
      if (growthVelocity7d > 5) trend = 'rising';
      else if (growthVelocity7d < -5) trend = 'falling';
      
      // Calculate virality score (simplified algorithm)
      // Real implementation would be more sophisticated
      const viralityScore = Math.min(
        100, 
        Math.max(
          0, 
          Math.round(
            (growthVelocity7d * 5) + 
            (acceleration * 10) + 
            (sound.usageCount / 1000)
          )
        )
      );
      
      // Return sound with enhanced growth metrics
      return {
        ...sound,
        stats: {
          ...sound.stats,
          growthVelocity7d,
          growthVelocity14d,
          growthVelocity30d,
          trend
        },
        viralityScore
      };
    } catch (error) {
      console.error('Error calculating growth metrics:', error);
      return sound; // Return original sound if calculation fails
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
      
      if (dates.length < 2) {
        // Not enough data to determine lifecycle
        return {
          ...sound,
          lifecycle: sound.lifecycle || {
            stage: 'emerging',
            discoveryDate: dates[0] || new Date().toISOString().split('T')[0],
            lastDetectedDate: dates[0] || new Date().toISOString().split('T')[0]
          }
        };
      }
      
      // Get current trend and growth data
      const { trend } = sound.stats;
      const growthVelocity = sound.stats.growthVelocity7d || 0;
      
      // Current usage and max usage
      const currentUsage = usageHistory[dates[dates.length - 1]];
      const maxUsage = Math.max(...Object.values(usageHistory));
      const maxUsageDate = Object.keys(usageHistory).find(
        date => usageHistory[date] === maxUsage
      ) || dates[dates.length - 1];
      
      // Determine stage based on trend and usage patterns
      let stage: 'emerging' | 'growing' | 'peaking' | 'declining' | 'stable' = 'stable';
      
      if (trend === 'rising' && growthVelocity > 10) {
        stage = 'growing';
      } else if (trend === 'rising' && currentUsage < 1000) {
        stage = 'emerging';
      } else if (trend === 'falling' && currentUsage < maxUsage * 0.8) {
        stage = 'declining';
      } else if (currentUsage >= maxUsage * 0.9) {
        stage = 'peaking';
      }
      
      // Calculate estimated peak and decline dates
      let estimatedPeakDate: string | undefined;
      let estimatedDeclineDate: string | undefined;
      
      // Only predict for emerging or growing sounds
      if (stage === 'emerging' || stage === 'growing') {
        // Simplified prediction model - in production this would use regression
        const daysToProjectForPeak = 
          stage === 'emerging' ? 14 : (stage === 'growing' ? 7 : 3);
        
        const daysToProjectForDecline = 
          stage === 'emerging' ? 28 : (stage === 'growing' ? 14 : 7);
        
        // Generate date strings in YYYY-MM-DD format
        const peakDate = new Date();
        peakDate.setDate(peakDate.getDate() + daysToProjectForPeak);
        estimatedPeakDate = peakDate.toISOString().split('T')[0];
        
        const declineDate = new Date();
        declineDate.setDate(declineDate.getDate() + daysToProjectForDecline);
        estimatedDeclineDate = declineDate.toISOString().split('T')[0];
      } else if (stage === 'peaking') {
        // If already peaking, estimate decline soon
        const declineDate = new Date();
        declineDate.setDate(declineDate.getDate() + 3);
        estimatedDeclineDate = declineDate.toISOString().split('T')[0];
        estimatedPeakDate = new Date().toISOString().split('T')[0]; // Today
      }
      
      // Build lifecycle object
      const lifecycle = {
        stage,
        estimatedPeakDate,
        estimatedDeclineDate,
        discoveryDate: sound.lifecycle?.discoveryDate || dates[0],
        lastDetectedDate: dates[dates.length - 1]
      };
      
      return {
        ...sound,
        lifecycle,
        stats: {
          ...sound.stats,
          peakUsage: maxUsage,
          peakDate: maxUsageDate
        }
      };
    } catch (error) {
      console.error('Error determining lifecycle stage:', error);
      return sound; // Return original sound if determination fails
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
    try {
      // Get the sound data
      const sound = await soundService.getSoundById(soundId);
      if (!sound) {
        throw new Error(`Sound ${soundId} not found`);
      }
      
      // Get templates that have used this sound
      const currentTemplates = await soundService.getTemplatesUsingSound(soundId);
      
      // Calculate engagement for templates using this sound
      const templateEngagements = new Map<string, number>();
      for (const template of currentTemplates) {
        // Calculate average engagement (simplified)
        const avgEngagement = 
          (template.stats.likes + template.stats.views + template.stats.shares) / 3;
        templateEngagements.set(template.id, avgEngagement);
      }
      
      // Get similar templates by category/style
      const firestore = getFirestore();
      const templatesQuery = query(
        collection(firestore, TEMPLATES_COLLECTION),
        where('category', 'in', sound.categories || ['music']),
        firestoreLimit(50)
      );
      
      const templatesSnapshot = await getDocs(templatesQuery);
      
      // Calculate correlation scores for all templates
      const correlations: Array<{
        templateId: string;
        correlationScore: number;
        engagementLift: number;
      }> = [];
      
      templatesSnapshot.forEach(templateDoc => {
        const template = templateDoc.data();
        
        // Skip if this template is already using the sound
        if (currentTemplates.some(t => t.id === template.id)) {
          return;
        }
        
        // Calculate base correlation score based on template characteristics
        let correlationScore = 0;
        
        // Calculate potential engagement lift
        const baselineEngagement = template.stats.likes + template.stats.views + template.stats.shares;
        const similarTemplatesWithSound = currentTemplates.filter(
          t => t.category === template.category
        );
        
        let engagementLift = 0;
        if (similarTemplatesWithSound.length > 0) {
          // Calculate average engagement lift for similar templates
          const avgSimilarEngagement = similarTemplatesWithSound.reduce(
            (sum, t) => sum + templateEngagements.get(t.id)!, 0
          ) / similarTemplatesWithSound.length;
          
          // Calculate expected lift
          engagementLift = Math.round(
            ((avgSimilarEngagement - baselineEngagement) / baselineEngagement) * 100
          );
        } else {
          // Use sound virality score as a proxy for engagement lift
          engagementLift = Math.round(sound.viralityScore || 0);
        }
        
        // Sound-specific bonuses
        if (sound.stats.trend === 'rising') {
          correlationScore += 20;
        }
        
        if (sound.lifecycle?.stage === 'emerging') {
          correlationScore += 15;
        } else if (sound.lifecycle?.stage === 'growing') {
          correlationScore += 25;
        } else if (sound.lifecycle?.stage === 'peaking') {
          correlationScore += 20;
        }
        
        // Adjust based on virality score
        correlationScore += Math.round((sound.viralityScore || 0) / 5);
        
        // Ensure correlation score is between 0-100
        correlationScore = Math.min(100, Math.max(0, correlationScore));
        
        // Only include templates with positive correlation
        if (correlationScore > 50) {
          correlations.push({
            templateId: template.id,
            correlationScore,
            engagementLift
          });
        }
      });
      
      // Sort by correlation score, descending
      correlations.sort((a, b) => b.correlationScore - a.correlationScore);
      
      // Update the sound with template correlations
      await soundService.updateTemplateCorrelations(soundId, correlations);
      
      return correlations;
    } catch (error) {
      console.error(`Error finding template pairings for sound ${soundId}:`, error);
      return [];
    }
  },
  
  /**
   * Build sound-template pairing recommendation
   * @param soundId Sound ID
   * @param templateId Template ID
   * @returns Recommendation object with details
   */
  async buildPairingRecommendation(soundId: string, templateId: string): Promise<any> {
    try {
      const sound = await soundService.getSoundById(soundId);
      if (!sound) {
        throw new Error(`Sound ${soundId} not found`);
      }
      
      // Find the correlation for this template
      const correlation = sound.templateCorrelations?.find(
        c => c.templateId === templateId
      );
      
      if (!correlation) {
        // Generate correlation on the fly if not found
        const firestore = getFirestore();
        const templateDoc = await getDoc(doc(firestore, TEMPLATES_COLLECTION, templateId));
        
        if (!templateDoc.exists()) {
          throw new Error(`Template ${templateId} not found`);
        }
        
        const template = templateDoc.data();
        
        // Simple correlation calculation
        const correlationScore = 65; // Default score
        const engagementLift = Math.round(sound.viralityScore || 0);
        
        return {
          sound: {
            id: sound.id,
            title: sound.title,
            authorName: sound.authorName,
            soundCategory: sound.soundCategory,
            viralityScore: sound.viralityScore,
            lifecycle: sound.lifecycle
          },
          template: {
            id: templateId,
            title: template.title,
            category: template.category
          },
          correlation: {
            score: correlationScore,
            engagementLift,
            confidence: 'medium', // Default confidence
            recommendation: correlationScore > 75 ? 'strong' : 'moderate'
          }
        };
      }
      
      // Return detailed recommendation
      return {
        sound: {
          id: sound.id,
          title: sound.title,
          authorName: sound.authorName,
          soundCategory: sound.soundCategory,
          viralityScore: sound.viralityScore,
          lifecycle: sound.lifecycle
        },
        template: {
          id: templateId,
          // Would fetch more template details in a real implementation
        },
        correlation: {
          score: correlation.correlationScore,
          engagementLift: correlation.engagementLift,
          confidence: correlation.correlationScore > 80 ? 'high' : 'medium',
          recommendation: correlation.correlationScore > 75 ? 'strong' : 'moderate'
        }
      };
    } catch (error) {
      console.error(`Error building pairing recommendation for ${soundId}-${templateId}:`, error);
      throw error;
    }
  },
  
  /**
   * Generate a comprehensive sound trend report
   * @returns The generated trend report
   */
  async generateSoundTrendReport(): Promise<SoundTrendReport> {
    try {
      // Create report ID
      const reportId = uuidv4();
      const today = new Date().toISOString().split('T')[0];
      
      // Get trending sounds for different timeframes
      const trendingDaily = await soundService.getTrendingSounds('7d', 10);
      const trendingWeekly = await soundService.getTrendingSounds('14d', 10);
      const trendingMonthly = await soundService.getTrendingSounds('30d', 10);
      
      // Get sounds by lifecycle stage
      const emergingSounds = await soundService.getSoundsByLifecycleStage('emerging', 10);
      const peakingSounds = await soundService.getSoundsByLifecycleStage('peaking', 10);
      const decliningTrends = await soundService.getSoundsByLifecycleStage('declining', 10);
      
      // Get genre distribution
      const genreDistribution = await soundService.getGenreDistribution();
      
      // Create the report object
      const report: SoundTrendReport = {
        id: reportId,
        date: today,
        topSounds: {
          daily: trendingDaily.map(sound => sound.id),
          weekly: trendingWeekly.map(sound => sound.id),
          monthly: trendingMonthly.map(sound => sound.id)
        },
        emergingSounds: emergingSounds.map(sound => sound.id),
        peakingSounds: peakingSounds.map(sound => sound.id),
        decliningTrends: decliningTrends.map(sound => sound.id),
        genreDistribution,
        createdAt: serverTimestamp()
      };
      
      // Store report in Firestore
      await soundService.storeTrendReport(report);
      
      return report;
    } catch (error) {
      console.error('Error generating sound trend report:', error);
      throw error;
    }
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