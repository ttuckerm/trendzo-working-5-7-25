/**
 * Shared Component Types for All Workflows
 * 
 * These types define the shared foundation that Workflows 1, 3, and 5 build upon.
 * Following the Product Operations Pack specification format.
 */

// =============================================================================
// NICHE DEFINITIONS
// =============================================================================

export const NICHES = [
  'personal_finance',
  'side_hustles',
  'entrepreneurship',
  'real_estate',
  'investing',
  'crypto',
  'fitness',
  'health_wellness',
  'beauty',
  'fashion',
  'food_cooking',
  'travel',
  'tech',
  'gaming',
  'education',
  'parenting',
  'relationships',
  'comedy',
  'motivation',
  'lifestyle',
] as const;

export type Niche = typeof NICHES[number];

export interface NicheOption {
  value: Niche;
  label: string;
  description: string;
  icon?: string;
}

export const NICHE_OPTIONS: NicheOption[] = [
  { value: 'personal_finance', label: 'Personal Finance', description: 'Budgeting, saving, debt management' },
  { value: 'side_hustles', label: 'Side Hustles', description: 'Extra income streams and gig economy' },
  { value: 'entrepreneurship', label: 'Entrepreneurship', description: 'Business building and startups' },
  { value: 'real_estate', label: 'Real Estate', description: 'Property investment and housing' },
  { value: 'investing', label: 'Investing', description: 'Stocks, bonds, and portfolio management' },
  { value: 'crypto', label: 'Crypto', description: 'Cryptocurrency and blockchain' },
  { value: 'fitness', label: 'Fitness', description: 'Workouts, training, and exercise' },
  { value: 'health_wellness', label: 'Health & Wellness', description: 'Mental and physical wellbeing' },
  { value: 'beauty', label: 'Beauty', description: 'Skincare, makeup, and self-care' },
  { value: 'fashion', label: 'Fashion', description: 'Style, clothing, and trends' },
  { value: 'food_cooking', label: 'Food & Cooking', description: 'Recipes and culinary content' },
  { value: 'travel', label: 'Travel', description: 'Destinations and travel tips' },
  { value: 'tech', label: 'Tech', description: 'Technology and gadgets' },
  { value: 'gaming', label: 'Gaming', description: 'Video games and esports' },
  { value: 'education', label: 'Education', description: 'Learning and teaching' },
  { value: 'parenting', label: 'Parenting', description: 'Family and child-rearing' },
  { value: 'relationships', label: 'Relationships', description: 'Dating and connections' },
  { value: 'comedy', label: 'Comedy', description: 'Humor and entertainment' },
  { value: 'motivation', label: 'Motivation', description: 'Inspiration and self-improvement' },
  { value: 'lifestyle', label: 'Lifestyle', description: 'General life content' },
];

// =============================================================================
// AUDIENCE DEFINITIONS
// =============================================================================

export const AUDIENCE_AGE_BANDS = ['18-24', '25-34', '35-44', '45+'] as const;
export type AudienceAgeBand = typeof AUDIENCE_AGE_BANDS[number];

export interface AudienceAgeBandOption {
  value: AudienceAgeBand;
  label: string;
  description: string;
}

export const AUDIENCE_AGE_OPTIONS: AudienceAgeBandOption[] = [
  { value: '18-24', label: '18-24 years', description: 'Gen Z / Young Adults' },
  { value: '25-34', label: '25-34 years', description: 'Millennials' },
  { value: '35-44', label: '35-44 years', description: 'Gen X / Early Millennial' },
  { value: '45+', label: '45+ years', description: 'Gen X / Boomers' },
];

// =============================================================================
// CONTENT PURPOSE (Know/Like/Trust)
// =============================================================================

export const CONTENT_PURPOSES = ['know', 'like', 'trust'] as const;
export type ContentPurpose = typeof CONTENT_PURPOSES[number];

export interface ContentPurposeOption {
  value: ContentPurpose;
  label: string;
  description: string;
  ctaExample: string;
  icon: string;
}

