/**
 * Type adapters for converting between different data formats
 */

import { TikTokVideo as NewTikTokVideo, TikTokSound } from '@/lib/types/tiktok';
import { TikTokVideo as LegacyTikTokVideo, TemplateSection } from '@/lib/types/trendingTemplate';

/**
 * Convert from legacy TikTokVideo format to new format
 */
export function convertToNewTikTokFormat(legacyVideo: LegacyTikTokVideo): NewTikTokVideo {
  return {
    id: legacyVideo.id,
    desc: legacyVideo.text,
    createTime: legacyVideo.createTime,
    author: {
      id: legacyVideo.authorMeta.id,
      uniqueId: legacyVideo.authorMeta.nickname,
      nickname: legacyVideo.authorMeta.name,
      avatarThumb: '',
      verified: legacyVideo.authorMeta.verified
    },
    music: legacyVideo.musicMeta ? {
      id: legacyVideo.musicMeta.musicId || '',
      title: legacyVideo.musicMeta.musicName || '',
      authorName: legacyVideo.musicMeta.musicAuthor || '',
      playUrl: legacyVideo.musicMeta.musicUrl || '',
      duration: legacyVideo.musicMeta.duration || 0,
      original: legacyVideo.musicMeta.isOriginal || false,
      usageCount: legacyVideo.musicMeta.usageCount || 0
    } : undefined,
    stats: {
      diggCount: legacyVideo.stats.diggCount,
      shareCount: legacyVideo.stats.shareCount,
      commentCount: legacyVideo.stats.commentCount,
      playCount: legacyVideo.stats.playCount
    },
    video: {
      id: legacyVideo.id,
      duration: legacyVideo.videoMeta.duration,
      ratio: '16:9',
      cover: '',
      playAddr: legacyVideo.videoUrl,
      downloadAddr: '',
      height: legacyVideo.videoMeta.height,
      width: legacyVideo.videoMeta.width
    },
    hashtags: Array.isArray(legacyVideo.hashtags) 
      ? legacyVideo.hashtags.map(tag => ({
          id: '',
          name: typeof tag === 'string' ? tag : '',
          title: typeof tag === 'string' ? tag : ''
        }))
      : []
  };
}

/**
 * Convert from new TikTokVideo format to legacy format
 */
export function convertToLegacyTikTokFormat(newVideo: NewTikTokVideo): LegacyTikTokVideo {
  return {
    id: newVideo.id,
    text: newVideo.desc,
    createTime: newVideo.createTime,
    authorMeta: {
      id: newVideo.author.id,
      name: newVideo.author.nickname,
      nickname: newVideo.author.uniqueId,
      verified: newVideo.author.verified || false
    },
    musicMeta: newVideo.music ? {
      musicId: newVideo.music.id,
      musicName: newVideo.music.title,
      musicAuthor: newVideo.music.authorName || '',
      musicUrl: newVideo.music.playUrl || '',
      duration: newVideo.music.duration || 0,
      isOriginal: newVideo.music.original || false,
      usageCount: newVideo.music.usageCount || 0
    } : undefined,
    videoMeta: {
      height: newVideo.video.height || 0,
      width: newVideo.video.width || 0,
      duration: newVideo.video.duration
    },
    hashtags: newVideo.hashtags?.map(tag => tag.name) || [],
    stats: {
      diggCount: newVideo.stats.diggCount,
      shareCount: newVideo.stats.shareCount,
      commentCount: newVideo.stats.commentCount,
      playCount: newVideo.stats.playCount
    },
    videoUrl: newVideo.video.playAddr || '',
    webVideoUrl: ''
  };
}

/**
 * Convert raw Apify data to our legacy TikTokVideo format
 * This is a more robust converter that handles various input formats
 */
