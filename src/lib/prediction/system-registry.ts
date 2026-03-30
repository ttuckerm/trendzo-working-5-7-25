/**
 * System Registry — Single Source of Truth (D11)
 *
 * ALL components, packs, tiers, niches, paths, and constants are defined here.
 * No other file should hardcode these values. Import from this file.
 *
 * This file is pure typed constants — no server-only APIs, safe for 'use client'.
 */

// =============================================================================
// TYPES
// =============================================================================

export type ComponentType = 'quantitative' | 'qualitative' | 'pattern' | 'historical';

export interface ComponentDefinition {
  id: string;
  name: string;
  type: ComponentType;
  defaultReliability: number;
  defaultAvgLatency: number;
  /** Which env var this component needs (undefined = no API key required) */
  apiDependency?: string;
  /** True if component can run without its API key (heuristic fallback) */
  hasFallback?: boolean;
  /** Additional notes about the component status */
  description?: string;
}

export interface PackDefinition {
  id: string;
  name: string;
  /** The component ID in COMPONENT_REGISTRY */
  componentId: string;
  provider: 'google-ai' | 'rule-based' | 'signal-aggregation';
  requiresTranscript: boolean;
  dependsOn?: string[];
}

export interface NicheDefinition {
  /** Canonical key — always hyphenated: 'side-hustles' */
  key: string;
  /** UI display label */
  label: string;
  /** Calibration factor: 1.0 = normal, <1.0 = harder to go viral */
  difficultyFactor: number;
  /** Whether a trained XGBoost v5 model exists for this niche */
  hasTrainedModel: boolean;
  /** Spearman rank correlation of trained model (if exists) */
  xgboostCorrelation?: number;
  /** Underscore key for XGBoost Python service: 'side_hustles' */
  xgboostNicheKey?: string;
  /** Specific content subtopics creators can select (3-5 from this list) */
  subtopics?: string[];
}

export interface PathDefinition {
  id: string;
  name: string;
  componentIds: string[];
  baseWeight: number;
  defaultContext: WorkflowType;
}

export interface VpsTier {
  minScore: number;
  label: string;
  colorClass: string;
  gradient: { start: string; end: string };
}

export interface DpsTier {
  minPercentile: number;
  minZScore: number;
  category: 'mega-viral' | 'hyper-viral' | 'viral' | 'trending' | 'normal';
}

export type WorkflowType =
  | 'content-planning'
  | 'template-selection'
  | 'quick-win'
  | 'immediate-analysis'
  | 'trending-library';

export const PIPELINE_MODES = ['standard', 'validation'] as const;
export type PipelineMode = (typeof PIPELINE_MODES)[number];

// =============================================================================
// COMPONENT REGISTRY — 22 registered components
// =============================================================================

