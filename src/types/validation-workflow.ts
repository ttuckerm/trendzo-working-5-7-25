// FEAT-072: Admin Accuracy Validation Workflow - TypeScript Types
// Created: 2025-10-23

// ============================================================================
// VALIDATION RUN TYPES
// ============================================================================

export type ValidationStatus =
  | 'setup'
  | 'intake'
  | 'pattern_qa'
  | 'fingerprint'
  | 'predict'
  | 'validate'
  | 'complete';

export type PredictionStatus = 'green' | 'yellow' | 'red';

export type PatternQAStatus = 'verified' | 'review' | 'missing';

export interface ValidationRun {
  id: string;
  run_number: number;
  name: string;
  description?: string;

  // Experiment Constraints (Step 1)
  niche: string;
  video_format?: string;
  account_size?: string;
  timeframe?: string;
  success_metric: string;
  formula_locked?: Record<string, any>;

  // Workflow Status
  status: ValidationStatus;
  current_step: number;

  // Validation Results (Step 6)
  overall_accuracy?: number;
  green_precision?: number;
  yellow_recall?: number;
  lift_vs_baseline?: number;
  failure_modes?: Record<string, 'pass' | 'fail' | 'warning'>;

  // Decision Gate
  approved?: boolean;
  approved_at?: string;
  approved_by?: string;

  // Accuracy Target
  accuracy_target_min: number;
  accuracy_target_max: number;

  // Timestamps
  created_at: string;
  started_at?: string;
  completed_at?: string;
  last_updated_at: string;

  // Metadata
  created_by?: string;
  notes?: string;
}

// ============================================================================
// COHORT TYPES (Step 2)
// ============================================================================

export interface ValidationCohort {
  id: string;
  run_id: string;

  // Scraper Stats
  total_videos_scraped: number;
  videos_passing_dps: number;

  // Cohort Splits
  train_count: number;
  val_count: number;
  test_count: number;

  // Video IDs
  train_video_ids: string[];
  val_video_ids: string[];
  test_video_ids: string[];

  // Filters Applied
  language_filter?: string;
  timeframe_filter?: string;
  dedupe_method?: string;

  // Processing Stats
  avg_processing_time_seconds?: number;

  // Timestamps
  created_at: string;
}

// ============================================================================
// PATTERN TYPES (Step 3)
// ============================================================================

export interface ValidationPattern {
  id: string;
  run_id: string;
  video_id: string;

  // 9 Attributes
  hook_time?: string;
  visual_style?: string;
  audio_pattern?: string;
  text_overlay?: string;
  pacing?: string;
  emotion?: string;
  call_to_action?: string;
  share_trigger?: string;
  engagement_hook?: string;

  // QA Status for each attribute
  hook_time_status?: PatternQAStatus;
  visual_style_status?: PatternQAStatus;
  audio_pattern_status?: PatternQAStatus;
  text_overlay_status?: PatternQAStatus;
  pacing_status?: PatternQAStatus;
  emotion_status?: PatternQAStatus;
  call_to_action_status?: PatternQAStatus;
  share_trigger_status?: PatternQAStatus;
  engagement_hook_status?: PatternQAStatus;

  // Pattern Tags
  pattern_tags?: string[];

  // Auto-fill Confidence
  auto_fill_accuracy?: number;

  // Human Review
  reviewed_by?: string;
  reviewed_at?: string;
  human_corrections?: Record<string, any>;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface PatternQASummary {
  total_patterns: number;
  verified_count: number;
  review_count: number;
  missing_count: number;
  auto_fill_accuracy: number;
}

// ============================================================================
// FINGERPRINT TYPES (Step 4)
// ============================================================================

export interface ValidationFingerprint {
  id: string;
  run_id: string;

  // Cluster Info
  cluster_name: string;
  video_count: number;
  match_confidence: number;
  color_gradient: string;

  // Video IDs in cluster
  video_ids: string[];

  // Compendium Template Mapping
  template_id?: string;
  template_name?: string;
  pattern_weights?: Record<string, number>;
  performance_drivers?: string[];