export const CONTENT_PURPOSE_OPTIONS: ContentPurposeOption[] = [
  {
    value: 'know',
    label: 'KNOW',
    description: 'Get them to know you',
    ctaExample: 'Follow for more!',
    icon: '✋',
  },
  {
    value: 'like',
    label: 'LIKE',
    description: 'Build rapport & trust',
    ctaExample: 'Like & share!',
    icon: '❤️',
  },
  {
    value: 'trust',
    label: 'TRUST',
    description: 'Convert to customers',
    ctaExample: 'Link in bio',
    icon: '🤝',
  },
];

// =============================================================================
// CONTENT PILLARS
// =============================================================================

export const CONTENT_PILLARS = ['education', 'entertainment', 'inspiration', 'validation'] as const;
export type ContentPillar = typeof CONTENT_PILLARS[number];

export interface ContentPillarOption {
  value: ContentPillar;
  label: string;
  description: string;
}

export const CONTENT_PILLAR_OPTIONS: ContentPillarOption[] = [
  { value: 'education', label: 'Education', description: 'Teach something valuable' },
  { value: 'entertainment', label: 'Entertainment', description: 'Engage and entertain' },
  { value: 'inspiration', label: 'Inspiration', description: 'Motivate and inspire action' },
  { value: 'validation', label: 'Validation', description: 'Validate feelings and experiences' },
];

// =============================================================================
// CONTENT FORMATS
// =============================================================================

export const CONTENT_FORMATS = [
  'talking_head',
  'list_style',
  'story_telling',
  'tutorial',
  'reaction',
  'day_in_life',
  'comparison',
  'challenge',
  'duet_stitch',
  'green_screen',
] as const;

export type ContentFormat = typeof CONTENT_FORMATS[number];

export interface ContentFormatOption {
  value: ContentFormat;
  label: string;
  description: string;
}

export const CONTENT_FORMAT_OPTIONS: ContentFormatOption[] = [
  { value: 'talking_head', label: 'Talking Head', description: 'Direct to camera speaking' },
  { value: 'list_style', label: 'List Style', description: 'Numbered tips or points' },
  { value: 'story_telling', label: 'Story Telling', description: 'Narrative-driven content' },
  { value: 'tutorial', label: 'Tutorial', description: 'Step-by-step how-to' },
  { value: 'reaction', label: 'Reaction', description: 'Reacting to other content' },
  { value: 'day_in_life', label: 'Day in the Life', description: 'Documentary style' },
  { value: 'comparison', label: 'Comparison', description: 'Before/after or vs content' },
  { value: 'challenge', label: 'Challenge', description: 'Participating in trends' },
  { value: 'duet_stitch', label: 'Duet/Stitch', description: 'Building on other creators' },
  { value: 'green_screen', label: 'Green Screen', description: 'Background-based content' },
];

// =============================================================================
// GOALS & KPIs
// =============================================================================

export const GOAL_TYPES = [
  'engagement_rate',
  'lead_generation',
  'brand_awareness',
  'follower_growth',
  'conversions',
  'community_building',
] as const;

export type GoalType = typeof GOAL_TYPES[number];

export interface GoalOption {
  value: GoalType;
  label: string;
  description: string;
  kpiSuggestions: string[];
}

export const GOAL_OPTIONS: GoalOption[] = [
  {
    value: 'engagement_rate',
    label: 'Engagement Rate',
    description: 'Maximize likes, comments, shares',
    kpiSuggestions: ['Target engagement rate %', 'Comments per video', 'Shares per video'],
  },
  {
    value: 'lead_generation',
    label: 'Lead Generation',
    description: 'Capture leads and emails',
    kpiSuggestions: ['Leads captured', 'Click-through rate', 'Bio link clicks'],
  },
  {
    value: 'brand_awareness',
    label: 'Brand Awareness',
    description: 'Increase visibility and reach',
    kpiSuggestions: ['Views per video', 'Reach', 'Impressions'],
  },
  {
    value: 'follower_growth',
    label: 'Follower Growth',
    description: 'Grow audience size',
    kpiSuggestions: ['New followers per video', 'Follower growth rate', 'Follow rate'],
  },
  {
    value: 'conversions',
    label: 'Conversions',
    description: 'Drive sales or sign-ups',
    kpiSuggestions: ['Conversion rate', 'Revenue per video', 'Sales attributed'],
  },
  {
    value: 'community_building',
    label: 'Community Building',
    description: 'Build engaged community',
    kpiSuggestions: ['Comment depth', 'Reply rate', 'Community interactions'],
  },
];

