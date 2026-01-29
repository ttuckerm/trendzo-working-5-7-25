/**
 * Workflow Shared Components - Shared Foundation
 * 
 * Consolidated exports for reusable workflow components
 * Used by Workflow 1, 3, and 5
 */

// Re-export from specs
export * from '../workflow-specs';

// Niche configuration - matches GalleryPhase NICHE_CATEGORIES
export const NICHE_OPTIONS = [
  { key: 'all', label: 'All', icon: '🌐' },
  { key: 'personal-finance', label: 'Personal Finance/Investing', icon: '💰' },
  { key: 'fitness', label: 'Fitness/Weight Loss', icon: '💪' },
  { key: 'business', label: 'Business/Entrepreneurship', icon: '💼' },
  { key: 'food', label: 'Food/Nutrition Comparisons', icon: '🍳' },
  { key: 'beauty', label: 'Beauty/Skincare', icon: '💄' },
  { key: 'real-estate', label: 'Real Estate/Property', icon: '🏠' },
  { key: 'self-improvement', label: 'Self-Improvement/Productivity', icon: '📈' },
  { key: 'dating', label: 'Dating/Relationships', icon: '❤️' },
  { key: 'education', label: 'Education/Study Tips', icon: '📚' },
  { key: 'career', label: 'Career/Job Advice', icon: '👔' },
  { key: 'parenting', label: 'Parenting/Family', icon: '👨‍👩‍👧' },
  { key: 'tech', label: 'Tech Reviews/Tutorials', icon: '📱' },
  { key: 'fashion', label: 'Fashion/Style', icon: '👗' },
  { key: 'health', label: 'Health/Medical Education', icon: '🏥' },
  { key: 'cooking', label: 'Cooking/Recipes', icon: '👨‍🍳' },
  { key: 'psychology', label: 'Psychology/Mental Health', icon: '🧠' },
  { key: 'travel', label: 'Travel/Lifestyle', icon: '✈️' },
  { key: 'diy', label: 'DIY/Home Improvement', icon: '🔧' },
  { key: 'language', label: 'Language Learning', icon: '🗣️' },
  { key: 'side-hustles', label: 'Side Hustles/Making Money Online', icon: '💵' },
] as const;

export type NicheKey = typeof NICHE_OPTIONS[number]['key'];

// Audience age bands
export const AUDIENCE_AGE_BANDS = [
  { key: '13-17', label: 'Gen Alpha (13-17)', description: 'Youngest TikTok users' },
  { key: '18-24', label: 'Gen Z (18-24)', description: 'Core TikTok demographic' },
  { key: '25-34', label: 'Young Millennials (25-34)', description: 'High engagement, purchasing power' },
  { key: '35-44', label: 'Older Millennials (35-44)', description: 'Growing TikTok segment' },
  { key: '45+', label: 'Gen X & Boomers (45+)', description: 'Fastest growing demographic' },
] as const;

export type AudienceAgeBand = typeof AUDIENCE_AGE_BANDS[number]['key'];

// Content purpose (KLT - Know, Like, Trust)
export const CONTENT_PURPOSES = [
  { 
    key: 'KNOW', 
    label: 'Know', 
    description: 'Build awareness - teach something new',
    ctaExamples: ['Learn more', 'Discover how', 'Find out why'],
    icon: '💡'
  },
  { 
    key: 'LIKE', 
    label: 'Like', 
    description: 'Build connection - entertain or relate',
    ctaExamples: ['Follow for more', 'Tag someone who...', 'Share if you agree'],
    icon: '❤️'
  },
  { 
    key: 'TRUST', 
    label: 'Trust', 
    description: 'Build credibility - prove expertise',
    ctaExamples: ['Book a call', 'Get started', 'Join the waitlist'],
    icon: '🤝'
  },
] as const;

export type ContentPurposeKey = typeof CONTENT_PURPOSES[number]['key'];

// Goal types with target metrics
export const GOAL_TYPES = [
  { key: 'engagement', label: 'Engagement Rate', metric: 'likes + comments / views', targetRange: '5-15%' },
  { key: 'reach', label: 'Maximum Reach', metric: 'total views', targetRange: '100K-1M' },
  { key: 'followers', label: 'Follower Growth', metric: 'new followers', targetRange: '1K-10K' },
  { key: 'leads', label: 'Lead Generation', metric: 'link clicks / profile visits', targetRange: '2-5%' },
  { key: 'sales', label: 'Direct Sales', metric: 'conversions', targetRange: '0.5-2%' },
  { key: 'awareness', label: 'Brand Awareness', metric: 'shares + saves', targetRange: '3-8%' },
] as const;

export type GoalTypeKey = typeof GOAL_TYPES[number]['key'];

// Content pillars
export const CONTENT_PILLARS = [
  { key: 'education', label: 'Education', description: 'Teach valuable skills or knowledge', icon: '📚' },
  { key: 'entertainment', label: 'Entertainment', description: 'Make people laugh or feel emotion', icon: '🎭' },
  { key: 'inspiration', label: 'Inspiration', description: 'Motivate and uplift your audience', icon: '✨' },
  { key: 'behind-scenes', label: 'Behind the Scenes', description: 'Show authentic, unfiltered content', icon: '🎬' },
  { key: 'controversy', label: 'Controversy/Opinion', description: 'Share hot takes and strong opinions', icon: '🔥' },
  { key: 'transformation', label: 'Transformation', description: 'Before/after and progress content', icon: '🦋' },
] as const;

