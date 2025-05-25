import { ApifyClient } from 'apify-client';
import { ETLError, logETLEvent, ETLLogLevel } from '@/lib/utils/etlLogger';
import axios from 'axios';
import { TikTokVideo, TikTokSound } from '@/lib/types/tiktok';

// Define types for Apify API responses and inputs
interface ApifyScraperInput {
  search: string;
  mode: string;
  proxy: {
    useApifyProxy: boolean;
    apifyProxyGroups: string[];
  };
  maxItems: number;
  customMapFunction: string;
  timestamp?: string; // Add this to allow timestamp property
}

interface ApifyUserInfo {
  subscription: any;
  availableMemory: number;
  availableCpu: number;
  rateLimitState: any;
}

// Initialize the ApifyClient with API token
const client = new ApifyClient({
  token: process.env.APIFY_API_TOKEN || '',
});

// Log API token status for debugging
console.log('APIFY_API_TOKEN status:', process.env.APIFY_API_TOKEN ? 'Set' : 'Not set');

if (!process.env.APIFY_API_TOKEN) {
  console.warn('Warning: APIFY_API_TOKEN is not set. TikTok scraping will likely fail.');
}

// Default parameters for TikTok scraper
const DEFAULT_SCRAPER_SETTINGS: ApifyScraperInput = {
  search: '',
  mode: 'trending',
  proxy: {
    useApifyProxy: true,
    apifyProxyGroups: ['RESIDENTIAL'],
  },
  maxItems: 50,
  customMapFunction: `
    ({ data, customData }) => {
      return data.map(item => ({
        id: item.id,
        text: item.desc,
        createTime: item.createTime,
        authorMeta: {
          id: item.authorMeta?.id,
          name: item.authorMeta?.name,
          nickname: item.authorMeta?.nickname,
          verified: item.authorMeta?.verified
        },
        music: {
          id: item.musicMeta?.musicId || item.music?.id || '',
          title: item.musicMeta?.musicName || item.music?.title || '',
          authorName: item.musicMeta?.musicAuthor || item.music?.authorName || '',
          playUrl: item.musicMeta?.musicUrl || item.music?.playUrl || '',
          duration: item.musicMeta?.duration || item.music?.duration || 0,
          album: item.musicMeta?.album || item.music?.album || '',
          coverLarge: item.musicMeta?.coverLarge || item.music?.coverLarge || '',
          coverMedium: item.musicMeta?.coverMedium || item.music?.coverMedium || '',
          coverThumb: item.musicMeta?.coverThumb || item.music?.coverThumb || '',
          original: item.musicMeta?.isOriginal || item.music?.original || false,
          isRemix: item.musicMeta?.isRemix || item.music?.isRemix || false,
          usageCount: item.musicMeta?.usageCount || item.music?.usageCount || 0,
          
          // Enhanced audio metadata extraction
          creationDate: item.musicMeta?.creationDate || item.music?.creationDate || item.createTime || 0,
          
          // Enhanced categorization
          genre: extractGenre(item),
          mood: extractMood(item),
          tempo: analyzeAudioTempo(item),
          language: detectLanguage(item),
          
          // Taxonomy and classification
          soundCategory: determineSoundCategory(item),
          commercialAudio: isCommercialAudio(item),
          
          // Additional metadata
          lyrics: item.musicMeta?.lyric || item.music?.lyric || '',
          audioFeatures: {
            hasVocals: detectVocals(item),
            hasBeat: detectBeat(item),
            isSpeech: detectSpeech(item)
          },
          
          // Structure metadata
          structuralInfo: {
            introLength: estimateIntroLength(item),
            hasDrop: detectDrop(item),
            loopable: isLoopable(item)
          },
          
          // Social context
          socialContext: {
            trendCycle: detectTrendCycle(item),
            originApp: detectOriginApp(item),
            isViral: item.music?.usageCount > 50000 || false
          }
        },
        videoMeta: {
          height: item.videoMeta?.height,
          width: item.videoMeta?.width,
          duration: item.videoMeta?.duration,
        },
        hashtags: item.hashtags?.map(tag => tag.name) || [],
        stats: {
          commentCount: item.stats?.commentCount,
          diggCount: item.stats?.diggCount,
          playCount: item.stats?.playCount,
          shareCount: item.stats?.shareCount,
        },
        videoUrl: item.videoUrl,
        webVideoUrl: item.webVideoUrl,
      }));
    }
    
    // Enhanced helper functions for audio metadata extraction
    
    // Determine audio category with improved classification
    function determineSoundCategory(item) {
      const music = item.musicMeta || item.music || {};
      
      // First check for explicit category markers
      if (music.isOriginal) {
        return 'original';
      }
      
      if (music.isRemix) {
        return 'remix';
      }
      
      const title = (music.musicName || music.title || '').toLowerCase();
      const author = (music.musicAuthor || music.authorName || '').toLowerCase();
      
      // Check for sound effect indicators
      if (title.includes('sound effect') || 
          title.includes('sfx') || 
          title.includes('sound') || 
          title.includes('effect') ||
          author.includes('sound effect') ||
          music.duration < 5) {
        return 'soundEffect';
      }
      
      // Check for voiceover indicators
      if ((!music.musicAuthor || music.musicAuthor === music.authorName) && 
          !music.album && 
          (music.isOriginal || music.original) &&
          music.duration < 20) {
        return 'voiceover';
      }
      
      // Check for environmental sounds
      if (title.includes('ambience') || 
          title.includes('ambient') || 
          title.includes('background')) {
        return 'ambient';
      }
      
      // Check for meme/viral sounds
      if (title.includes('meme') || 
          title.includes('viral') || 
          title.includes('trending') ||
          music.usageCount > 50000) {
        return 'viral';
      }
      
      // Default to music for everything else
      return 'music';
    }
    
    // Extract genre from music metadata
    function extractGenre(item) {
      const music = item.musicMeta || item.music || {};
      if (music.genre) return music.genre;
      
      const title = (music.musicName || music.title || '').toLowerCase();
      
      // Simple genre detection based on keywords in title
      const genreKeywords = {
        'pop': ['pop', 'catchy', 'radio'],
        'hip hop': ['hip hop', 'rap', 'trap', 'beat'],
        'electronic': ['electronic', 'edm', 'house', 'techno', 'dubstep'],
        'rock': ['rock', 'guitar', 'band'],
        'rnb': ['rnb', 'r&b', 'soul'],
        'country': ['country', 'western'],
        'classical': ['classical', 'orchestra', 'symphony'],
        'jazz': ['jazz', 'blues'],
        'folk': ['folk', 'acoustic'],
        'latin': ['latin', 'reggaeton', 'salsa'],
        'kpop': ['kpop', 'k-pop'],
        'indie': ['indie', 'alternative']
      };
      
      for (const [genre, keywords] of Object.entries(genreKeywords)) {
        if (keywords.some(keyword => title.includes(keyword))) {
          return genre;
        }
      }
      
      return '';
    }
    
    // Extract mood from music metadata
    function extractMood(item) {
      const music = item.musicMeta || item.music || {};
      const title = (music.musicName || music.title || '').toLowerCase();
      
      // Simple mood detection based on keywords in title
      const moodKeywords = {
        'happy': ['happy', 'joy', 'upbeat', 'fun', 'cheer'],
        'sad': ['sad', 'melancholy', 'blue', 'heartbreak'],
        'energetic': ['energy', 'pump', 'workout', 'hype', 'energetic'],
        'calm': ['calm', 'relax', 'chill', 'peaceful', 'sleep'],
        'romantic': ['love', 'romance', 'romantic', 'heart'],
        'dramatic': ['dramatic', 'intense', 'epic', 'powerful'],
        'inspirational': ['inspire', 'motivation', 'uplifting']
      };
      
      const detectedMoods = [];
      
      for (const [mood, keywords] of Object.entries(moodKeywords)) {
        if (keywords.some(keyword => title.includes(keyword))) {
          detectedMoods.push(mood);
        }
      }
      
      return detectedMoods.length > 0 ? detectedMoods : undefined;
    }
    
    // Analyze audio tempo based on metadata and title
    function analyzeAudioTempo(item) {
      const music = item.musicMeta || item.music || {};
      const title = (music.musicName || music.title || '').toLowerCase();
      
      // Keywords for tempo estimation
      const tempoKeywords = {
        'slow': ['slow', 'ballad', 'calm', 'relax', 'chill', 'sleep'],
        'medium': ['medium', 'moderate', 'groove', 'regular'],
        'fast': ['fast', 'quick', 'rapid', 'speed', 'energetic', 'hype', 'dance']
      };
      
      for (const [tempo, keywords] of Object.entries(tempoKeywords)) {
        if (keywords.some(keyword => title.includes(keyword))) {
          return tempo;
        }
      }
      
      // Default estimation based on duration and type
      if (music.duration < 10 && determineSoundCategory(item) === 'soundEffect') {
        return 'fast';
      } else if (music.duration > 30 && determineSoundCategory(item) === 'original') {
        return 'medium';
      }
      
      return 'medium'; // Default to medium when we can't detect
    }
    
    // Detect language of audio
    function detectLanguage(item) {
      const music = item.musicMeta || item.music || {};
      const title = (music.musicName || music.title || '').toLowerCase();
      
      // Simple language detection based on common indicators in title
      if (title.includes('(en)') || title.includes('[english]')) return 'english';
      if (title.includes('(es)') || title.includes('[spanish]') || title.includes('español')) return 'spanish';
      if (title.includes('(fr)') || title.includes('[french]') || title.includes('français')) return 'french';
      if (title.includes('(de)') || title.includes('[german]') || title.includes('deutsch')) return 'german';
      if (title.includes('(it)') || title.includes('[italian]') || title.includes('italiano')) return 'italian';
      if (title.includes('(ko)') || title.includes('[korean]') || title.includes('한국어')) return 'korean';
      if (title.includes('(jp)') || title.includes('[japanese]') || title.includes('日本語')) return 'japanese';
      if (title.includes('(zh)') || title.includes('[chinese]') || title.includes('中文')) return 'chinese';
      
      return ''; // Default to empty when we can't detect
    }
    
    // Detect if audio is commercial
    function isCommercialAudio(item) {
      const music = item.musicMeta || item.music || {};
      
      // Check if it's a commercially released track vs user generated
      return !music.isOriginal && 
             music.album && 
             music.musicAuthor && 
             music.musicAuthor !== item.authorMeta?.name;
    }
    
    // Detect vocals in audio
    function detectVocals(item) {
      const music = item.musicMeta || item.music || {};
      
      // Simple heuristic based on category and title
      if (determineSoundCategory(item) === 'voiceover') return true;
      if (determineSoundCategory(item) === 'soundEffect') return false;
      
      const title = (music.musicName || music.title || '').toLowerCase();
      if (title.includes('instrumental') || title.includes('no vocals')) return false;
      if (title.includes('vocal') || title.includes('lyrics') || title.includes('acapella')) return true;
      
      // Assume commercial music generally has vocals
      return isCommercialAudio(item);
    }
    
    // Detect beat in audio
    function detectBeat(item) {
      const category = determineSoundCategory(item);
      
      // Most music has beats, sound effects might not
      return category === 'music' || 
             category === 'remix' || 
             category === 'viral';
    }
    
    // Detect if audio is speech
    function detectSpeech(item) {
      const category = determineSoundCategory(item);
      return category === 'voiceover';
    }
    
    // Estimate intro length
    function estimateIntroLength(item) {
      const music = item.musicMeta || item.music || {};
      const duration = music.duration || 0;
      
      if (duration < 5) return 0;
      if (duration < 15) return 2;
      if (duration < 30) return 5;
      return 10;
    }
    
    // Detect drop in audio
    function detectDrop(item) {
      const music = item.musicMeta || item.music || {};
      const title = (music.musicName || music.title || '').toLowerCase();
      
      return title.includes('drop') || 
             title.includes('beat drop') ||
             title.includes('bass drop');
    }
    
    // Check if audio is designed to be looped
    function isLoopable(item) {
      const music = item.musicMeta || item.music || {};
      const title = (music.musicName || music.title || '').toLowerCase();
      
      return title.includes('loop') || 
             title.includes('seamless') ||
             title.includes('repeating') ||
             music.duration < 5;
    }
    
    // Detect trend cycle stage
    function detectTrendCycle(item) {
      const music = item.musicMeta || item.music || {};
      
      // Simple heuristic based on usage count
      if (!music.usageCount) return 'unknown';
      
      if (music.usageCount > 1000000) return 'mainstream';
      if (music.usageCount > 100000) return 'peaking';
      if (music.usageCount > 10000) return 'growing';
      return 'emerging';
    }
    
    // Detect origin app
    function detectOriginApp(item) {
      const music = item.musicMeta || item.music || {};
      const title = (music.musicName || music.title || '').toLowerCase();
      
      if (title.includes('tiktok')) return 'tiktok';
      if (title.includes('instagram')) return 'instagram';
      if (title.includes('youtube')) return 'youtube';
      if (title.includes('soundcloud')) return 'soundcloud';
      if (title.includes('spotify')) return 'spotify';
      
      return 'unknown';
    }
};

// Maximum number of retry attempts
const MAX_RETRY_COUNT = 3;

// Service for TikTok scraping
export const apifyService = {
  /**
   * Scrape trending TikTok videos with enhanced audio metadata
   */
  async scrapeTrending(options = {}): Promise<any[]> {
    console.log('Scraping trending TikTok videos with enhanced audio metadata...');
    
    const defaultOptions = {
      maxVideos: 50,
      includeAudioData: true,
      collectSoundMetrics: true,
      includeRelatedSounds: true,
    };
    
    const mergedOptions = { ...defaultOptions, ...options };
    
    try {
      const response = await axios.post(
        `https://api.apify.com/v2/actor-tasks/${TIKTOK_SCRAPER_ACTOR_ID}/run-sync-get-dataset-items`,
        {
          ...mergedOptions,
          outputAsJson: true,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${APIFY_API_TOKEN}`,
          }
        }
      );
      
      if (!response.data || !Array.isArray(response.data)) {
        console.error('Invalid response from Apify:', response.data);
        return [];
      }
      
      return response.data;
    } catch (error) {
      console.error('Error scraping trending videos:', error);
      return [];
    }
  },
  
  /**
   * Scrape TikTok videos by hashtag with enhanced audio metadata
   */
  async scrapeByHashtag(hashtag: string, limit = 20): Promise<any[]> {
    console.log(`Scraping TikTok videos for hashtag #${hashtag}...`);
    
    try {
      const response = await axios.post(
        `https://api.apify.com/v2/actor-tasks/${TIKTOK_SCRAPER_ACTOR_ID}/run-sync-get-dataset-items`,
        {
          hashtag,
          maxVideos: limit,
          includeAudioData: true,
          collectSoundMetrics: true,
          outputAsJson: true,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${APIFY_API_TOKEN}`,
          },
        }
      );
      
      if (!response.data || !Array.isArray(response.data)) {
        console.error('Invalid response from Apify:', response.data);
        return [];
      }
      
      return response.data;
    } catch (error) {
      console.error(`Error scraping videos for hashtag #${hashtag}:`, error);
      return [];
    }
  },
  
  /**
   * Scrape TikTok videos by category with enhanced audio metadata
   */
  async scrapeByCategory(category: string, limit = 20): Promise<any[]> {
    console.log(`Scraping TikTok videos for category ${category}...`);
    
    try {
      const response = await axios.post(
        `https://api.apify.com/v2/actor-tasks/${TIKTOK_SCRAPER_ACTOR_ID}/run-sync-get-dataset-items`,
        {
          category,
          maxVideos: limit,
          includeAudioData: true,
          collectSoundMetrics: true,
          outputAsJson: true,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${APIFY_API_TOKEN}`,
          },
        }
      );
      
      if (!response.data || !Array.isArray(response.data)) {
        console.error('Invalid response from Apify:', response.data);
        return [];
      }
      
      return response.data;
    } catch (error) {
      console.error(`Error scraping videos for category ${category}:`, error);
      return [];
    }
  },
  
  /**
   * Scrape TikTok videos by user with enhanced audio metadata
   */
  async scrapeByUser(username: string, limit = 20): Promise<any[]> {
    console.log(`Scraping TikTok videos for user @${username}...`);
    
    try {
      const response = await axios.post(
        `https://api.apify.com/v2/actor-tasks/${TIKTOK_SCRAPER_ACTOR_ID}/run-sync-get-dataset-items`,
        {
          username,
          maxVideos: limit,
          includeAudioData: true,
          collectSoundMetrics: true,
          outputAsJson: true,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${APIFY_API_TOKEN}`,
          },
        }
      );
      
      if (!response.data || !Array.isArray(response.data)) {
        console.error('Invalid response from Apify:', response.data);
        return [];
      }
      
      return response.data;
    } catch (error) {
      console.error(`Error scraping videos for user @${username}:`, error);
      return [];
    }
  },
  
  /**
   * NEW: Scrape trending sounds directly
   * This method focuses specifically on collecting sound data
   */
  async scrapeTrendingSounds(limit = 50): Promise<any[]> {
    console.log('Scraping trending TikTok sounds...');
    
    try {
      const response = await axios.post(
        `https://api.apify.com/v2/actor-tasks/${TIKTOK_SCRAPER_ACTOR_ID}/run-sync-get-dataset-items`,
        {
          maxSounds: limit,
          outputType: 'sounds',
          includeExtendedAudioData: true,
          includeUsageMetrics: true,
          soundCategorization: true,
          outputAsJson: true,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${APIFY_API_TOKEN}`,
          },
        }
      );
      
      if (!response.data || !Array.isArray(response.data)) {
        console.error('Invalid response from Apify:', response.data);
        return [];
      }
      
      return response.data;
    } catch (error) {
      console.error('Error scraping trending sounds:', error);
      return [];
    }
  },
  
  /**
   * NEW: Scrape videos by sound ID with enhanced metadata
   * This allows tracking how a specific sound is being used
   */
  async scrapeVideosBySound(soundId: string, limit = 30): Promise<any[]> {
    console.log(`Scraping TikTok videos using sound ${soundId}...`);
    
    try {
      const response = await axios.post(
        `https://api.apify.com/v2/actor-tasks/${TIKTOK_SCRAPER_ACTOR_ID}/run-sync-get-dataset-items`,
        {
          soundId,
          maxVideos: limit,
          includeAudioData: true,
          includeVideoEngagement: true,
          outputAsJson: true,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${APIFY_API_TOKEN}`,
          },
        }
      );
      
      if (!response.data || !Array.isArray(response.data)) {
        console.error('Invalid response from Apify:', response.data);
        return [];
      }
      
      return response.data;
    } catch (error) {
      console.error(`Error scraping videos for sound ${soundId}:`, error);
      return [];
    }
  },
  
  /**
   * NEW: Enhanced generic scraper with comprehensive sound data collection
   * This is the main method that implements the enhanced sound data collection
   */
  async scrapeWithEnhancedAudio(options = {}) {
    console.log('Performing enhanced TikTok scraping with comprehensive audio metadata...');
    
    const defaultOptions = {
      maxVideos: 100,
      // Enhanced audio collection options
      includeAudioData: true,
      collectSoundMetrics: true,
      includeSoundCategories: true,
      extractAudioFeatures: true,  // Extract tempo, mood, genre
      trackSoundLifecycle: true,   // Get historical data if available
      soundUsageCorrelation: true, // Analyze which sounds work with which content types
      includeArtistInfo: true,     // Get creator/artist information
      soundQualityAnalysis: true,  // Basic audio quality metrics
      includeRelatedSounds: true,  // Get similar/related sounds
      outputAsJson: true,
    };
    
    const mergedOptions = { ...defaultOptions, ...options };
    
    try {
      const response = await axios.post(
        `https://api.apify.com/v2/actor-tasks/${TIKTOK_SCRAPER_ACTOR_ID}/run-sync-get-dataset-items`,
        mergedOptions,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${APIFY_API_TOKEN}`,
          },
        }
      );
      
      if (!response.data || !Array.isArray(response.data)) {
        console.error('Invalid response from Apify:', response.data);
        return {
          videos: [],
          sounds: [],
          error: 'Invalid response format'
        };
      }
      
      // Process and separate videos and sounds
      const videos = response.data.filter(item => item.type === 'video');
      const sounds = response.data.filter(item => item.type === 'sound');
      
      return {
        videos,
        sounds,
        total: response.data.length
      };
    } catch (error) {
      console.error('Error performing enhanced scraping:', error);
      return {
        videos: [],
        sounds: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
  
  /**
   * Track video and sound performance over time
   */
  async trackPerformance(ids: string[], type: 'video' | 'sound') {
    console.log(`Tracking ${type} performance for ${ids.length} items...`);
    
    try {
      const response = await axios.post(
        `https://api.apify.com/v2/actor-tasks/${TIKTOK_SCRAPER_ACTOR_ID}/run-sync-get-dataset-items`,
        {
          trackIds: ids,
          trackType: type,
          includeHistoricalMetrics: true,
          outputAsJson: true,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${APIFY_API_TOKEN}`,
          },
        }
      );
      
      if (!response.data || !Array.isArray(response.data)) {
        console.error('Invalid response from Apify:', response.data);
        return [];
      }
      
      return response.data;
    } catch (error) {
      console.error(`Error tracking ${type} performance:`, error);
      return [];
    }
  },
  
  /**
   * Get the status of the Apify API
   * @returns The API status
   */
  async getApifyStatus() {
    try {
      const user = await client.user().get() as unknown as ApifyUserInfo;
      return {
        status: 'ok',
        subscription: user.subscription,
        availableMemory: user.availableMemory,
        availableCpu: user.availableCpu,
        rateLimitState: user.rateLimitState
      };
    } catch (error) {
      console.error('Error checking Apify status:', error);
      
      return {
        status: 'error',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}; 