export const COMPONENT_REGISTRY: Record<string, ComponentDefinition> = {
  '9-attributes': {
    id: '9-attributes',
    name: '9 Attributes Scorer',
    type: 'pattern',
    defaultReliability: 0.85,
    defaultAvgLatency: 500,
  },
  'ffmpeg': {
    id: 'ffmpeg',
    name: 'FFmpeg Visual Analysis',
    type: 'quantitative',
    defaultReliability: 0.99,
    defaultAvgLatency: 30000,
  },
  '7-legos': {
    id: '7-legos',
    name: '7 Idea Legos Pattern Extraction',
    type: 'pattern',
    defaultReliability: 0.90,
    defaultAvgLatency: 1000,
  },
  'whisper': {
    id: 'whisper',
    name: 'Whisper Transcription',
    type: 'quantitative',
    defaultReliability: 0.95,
    defaultAvgLatency: 5000,
  },
  'gpt4': {
    id: 'gpt4',
    name: 'Text Analysis (GPT-4o-mini / Heuristic)',
    type: 'qualitative',
    defaultReliability: 0.92,
    defaultAvgLatency: 3000,
    apiDependency: 'OPENAI_API_KEY',
    hasFallback: true,
    description: 'Uses gpt-4o-mini when OPENAI_API_KEY available, heuristic fallback otherwise',
  },
  'gemini': {
    id: 'gemini',
    name: 'Gemini 3 Pro Preview Analysis',
    type: 'qualitative',
    defaultReliability: 0.92,
    defaultAvgLatency: 45000,
    apiDependency: 'GOOGLE_GEMINI_AI_API_KEY',
  },
  'niche-keywords': {
    id: 'niche-keywords',
    name: 'Niche Keywords Analyzer',
    type: 'pattern',
    defaultReliability: 0.85,
    defaultAvgLatency: 200,
    description: 'ALWAYS DISABLED at runtime (pushed to disabledComponents). Kept in registry to prevent historical path execution errors.',
  },
  'feature-extraction': {
    id: 'feature-extraction',
    name: 'Feature Extraction Service (152 features)',
    type: 'quantitative',
    defaultReliability: 0.99,
    defaultAvgLatency: 60000,
    description: 'ALWAYS DISABLED at runtime — 152-feature extraction feeds nothing. Kept for future XGBoost retrain with 200+ labeled videos.',
  },
  'pattern-extraction': {
    id: 'pattern-extraction',
    name: 'Pattern Extraction Engine',
    type: 'pattern',
    defaultReliability: 0.90,
    defaultAvgLatency: 2000,
  },
  'hook-scorer': {
    id: 'hook-scorer',
    name: 'Hook Strength Scorer (Multi-Modal)',
    type: 'pattern',
    defaultReliability: 0.80,
    defaultAvgLatency: 50,
    description: '5-channel multi-modal hook analyzer (text/audio/visual/pace/tone). Runs in Phase 2 to access audio-analyzer results.',
  },
  'audio-analyzer': {
    id: 'audio-analyzer',
    name: 'Audio Analysis Engine',
    type: 'quantitative',
    defaultReliability: 0.50,
    defaultAvgLatency: 30000,
  },
  'visual-scene-detector': {
    id: 'visual-scene-detector',
    name: 'Visual Scene Detection',
    type: 'quantitative',
    defaultReliability: 0.50,
    defaultAvgLatency: 40000,
  },
  'thumbnail-analyzer': {
    id: 'thumbnail-analyzer',
    name: 'Thumbnail Analyzer',
    type: 'quantitative',
    defaultReliability: 0.50,
    defaultAvgLatency: 35000,
  },
  '24-styles': {
    id: '24-styles',
    name: '24 Video Styles Classifier (Hybrid)',
    type: 'pattern',
    defaultReliability: 0.65,
    defaultAvgLatency: 500,
    apiDependency: 'OPENAI_API_KEY',
    hasFallback: true,
    description: 'Hybrid: deterministic keyword classifier (Tier 1) + optional GPT-4o-mini refinement (Tier 2) for ambiguous cases.',
  },
  'virality-matrix': {
    id: 'virality-matrix',
    name: 'TikTok Virality Matrix',
    type: 'pattern',
    defaultReliability: 0.80,
    defaultAvgLatency: 50,
    description: 'DISABLED — fully algorithmic but duplicative of hook-scorer + pattern-extraction',
  },
  'claude': {
    id: 'claude',
    name: 'Claude Analysis',
    type: 'qualitative',
    defaultReliability: 0.85,
    defaultAvgLatency: 15000,
    apiDependency: 'ANTHROPIC_API_KEY',
  },
  'virality-indicator': {
    id: 'virality-indicator',
    name: 'Virality Indicator Engine',
    type: 'pattern',
    defaultReliability: 0.85,
    defaultAvgLatency: 500,
  },
  'xgboost-virality-ml': {
    id: 'xgboost-virality-ml',
    name: 'XGBoost Virality ML Predictor v7',
    type: 'quantitative',
    defaultReliability: 0.75,
    defaultAvgLatency: 2000,
    description: 'TypeScript XGBoost v7 model. 70 content-only features. One signal among many in the orchestrator blend.',
  },
  'unified-grading': {
    id: 'unified-grading',
    name: 'Unified Grading Rubric (Pack 1)',
    type: 'qualitative',
    defaultReliability: 0.90,
    defaultAvgLatency: 8000,
    apiDependency: 'GOOGLE_GEMINI_AI_API_KEY',
    hasFallback: true,
  },
  'editing-coach': {
    id: 'editing-coach',
    name: 'Editing Coach (Pack 2)',
    type: 'qualitative',
    defaultReliability: 0.88,
    defaultAvgLatency: 5000,
    apiDependency: 'GOOGLE_GEMINI_AI_API_KEY',
    hasFallback: true,
  },
  'visual-rubric': {
    id: 'visual-rubric',
    name: 'Visual Rubric (Pack V)',
    type: 'qualitative',
    defaultReliability: 0.85,
    defaultAvgLatency: 8000,
    apiDependency: 'GOOGLE_GEMINI_AI_API_KEY',
    hasFallback: true,
    description: 'Rule-based visual analysis augmented with Gemini Vision (D13). Falls back to rule-based only when no video file or API key.',
  },
  'viral-mechanics': {
    id: 'viral-mechanics',
    name: 'Viral Mechanics (Pack 3)',
    type: 'qualitative',
    defaultReliability: 0.80,
    defaultAvgLatency: 50,
    description: 'Rule-based signal synthesis. No LLM calls.',
  },
};

// =============================================================================
// DISABLED COMPONENTS — commented out / removed from pipeline
// =============================================================================

