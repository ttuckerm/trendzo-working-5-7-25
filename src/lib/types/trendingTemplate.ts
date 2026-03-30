/**
 * Types for trending templates and template discovery
 */

/**
 * Represents a trending or discoverable template
 */
export interface TrendingTemplate {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl?: string;
  category: string;
  tags: string[];
  authorName: string;
  authorId?: string;
  authorVerified?: boolean;
  authorAvatar?: string;
  stats: {
    views: number;
    likes: number;
    usageCount: number;
    commentCount?: number;
    shareCount?: number;
  };
  createdAt: string;
  updatedAt?: string;
  isPremium?: boolean;
  price?: number;
  discountedPrice?: number;
  isVerified?: boolean;
  ranking?: number;
  trendingScore?: number;
  metadata?: Record<string, any>;
  trendData?: {
    dailyViews?: Record<string, number>;
    growthRate?: number;
    velocityScore?: number;
    dailyGrowth?: number;
    weeklyGrowth?: number;
    similarTemplates?: string[];
    confidenceScore?: number;
    daysUntilPeak?: number;
    growthTrajectory?: 'exponential' | 'linear' | 'plateauing' | 'volatile';
  };
  expertInsights?: {
    tags: ExpertInsightTag[];
    notes?: string;
    recommendedUses?: string[];
    performanceRating?: number;
    audienceRecommendation?: string[];
  };
  manualAdjustments?: ManualAdjustmentLog[];
}

/**
 * Category for templates
 */
export interface TemplateCategory {
  id: string;
  name: string;
  description?: string;
  iconUrl?: string;
  color?: string;
  count?: number;
}

/**
 * Filter options for template browsing
 */
export interface TemplateFilterOptions {
  categories?: string[];
  sortBy?: 'popular' | 'recent' | 'trending' | 'recommended';
  isPremiumOnly?: boolean;
  isFreeOnly?: boolean;
  tags?: string[];
  searchQuery?: string;
  authorId?: string;
}

/**
 * Response from template browsing API
 */
export interface TemplateBrowseResponse {
  templates: TrendingTemplate[];
  totalCount: number;
  pageCount: number;
  currentPage: number;
  hasMore: boolean;
  categories?: TemplateCategory[];
  featuredTemplates?: TrendingTemplate[];
}

/**
 * TikTok video data structure
 */
export interface TikTokVideo {
  id: string;
  text: string;
  createTime: number;
  authorMeta: {
    id: string;
    name: string;
    nickname: string;
    verified: boolean;
  };
  musicMeta?: {
    musicId: string;
    musicName: string;
    musicAuthor: string;
    musicUrl?: string;
    duration?: number;
    isOriginal?: boolean;
    usageCount?: number;
  };
  videoMeta: {
    height: number;
    width: number;
    duration: number;
  };
  hashtags: string[];
  stats: {
    commentCount: number;
    diggCount: number; // Likes
    playCount: number; // Views
    shareCount: number;
  };
  videoUrl: string;
  webVideoUrl: string;
}

/**
 * Represents a section of a template
 */
export interface TemplateSection {
  id: string;
  type: string;
  startTime: number;
  duration: number;
  textOverlays?: TemplateTextOverlay[];
}

/**
 * Text overlay in a template
 */
export interface TemplateTextOverlay {
  id: string;
  text: string;
  position: string;
  startTime: number;
  duration: number;
  style?: {
    fontSize?: string;
    color?: string;
    fontFamily?: string;
    background?: string;
    animation?: string;
  };
}

/**
 * Generic text overlay structure
 */
export interface TextOverlay {
  id: string;
  text: string;
  position: {
    x: number; // percentage from left
    y: number; // percentage from top
  };
  style: {
    fontSize: number;
    fontWeight: string;
    color: string;
    backgroundColor?: string;
    opacity?: number;
  };
}

/**
 * Detailed template analysis
 */
export interface TemplateAnalysis {
  templateId: string;
  videoId: string;
  estimatedSections: TemplateSection[];
  detectedElements: {
    hasCaption: boolean;
    hasCTA: boolean;
    hasProductDisplay: boolean;
    hasTextOverlay: boolean;
    hasVoiceover: boolean;
    hasBgMusic: boolean;
  };
  effectiveness: {
    engagementRate: number;
    conversionRate?: number;
    averageViewDuration?: number;
  };
  engagementInsights: string[];
  similarityPatterns: string;
}