// =============================================================================
// CONTENT BEAT STRUCTURE
// =============================================================================

export interface ContentBeat {
  hook: string;
  proofPoint: string;
  valueProposition: string;
  callToAction: string;
}

export interface ContentBeatWithTimings extends ContentBeat {
  timings: {
    hook: string;
    context: string;
    value: string;
    cta: string;
  };
}

// =============================================================================
// SEO PACK
// =============================================================================

export interface SEOPack {
  primaryTerms: string[];
  alternativeTerms: string[];
  hashtags: string[];
  trendingHashtags: string[];
}

// =============================================================================
// TEMPLATE/EXEMPLAR STRUCTURE
// =============================================================================

export interface ViralTemplate {
  video_id: string;
  title: string;
  views_count: number;
  likes_count: number;
  dps_score: number;
  thumbnail_url: string | null;
  niche: string | null;
  transcript_text: string | null;
  creator_username: string | null;
  pattern_dna?: {
    hook_type: string;
    structure: string;
    cta_type: string;
  };
}

// =============================================================================
// PLATFORM DEFINITIONS
// =============================================================================

export const PLATFORMS = ['tiktok', 'instagram', 'youtube_shorts', 'twitter'] as const;
export type Platform = typeof PLATFORMS[number];

export interface PlatformOption {
  value: Platform;
  label: string;
  available: boolean;
  maxDuration: number;
  icon: string;
}

export const PLATFORM_OPTIONS: PlatformOption[] = [
  { value: 'tiktok', label: 'TikTok', available: true, maxDuration: 180, icon: '🎵' },
  { value: 'instagram', label: 'Instagram Reels', available: true, maxDuration: 90, icon: '📸' },
  { value: 'youtube_shorts', label: 'YouTube Shorts', available: true, maxDuration: 60, icon: '📺' },
  { value: 'twitter', label: 'Twitter/X', available: false, maxDuration: 140, icon: '🐦' },
];

// =============================================================================
// PERFORMANCE METRICS
// =============================================================================

export interface PerformanceMetrics {
  views: number;
  avgViewTime: string;
  engagement: number;
  shares: number;
  performanceOverFirstHour: number;
  audienceRetention: number;
  clickThroughRate: number;
  commentRate: number;
  shareRate: number;
}

export interface ContentIteration {
  performanceOverview: string;
  improvementSuggestions: string[];
  audienceFeedback: string[];
  nextSteps: string[];
}

// =============================================================================
// SHARED STATE STRUCTURE
// =============================================================================

export interface SharedWorkflowState {
  // Identity
  workflowId: string;
  workflowType: 'creator' | 'quick_win' | 'template_library';
  
  // Research data (shared by all workflows)
  niche: Niche | null;
  audienceAgeBand: AudienceAgeBand | null;
  contentPurpose: ContentPurpose | null;
  primaryGoal: GoalType | null;
  
  // Template selection (used by Workflow 3 & 5)
  selectedTemplate: ViralTemplate | null;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// TYPE GUARDS
// =============================================================================

export function isValidNiche(value: string): value is Niche {
  return NICHES.includes(value as Niche);
}

export function isValidAudienceAgeBand(value: string): value is AudienceAgeBand {
  return AUDIENCE_AGE_BANDS.includes(value as AudienceAgeBand);
}

export function isValidContentPurpose(value: string): value is ContentPurpose {
  return CONTENT_PURPOSES.includes(value as ContentPurpose);
}

export function isValidContentPillar(value: string): value is ContentPillar {
  return CONTENT_PILLARS.includes(value as ContentPillar);
}

export function isValidGoalType(value: string): value is GoalType {
  return GOAL_TYPES.includes(value as GoalType);
}

export function isValidPlatform(value: string): value is Platform {
  return PLATFORMS.includes(value as Platform);
}