export const DISABLED_COMPONENTS: Record<string, { reason: string; disabledDate?: string }> = {
  'xgboost': {
    reason: 'FAKE heuristic placeholder. Real XGBoost is xgboost-virality-ml.',
    disabledDate: '2025-12-27',
  },
  'historical': {
    reason: 'Zero variance — just returns niche average VPS, not contributing to accuracy.',
  },
  'trend-timing-analyzer': {
    reason: 'Content-independent — returns same score regardless of video quality.',
  },
  'posting-time-optimizer': {
    reason: 'Content-independent — useful for timing recommendations but not prediction accuracy.',
  },
  'python-analysis': {
    reason: 'Python Enhanced Analysis (PySceneDetect, VADER) — deprecated.',
  },
  'competitor-benchmark': {
    reason: 'Disabled at runtime via smart defaults (always pushed to disabledComponents).',
  },
  'feature-extraction': {
    reason: 'ALWAYS DISABLED — 152-feature extraction feeds nothing. Kept for future XGBoost retrain with 200+ labeled videos.',
    disabledDate: '2026-03-17',
  },
};

// =============================================================================
// PACK DEFINITIONS
// =============================================================================

export const PACK_DEFINITIONS: PackDefinition[] = [
  {
    id: 'pack-v',
    name: 'Visual Rubric',
    componentId: 'visual-rubric',
    provider: 'rule-based',
    requiresTranscript: false,
  },
  {
    id: 'pack-1',
    name: 'Unified Grading Rubric',
    componentId: 'unified-grading',
    provider: 'google-ai',
    requiresTranscript: true,
  },
  {
    id: 'pack-2',
    name: 'Editing Coach',
    componentId: 'editing-coach',
    provider: 'google-ai',
    requiresTranscript: true,
    dependsOn: ['pack-1'],
  },
  {
    id: 'pack-3',
    name: 'Viral Mechanics',
    componentId: 'viral-mechanics',
    provider: 'signal-aggregation',
    requiresTranscript: false,
    dependsOn: ['pack-1'],
  },
];

// =============================================================================
// NICHE REGISTRY — canonical flat list, hyphenated keys, no duplicates
// =============================================================================

