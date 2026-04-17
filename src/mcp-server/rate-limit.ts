/**
 * Prompt 43 — Per-tier daily rate limiting for MCP calls.
 *
 * Policy (spec filled in by user):
 *   enterprise : unlimited
 *   pro        : 1000 / 24h
 *   growth     : 500  / 24h
 *   starter    : 100  / 24h
 *
 * Unknown tiers fall through to the most conservative limit (starter)
 * rather than unlimited — fail-safe.
 *
 * Window: rolling 24 hours, counted from `mcp_call_log.called_at`.
 * This is a strict-count check — we query COUNT(*) before each call
 * and reject if >= the limit. Logging the call happens AFTER the
 * tool handler runs (or fails), so the count reflects prior
 * successful-or-failed attempts equally. This is intentional:
 * burning quota on errors prevents retry storms.
 *
 * Race conditions: two concurrent callers might both read count=99
 * and both proceed, ending at 101. For stdio MCP (one Claude session
 * at a time) this is negligible. Serializable transaction would fix
 * it at cost of throughput — not worth it here.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export const TIER_LIMITS: Record<string, number> = {
  enterprise: Infinity,
  pro: 1000,
  growth: 500,
  starter: 100,
}

export const DEFAULT_LIMIT = TIER_LIMITS.starter

export interface RateLimitCheck {
  allowed: boolean
  limit: number
  used: number
  remaining: number
  reset_at: string
}

function limitForTier(tier: string): number {
  return TIER_LIMITS[tier] ?? DEFAULT_LIMIT
}

export async function checkRateLimit(
  db: SupabaseClient,
  agencyId: string,
  agencyTier: string,
): Promise<RateLimitCheck> {
  const limit = limitForTier(agencyTier)

  if (limit === Infinity) {
    return {
      allowed: true,
      limit: Infinity,
      used: 0,
      remaining: Infinity,
      reset_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    }
  }

  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { count, error } = await db
    .from('mcp_call_log')
    .select('*', { count: 'exact', head: true })
    .eq('agency_id', agencyId)
    .gte('called_at', cutoff)

  if (error) {
    // Fail-closed on DB errors: safer to reject than to over-serve.
    return {
      allowed: false,
      limit,
      used: -1,
      remaining: 0,
      reset_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    }
  }

  const used = count || 0
  return {
    allowed: used < limit,
    limit,
    used,
    remaining: Math.max(0, limit - used),
    reset_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  }
}

export async function logCall(
  db: SupabaseClient,
  params: {
    api_key_id: string
    agency_id: string
    tool_name: string
    duration_ms: number
    ok: boolean
    error_code?: string | null
  },
): Promise<void> {
  const { error } = await db.from('mcp_call_log').insert({
    api_key_id: params.api_key_id,
    agency_id: params.agency_id,
    tool_name: params.tool_name,
    duration_ms: params.duration_ms,
    ok: params.ok,
    error_code: params.error_code ?? null,
  })
  if (error) {
    // Don't throw — logging failures shouldn't fail the tool call.
    // eslint-disable-next-line no-console
    console.error('[mcp] logCall failed:', error.message)
  }
}
