import { collection, query, where, orderBy, limit as firestoreLimit, getDocs, getDoc, doc, addDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { v4 as uuidv4 } from 'uuid';
import { soundService } from './soundService';
import { soundAnalysisService } from './soundAnalysisService';
import { 
  NewsletterSoundRecommendation, 
  WeeklyTrendingSoundsShowcase,
  SoundPerformanceData 
} from '@/lib/types/newsletter';

const WEEKLY_SOUNDS_COLLECTION = 'newsletter_weekly_sounds';
const NEWSLETTER_LINKS_COLLECTION = 'newsletterLinks';
const NEWSLETTER_CLICKS_COLLECTION = 'newsletterClicks';
const TEMPLATES_COLLECTION = 'templates';
const SOUNDS_COLLECTION = 'sounds';

/**
 * Service for managing sound-related newsletter functionality
 */
export const newsletterSoundService = {
  /**
   * Generate weekly trending sounds showcase for newsletters
   * @returns A promise containing the generated showcase
   */
  async generateWeeklyTrendingSoundsShowcase(): Promise<WeeklyTrendingSoundsShowcase> {
    try {
      // Get trending sounds from soundService
      const trendingSounds = await soundService.getTrendingSounds('7d', 10);
      
      // Format the sounds for newsletter presentation
      const newsletterSounds: NewsletterSoundRecommendation[] = await Promise.all(
        trendingSounds.map(async (sound) => {
          // Get optimal template pairings for this sound
          const templatePairings = await soundAnalysisService.findOptimalTemplatePairings(sound.id);
          
          // Format for newsletter
          return {
            soundId: sound.id,
            soundTitle: sound.title,
            authorName: sound.authorName,
            category: sound.soundCategory || 'music',
            thumbnailUrl: sound.coverThumb,
            templatePairings: templatePairings.slice(0, 3).map(pairing => ({
              templateId: pairing.templateId,
              templateTitle: 'Template ' + pairing.templateId.substring(0, 5), // This would ideally get the actual template title
              correlationScore: pairing.correlationScore
            })),
            trendingStatus: sound.lifecycle?.stage || 'growing',
            weeklyChange: sound.stats?.usageChange7d || 0,
            playUrl: sound.playUrl || '' // Fixed: use playUrl instead of audioUrl
          };
        })
      );
      
      // Create showcase object
      const showcase: WeeklyTrendingSoundsShowcase = {
        id: uuidv4(),
        date: new Date().toISOString().split('T')[0],
        title: `Weekly Trending Sounds - ${new Date().toLocaleDateString()}`,
        description: 'Discover this week\'s trending sounds to boost your content performance.',
        sounds: newsletterSounds,
        createdAt: new Date().toISOString()
      };
      
      // Save to Firestore
      const firestore = db;
      if (firestore) {
        await addDoc(collection(firestore, WEEKLY_SOUNDS_COLLECTION), {
          ...showcase,
          createdAt: serverTimestamp(),
          sounds: newsletterSounds.map(sound => ({
            ...sound,
            templatePairings: sound.templatePairings.map(pairing => ({
              ...pairing,
              correlationScore: pairing.correlationScore || 0
            }))
          }))
        });
      }
      
      return showcase;
    } catch (error) {
      console.error('Error generating weekly trending sounds showcase:', error);
      throw error;
    }
  },
  
  /**
   * Get the latest weekly trending sounds showcase
   * @returns The latest showcase or null if none exists
   */
  async getLatestWeeklyTrendingSounds(): Promise<WeeklyTrendingSoundsShowcase | null> {
    try {
      const firestore = db;
      if (!firestore) {
        throw new Error('Firestore not initialized');
      }
      
      const q = query(
        collection(firestore, WEEKLY_SOUNDS_COLLECTION),
        orderBy('createdAt', 'desc'),
        firestoreLimit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        // Create a showcase if none exists
        return this.generateWeeklyTrendingSoundsShowcase();
      }
      
      // Format and return the latest showcase
      const docData = querySnapshot.docs[0].data();
      return {
        id: querySnapshot.docs[0].id,
        date: docData.date,
        title: docData.title,
        description: docData.description,
        sounds: docData.sounds,
        createdAt: docData.createdAt?.toDate?.().toISOString() || new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting latest weekly trending sounds:', error);
      return null;
    }
  },
  
  /**
   * Add sound recommendations to a newsletter template link
   * @param linkId The ID of the newsletter template link
   * @param soundIds Array of sound IDs to recommend
   * @returns True if successful, false otherwise
   */
  async addSoundRecommendationsToLink(linkId: string, soundIds: string[]): Promise<boolean> {
    try {
      const firestore = db;
      if (!firestore) {
        throw new Error('Firestore not initialized');
      }
      
      const linkRef = doc(firestore, NEWSLETTER_LINKS_COLLECTION, linkId);
      
      await updateDoc(linkRef, {
        soundRecommendations: soundIds,
        updatedAt: serverTimestamp()
      });
      
      return true;
    } catch (error) {
      console.error(`Error adding sound recommendations to link ${linkId}:`, error);
      return false;
    }
  },
  
  /**
   * Track sound selection from newsletter
   * @param linkId Newsletter link ID
   * @param soundId Selected sound ID
   * @param userId Optional user ID
   * @returns True if successful, false otherwise
   */
  async trackSoundSelection(linkId: string, soundId: string, userId?: string): Promise<boolean> {
    try {
      const firestore = db;
      if (!firestore) {
        throw new Error('Firestore not initialized');
      }
      
      // Add click event with sound selection
      await addDoc(collection(firestore, NEWSLETTER_CLICKS_COLLECTION), {
        linkId,
        userId,
        soundSelected: soundId,
        soundClicked: true,
        timestamp: serverTimestamp(),
        converted: true,
        conversionType: 'sound_selection'
      });
      
      // Update link analytics
      const linkRef = doc(firestore, NEWSLETTER_LINKS_COLLECTION, linkId);
      const linkDoc = await getDoc(linkRef);
      
      if (linkDoc.exists()) {
        const soundSelections = linkDoc.data().soundSelections || {};
        soundSelections[soundId] = (soundSelections[soundId] || 0) + 1;
        
        await updateDoc(linkRef, {
          soundSelections,
          updatedAt: serverTimestamp()
        });
      }
      
      return true;
    } catch (error) {
      console.error(`Error tracking sound selection from newsletter:`, error);
      return false;
    }
  },
  
  /**
   * Generate sound performance tracking data for a specific sound
   * @param soundId The ID of the sound
   * @returns Performance data for the sound
   */
  async generateSoundPerformanceData(soundId: string): Promise<SoundPerformanceData | null> {
    try {
      // Get sound details
      const sound = await soundService.getSoundById(soundId);
      if (!sound) {
        throw new Error(`Sound ${soundId} not found`);
      }
      
      // Get templates using this sound
      const templates = await soundService.getTemplatesUsingSound(soundId);
      
      // Generate tracking URL
      const trackingUrl = `/api/sounds/performance-tracking?soundId=${soundId}`;
      
      // Convert sound.stats.trend to SoundPerformanceData.trendDirection
      let trendDirection: 'up' | 'down' | 'stable' = 'stable';
      if (sound.stats?.trend === 'rising') {
        trendDirection = 'up';
      } else if (sound.stats?.trend === 'falling') {
        trendDirection = 'down';
      }
      
      return {
        soundId: sound.id,
        title: sound.title,
        authorName: sound.authorName,
        usageCount: sound.usageCount || 0,
        weeklyChange: sound.stats?.usageChange7d || 0,
        trendDirection,
        topTemplates: templates.slice(0, 3).map(template => ({
          templateId: template.id,
          templateTitle: template.title,
          usageCount: template.stats?.usageCount || 0
        })),
        trackingUrl
      };
    } catch (error) {
      console.error(`Error generating sound performance data for ${soundId}:`, error);
      return null;
    }
  },
  
  /**
   * Get sound-template pairing recommendations for newsletter
   * @param templateId The template ID 
   * @param limit Maximum number of sound recommendations
   * @returns Array of recommended sounds for the template
   */
  async getSoundRecommendationsForTemplate(templateId: string, limitCount = 5): Promise<NewsletterSoundRecommendation[]> {
    try {
      // First, get template details
      const firestore = db;
      if (!firestore) {
        throw new Error('Firestore not initialized');
      }
      
      const templateDoc = await getDoc(doc(firestore, TEMPLATES_COLLECTION, templateId));
      if (!templateDoc.exists()) {
        throw new Error(`Template ${templateId} not found`);
      }
      
      const template = templateDoc.data();
      const category = template.category || 'general';
      
      // Find trending sounds in the same category
      const q = query(
        collection(firestore, SOUNDS_COLLECTION),
        where('categories', 'array-contains', category),
        orderBy('viralityScore', 'desc'),
        firestoreLimit(limitCount)
      );
      
      const soundsSnapshot = await getDocs(q);
      
      // Format sounds for newsletter recommendations
      return Promise.all(
        soundsSnapshot.docs.map(async (soundDoc) => {
          const sound = soundDoc.data();
          
          // For each sound, find its compatibility with this template
          const pairing = await soundAnalysisService.buildPairingRecommendation(
            soundDoc.id,
            templateId
          );
          
          return {
            soundId: soundDoc.id,
            soundTitle: sound.title,
            authorName: sound.authorName,
            category: sound.soundCategory || 'music',
            thumbnailUrl: sound.coverThumb,
            templatePairings: [{
              templateId,
              templateTitle: template.title,
              correlationScore: pairing?.correlation?.score || 75
            }],
            trendingStatus: sound.lifecycle?.stage || 'growing',
            weeklyChange: sound.stats?.usageChange7d || 0,
            playUrl: sound.playUrl || '' // Fixed: use playUrl instead of audioUrl
          };
        })
      );
    } catch (error) {
      console.error(`Error getting sound recommendations for template ${templateId}:`, error);
      return [];
    }
  }
}; 