export const NICHE_REGISTRY: NicheDefinition[] = [
  { key: 'side-hustles', label: 'Side Hustles/Making Money Online', difficultyFactor: 0.85, hasTrainedModel: true, xgboostCorrelation: 0.61, xgboostNicheKey: 'side_hustles', subtopics: ['etsy-digital-products', 'freelancing', 'print-on-demand', 'dropshipping', 'content-creation', 'affiliate-marketing', 'online-courses', 'social-media-management', 'ai-tools-business', 'flipping-reselling'] },
  { key: 'personal-finance', label: 'Personal Finance/Investing', difficultyFactor: 0.90, hasTrainedModel: false, subtopics: ['budgeting', 'index-funds', 'real-estate-investing', 'debt-payoff', 'credit-cards', 'retirement', 'crypto', 'tax-strategies', 'savings-challenges', 'financial-independence'] },
  { key: 'fitness', label: 'Fitness/Weight Loss', difficultyFactor: 0.90, hasTrainedModel: false, subtopics: ['weight-loss', 'muscle-building', 'home-workouts', 'running', 'yoga', 'meal-prep', 'supplements', 'recovery', 'flexibility', 'calisthenics'] },
  { key: 'business', label: 'Business/Entrepreneurship', difficultyFactor: 0.95, hasTrainedModel: false, subtopics: ['startup-advice', 'sales-techniques', 'marketing-strategy', 'leadership', 'automation', 'client-acquisition', 'scaling', 'ecommerce', 'saas', 'personal-branding'] },
  { key: 'food-nutrition', label: 'Food/Nutrition Comparisons', difficultyFactor: 1.00, hasTrainedModel: false, subtopics: ['calorie-counting', 'supplements-review', 'diet-comparisons', 'meal-planning', 'gut-health', 'protein-optimization', 'food-myths', 'grocery-shopping', 'clean-eating', 'sports-nutrition'] },
  { key: 'beauty', label: 'Beauty/Skincare', difficultyFactor: 0.95, hasTrainedModel: false, subtopics: ['skincare-routines', 'makeup-tutorials', 'product-reviews', 'anti-aging', 'acne-treatment', 'k-beauty', 'budget-beauty', 'hair-care', 'nail-art', 'dermatology'] },
  { key: 'real-estate', label: 'Real Estate/Property', difficultyFactor: 0.95, hasTrainedModel: false, subtopics: ['first-time-buyers', 'house-flipping', 'rental-investing', 'house-hacking', 'market-analysis', 'negotiation', 'home-inspection', 'mortgage-tips', 'commercial-real-estate', 'airbnb'] },
  { key: 'self-improvement', label: 'Self-Improvement/Productivity', difficultyFactor: 0.92, hasTrainedModel: false, subtopics: ['morning-routines', 'habit-building', 'mindfulness', 'goal-setting', 'journaling', 'time-management', 'reading', 'digital-detox', 'confidence', 'stoicism'] },
  { key: 'dating', label: 'Dating/Relationships', difficultyFactor: 0.95, hasTrainedModel: false, subtopics: ['dating-apps', 'first-dates', 'communication-skills', 'attachment-styles', 'red-flags', 'texting', 'body-language', 'long-distance', 'breakup-recovery', 'self-love'] },
  { key: 'education', label: 'Education/Study Tips', difficultyFactor: 0.95, hasTrainedModel: false, subtopics: ['study-techniques', 'memory-hacks', 'note-taking', 'exam-prep', 'speed-reading', 'online-learning', 'academic-writing', 'scholarship-tips', 'career-after-school', 'stem-education'] },
  { key: 'career', label: 'Career/Job Advice', difficultyFactor: 0.95, hasTrainedModel: false, subtopics: ['resume-writing', 'interview-prep', 'salary-negotiation', 'career-switching', 'remote-work', 'linkedin-strategy', 'promotion-tactics', 'networking', 'workplace-skills', 'side-to-full-time'] },
  { key: 'parenting', label: 'Parenting/Family', difficultyFactor: 1.00, hasTrainedModel: false, subtopics: ['toddler-discipline', 'baby-sleep', 'picky-eaters', 'screen-time', 'education-at-home', 'co-parenting', 'teen-communication', 'work-life-balance', 'budget-family', 'developmental-milestones'] },
  { key: 'tech', label: 'Tech Reviews/Tutorials', difficultyFactor: 0.92, hasTrainedModel: false, subtopics: ['smartphone-reviews', 'ai-tools', 'home-automation', 'laptop-guides', 'privacy-security', 'app-recommendations', 'coding-tutorials', 'gadget-comparisons', 'gaming-tech', 'no-code-tools'] },
  { key: 'fashion', label: 'Fashion/Style', difficultyFactor: 0.95, hasTrainedModel: false, subtopics: ['capsule-wardrobe', 'thrift-styling', 'color-theory', 'body-types', 'seasonal-trends', 'street-style', 'sustainable-fashion', 'mens-fashion', 'accessories', 'budget-outfits'] },
  { key: 'health', label: 'Health/Medical Education', difficultyFactor: 0.95, hasTrainedModel: false, subtopics: ['sleep-optimization', 'inflammation', 'gut-health', 'cold-exposure', 'supplement-science', 'mental-health', 'chronic-pain', 'womens-health', 'preventive-care', 'longevity'] },
  { key: 'cooking', label: 'Cooking/Recipes', difficultyFactor: 1.00, hasTrainedModel: false, subtopics: ['quick-meals', 'meal-prep', 'baking', 'grilling', 'budget-cooking', 'international-cuisine', 'knife-skills', 'kitchen-equipment', 'viral-recipes', 'spice-blending'] },
  { key: 'psychology', label: 'Psychology/Mental Health', difficultyFactor: 0.95, hasTrainedModel: false, subtopics: ['attachment-theory', 'cognitive-biases', 'therapy-techniques', 'narcissism', 'anxiety-management', 'trauma-healing', 'neuroscience', 'body-language', 'emotional-intelligence', 'habit-psychology'] },
  { key: 'travel', label: 'Travel/Lifestyle', difficultyFactor: 0.95, hasTrainedModel: false, subtopics: ['budget-travel', 'digital-nomad', 'packing-hacks', 'solo-travel', 'street-food', 'flight-deals', 'travel-photography', 'destination-guides', 'van-life', 'luxury-travel'] },
  { key: 'diy', label: 'DIY/Home Improvement', difficultyFactor: 1.00, hasTrainedModel: false, subtopics: ['bathroom-renovation', 'painting-tips', 'furniture-hacks', 'plumbing-basics', 'electrical-safety', 'garden-projects', 'organization', 'tool-tutorials', 'ikea-hacks', 'small-space-solutions'] },
  { key: 'language', label: 'Language Learning', difficultyFactor: 0.95, hasTrainedModel: false, subtopics: ['spanish', 'french', 'japanese', 'korean', 'mandarin', 'immersion-methods', 'vocabulary-hacks', 'pronunciation', 'grammar-shortcuts', 'polyglot-tips'] },
];

// =============================================================================
// HOOK TAXONOMY — 10-type research-validated taxonomy with 5 psychological clusters
// =============================================================================

export const HOOK_CLUSTERS = {
  curiosity_trigger:    { label: 'Curiosity Trigger',    types: ['question', 'list_preview'] },
  cognitive_challenge:  { label: 'Cognitive Challenge',  types: ['contrarian', 'myth_bust'] },
  credibility_signal:   { label: 'Credibility Signal',   types: ['statistic', 'authority', 'result_preview'] },
  emotional_connection: { label: 'Emotional Connection', types: ['personal_story', 'problem_identification'] },
  urgency_scarcity:     { label: 'Urgency/Scarcity',    types: ['urgency'] },
} as const;