export function convertRawToLegacyFormat(rawData: any): LegacyTikTokVideo {
  return {
    id: rawData.id || '',
    text: rawData.text || rawData.desc || '',
    createTime: rawData.createTime || Date.now(),
    authorMeta: {
      id: rawData.authorMeta?.id || rawData.author?.id || '',
      name: rawData.authorMeta?.name || rawData.author?.nickname || '',
      nickname: rawData.authorMeta?.nickname || rawData.author?.uniqueId || '',
      verified: rawData.authorMeta?.verified || rawData.author?.verified || false
    },
    musicMeta: rawData.musicMeta || rawData.music ? {
      musicId: rawData.musicMeta?.musicId || rawData.music?.id || '',
      musicName: rawData.musicMeta?.musicName || rawData.music?.title || '',
      musicAuthor: rawData.musicMeta?.musicAuthor || rawData.music?.authorName || '',
      musicUrl: rawData.musicMeta?.musicUrl || rawData.music?.playUrl || '',
      duration: rawData.musicMeta?.duration || rawData.music?.duration || 0,
      isOriginal: rawData.musicMeta?.isOriginal || rawData.music?.original || false,
      usageCount: rawData.musicMeta?.usageCount || rawData.music?.usageCount || 0
    } : undefined,
    videoMeta: {
      height: rawData.videoMeta?.height || rawData.video?.height || 0,
      width: rawData.videoMeta?.width || rawData.video?.width || 0,
      duration: rawData.videoMeta?.duration || rawData.video?.duration || 0
    },
    hashtags: Array.isArray(rawData.hashtags) 
      ? rawData.hashtags.map((tag: any) => typeof tag === 'string' ? tag : tag.name || '')
      : [],
    stats: {
      diggCount: rawData.stats?.diggCount || 0,
      shareCount: rawData.stats?.shareCount || 0,
      commentCount: rawData.stats?.commentCount || 0,
      playCount: rawData.stats?.playCount || 0
    },
    videoUrl: rawData.videoUrl || rawData.video?.playAddr || '',
    webVideoUrl: rawData.webVideoUrl || ''
  };
}

/**
 * Convert raw Apify data to our new TikTokVideo format
 */
export function convertRawToNewFormat(rawData: any): NewTikTokVideo {
  return {
    id: rawData.id || '',
    desc: rawData.text || rawData.desc || '',
    createTime: rawData.createTime || Date.now(),
    author: {
      id: rawData.authorMeta?.id || rawData.author?.id || '',
      uniqueId: rawData.authorMeta?.nickname || rawData.author?.uniqueId || '',
      nickname: rawData.authorMeta?.name || rawData.author?.nickname || '',
      avatarThumb: rawData.authorMeta?.avatar || rawData.author?.avatarThumb || '',
      verified: rawData.authorMeta?.verified || rawData.author?.verified || false
    },
    music: rawData.musicMeta || rawData.music ? {
      id: rawData.musicMeta?.musicId || rawData.music?.id || '',
      title: rawData.musicMeta?.musicName || rawData.music?.title || '',
      authorName: rawData.musicMeta?.musicAuthor || rawData.music?.authorName || '',
      playUrl: rawData.musicMeta?.musicUrl || rawData.music?.playUrl || '',
      duration: rawData.musicMeta?.duration || rawData.music?.duration || 0,
      album: rawData.musicMeta?.album || rawData.music?.album || '',
      coverLarge: rawData.musicMeta?.coverLarge || rawData.music?.coverLarge || '',
      coverMedium: rawData.musicMeta?.coverMedium || rawData.music?.coverMedium || '',
      coverThumb: rawData.musicMeta?.coverThumb || rawData.music?.coverThumb || '',
      original: rawData.musicMeta?.isOriginal || rawData.music?.original || false,
      isRemix: rawData.musicMeta?.isRemix || rawData.music?.isRemix || false,
      usageCount: rawData.musicMeta?.usageCount || rawData.music?.usageCount || 0,
      creationDate: rawData.musicMeta?.creationDate || rawData.music?.creationDate || 0,
      genre: rawData.musicMeta?.genre || rawData.music?.genre || '',
      lyric: rawData.musicMeta?.lyric || rawData.music?.lyric || ''
    } : undefined,
    stats: {
      diggCount: rawData.stats?.diggCount || 0,
      shareCount: rawData.stats?.shareCount || 0,
      commentCount: rawData.stats?.commentCount || 0,
      playCount: rawData.stats?.playCount || 0
    },
    video: {
      id: rawData.id || '',
      duration: rawData.videoMeta?.duration || rawData.video?.duration || 0,
      ratio: rawData.videoMeta?.ratio || rawData.video?.ratio || '16:9',
      cover: rawData.covers?.default || rawData.video?.cover || '',
      playAddr: rawData.videoUrl || rawData.video?.playAddr || '',
      downloadAddr: rawData.downloadUrl || rawData.video?.downloadAddr || '',
      height: rawData.videoMeta?.height || rawData.video?.height || 0,
      width: rawData.videoMeta?.width || rawData.video?.width || 0
    },
    hashtags: Array.isArray(rawData.hashtags) 
      ? rawData.hashtags.map((tag: any) => ({
          id: tag.id || '',
          name: typeof tag === 'string' ? tag : tag.name || '',
          title: typeof tag === 'string' ? tag : tag.title || tag.name || ''
        }))
      : []
  };
}