export type ContentPillarKey = typeof CONTENT_PILLARS[number]['key'];

// Content formats
export const CONTENT_FORMATS = [
  { key: 'talking-head', label: 'Talking Head', description: 'Direct-to-camera speaking' },
  { key: 'story', label: 'Story Time', description: 'Narrative storytelling format' },
  { key: 'tutorial', label: 'Tutorial/How-To', description: 'Step-by-step instruction' },
  { key: 'reaction', label: 'Reaction', description: 'React to trending content' },
  { key: 'duet', label: 'Duet/Stitch', description: 'Respond to another creator' },
  { key: 'trend', label: 'Trend Participation', description: 'Join a viral trend' },
  { key: 'list', label: 'List/Ranking', description: 'Top X or ranking format' },
  { key: 'pov', label: 'POV', description: 'Point-of-view scenario' },
  { key: 'asmr', label: 'ASMR/Satisfying', description: 'Sensory content' },
  { key: 'greenscreen', label: 'Green Screen', description: 'Background replacement content' },
] as const;

export type ContentFormatKey = typeof CONTENT_FORMATS[number]['key'];

// Content beats structure
export const BEAT_STRUCTURE = [
  { key: 'hook', label: 'Hook', timeRange: '0-3s', description: 'Grab attention immediately' },
  { key: 'value-prop', label: 'Value Proposition', timeRange: '3-7s', description: 'Promise what they\'ll learn/get' },
  { key: 'proof', label: 'Proof Point', timeRange: '7-15s', description: 'Evidence or demonstration' },
  { key: 'body', label: 'Main Content', timeRange: '15-45s', description: 'Deliver the core value' },
  { key: 'cta', label: 'Call to Action', timeRange: '45-60s', description: 'Tell them what to do next' },
] as const;

export type BeatKey = typeof BEAT_STRUCTURE[number]['key'];

// DPS prediction API integration
export interface DPSPredictionRequest {
  transcript?: string;
  niche?: string;
  format?: string;
  duration?: number;
  hooks?: string[];
  hashtags?: string[];
}

export interface DPSPredictionResponse {
  run_id: string;
  predicted_dps_7d: number;
  predicted_tier_7d: 'poor' | 'average' | 'good' | 'excellent' | 'viral';
  confidence: number;
  success: boolean;
  qualitative_analysis?: {
    unified_grading?: any;
    editing_suggestions?: any;
    viral_mechanics?: any;
    visual_rubric?: any;
  };
}

// Helper to call DPS prediction API
export async function predictDPS(request: DPSPredictionRequest): Promise<DPSPredictionResponse> {
  const response = await fetch('/api/kai/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  
  if (!response.ok) {
    throw new Error(`DPS prediction failed: ${response.statusText}`);
  }
  
  return response.json();
}

// Template interface matching GalleryPhase
export interface ViralTemplate {
  id: string;
  title: string;
  category: string;
  views: string;
  likes: string;
  shares: string;
  viralScore: number;
  description: string;
  trendingSound: string;
  backgroundGradient: string;
  previewImage: string;
  previewVideo?: string;
  hoverFrames?: string[];
  creator: string;
  platform: 'TIKTOK' | 'YOUTUBE' | 'INSTAGRAM';
  duration: string;
}

// Format large numbers
export function formatNumber(num: number | null | undefined): string {
  if (!num) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

// Calculate DPS from metrics (matches GalleryPhase)
export function calculateDPSFromMetrics(video: {
  views_count?: number;
  likes_count?: number;
  comments_count?: number;
  shares_count?: number;
}): number {
  const views = video.views_count || 0;
  const likes = video.likes_count || 0;
  const comments = video.comments_count || 0;
  const shares = video.shares_count || 0;
  
  if (views === 0) return 0;
  
  const engagementRate = ((likes + comments + shares) / views) * 100;
  const viewScore = Math.min(40, Math.log10(Math.max(1, views)) * 5);
  const engagementScore = Math.min(40, engagementRate * 4);
  const viralityBonus = shares > 1000 ? 10 : shares > 100 ? 5 : 0;
  
  return Math.min(100, viewScore + engagementScore + viralityBonus + 10);
}

// Get niche key from display name
export function getNicheKey(nicheName: string): NicheKey {
  const found = NICHE_OPTIONS.find(n => n.label === nicheName);
  return found?.key || 'all';
}

// Get niche label from key
export function getNicheLabel(nicheKey: NicheKey): string {
  const found = NICHE_OPTIONS.find(n => n.key === nicheKey);
  return found?.label || 'All';
}

// Workflow state storage keys
export const STORAGE_KEYS = {
  WORKFLOW_1: 'trendzo_workflow_1_state',
  WORKFLOW_3: 'trendzo_workflow_3_state',
  WORKFLOW_5: 'trendzo_workflow_5_state',
} as const;

// Save workflow state to localStorage
export function saveWorkflowState<T>(key: string, state: T): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(state));
  }
}

// Load workflow state from localStorage
export function loadWorkflowState<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(key);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as T;
  } catch {
    return null;
  }
}

// Clear workflow state
export function clearWorkflowState(key: string): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(key);
  }
}