export const HOOK_TYPES = [
  'question', 'list_preview',
  'contrarian', 'myth_bust',
  'statistic', 'authority', 'result_preview',
  'personal_story', 'problem_identification',
  'urgency',
] as const;

export type HookType = typeof HOOK_TYPES[number];

export const HOOK_MIGRATION_MAP: Record<string, HookType> = {
  'authority':     'authority',
  'myth-busting':  'myth_bust',
  'controversial': 'contrarian',
  'story':         'personal_story',
  'listicle':      'list_preview',
};

export function migrateHookType(legacy: string): HookType {
  return HOOK_MIGRATION_MAP[legacy] ?? (legacy as HookType);
}

/**
 * Additional niches used only for calibration difficulty factors.
 * These are NOT shown in the UI niche dropdown.
 */
export const CALIBRATION_ONLY_NICHES: Record<string, number> = {
  'make-money-online': 0.80,
  'dropshipping': 0.75,
  'crypto': 0.85,
  'forex': 0.80,
  'affiliate-marketing': 0.80,
  'investing': 0.90,
  'weight-loss': 0.85,
  'productivity': 0.92,
  'pets': 1.05,
  'gardening': 1.05,
};

// =============================================================================
// NICHE HASHTAGS — TikTok hashtags per niche for discovery + channel verification
// Moved from niche-creator-scraper.ts (2026-03-05) to centralize reference data.
// =============================================================================

export const NICHE_HASHTAGS: Record<string, string[]> = {
  'side-hustles':     ['sidehustle', 'makemoneyonline', 'sidehustleideas'],
  'personal-finance': ['personalfinance', 'investing101', 'moneytips'],
  'fitness':          ['fitness', 'gymtok', 'homeworkout'],
  'business':         ['entrepreneur', 'smallbusiness', 'businesstips'],
  'food-nutrition':   ['foodtok', 'nutrition', 'healthyfood'],
  'beauty':           ['beautytok', 'skincare', 'makeuptutorial'],
  'real-estate':      ['realestate', 'realestateinvesting', 'homebuying'],
  'self-improvement': ['selfimprovement', 'productivity', 'growthmindset'],
  'dating':           ['datingadvice', 'relationships', 'datingtips'],
  'education':        ['studytok', 'studytips', 'learnontiktok'],
  'career':           ['careertips', 'jobsearch', 'careeradvice'],
  'parenting':        ['parentingtips', 'momtok', 'parentinghacks'],
  'tech':             ['techtok', 'techreview', 'techtips'],
  'fashion':          ['fashiontok', 'ootd', 'styletips'],
  'health':           ['healthtips', 'mentalhealth', 'wellness'],
  'cooking':          ['cookingtok', 'recipe', 'easyrecipe'],
  'psychology':       ['psychologyfacts', 'therapytok', 'psychologytips'],
  'travel':           ['traveltok', 'travelguide', 'budgettravel'],
  'diy':              ['diy', 'homeimprovement', 'diycrafts'],
  'language':         ['languagelearning', 'learnenglish', 'polyglot'],
};

// =============================================================================
// VIDEO STYLES REGISTRY — 24 proven viral video format templates (D11)
// viralWeight is 1.0 for all styles until empirical Spearman data proves
// that certain styles correlate with higher VPS. The field stays in the schema
// for future data-driven values.
// =============================================================================

export interface VideoStyleDefinition {
  id: string;
  name: string;
  /** Reserved for future data-driven values. Default 1.0 until Spearman data exists. */
  viralWeight: number;
  /** Keyword/regex patterns for deterministic Tier 1 classification */
  textSignals: RegExp[];
  /** Structural signals: min question marks, expected speaking rate range, etc. */
  structuralHints?: {
    minQuestionMarks?: number;
    minNumberedSteps?: number;
    expectsHighWpm?: boolean;   // > 150 WPM
    expectsLowWpm?: boolean;    // < 100 WPM
    expectsSceneChanges?: boolean;
    expectsNoSceneChanges?: boolean;
    expectsHighMusicRatio?: boolean;  // > 0.3
    expectsHighSpeechRatio?: boolean; // > 0.6
  };
}