/**
 * Extract sound/music data from TikTok video
 */
export function extractSoundData(video: NewTikTokVideo): TikTokSound | null {
  if (!video.music || !video.music.id) {
    return null;
  }

  // Get current date in YYYY-MM-DD format for usage history
  const today = new Date().toISOString().split('T')[0];

  // Get nested properties safely by creating placeholder objects for type safety
  const audioFeatures = {
    hasVocals: false,
    hasBeat: true,
    isSpeech: false
  };

  const structuralInfo = {
    introLength: 0,
    hasDrop: false,
    loopable: false
  };
  
  const socialContext = {
    trendCycle: 'emerging' as const,
    originApp: 'tiktok' as const,
    isViral: false,
    initiallyDetectedIn: video.id
  };

  return {
    id: video.music.id,
    title: video.music.title,
    authorName: video.music.authorName || 'Unknown Artist',
    playUrl: video.music.playUrl,
    duration: video.music.duration || 0,
    album: video.music.album,
    coverLarge: video.music.coverLarge,
    coverMedium: video.music.coverMedium,
    coverThumb: video.music.coverThumb,
    original: video.music.original || false,
    isRemix: video.music.isRemix || false,
    usageCount: video.music.usageCount || 1, // Default to 1 if we found it in at least this video
    creationDate: video.music.creationDate || video.createTime,
    genre: video.music.genre,
    lyric: video.music.lyric,
    stats: {
      usageCount: video.music.usageCount || 1,
      usageChange7d: 0,
      usageChange14d: 0,
      usageChange30d: 0,
      // Enhanced growth metrics
      growthVelocity7d: 0,
      growthVelocity14d: 0,
      growthVelocity30d: 0,
      trend: 'stable' // Default to stable until we have historical data
    },
    // Enhanced metadata
    relatedTemplates: [],
    categories: [],
    soundCategory: (video.music as any).soundCategory || determineSoundCategory(video.music),
    tempo: (video.music as any).tempo || determineTempo(video.music),
    language: video.music.language,
    
    // Initialize lifecycle information
    lifecycle: {
      stage: 'emerging', // Default to emerging for new sounds
      discoveryDate: today,
      lastDetectedDate: today
    },
    
    // Initialize usage history
    usageHistory: {
      [today]: video.music.usageCount || 1
    },
    
    // Enhanced audio features - use safe defaults
    audioFeatures: (video.music as any).audioFeatures || audioFeatures,
    
    // Structural metadata - use safe defaults
    structuralInfo: (video.music as any).structuralInfo || structuralInfo,
    
    // Social context - use safe defaults
    socialContext: (video.music as any).socialContext || socialContext,
    
    // Initialize bidirectional template usage
    templateUsage: [{
      templateId: video.id, // The video ID is used as a proxy for template ID initially
      useCount: 1,
      averageEngagement: (video.stats.diggCount + video.stats.shareCount + video.stats.commentCount) / 3,
      lastUsed: today
    }],
    
    commercialAudio: (video.music as any).commercialAudio || false
  };
}

/**
 * Determine the sound category if not provided
 */
function determineSoundCategory(music: any): 'music' | 'voiceover' | 'soundEffect' | 'remix' | 'original' | 'mixed' {
  if (music.original) {
    return 'original';
  }
  
  if (music.isRemix) {
    return 'remix';
  }
  
  // Try to determine if it's a sound effect
  if (music.title && (
      music.title.toLowerCase().includes('sound effect') ||
      music.title.toLowerCase().includes('sfx') ||
      music.duration < 5
    )) {
    return 'soundEffect';
  }
  
  // Try to determine if it's a voiceover
  if (!music.authorName && !music.album && music.original) {
    return 'voiceover';
  }
  
  // Default to music
  return 'music';
}

/**
 * Determine tempo based on video duration or music properties
 */
function determineTempo(music: any): 'slow' | 'medium' | 'fast' {
  // If we have BPM information someday, we could use that
  // For now, make an educated guess based on duration
  if (music.duration) {
    if (music.duration < 15) {
      return 'fast';
    } else if (music.duration > 45) {
      return 'slow';
    }
  }
  
  // Default to medium
  return 'medium';
} 