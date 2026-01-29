/**
 * Types for Newsletter Integration functionality
 */

/**
 * Represents a template link for newsletter
 */
export interface NewsletterTemplateLink {
  id: string;
  templateId: string;
  title: string;
  description?: string;
  createdAt: string;
  expiresAt?: string;
  createdBy: string;
  token: string;
  shortCode: string;
  fullUrl: string;
  clicks: number;
  conversions: number;
  lastClicked?: string;
  
  // Tracking and context
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  
  // Additional context data to pass to the editor
  editorContext?: Record<string, any>;
  
  // Whether the link has been used in a newsletter
  usedInNewsletter: boolean;
  newsletterId?: string;
  newsletterIssue?: string;
  
  // Expert attribution
  expertCreated: boolean;
  expertId?: string;
  expertNote?: string;

  // Sound integration - New fields
  includedSoundId?: string;
  soundRecommendations?: string[];
}

/**
 * Parameters for creating a new newsletter template link
 */
export interface CreateNewsletterLinkParams {
  templateId: string;
  title: string;
  description?: string;
  expiresAt?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  editorContext?: Record<string, any>;
  expertCreated?: boolean;
  expertId?: string;
  expertNote?: string;
  includedSoundId?: string;
  soundRecommendations?: string[];
}

/**
 * Newsletter click event for analytics
 */
export interface NewsletterClickEvent {
  id: string;
  linkId: string;
  userId?: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
  converted: boolean;
  conversionType?: 'view' | 'edit' | 'save' | 'publish';
  conversionTimestamp?: string;
  sessionDuration?: number;
  soundSelected?: string;
  soundClicked?: boolean;
}

/**
 * Newsletter analytics summary
 */
export interface NewsletterAnalytics {
  linkId: string;
  templateId: string;
  totalClicks: number;
  uniqueClicks: number;
  conversionRate: number;
  totalConversions: number;
  conversionsByType: Record<string, number>;
  clicksByDay: Array<{date: string, count: number}>;
  avgSessionDuration: number;
  topReferrers: Array<{referrer: string, count: number}>;
  expertCreated: boolean;
  soundSelections?: Record<string, number>;
}

/**
 * Redirect result for newsletter links
 */
export interface NewsletterRedirectResult {
  success: boolean;
  redirectUrl: string;
  templateId?: string;
  editorContext?: Record<string, any>;
  requiresAuth: boolean;
  error?: string;
  linkId?: string;
  recommendedSounds?: string[];
}

/**
 * Current user context for newsletter redirects
 */
export interface NewsletterUserContext {
  isAuthenticated: boolean;
  userId?: string;
  email?: string;
  name?: string;
  isPremium: boolean;
  lastLoginAt?: string;
}

/**
 * Sound recommendations for newsletters
 */
export interface NewsletterSoundRecommendation {
  soundId: string;
  soundTitle: string;
  authorName: string;
  category: string;
  thumbnailUrl?: string;
  templatePairings: Array<{
    templateId: string;
    templateTitle: string;
    correlationScore: number;
  }>;
  trendingStatus: 'emerging' | 'growing' | 'peaking' | 'stable' | 'declining';
  weeklyChange: number;
  playUrl?: string;
}

/**
 * Weekly trending sounds showcase for newsletters
 */
export interface WeeklyTrendingSoundsShowcase {
  id: string;
  date: string;
  title: string;
  description: string;
  sounds: NewsletterSoundRecommendation[];
  createdAt: string;
}

/**
 * Sound performance data for newsletters
 */
export interface SoundPerformanceData {
  soundId: string;
  title: string;
  authorName: string;
  usageCount: number;
  weeklyChange: number;
  trendDirection: 'up' | 'down' | 'stable';
  topTemplates: Array<{
    templateId: string;
    templateTitle: string;
    usageCount: number;
  }>;
  trackingUrl: string;
  
  // Enhanced performance metrics
  engagement: {
    clicks: number;
    completionRate: number;
    conversionRate: number;
    averageDuration: number;
    returningUsers: number;
  };
  demographics?: {
    age?: Record<string, number>;
    location?: Record<string, number>;
    device?: Record<string, number>;
  };
  trends?: {
    hourly?: Array<{hour: number, count: number}>;
    daily?: Array<{date: string, count: number}>;
    monthly?: Array<{month: string, count: number}>;
    seasonal?: Array<{season: string, count: number}>;
  };
}

/**
 * Detailed sound performance metrics for analytics dashboard
 */
export interface DetailedSoundPerformanceMetrics {
  soundId: string;
  title: string;
  period: 'day' | 'week' | 'month' | 'quarter' | 'year';
  startDate: string;
  endDate: string;
  
  // Core metrics
  totalPlays: number;
  uniqueUsers: number;
  averageDuration: number;
  completionRate: number;
  
  // Growth metrics
  growthRate: number;
  previousPeriodPlays: number;
  periodChange: number;
  
  // Engagement metrics
  userActions: {
    shares: number;
    downloads: number;
    favorites: number;
    comments: number;
  };
  
  // Conversion metrics
  conversions: {
    templateCreations: number;
    publicationRate: number;
    clickThroughRate: number;
  };
  
  // Distribution metrics
  distribution: {
    byPlatform: Record<string, number>;
    byDeviceType: Record<string, number>;
    byRegion: Record<string, number>;
    byTimeOfDay: Record<number, number>;
    byDayOfWeek: Record<number, number>;
  };
  
  // Contextual metrics
  context: {
    topPairingTemplates: Array<{
      templateId: string;
      templateName: string;
      useCount: number;
      conversionRate: number;
    }>;
    topPairingTags: Array<{
      tag: string;
      count: number;
      performanceMultiplier: number;
    }>;
    competitivePerformance: {
      categoryRank: number;
      categoryPercentile: number;
      similarSoundsComparison: Array<{
        soundId: string;
        soundName: string;
        performanceRatio: number;
      }>;
    };
  };
} 