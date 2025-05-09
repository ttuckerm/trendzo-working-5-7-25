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
import { v4 as uuidv4 } from 'uuid';

// Collection names
const SOUNDS_COLLECTION = 'sounds';
const TEMPLATES_COLLECTION = 'templates';
const TREND_REPORTS_COLLECTION = 'soundTrendReports';

// Helper function to get a safe Firestore instance
function getFirestore(): Firestore {
  if (!db) {
    throw new Error('Firestore is not initialized. This might happen in development mode.');
  }
  return db as Firestore;
}

// Service for managing TikTok sounds
export const soundService = {
  /**
   * Store a sound in Firestore
   * @param sound The TikTok sound to store
   * @returns The stored sound with ID
   */
  async storeSound(sound: TikTokSound): Promise<TikTokSound> {
    try {
      console.log(`Storing sound: ${sound.title} by ${sound.authorName}`);
      
      // Check if sound already exists
      const existingSound = await this.getSoundById(sound.id);
      if (existingSound) {
        console.log(`Sound ${sound.id} already exists, updating usage count`);
        return await this.updateSoundUsage(sound.id, sound.usageCount);
      }
      
      // Create a new sound document
      const soundDoc = {
        ...sound,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        usageHistory: sound.usageHistory || {
          [new Date().toISOString().split('T')[0]]: sound.usageCount
        },
        expertAnnotations: sound.expertAnnotations || {},
        categories: sound.categories || [],
        soundCategory: sound.soundCategory || 'music',
        lifecycle: sound.lifecycle || {
          stage: 'emerging',
          discoveryDate: new Date().toISOString().split('T')[0],
          lastDetectedDate: new Date().toISOString().split('T')[0]
        }
      };
      
      // Store in Firestore
      const firestore = getFirestore();
      await setDoc(doc(firestore, SOUNDS_COLLECTION, sound.id), soundDoc);
      
      console.log(`Sound ${sound.id} stored successfully`);
      return {
        ...sound,
        stats: {
          ...sound.stats
        }
      };
    } catch (error) {
      console.error('Error storing sound:', error);
      throw error;
    }
  },
  
  /**
   * Get a sound by ID
   * @param soundId The sound ID
   * @returns The sound or null if not found
   */
  async getSoundById(soundId: string): Promise<TikTokSound | null> {
    try {
      const firestore = getFirestore();
      const soundDoc = await getDoc(doc(firestore, SOUNDS_COLLECTION, soundId));
      
      if (!soundDoc.exists()) {
        return null;
      }
      
      return soundDoc.data() as TikTokSound;
    } catch (error) {
      console.error(`Error getting sound ${soundId}:`, error);
      throw error;
    }
  },
  
  /**
   * Update sound usage count and calculate growth
   * @param soundId The sound ID
   * @param currentUsageCount Current usage count
   * @returns The updated sound
   */
  async updateSoundUsage(soundId: string, currentUsageCount: number): Promise<TikTokSound> {
    try {
      const firestore = getFirestore();
      const soundRef = doc(firestore, SOUNDS_COLLECTION, soundId);
      const soundDoc = await getDoc(soundRef);
      
      if (!soundDoc.exists()) {
        throw new Error(`Sound ${soundId} not found`);
      }
      
      const soundData = soundDoc.data() as TikTokSound & {
        usageHistory: Record<string, number>;
        createdAt: Timestamp;
        updatedAt: Timestamp;
      };
      
      // Get current date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      
      // Update usage history
      const usageHistory = {
        ...soundData.usageHistory,
        [today]: currentUsageCount
      };
      
      // Calculate growth metrics
      const dates = Object.keys(usageHistory).sort();
      const currentUsage = usageHistory[today] || currentUsageCount;
      
      // Find dates for comparison
      const dateIndex = dates.indexOf(today);
      let sevenDaysAgo = null;
      let fourteenDaysAgo = null;
      let thirtyDaysAgo = null;
      
      if (dateIndex >= 0) {
        // Find closest date to 7 days ago
        for (let i = dateIndex - 1; i >= 0; i--) {
          const date = new Date(dates[i]);
          const daysDiff = Math.floor((new Date(today).getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysDiff >= 7 && !sevenDaysAgo) {
            sevenDaysAgo = dates[i];
          }
          
          if (daysDiff >= 14 && !fourteenDaysAgo) {
            fourteenDaysAgo = dates[i];
          }
          
          if (daysDiff >= 30 && !thirtyDaysAgo) {
            thirtyDaysAgo = dates[i];
          }
          
          if (sevenDaysAgo && fourteenDaysAgo && thirtyDaysAgo) {
            break;
          }
        }
      }
      
      // Calculate growth changes
      const usageChange7d = sevenDaysAgo 
        ? currentUsage - usageHistory[sevenDaysAgo] 
        : 0;
        
      const usageChange14d = fourteenDaysAgo 
        ? currentUsage - usageHistory[fourteenDaysAgo] 
        : 0;
        
      const usageChange30d = thirtyDaysAgo 
        ? currentUsage - usageHistory[thirtyDaysAgo] 
        : 0;
      
      // Update the sound document
      await updateDoc(soundRef, {
        usageCount: currentUsage,
        updatedAt: serverTimestamp(),
        usageHistory,
        'stats.usageCount': currentUsage,
        'stats.usageChange7d': usageChange7d,
        'stats.usageChange14d': usageChange14d,
        'stats.usageChange30d': usageChange30d,
        'lifecycle.lastDetectedDate': today
      });
      
      return {
        ...soundData,
        usageCount: currentUsage,
        stats: {
          ...soundData.stats,
          usageCount: currentUsage,
          usageChange7d,
          usageChange14d,
          usageChange30d
        }
      };
    } catch (error) {
      console.error(`Error updating sound ${soundId} usage:`, error);
      throw error;
    }
  },
  
  /**
   * Update sound metrics with calculated values
   * @param soundId The sound ID
   * @param metrics Object containing metrics to update
   */
  async updateSoundMetrics(soundId: string, metrics: Record<string, any>): Promise<void> {
    try {
      const firestore = getFirestore();
      const soundRef = doc(firestore, SOUNDS_COLLECTION, soundId);
      
      // Update metrics
      await updateDoc(soundRef, {
        ...metrics,
        updatedAt: serverTimestamp()
      });
      
      console.log(`Updated metrics for sound ${soundId}`);
    } catch (error) {
      console.error(`Error updating metrics for sound ${soundId}:`, error);
      throw error;
    }
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
    try {
      // Determine which growth metric to use
      const growthField = timeframe === '7d' 
        ? 'stats.usageChange7d' 
        : timeframe === '14d' 
          ? 'stats.usageChange14d' 
          : 'stats.usageChange30d';
      
      const firestore = getFirestore();
      const soundsRef = collection(firestore, SOUNDS_COLLECTION);
      const q = query(
        soundsRef,
        orderBy(growthField, 'desc'),
        firestoreLimit(limit)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as TikTokSound);
    } catch (error) {
      console.error('Error getting trending sounds:', error);
      throw error;
    }
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
    try {
      const firestore = getFirestore();
      const soundsRef = collection(firestore, SOUNDS_COLLECTION);
      const q = query(
        soundsRef,
        where('lifecycle.stage', '==', stage),
        orderBy('stats.usageCount', 'desc'),
        firestoreLimit(limit)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as TikTokSound);
    } catch (error) {
      console.error(`Error getting sounds in ${stage} stage:`, error);
      throw error;
    }
  },
  
  /**
   * Get genre distribution across all sounds
   * @returns Object mapping genre names to counts
   */
  async getGenreDistribution(): Promise<Record<string, number>> {
    try {
      const firestore = getFirestore();
      const soundsRef = collection(firestore, SOUNDS_COLLECTION);
      const querySnapshot = await getDocs(soundsRef);
      
      const distribution: Record<string, number> = {};
      
      querySnapshot.docs.forEach(doc => {
        const sound = doc.data() as TikTokSound;
        
        // Handle classification.genre array
        if (sound.classification?.genre && Array.isArray(sound.classification.genre)) {
          sound.classification.genre.forEach(genre => {
            distribution[genre] = (distribution[genre] || 0) + 1;
          });
        }
        // Also check string genre field for backward compatibility
        else if (sound.genre) {
          distribution[sound.genre] = (distribution[sound.genre] || 0) + 1;
        }
        // Use soundCategory as fallback
        else if (sound.soundCategory) {
          distribution[sound.soundCategory] = (distribution[sound.soundCategory] || 0) + 1;
        }
      });
      
      return distribution;
    } catch (error) {
      console.error('Error getting genre distribution:', error);
      throw error;
    }
  },
  
  /**
   * Link a sound to a template
   * @param soundId The sound ID
   * @param templateId The template ID
   */
  async linkSoundToTemplate(soundId: string, templateId: string): Promise<void> {
    try {
      const firestore = getFirestore();
      const soundRef = doc(firestore, SOUNDS_COLLECTION, soundId);
      const soundDoc = await getDoc(soundRef);
      
      if (!soundDoc.exists()) {
        throw new Error(`Sound ${soundId} not found`);
      }
      
      const soundData = soundDoc.data() as TikTokSound;
      const relatedTemplates = soundData.relatedTemplates || [];
      
      // Only add if not already linked
      if (!relatedTemplates.includes(templateId)) {
        // Add template to sound's related templates
        await updateDoc(soundRef, {
          relatedTemplates: [...relatedTemplates, templateId],
          updatedAt: serverTimestamp()
        });
        
        console.log(`Linked template ${templateId} to sound ${soundId}`);
      } else {
        console.log(`Template ${templateId} already linked to sound ${soundId}`);
      }
    } catch (error) {
      console.error(`Error linking template ${templateId} to sound ${soundId}:`, error);
      throw error;
    }
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
    try {
      const firestore = getFirestore();
      const soundRef = doc(firestore, SOUNDS_COLLECTION, soundId);
      
      // Update template correlations
      await updateDoc(soundRef, {
        templateCorrelations: correlations,
        updatedAt: serverTimestamp()
      });
      
      console.log(`Updated template correlations for sound ${soundId}`);
    } catch (error) {
      console.error(`Error updating template correlations for sound ${soundId}:`, error);
      throw error;
    }
  },
  
  /**
   * Get templates that use a specific sound
   * @param soundId The sound ID
   * @returns Array of templates that use the sound
   */
  async getTemplatesUsingSound(soundId: string): Promise<any[]> {
    try {
      // Get sound with related templates
      const sound = await this.getSoundById(soundId);
      
      if (!sound || !sound.relatedTemplates || sound.relatedTemplates.length === 0) {
        return [];
      }
      
      // Get template details
      const firestore = getFirestore();
      const templates = [];
      
      for (const templateId of sound.relatedTemplates) {
        try {
          const templateDoc = await getDoc(doc(firestore, TEMPLATES_COLLECTION, templateId));
          
          if (templateDoc.exists()) {
            templates.push({
              id: templateDoc.id,
              ...templateDoc.data()
            });
          }
        } catch (error) {
          console.error(`Error fetching template ${templateId}:`, error);
        }
      }
      
      return templates;
    } catch (error) {
      console.error(`Error getting templates using sound ${soundId}:`, error);
      throw error;
    }
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
    try {
      const firestore = getFirestore();
      const soundRef = doc(firestore, SOUNDS_COLLECTION, soundId);
      const soundDoc = await getDoc(soundRef);
      
      if (!soundDoc.exists()) {
        throw new Error(`Sound ${soundId} not found`);
      }
      
      const soundData = soundDoc.data() as TikTokSound;
      const existingAnnotations = soundData.expertAnnotations || {};
      
      // Merge existing and new annotations
      await updateDoc(soundRef, {
        expertAnnotations: {
          ...existingAnnotations,
          ...annotations,
          annotatedAt: Date.now()
        },
        updatedAt: serverTimestamp()
      });
      
      console.log(`Added expert annotations to sound ${soundId}`);
    } catch (error) {
      console.error(`Error adding expert annotations to sound ${soundId}:`, error);
      throw error;
    }
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
    try {
      const firestore = getFirestore();
      const soundRef = doc(firestore, SOUNDS_COLLECTION, soundId);
      
      await updateDoc(soundRef, {
        categories,
        updatedAt: serverTimestamp()
      });
      
      console.log(`Updated categories for sound ${soundId}`);
    } catch (error) {
      console.error(`Error updating categories for sound ${soundId}:`, error);
      throw error;
    }
  },
  
  /**
   * Store a sound trend report
   * @param report The trend report to store
   */
  async storeTrendReport(report: SoundTrendReport): Promise<void> {
    try {
      const firestore = getFirestore();
      const reportId = report.id || uuidv4();
      
      await setDoc(doc(firestore, TREND_REPORTS_COLLECTION, reportId), {
        ...report,
        id: reportId,
        createdAt: serverTimestamp()
      });
      
      console.log(`Stored sound trend report with ID ${reportId}`);
    } catch (error) {
      console.error('Error storing sound trend report:', error);
      throw error;
    }
  },
  
  /**
   * Get the latest sound trend report
   * @returns The latest sound trend report or null if none exists
   */
  async getLatestTrendReport(): Promise<SoundTrendReport | null> {
    try {
      const firestore = getFirestore();
      const reportsRef = collection(firestore, TREND_REPORTS_COLLECTION);
      const q = query(
        reportsRef,
        orderBy('createdAt', 'desc'),
        firestoreLimit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }
      
      return querySnapshot.docs[0].data() as SoundTrendReport;
    } catch (error) {
      console.error('Error getting latest trend report:', error);
      throw error;
    }
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
    try {
      const {
        filters = {},
        page = 1,
        limit = 20,
        sortBy = 'viralityScore',
        sortDir = 'desc'
      } = options;
      
      const firestore = getFirestore();
      
      // Start building the query
      let soundsQuery = collection(firestore, SOUNDS_COLLECTION);
      let constraints: any[] = [];
      
      // Apply filters
      if (filters.category) {
        constraints.push(where('soundCategory', '==', filters.category));
      }
      
      if (filters.lifecycle) {
        constraints.push(where('lifecycle.stage', '==', filters.lifecycle));
      }
      
      if (filters.trending === true) {
        constraints.push(where('stats.trend', '==', 'rising'));
      }
      
      // Apply sorting
      let sortField = sortBy;
      if (sortBy === 'viralityScore') {
        sortField = 'viralityScore';
      } else if (sortBy === 'usageCount') {
        sortField = 'stats.usageCount';
      } else if (sortBy === 'creationDate') {
        sortField = 'creationDate';
      }
      
      constraints.push(orderBy(sortField, sortDir));
      
      // Apply pagination (Firestore uses limit and startAfter)
      const offset = (page - 1) * limit;
      constraints.push(firestoreLimit(limit));
      
      // Create the final query with all constraints
      const finalQuery = query(soundsQuery, ...constraints);
      
      // Execute the query
      const soundsSnapshot = await getDocs(finalQuery);
      
      // Get total count (Note: Firestore doesn't have a direct count API)
      // This is a simplified approach - for large collections, a separate
      // counter document would be more efficient
      const countQuery = query(soundsQuery, ...constraints.filter(c => c.type !== 'limit'));
      const countSnapshot = await getDocs(countQuery);
      const total = countSnapshot.size;
      
      // Convert snapshots to sound objects
      const sounds: TikTokSound[] = [];
      soundsSnapshot.forEach(doc => {
        sounds.push(doc.data() as TikTokSound);
      });
      
      return {
        sounds,
        total
      };
    } catch (error) {
      console.error('Error getting sounds:', error);
      throw error;
    }
  },
  
  /**
   * Get a specific trend report by ID
   * @param reportId The ID of the report to retrieve
   * @returns The trend report or null if not found
   */
  async getTrendReportById(reportId: string): Promise<SoundTrendReport | null> {
    try {
      const firestore = getFirestore();
      const reportDoc = await getDoc(doc(firestore, TREND_REPORTS_COLLECTION, reportId));
      
      if (!reportDoc.exists()) {
        return null;
      }
      
      return reportDoc.data() as SoundTrendReport;
    } catch (error) {
      console.error(`Error getting trend report ${reportId}:`, error);
      throw error;
    }
  },
}; 