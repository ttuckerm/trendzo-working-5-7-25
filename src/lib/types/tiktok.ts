/**
 * Type definitions for TikTok data structures used in the ETL process
 */

/**
 * Represents a TikTok video with all relevant metadata
 */
export interface TikTokVideo {
  id: string;
  desc: string;
  createTime: number;
  author: {
    id: string;
    uniqueId: string;
    nickname: string;
    avatarThumb: string;
    signature?: string;
    verified?: boolean;
  };
  music?: {
    id: string;
    title: string;
    authorName?: string;
    playUrl?: string;
    duration?: number;
    album?: string;
    coverLarge?: string;
    coverMedium?: string;
    coverThumb?: string;
    original?: boolean;
    isRemix?: boolean;
    usageCount?: number;
    creationDate?: number;
    genre?: string;
    lyric?: string;
    tempo?: 'slow' | 'medium' | 'fast';
    language?: string;
    soundCategory?: 'music' | 'voiceover' | 'soundEffect' | 'remix' | 'original' | 'ambient' | 'viral' | 'mixed';
    commercialAudio?: boolean;
    // Enhanced audio features
    audioFeatures?: {
      hasVocals?: boolean;
      hasBeat?: boolean;
      isSpeech?: boolean;
      bpm?: number;
      key?: string;
      energy?: number;
      danceability?: number;
    };
    // Structural metadata
    structuralInfo?: {
      introLength?: number;
      hasDrop?: boolean;
      loopable?: boolean;
      sections?: {
        type: string;
        start: number;
        end: number;
        features?: string[];
      }[];
    };
    // Social context
    socialContext?: {
      trendCycle?: 'emerging' | 'growing' | 'peaking' | 'mainstream' | 'declining' | 'unknown';
      originApp?: 'tiktok' | 'instagram' | 'youtube' | 'spotify' | 'soundcloud' | 'unknown';
      isViral?: boolean;
      initiallyDetectedIn?: string;
      useContext?: string[];
    };
  };
  stats: {
    diggCount: number;
    shareCount: number;
    commentCount: number;
    playCount: number;
  };
  video: {
    id: string;
    duration: number;
    ratio: string;
    cover?: string;
    dynamicCover?: string; 
    playAddr?: string;
    downloadAddr?: string;
    height?: number;
    width?: number;
  };
  hashtags?: Array<{
    id: string;
    name: string;
    title: string;
  }>;
  challenges?: string[];
  trends?: string[];
  effectIds?: string[];
}

/**
 * Position data for text overlay on a template
 */
export interface TextPosition {
  x: number;
  y: number;
  width?: number; 
  height?: number;
  alignment?: 'left' | 'center' | 'right';
}

/**
 * Style information for text overlay
 */
export interface TextStyle {
  fontSize: number;
  fontFamily?: string;
  fontWeight?: string | number;
  color: string;
  backgroundColor?: string;
  opacity?: number;
  shadow?: boolean;
  outline?: boolean;
  animation?: string;
}

/**
 * Represents a text overlay in a template section
 */
export interface TextOverlay {
  id: string;
  text: string;
  position: TextPosition;
  style: TextStyle;
  duration?: number;
  startTime?: number;
}

/**
 * Represents a section of a template (intro, content, outro)
 */
export interface TemplateSection {
  id: string;
  type: 'intro' | 'content' | 'outro';
  duration: number;
  startTime: number;
  endTime: number;
  textOverlays: TextOverlay[];
  transitions?: string[];
  effects?: string[];
}

/**
 * Represents a template created from a TikTok video
 */
export interface Template {
  id: string;
  title: string;
  description: string;
  sourceVideoId: string;
  sourceAuthor: {
    id: string;
    username: string;
  };
  duration: number;
  thumbnailUrl?: string;
  sections: TemplateSection[];
  category: string;
  tags: string[];
  stats: {
    views: number;
    uses: number;
    likes: number;
    shares: number;
    createdAt: number;
    updatedAt: number;
  };
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  trendscore?: number;
}

/**
 * Options for the ETL process
 */
