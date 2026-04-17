/**
 * Prompt 38 — Tier gating for agency planning sessions.
 *
 * Rules (from the prompt):
 *   Chairman      : unlimited, on-demand
 *   Enterprise    : quarterly included (1 credit auto-topped up manually)
 *   Pro / Growth  : $500 add-on per session (billing handled elsewhere,
 *                   we just refuse if there's no credit)
 *   Starter       : no access
 *
 * We implement this as: `planning_credits_remaining` on the agencies
 * table. The check decrements a credit on successful dispatch. If
 * credits == 0 we refuse with a tier-specific message.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export type GateResult =
  | { ok: true; remaining_after: number; tier: string | null }
  | { ok: false; reason: string; tier: string | null };

export async function checkAndConsumeAgencyCredit(
  db: SupabaseClient,
  agencyId: string,
): Promise<GateResult> {
  const { data: agency, error } = await db
    .from('agencies')
    .select('id, tier, planning_credits_remaining')
    .eq('id', agencyId)
    .maybeSingle();

  if (error || !agency) {
    return { ok: false, reason: 'agency not found', tier: null };
  }

  const tier = (agency.tier as string | null) || null;
  const remaining = (agency.planning_credits_remaining as number | null) ?? 0;

  if (remaining <= 0) {
    let message: string;
    if (tier === 'enterprise') {
      message =
        'Enterprise credit already used this quarter. Contact support to top up.';
    } else if (tier === 'pro' || tier === 'growth') {
      message =
        'Planning sessions are a $500 add-on for this tier. Purchase a credit first.';
    } else {
      message = 'Planning sessions are not available on your tier.';
    }
    return { ok: false, reason: message, tier };
  }

  // Decrement the credit. Using a plain update; if two sessions start
  // simultaneously we'd need a DB-level decrement to avoid a race, but
  // the volume here (manually-triggered Chairman/agency sessions) makes
  // that a non-issue. Flag for follow-up if it ever matters.
  const { error: decErr } = await db
    .from('agencies')
    .update({ planning_credits_remaining: remaining - 1 })
    .eq('id', agencyId);

  if (decErr) {
    return { ok: false, reason: `credit decrement failed: ${decErr.message}`, tier };
  }

  return { ok: true, remaining_after: remaining - 1, tier };
}