/**
 * Expert insight tag for templates
 */
export interface ExpertInsightTag {
  id: string;
  tag: string;
  category: 'content' | 'engagement' | 'trend' | 'demographic' | 'other';
  addedBy: string;
  addedAt: string;
  confidence: number; // 0-1 scale
}

/**
 * Log of manual adjustments to template data
 */
export interface ManualAdjustmentLog {
  id: string;
  field: string;
  previousValue: any;
  newValue: any;
  reason: string;
  adjustedBy: string;
  adjustedAt: string;
  expertConfidence?: number; // Expert's confidence in their adjustment
  dataSource?: string; // Source of expert's insight (manual, analysis, etc.)
  impactScore?: number; // Score indicating how much this improved prediction accuracy
  adjustmentCategory: 'growth' | 'engagement' | 'audience' | 'content' | 'other';
  supportingData?: string; // Additional data or evidence supporting the adjustment
  impactAssessment?: string; // Expected impact of this adjustment
  validityPeriod?: { // Time period for which this adjustment is valid
    start: string;
    end: string;
  };
  verificationStatus: 'pending' | 'verified' | 'rejected';
  lastVerifiedAt: string | null;
  verificationHistory: Array<{
    timestamp: string;
    status: 'verified' | 'rejected';
    verifiedBy: string;
    notes?: string;
  }>;
}

/**
 * Detailed template information including analysis data
 */
export interface TemplateDetail {
  id: string;
  sourceVideoId: string;
  category: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  createdAt: string;
  updatedAt: string;
  authorInfo: {
    id: string;
    username: string;
    isVerified: boolean;
  };
  stats: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
    engagementRate: number;
  };
  metadata: {
    duration: number;
    hashtags: string[];
    aiDetectedCategory?: string;
  };
  templateStructure: TemplateSection[];
  analysisData?: TemplateAnalysis;
  trendData: {
    dailyViews: Record<string, number>;
    growthRate: number;
    velocityScore?: number;
    dailyGrowth?: number;
    weeklyGrowth?: number;
    similarTemplates?: string[];
  };
  expertInsights?: {
    tags: ExpertInsightTag[];
    notes: string;
    recommendedUses: string[];
    performanceRating: number; // 1-5 scale
    audienceRecommendation: string[];
  };
  manualAdjustments?: ManualAdjustmentLog[];
  auditTrail?: {
    createdBy: string;
    lastModifiedBy: string;
    modificationHistory: {
      timestamp: string;
      user: string;
      action: string;
      details: string;
    }[];
  };
  isActive: boolean;
}

/**
 * Types for trending templates and predictions
 */

export interface Template {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  category?: string;
  authorName?: string;
  stats?: {
    views?: number;
    likes?: number;
    usageCount?: number;
    commentCount?: number;
    shareCount?: number;
  };
}

export interface VelocityPattern {
  pattern: string;
  confidence?: number;
  timeWindow?: string;
}

export interface TrendPrediction {
  templateId: string;
  template: Template;
  contentCategory: string;
  confidenceScore: number;
  growthTrajectory: 'exponential' | 'linear' | 'plateauing' | 'volatile';
  daysUntilPeak: number;
  targetAudience: string[];
  velocityPatterns: VelocityPattern;
  predictedAt: string;
  expertAdjusted: boolean;
  expertAdjustments?: ManualAdjustmentLog[];
  expertInsights?: ExpertInsightTag[];
}

/**
 * Response from trend prediction API
 */
export interface TrendPredictionResponse {
  predictions: TrendPrediction[];
  timeWindow: string;
  totalCount: number;
  hasMoreResults?: boolean;
  isDemo?: boolean; // Indicates if this is demo data for non-premium users
}

/**
 * Notification for new predicted trends
 */
export interface TrendPredictionNotification {
  id: string;
  templateId: string;
  templateTitle: string;
  confidenceScore: number;
  predictedAt: string;
  isRead: boolean;
  category: string;
  thumbnailUrl?: string;
  expertVerified?: boolean; // Indicates if an expert has verified this prediction
} 