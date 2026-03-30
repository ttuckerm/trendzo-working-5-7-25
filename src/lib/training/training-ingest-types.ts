/**
 * Phase 82: Training Ingest v1 — Shared TypeScript Types
 *
 * Types for the training data collection pipeline.
 * These are used by the ingest endpoint, metric scheduler, and UI.
 */

// ---------------------------------------------------------------------------
// Request / Response types for POST /api/admin/training-ingest
// ---------------------------------------------------------------------------

export interface TrainingIngestRequest {
  videoFile: File;
  transcript: string;
  niche: string;
  goal: string;
  accountSize: string;
  platform?: string;
  platformVideoId?: string;
}

/**
 * Response from the training ingest endpoint.
 * IMPORTANT: No prediction scores, tiers, confidence, or component details
 * are included — internals stay hidden from the training ingest flow.
 */
export interface TrainingIngestResponse {
  run_id: string;
  video_id: string;
  schedule_count: number;
  platform_video_id_attached: boolean;
  /** Present when schedule creation fails but pipeline succeeded */
  schedule_error?: string;
  /** Contamination proof from the lock module (clean ingest only) */
  contamination_proof?: {
    inputs_hash: string;
    pipeline_version: string;
    flags: string[];
    generated_at: string;
  } | null;
}

// ---------------------------------------------------------------------------
// Metric schedule types
// ---------------------------------------------------------------------------

export type MetricCheckType = '4h' | '24h' | '48h' | '7d';
export type MetricScheduleStatus = 'pending' | 'scheduled' | 'completed' | 'failed' | 'skipped';

export interface MetricScheduleRow {
  id: string;
  prediction_run_id: string;
  video_id: string;
  platform: string;
  platform_video_id: string | null;
  check_type: MetricCheckType;
  scheduled_at: string;
  status: MetricScheduleStatus;
  actual_metrics: Record<string, unknown> | null;
  completed_at: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Attach platform ID types
// ---------------------------------------------------------------------------

export interface AttachPlatformIdRequest {
  platform: string;
  platform_video_id: string;
}

export interface AttachPlatformIdResponse {
  updated_count: number;
  post_url: string;
  schedule_count: number;
}

// ---------------------------------------------------------------------------
// Training run list types (for GET /api/admin/prediction-runs)
// ---------------------------------------------------------------------------

export interface TrainingRunSummary {
  run_id: string;
  video_id: string;
  niche: string | null;
  created_at: string;
  source: string;
  source_meta: Record<string, unknown> | null;
  schedules: {
    total: number;
    pending: number;
    completed: number;
    failed: number;
    platform_video_id: string | null;
  };
  /** Per-schedule detail rows (Phase 83 — populated when expanded) */
  schedule_rows?: MetricScheduleRow[];
  /** Contamination lock status */
  contamination_lock?: boolean;
  /** Contamination proof JSON */
  contamination_proof?: {
    inputs_hash: string;
    pipeline_version: string;
    flags: string[];
    generated_at: string;
  } | null;
  /** Ingest mode: 'clean' or 'dirty_allowed' */
  ingest_mode?: string | null;
}

// ---------------------------------------------------------------------------
// Phase 83: Metric Collector types
// ---------------------------------------------------------------------------

export interface MetricCollectorRequest {
  run_id?: string;
  limit?: number;
  dry_run?: boolean;
}

export interface MetricCollectorResult {
  processed: number;
  succeeded: number;
  failed: number;
  skipped: number;
  dry_run: boolean;
  details: MetricCollectorItemResult[];
}

export interface MetricCollectorItemResult {
  schedule_id: string;
  prediction_run_id: string;
  check_type: string;
  platform_video_id: string;
  status: 'completed' | 'failed' | 'skipped';
  error?: string;
  metrics?: TikTokMetricsPayload;
}

/** Minimal metrics captured from TikTok */
export interface TikTokMetricsPayload {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number | null;
  author: string | null;
  follower_count: number | null;
  posted_at: string | null;
  collected_at: string;
  source: 'apify';
  raw_stats?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Feature #3: Metric Attach types
// ---------------------------------------------------------------------------

export interface MetricAttachResult {
  processed: number;
  attached: number;
  skipped: number;
  failed: number;
  details: MetricAttachItemResult[];
}

export interface MetricAttachItemResult {
  run_id: string;
  status: 'attached' | 'skipped' | 'failed' | 'incomplete';
  check_type_used?: string;
  actual_dps?: number | null;
  actual_tier?: string;
  skip_reason?: string;
  error?: string;
}

export interface MetricScheduleSummary {
  prediction_run_id: string;
  video_id: string;
  platform_video_id: string | null;
  niche: string | null;
  created_at: string;
  has_actuals: boolean;
  contamination_lock: boolean | null;
  checks: {
    '4h': { status: string; completed_at: string | null; views: number | null } | null;
    '24h': { status: string; completed_at: string | null; views: number | null } | null;
    '48h': { status: string; completed_at: string | null; views: number | null } | null;
    '7d': { status: string; completed_at: string | null; views: number | null } | null;
  };
}