  // Timestamps
  created_at: string;
}

export interface TemplateMappingSummary {
  best_fit_templates: number;
  pattern_weight_calculation: 'complete' | 'pending' | 'failed';
  performance_drivers: string[];
}

// ============================================================================
// PREDICTION TYPES (Step 5)
// ============================================================================

export interface ValidationPrediction {
  id: string;
  run_id: string;
  video_id: string;

  // Predicted Status
  predicted_status: PredictionStatus;
  predicted_dps: number;
  predicted_views_min?: number;
  predicted_views_max?: number;
  predicted_engagement_rate?: number;
  share_potential?: 'high' | 'medium' | 'low';

  // 9 Attributes Breakdown
  nine_attributes_breakdown?: NineAttributesBreakdown;

  // Recommended Fixes
  recommended_fixes?: RecommendedFix[];

  // Lockbox
  locked_at: string;
  lock_hash: string;

  // Actual Results
  actual_dps?: number;
  actual_views?: number;
  actual_engagement_rate?: number;
  actual_status?: PredictionStatus;
  actuals_updated_at?: string;

  // Validation
  prediction_correct?: boolean;
  dps_error?: number;

  // Timestamps
  created_at: string;
}

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

export interface RecommendedFix {
  issue: string;
  fix: string;
  severity: 'high' | 'medium' | 'low';
  impact?: string;
  video_count?: number;
}

export interface PredictionSummary {
  green_count: number;
  yellow_count: number;
  red_count: number;
  total_count: number;
}

// ============================================================================
// VALIDATION EVENT TYPES
// ============================================================================

export interface ValidationEvent {
  id: string;
  run_id: string;
  event_type: string;
  event_data: Record<string, any>;
  user_id?: string;
  created_at: string;
}

// ============================================================================
// SERVER ACTION RESPONSE TYPES
// ============================================================================

export interface CreateRunResponse {
  success: boolean;
  run?: ValidationRun;
  error?: string;
}

export interface BuildCohortResponse {
  success: boolean;
  cohort?: ValidationCohort;
  error?: string;
}

export interface ExtractPatternsResponse {
  success: boolean;
  patterns?: ValidationPattern[];
  summary?: PatternQASummary;
  error?: string;
}

export interface GenerateFingerprintsResponse {
  success: boolean;
  fingerprints?: ValidationFingerprint[];
  template_mapping?: TemplateMappingSummary;
  error?: string;
}

export interface LockPredictionsResponse {
  success: boolean;
  predictions?: ValidationPrediction[];
  summary?: PredictionSummary;
  error?: string;
}

export interface ValidateAccuracyResponse {
  success: boolean;
  run?: ValidationRun;
  accuracy_metrics?: {
    overall_accuracy: number;
    green_precision: number;
    yellow_recall: number;
    lift_vs_baseline: number;
    failure_modes: Record<string, 'pass' | 'fail' | 'warning'>;
  };
  meets_target?: boolean;
  error?: string;
}

// ============================================================================
// REQUEST PAYLOAD TYPES
// ============================================================================

export interface CreateRunRequest {
  name: string;
  description?: string;
  niche: string;
  video_format?: string;
  account_size?: string;
  timeframe?: string;
  success_metric: string;
  formula_locked?: Record<string, any>;
  created_by?: string;
}

export interface BuildCohortRequest {
  run_id: string;
  language_filter?: string;
  timeframe_filter?: string;
  dedupe_method?: string;
  dps_threshold?: number;
  limit?: number;
}

export interface ExtractPatternsRequest {
  run_id: string;
  video_ids: string[];
}

export interface GenerateFingerprintsRequest {
  run_id: string;
  video_ids: string[];
}

export interface LockPredictionsRequest {
  run_id: string;
  video_ids: string[];
  goal_id?: string;
}

export interface ValidateAccuracyRequest {
  run_id: string;
  test_video_ids: string[];
}

export interface UpdateRunRequest {
  run_id: string;
  status?: ValidationStatus;
  current_step?: number;
  notes?: string;
}

export interface ApproveRunRequest {
  run_id: string;
  approved: boolean;
  approved_by?: string;
  notes?: string;
}