export interface ETLOptions {
  maxItems?: number;
  categories?: string[];
  minEngagement?: number;
  skipExisting?: boolean;
  forceUpdate?: boolean;
}

/**
 * Represents a sound/track from TikTok
 */
export interface TikTokSound {
  id: string;
  title: string;
  authorName: string;
  playUrl?: string;
  duration: number;
  album?: string;
  coverLarge?: string;
  coverMedium?: string;
  coverThumb?: string;
  original: boolean;
  isRemix: boolean;
  usageCount: number;
  creationDate: number;
  genre?: string;
  lyric?: string;
  stats: {
    usageCount: number;
    usageChange7d: number;
    usageChange14d: number;
    usageChange30d: number;
    likeCount?: number;
    commentCount?: number;
    shareCount?: number;
    growthVelocity7d?: number;
    growthVelocity14d?: number;
    growthVelocity30d?: number;
    trend?: 'rising' | 'stable' | 'falling';
    peakUsage?: number;
    peakDate?: string;
  };
  relatedTemplates?: string[];
  categories?: string[];
  soundCategory?: 'music' | 'voiceover' | 'soundEffect' | 'remix' | 'original' | 'ambient' | 'viral' | 'mixed';
  mood?: string[];
  tempo?: 'slow' | 'medium' | 'fast';
  language?: string;
  viralityScore?: number;
  templateCorrelations?: {
    templateId: string;
    correlationScore: number;
    engagementLift?: number;
  }[];
  classification?: {
    genre?: string[];
    style?: string[];
    instruments?: string[];
    vocals?: boolean;
    commercial?: boolean;
    explicit?: boolean;
  };
  expertAnnotations?: {
    qualityRating?: number;
    trendPotential?: number;
    targetDemographic?: string[];
    notes?: string;
    recommendedTemplates?: string[];
    annotatedBy?: string;
    annotatedAt?: number;
    contentStrategy?: string;
    usageRecommendations?: string;
  };
  lifecycle?: {
    stage: 'emerging' | 'growing' | 'peaking' | 'declining' | 'stable';
    estimatedPeakDate?: string;
    estimatedDeclineDate?: string;
    discoveryDate: string;
    lastDetectedDate: string;
  };
  // Enhanced audio features
  audioFeatures?: {
    hasVocals?: boolean;
    hasBeat?: boolean;
    isSpeech?: boolean;
    bpm?: number;
    key?: string;
    energy?: number;
    danceability?: number;
  };
  // Structural metadata
  structuralInfo?: {
    introLength?: number;
    hasDrop?: boolean;
    loopable?: boolean;
    sections?: {
      type: string;
      start: number;
      end: number;
      features?: string[];
    }[];
  };
  // Social context
  socialContext?: {
    trendCycle?: 'emerging' | 'growing' | 'peaking' | 'mainstream' | 'declining' | 'unknown';
    originApp?: 'tiktok' | 'instagram' | 'youtube' | 'spotify' | 'soundcloud' | 'unknown';
    isViral?: boolean;
    initiallyDetectedIn?: string; // Template ID where first detected
    useContext?: string[];
  };
  // Bidirectional relationships
  templateUsage?: {
    templateId: string;
    useCount: number;
    averageEngagement: number;
    lastUsed: string;
  }[];
  // Extraction and processing metadata
  metadata?: {
    extractedFrom?: string;
    extractionPriority?: 'high' | 'medium' | 'low';
    extractionReason?: string;
    processingTimestamp?: string;
    lastUpdated?: string;
    updateCount?: number;
    lastValidated?: string;
    validationStatus?: string;
    processingVersion?: string;
  };
  commercialAudio?: boolean;
  usageHistory?: Record<string, number>;
  createdAt?: any;
  updatedAt?: any;
}

/**
 * Sound trend report data structure
 */
export interface SoundTrendReport {
  id: string;
  date: string;
  topSounds: {
    daily: string[];
    weekly: string[];
    monthly: string[];
  };
  emergingSounds: string[];
  peakingSounds: string[];
  decliningTrends: string[];
  genreDistribution: Record<string, number>;
  createdAt: any;
} 