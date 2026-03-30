// FEAT-071: Unified Creator Workflow Types
// Created: 2025-10-22

// ============================================================================
// GOALS (OBJ-01 through OBJ-05)
// ============================================================================

export type GoalId = 'OBJ-01' | 'OBJ-02' | 'OBJ-03' | 'OBJ-04' | 'OBJ-05';

export interface Goal {
  id: GoalId;
  name: string;
  description: string;
  icon: string;
  kpi: string;
  target: number;
}

export const GOALS: Goal[] = [
  {
    id: 'OBJ-01',
    name: 'Build Engaged Following',
    description: 'Grow your audience and increase follower count',
    icon: '👥',
    kpi: 'follower_growth_rate',
    target: 0.15 // 15% monthly growth
  },
  {
    id: 'OBJ-02',
    name: 'Boost Engagement',
    description: 'Increase likes, comments, and shares',
    icon: '⚡',
    kpi: 'engagement_rate',
    target: 0.08 // 8% engagement rate
  },
  {
    id: 'OBJ-03',
    name: 'Drive Traffic',
    description: 'Get more visitors to your website or link',
    icon: '🌐',
    kpi: 'click_through_rate',
    target: 0.05 // 5% CTR
  },
  {
    id: 'OBJ-04',
    name: 'Generate Leads',
    description: 'Collect potential customers or signups',
    icon: '📧',
    kpi: 'lead_conversion_rate',
    target: 0.03 // 3% conversion
  },
  {
    id: 'OBJ-05',
    name: 'Build Awareness',
    description: 'Increase brand recognition and reach',
    icon: '🏆',
    kpi: 'reach',
    target: 100000 // 100k views
  }
];

// ============================================================================
// VIRAL VIDEOS (Step 2: Discover)
// ============================================================================

export interface ViralVideo {
  video_id: string;
  dps_score: number;
  views: number;
  likes: number;
  comments?: number;
  shares?: number;
  hook: string;
  framework_id?: string;
  framework_name?: string;
  platform: 'tiktok' | 'instagram' | 'youtube';
  url: string;
  thumbnail?: string;
  creator: string;
  caption?: string;
  transcript?: string;
  created_at?: string;
}

// ============================================================================
// NINE FIELDS (Step 3: Design)
// ============================================================================

export interface NineFields {
  topic: string;
  angle: string;
  hook_spoken: string;
  hook_text: string;
  hook_visual: string;
  story_structure: string;
  visual_format: string;
  key_visuals: string[];
  audio: string;
}

export interface FrameworkMatch {
  id: string;
  name: string;
  success_rate: number;
  confidence: number;
  description?: string;
}

// ============================================================================
// PREDICTION (Step 4: Predict)
// ============================================================================

export interface NineAttributesBreakdown {
  tam_resonance: number;
  sharability: number;
  hook_strength: number;
  format_innovation: number;
  value_density: number;
  pacing_rhythm: number;
  curiosity_gaps: number;
  emotional_journey: number;
  payoff_satisfaction: number;
}

export interface SuggestedImprovement {
  issue: string;
  fix: string;
  impact: string;
  one_click_fix: boolean;
  apply_action?: () => void;
}

export interface Prediction {
  dps_score: number;
  status: 'green' | 'yellow' | 'red';
  projected_views: {
    min: number;
    max: number;
    avg: number;
  };
  projected_engagement_rate: number;
  share_potential: 'low' | 'medium' | 'high';
  nine_attributes_breakdown: NineAttributesBreakdown;
  whats_working: string[];
  suggested_improvements: SuggestedImprovement[];
  recommended_hooks: string[];
}

// ============================================================================
// WORKFLOW SESSION
// ============================================================================

export type WorkflowStatus = 'goal_selected' | 'discovering' | 'designing' | 'predicting' | 'complete';

export interface CreatorWorkflow {
  id: string;
  user_id: string;
  goal_id: GoalId;
  niche: string | null;
  status: WorkflowStatus;

  // Step 2: Discover
  discovered_videos: ViralVideo[];

  // Step 3: Design
  script_draft: Partial<NineFields>;
  framework_id: string | null;
  framework_confidence: number | null;

  // Step 4: Predict
  prediction_result: Prediction | null;
  predicted_dps: number | null;

  // Metadata
  started_at: string;
  completed_at: string | null;
  last_updated_at: string;
  audit_id: string;

  // Privacy
  pii_flags: Record<string, boolean>;
  retention_days: number;
}

// ============================================================================
// WORKFLOW EVENTS
// ============================================================================

export type WorkflowEventType =
  | 'goal_selected'
  | 'discovery_started'
  | 'discovery_complete'
  | 'suggestion_started'
  | 'suggestion_complete'
  | 'prediction_started'
  | 'prediction_complete'
  | 'script_exported';

export interface WorkflowEvent {
  id: string;
  workflow_id: string;
  event_type: WorkflowEventType;
  event_data: Record<string, any>;
  audit_id: string;
  created_at: string;
}

// ============================================================================
// API RESPONSES
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  auditId: string;
}

export interface DiscoverResponse {
  videos: ViralVideo[];
  total_found: number;
  cache_age_hours?: number;
  cached?: boolean;
}

export interface SuggestResponse {
  suggestions: NineFields;
  framework_matched: FrameworkMatch | null;
  partial?: boolean;
}

export interface PredictResponse {
  prediction: Prediction;
}

// ============================================================================
// UI STATE
// ============================================================================

export interface WorkflowUIState {
  currentStep: 1 | 2 | 3 | 4;
  selectedGoal: Goal | null;
  discoveredVideos: ViralVideo[];
  scriptDraft: Partial<NineFields>;
  frameworkMatch: FrameworkMatch | null;
  prediction: Prediction | null;
  loading: boolean;
  error: string | null;
}