export const VIDEO_STYLES_REGISTRY: VideoStyleDefinition[] = [
  {
    id: 'talking-head-explainer',
    name: 'Talking-Head Explainer',
    viralWeight: 1.0,
    textSignals: [/\b(i'm going to|let me explain|here's (?:the thing|what)|i want to talk about)\b/i],
    structuralHints: { expectsNoSceneChanges: true, expectsHighSpeechRatio: true },
  },
  {
    id: 'green-screen-commentary',
    name: 'Green-Screen Commentary',
    viralWeight: 1.0,
    textSignals: [/\b(look at this|check this out|can you believe|react(?:ing)? to)\b/i],
    structuralHints: { expectsHighSpeechRatio: true },
  },
  {
    id: 'picture-in-picture',
    name: 'Picture-in-Picture Screen Walkthrough',
    viralWeight: 1.0,
    textSignals: [/\b(on (?:my |the )?screen|walkthrough|tutorial|click(?:ing)? on|let me show you)\b/i],
    structuralHints: { expectsSceneChanges: true },
  },
  {
    id: 'voiceover-broll',
    name: 'Voiceover + B-Roll Montage',
    viralWeight: 1.0,
    textSignals: [/\b(here(?:'s| is) (?:a look|what)|footage|cinematic|b-?roll)\b/i],
    structuralHints: { expectsHighMusicRatio: true, expectsHighSpeechRatio: true, expectsSceneChanges: true },
  },
  {
    id: 'whiteboard-teach',
    name: 'Whiteboard/Notepad Teach',
    viralWeight: 1.0,
    textSignals: [/\b(let me (?:draw|write|sketch)|whiteboard|diagram|note(?:s|pad))\b/i],
    structuralHints: { expectsNoSceneChanges: true },
  },
  {
    id: 'top-down-demo',
    name: 'Desk/Top-Down Hands-Only Demo',
    viralWeight: 1.0,
    textSignals: [/\b(hands[- ]on|unbox(?:ing)?|setup|assembly|desk (?:setup|tour))\b/i],
    structuralHints: { expectsNoSceneChanges: true },
  },
  {
    id: 'product-demo',
    name: 'Product/Feature Demo',
    viralWeight: 1.0,
    textSignals: [/\b(product|feature|review|worth (?:it|buying)|honest review)\b/i],
  },
  {
    id: 'case-study',
    name: 'Case Study / Before-After',
    viralWeight: 1.0,
    textSignals: [/\b(before\s+(?:and\s+)?after|results|outcome|grew|increased|from\s+\$?\d+.*?to\s+\$?\d+)\b/i],
  },
  {
    id: 'comparison',
    name: 'Comparison / A-vs-B-vs-C',
    viralWeight: 1.0,
    textSignals: [/\b(vs\.?|versus|compared to|better than|which (?:is|one)|head[- ]to[- ]head)\b/i],
  },
  {
    id: 'myth-bust',
    name: 'Myth-Bust / Red-Flag-Green-Flag',
    viralWeight: 1.0,
    textSignals: [/\b(myth|debunk(?:ed|ing)?|wrong|actually|truth is|red flag|green flag|lies? (?:about|you))\b/i],
  },
  {
    id: 'sop-checklist',
    name: 'SOP/Checklist Walkthrough',
    viralWeight: 1.0,
    textSignals: [/\bstep\s+\d/i, /\bnumber\s+\d/i, /\b(first|second|third).*\b(then|next|second|third)/i, /\bchecklist\b/i],
    structuralHints: { minNumberedSteps: 3 },
  },
  {
    id: 'decision-tree',
    name: 'Decision Tree / If-Then Navigator',
    viralWeight: 1.0,
    textSignals: [/\b(if you(?:'re| are)|depends on|it depends|decision|which (?:path|option|route))\b/i],
  },
  {
    id: 'challenge-protocol',
    name: 'Challenge / 7-30 Day Protocol',
    viralWeight: 1.0,
    textSignals: [/\b(\d+[- ]day|challenge|protocol|experiment|i tried)\b/i],
  },
  {
    id: 'live-build',
    name: 'Live Build / Real-Time Teardown',
    viralWeight: 1.0,
    textSignals: [/\b(live build|real[- ]time|building|teardown|watch me|from scratch)\b/i],
    structuralHints: { expectsSceneChanges: true },
  },
  {
    id: 'faq-rapid-fire',
    name: 'FAQ/AMA Rapid-Fire',
    viralWeight: 1.0,
    textSignals: [/\b(faq|q\s*&\s*a|ama|rapid[- ]fire|most asked|common question)\b/i],
    structuralHints: { minQuestionMarks: 3, expectsHighWpm: true },
  },
  {
    id: 'expert-clip',
    name: 'Expert Clip / Interview Bite',
    viralWeight: 1.0,
    textSignals: [/\b(interview|expert|podcast|clip|snippet|guest|they said)\b/i],
  },
  {
    id: 'ugc-testimonial',
    name: 'UGC Testimonial / Social Proof Stack',
    viralWeight: 1.0,
    textSignals: [/\b(testimonial|social proof|user generated|ugc|customer said|review(?:s)?)\b/i],
  },
  {
    id: 'transformation-timelapse',
    name: 'Transformation Time-Lapse',
    viralWeight: 1.0,
    textSignals: [/\b(transformation|time[- ]?lapse|progress|glow[- ]?up|journey)\b/i],
    structuralHints: { expectsSceneChanges: true },
  },
  {
    id: 'checklist-audit',
    name: 'Checklist Review / Audit',
    viralWeight: 1.0,
    textSignals: [/\b(audit|review|checklist|grade|rating|score|rank(?:ing)?)\b/i],
  },
  {
    id: 'template-framework',
    name: 'Template/Framework Explainer',
    viralWeight: 1.0,
    textSignals: [/\b(template|framework|formula|blueprint|system|method|model)\b/i],
  },
  {
    id: 'price-roi',
    name: 'Price/ROI Breakdown',
    viralWeight: 1.0,
    textSignals: [/\b(price|roi|return on|cost|worth|invest(?:ment)?|budget|dollar|pay(?:ing)?)\b/i],
  },
  {
    id: 'regulation-update',
    name: 'Regulation/Update Explainer',
    viralWeight: 1.0,
    textSignals: [/\b(regulation|update|new (?:rule|law|policy)|change(?:s|d)|announcement|breaking)\b/i],
  },
  {
    id: 'routine-system',
    name: 'Routine/System',
    viralWeight: 1.0,
    textSignals: [/\b(routine|morning|evening|daily|system|habit|ritual)\b/i],
  },
  {
    id: 'slideshow-infographic',
    name: 'Slideshow Infographic',
    viralWeight: 1.0,
    textSignals: [/\b(slide|infographic|carousel|swipe|visual(?:ize)?)\b/i],
    structuralHints: { expectsLowWpm: true, expectsSceneChanges: true },
  },
];

// =============================================================================
// PREDICTION PATHS — 4 paths with base weights
// =============================================================================

export const PATH_DEFINITIONS: PathDefinition[] = [
  {
    id: 'quantitative',
    name: 'Quantitative Analysis',
    componentIds: [],
    baseWeight: 0.15,
    defaultContext: 'immediate-analysis',
  },
  {
    id: 'qualitative',
    name: 'Qualitative Analysis',
    componentIds: ['gpt4', 'gemini', 'claude'],
    baseWeight: 0.25,
    defaultContext: 'content-planning',
  },
  {
    id: 'pattern_based',
    name: 'Pattern Recognition',
    componentIds: [
      'ffmpeg', 'visual-scene-detector', 'thumbnail-analyzer', 'audio-analyzer',
      '7-legos', '9-attributes', '24-styles',
      'pattern-extraction', 'hook-scorer', 'virality-indicator', 'xgboost-virality-ml',
      'visual-rubric', 'unified-grading', 'editing-coach', 'viral-mechanics',
    ],
    baseWeight: 0.45,
    defaultContext: 'template-selection',
  },
  {
    id: 'historical',
    name: 'Historical Comparison',
    // ALL components removed — path contributes 0 to predictions.
    // Weight redistributed to surviving paths via graceful degradation.
    componentIds: [],
    baseWeight: 0.15,
    defaultContext: 'trending-library',
  },
];

// =============================================================================
// CONTEXT WEIGHTS — by workflow type
// =============================================================================

export const CONTEXT_WEIGHTS: Record<WorkflowType, Record<string, number>> = {
  'content-planning': {
    quantitative: 0.15,
    qualitative: 0.25,
    pattern_based: 0.45,
    historical: 0.15,
  },
  'template-selection': {
    quantitative: 0.10,
    qualitative: 0.20,
    pattern_based: 0.55,
    historical: 0.15,
  },
  'quick-win': {
    quantitative: 0.15,
    qualitative: 0.20,
    pattern_based: 0.50,
    historical: 0.15,
  },
  'immediate-analysis': {
    quantitative: 0.20,
    qualitative: 0.25,
    pattern_based: 0.40,
    historical: 0.15,
  },
  'trending-library': {
    quantitative: 0.10,
    qualitative: 0.20,
    pattern_based: 0.40,
    historical: 0.30,
  },
};

// =============================================================================
// VPS TIER SYSTEM (System 1) — for prediction score gauge display
// =============================================================================

export const VPS_TIERS: VpsTier[] = [
  { minScore: 90, label: 'Viral Potential', colorClass: 'text-purple-400', gradient: { start: '#a855f7', end: '#7c3aed' } },
  { minScore: 75, label: 'Excellent - Top 10%', colorClass: 'text-green-400', gradient: { start: '#22c55e', end: '#10b981' } },
  { minScore: 60, label: 'Good - Top 25%', colorClass: 'text-green-500', gradient: { start: '#84cc16', end: '#22c55e' } },
  { minScore: 40, label: 'Average', colorClass: 'text-yellow-400', gradient: { start: '#eab308', end: '#f59e0b' } },
  { minScore: 0, label: 'Needs Work', colorClass: 'text-red-400', gradient: { start: '#ef4444', end: '#f97316' } },
];

// =============================================================================
// DPS TIER SYSTEM (System 3) — for post-publication percentile classification
// =============================================================================

export const DPS_PERCENTILE_TIERS: DpsTier[] = [
  { minPercentile: 99.9, minZScore: 3.0, category: 'mega-viral' },
  { minPercentile: 99.0, minZScore: 2.5, category: 'hyper-viral' },
  { minPercentile: 95.0, minZScore: 2.0, category: 'viral' },
  { minPercentile: 90.0, minZScore: 1.5, category: 'trending' },
  { minPercentile: 0, minZScore: -Infinity, category: 'normal' },
];

// =============================================================================
// LLM CONSENSUS GATE CONSTANTS
// =============================================================================

export const LLM_COMPONENT_IDS = new Set([
  'gpt4', 'gemini', 'claude',
]);

/** VPS spread above which LLM weight is zeroed */
export const LLM_SPREAD_THRESHOLD = 10;

/** Max weight any LLM component can contribute when spread is within threshold */
export const LLM_CONSENSUS_WEIGHT_CAP = 0.15;

// =============================================================================
// AGREEMENT THRESHOLDS
// =============================================================================

export const AGREEMENT_THRESHOLDS = {
  /** StdDev below this = high agreement → synthesizeConfidentPrediction */
  HIGH_STDDEV: 5,
  /** StdDev below this = moderate agreement → synthesizeWeightedConsensus */
  MODERATE_STDDEV: 15,
  /** StdDev above MODERATE_STDDEV = low agreement → performDisagreementReconciliation */
};

// =============================================================================
// CALIBRATION CONSTANTS
// =============================================================================

export const CALIBRATION = {
  /** Multiply confidence by this when no speech detected */
  CONFIDENCE_PENALTY_NO_SPEECH: 0.7,
  /** Max VPS for silent videos with low visual scores */
  SILENT_VIDEO_VPS_CAP: 55,
  /** Looser cap for visual-first styles/niches */
  SILENT_VIDEO_VPS_CAP_VISUAL_FIRST: 65,
  /** Pack V must be above this to avoid silent video cap */
  SILENT_VIDEO_PACKV_THRESHOLD: 50,
  /** Minimum chars to count as "has language signal" */
  MIN_TRANSCRIPT_LENGTH: 10,
  /** Apply high VPS scaling above this threshold */
  HIGH_VPS_THRESHOLD: 60,
  /** Progressive scaling factors for high predictions */
  HIGH_VPS_SCALING: {
    /** VPS > 80: 25% reduction */
    above80: 0.75,
    /** VPS > 70: 20% reduction */
    above70: 0.80,
    /** VPS 60-70: 15% reduction */
    above60: 0.85,
  },
  /** Styles where silent videos are legitimate (primary determination) */
  VISUAL_FIRST_STYLES: [
    'meme_edit', 'satisfying', 'asmr', 'cooking_montage', 'product_demo',
    'timelapse', 'cinematic', 'tutorial_silent', 'art_process', 'transformation',
  ] as readonly string[],
  /** Niches used as fallback only when detected_style is missing */
  VISUAL_FIRST_NICHES_FALLBACK: [
    'asmr', 'satisfying', 'cooking', 'art_process', 'product_demo',
  ] as readonly string[],
  /** Confidence bounds */
  CONFIDENCE_FLOOR: 0.4,
  CONFIDENCE_CEILING: 0.95,
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Returns the count of active components (excluding always-disabled niche-keywords).
 */
export function getActiveComponentCount(): number {
  // niche-keywords is registered but always disabled at runtime
  return Object.keys(COMPONENT_REGISTRY).length - 1;
}

/**
 * Look up VPS tier (System 1) for a given score.
 */
export function getVpsTier(score: number): VpsTier {
  return VPS_TIERS.find(t => score >= t.minScore) || VPS_TIERS[VPS_TIERS.length - 1];
}

/**
 * Look up DPS percentile tier (System 3) for a given percentile.
 */
export function getDpsTier(percentile: number): DpsTier {
  return DPS_PERCENTILE_TIERS.find(t => percentile >= t.minPercentile) || DPS_PERCENTILE_TIERS[DPS_PERCENTILE_TIERS.length - 1];
}

/**
 * Find a niche by key. Normalizes underscores to hyphens for lookup.
 */
export function getNicheByKey(key: string): NicheDefinition | undefined {
  const normalized = key.toLowerCase().replace(/_/g, '-');
  return NICHE_REGISTRY.find(n => n.key === normalized);
}

/**
 * Get all niches that have a trained XGBoost model.
 */
export function getTrainedNiches(): NicheDefinition[] {
  return NICHE_REGISTRY.filter(n => n.hasTrainedModel);
}

/**
 * Look up niche difficulty factor. Falls back to calibration-only niches, then default.
 */
export function getNicheDifficultyFactor(niche: string): number {
  const normalized = niche?.toLowerCase().replace(/_/g, '-').replace(/[^a-z-]/g, '') || 'general';
  const found = NICHE_REGISTRY.find(n => n.key === normalized);
  if (found) return found.difficultyFactor;
  const calibrationOnly = CALIBRATION_ONLY_NICHES[normalized];
  if (calibrationOnly !== undefined) return calibrationOnly;
  return 0.95; // Default for unknown niches
}
