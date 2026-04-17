/**
 * Prompt 38 — Agent2/ULTRAPLAN types
 *
 * Shared types between the planning worker, context assembler, and
 * API routes. The session lifecycle is documented in the migration.
 */

export type RequesterRole = 'chairman' | 'agency';

export type PlanningSessionStatus =
  | 'queued'
  | 'running'
  | 'reviewing'
  | 'approved'
  | 'rejected'
  | 'failed';

export interface PlanningSessionCaps {
  maxSeconds: number;
  maxOutputTokens: number;
  maxCostUsd: number;
}

/** Hard defaults for any new session. See CLAUDE.md rule on cost ceilings. */
export const DEFAULT_CAPS: PlanningSessionCaps = {
  maxSeconds: 600, // 10 minutes
  maxOutputTokens: 50_000,
  maxCostUsd: 5.0,
};

/** Chairman can raise caps per-session up to these ceilings. */
export const CHAIRMAN_MAX_CAPS: PlanningSessionCaps = {
  maxSeconds: 1800, // 30 minutes
  maxOutputTokens: 100_000,
  maxCostUsd: 15.0,
};

/**
 * Production deployment timeout (separate prompt to wire up).
 * Local dev uses DEFAULT_CAPS.maxSeconds (10 min) via `void promise`
 * in the Next dev server. On Vercel/Render this must drop to 4 min
 * to fit inside serverless function timeouts — or better, move to a
 * dedicated worker (Supabase Edge Function max = 400s; a real queue
 * like Inngest/Trigger.dev for anything longer).
 *
 * TODO(prod-deploy): pick a worker runtime before turning test_mode
 * off in production. See Prompt 38 planning doc.
 */
export const PRODUCTION_MAX_SECONDS = 240;

/**
 * Pricing for cost estimation. Matches Anthropic published prices for
 * claude-opus-4-6 as of 2026-04 (in $/million tokens). Update here if
 * Anthropic changes pricing — the worker uses these constants and
 * nothing else.
 */
export const OPUS_PRICING = {
  input_per_mtok: 15.0,
  output_per_mtok: 75.0,
  /**
   * Extended thinking tokens are billed at the same rate as output.
   * Prompt caching is not used here (sessions are one-shot).
   */
} as const;

export function estimateCostUsd(inputTokens: number, outputTokens: number): number {
  const input = (inputTokens / 1_000_000) * OPUS_PRICING.input_per_mtok;
  const output = (outputTokens / 1_000_000) * OPUS_PRICING.output_per_mtok;
  return Math.round((input + output) * 10_000) / 10_000; // 4 decimal places
}

export interface ContextSnapshot {
  scope: 'platform' | 'agency';
  collected_at: string;
  agency_id: string | null;
  agency_name: string | null;
  platform: {
    agencies_total: number;
    creators_total: number;
    completed_predictions_total: number;
    live_chairman_alerts: number;
  };
  agency_stats: {
    tier: string | null;
    total_creators: number;
    total_videos: number;
    avg_dps: number | null;
  } | null;
  recent_alerts: Array<{
    alert_type: string;
    severity: string;
    title: string;
    created_at: string;
  }>;
  recent_coordinator_tasks: Array<{
    task_type: string;
    status: string;
    completed_at: string | null;
  }>;
}

export interface PlanOutputStreaming {
  partial_text: string;
  thinking_text?: string;
  blocks_count: number;
}

export interface PlanOutputFinal {
  text: string;
  thinking?: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
    cache_read_input_tokens?: number;
    cache_creation_input_tokens?: number;
  };
  stop_reason: string | null;
  model: string;
  test_mode: boolean;
}

export interface PlanningSessionRow {
  id: string;
  requester_role: RequesterRole;
  requester_user_id: string | null;
  agency_id: string | null;
  input_prompt: string;
  context_snapshot: ContextSnapshot | null;
  model_used: string | null;
  status: PlanningSessionStatus;
  plan_output: PlanOutputStreaming | PlanOutputFinal | null;
  error_message: string | null;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  cap_max_seconds: number;
  cap_max_output_tokens: number;
  cap_max_cost_usd: number;
  test_mode: boolean;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}
