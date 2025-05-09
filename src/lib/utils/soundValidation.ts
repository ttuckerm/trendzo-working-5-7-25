import { TikTokSound } from '@/lib/types/tiktok';

/**
 * Validation result interface
 */
export interface SoundValidationResult {
  valid: boolean;
  issues?: string[];
  suggestions?: Partial<TikTokSound>;
  reason?: string;
}

/**
 * Validate TikTok sound data
 * @param sound The sound data to validate
 * @returns Validation result with status, issues, and enhancement suggestions
 */
export function validateSoundData(sound: TikTokSound): SoundValidationResult {
  const issues: string[] = [];
  const suggestions: Partial<TikTokSound> = {};
  
  // Essential fields validation
  if (!sound.id) {
    issues.push('Missing required field: id');
  }
  
  if (!sound.title) {
    issues.push('Missing required field: title');
  } else if (sound.title.length < 2) {
    issues.push('Title is too short (minimum 2 characters)');
  } else if (sound.title.length > 200) {
    issues.push('Title is too long (maximum 200 characters)');
  }
  
  if (!sound.authorName) {
    issues.push('Missing required field: authorName');
    suggestions.authorName = 'Unknown Artist';
  }
  
  // Check for suspicious data that might indicate scraping errors
  if (sound.title?.includes('[object Object]') || 
      sound.title?.includes('undefined') ||
      sound.authorName?.includes('[object Object]') ||
      sound.authorName?.includes('undefined')) {
    issues.push('Contains suspicious values (potential serialization errors)');
  }
  
  // Media URL validation
  if (!sound.playUrl && !sound.coverThumb && !sound.coverMedium && !sound.coverLarge) {
    issues.push('No media URLs provided (playUrl or cover images)');
  }
  
  // Duration validation
  if (sound.duration <= 0) {
    issues.push('Invalid duration (must be greater than 0)');
  } else if (sound.duration > 600) {
    issues.push('Duration exceeds maximum (600 seconds)');
  }
  
  // Usage count validation
  if (sound.usageCount < 0) {
    issues.push('Invalid usage count (must be non-negative)');
    suggestions.usageCount = 0;
  } else if (sound.usageCount > 1000000000) {
    issues.push('Usage count exceeds reasonable maximum');
  }
  
  // Genre validation and suggestion
  if (!sound.genre && sound.title) {
    // Simple genre detection based on keywords
    const title = sound.title.toLowerCase();
    const genreKeywords: Record<string, string[]> = {
      'pop': ['pop', 'hit', 'chart', 'radio'],
      'hip hop': ['hip hop', 'rap', 'trap', 'beat'],
      'electronic': ['electronic', 'edm', 'house', 'techno', 'dubstep', 'dj'],
      'rock': ['rock', 'guitar', 'band', 'metal'],
      'rnb': ['rnb', 'r&b', 'soul'],
      'country': ['country', 'western', 'folk'],
      'classical': ['classical', 'orchestra', 'symphony'],
      'jazz': ['jazz', 'blues', 'swing']
    };
    
    for (const [genre, keywords] of Object.entries(genreKeywords)) {
      if (keywords.some(keyword => title.includes(keyword))) {
        suggestions.genre = genre;
        break;
      }
    }
  }
  
  // Category classification and suggestion
  if (!sound.soundCategory) {
    // Try to determine category
    if (sound.original) {
      suggestions.soundCategory = 'original';
    } else if (sound.isRemix) {
      suggestions.soundCategory = 'remix';
    } else if (sound.duration && sound.duration < 5) {
      suggestions.soundCategory = 'soundEffect';
    } else {
      suggestions.soundCategory = 'music';
    }
  }
  
  // Initialize missing metadata collections
  if (!sound.categories) {
    suggestions.categories = [];
  }
  
  if (!sound.relatedTemplates) {
    suggestions.relatedTemplates = [];
  }
  
  if (!sound.stats) {
    suggestions.stats = {
      usageCount: sound.usageCount || 0,
      usageChange7d: 0,
      usageChange14d: 0,
      usageChange30d: 0
    };
  }
  
  // Add missing lifecycle info
  if (!sound.lifecycle) {
    const today = new Date().toISOString().split('T')[0];
    suggestions.lifecycle = {
      stage: 'emerging',
      discoveryDate: today,
      lastDetectedDate: today
    };
  }
  
  // Add metadata tracking if missing
  if (!sound.metadata) {
    suggestions.metadata = {
      processingTimestamp: new Date().toISOString(),
      extractionPriority: 'medium',
      extractionReason: 'Manual validation',
      processingVersion: '1.0'
    };
  }
  
  // Initialize usage history if missing
  if (!sound.usageHistory) {
    const today = new Date().toISOString().split('T')[0];
    suggestions.usageHistory = {
      [today]: sound.usageCount || 0
    };
  }
  
  return {
    valid: issues.length === 0,
    issues: issues.length > 0 ? issues : undefined,
    suggestions: Object.keys(suggestions).length > 0 ? suggestions : undefined
  };
}

/**
 * Enhance sound data with additional metadata
 * @param sound The sound data to enhance
 * @returns Enhanced sound data
 */
export function enhanceSoundData(sound: TikTokSound): TikTokSound {
  const validation = validateSoundData(sound);
  
  if (validation.suggestions) {
    return {
      ...sound,
      ...validation.suggestions
    };
  }
  
  return sound;
} 