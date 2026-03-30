/**
 * Pattern Performance Tracker
 *
 * Triggered when a content brief reaches 'measured' status with actual_vps.
 * Records the pattern performance delta into creator_pattern_performance,
 * building the per-creator-profile pattern effectiveness map.
 *
 * This is the proprietary data moat — maps which patterns work for which
 * creator profiles, enabling increasingly accurate personalization.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { resolveCreatorContext } from '@/lib/prediction/creator-context';

// ============================================================================
// Types
// ============================================================================

export interface PerformanceTrackingResult {
  recorded: boolean;
  pattern_id: string;
  delta: number;
  overperformed: boolean;   // delta > +10
  underperformed: boolean;  // delta < -10
}

// ============================================================================
// Main Export
// ============================================================================

/**
 * Record pattern performance when a brief is measured.
 * Returns null if the brief has no pattern, predicted_vps, or actual_vps.
 */
export async function trackPatternPerformance(
  supabase: SupabaseClient,
  briefId: string,
  userId: string,
): Promise<PerformanceTrackingResult | null> {
  // Fetch the brief
  const { data: brief, error: briefError } = await supabase
    .from('content_briefs')
    .select('pattern_id, predicted_vps, actual_vps')
    .eq('id', briefId)
    .eq('user_id', userId)
    .single();

  if (briefError || !brief) {
    console.error(`[PatternPerf] Brief not found: ${briefError?.message || 'no data'}`);
    return null;
  }

  // Must have all three values to record performance
  if (!brief.pattern_id || brief.predicted_vps == null || brief.actual_vps == null) {
    return null;
  }

  const predicted = Number(brief.predicted_vps);
  const actual = Number(brief.actual_vps);
  const delta = Math.round((actual - predicted) * 10) / 10;

  // Resolve current creator context for stage/niche snapshots
  let creatorStage: string | null = null;
  let nicheKey: string | null = null;

  try {
    const ctx = await resolveCreatorContext(supabase, userId);
    if (ctx) {
      creatorStage = ctx.creatorStage;
      nicheKey =
        ctx.calibrationProfile?.selectedNiche ||
        ctx.channelData?.inferredNicheKey ||
        null;
    }
  } catch {
    // Non-fatal — record without stage/niche
  }

  // Insert performance record
  const { error: insertError } = await supabase
    .from('creator_pattern_performance')
    .upsert(
      {
        user_id: userId,
        pattern_id: brief.pattern_id,
        brief_id: briefId,
        predicted_vps: predicted,
        actual_vps: actual,
        delta,
        creator_stage: creatorStage,
        niche_key: nicheKey,
      },
      { onConflict: 'user_id,pattern_id,brief_id' },
    );

  if (insertError) {
    console.error(`[PatternPerf] Insert failed: ${insertError.message}`);
    return null;
  }

  const overperformed = delta > 10;
  const underperformed = delta < -10;

  console.log(
    `[PatternPerf] Recorded: pattern=${brief.pattern_id}, delta=${delta}, ` +
      `${overperformed ? 'OVERPERFORMED' : underperformed ? 'UNDERPERFORMED' : 'within range'}`,
  );

  return {
    recorded: true,
    pattern_id: brief.pattern_id,
    delta,
    overperformed,
    underperformed,
  };
}
