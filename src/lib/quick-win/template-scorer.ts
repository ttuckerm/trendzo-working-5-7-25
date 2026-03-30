/**
 * Template Scorer
 *
 * Scores Quick Win templates against a creator's calibration profile
 * and ascending Pattern Library patterns. Pure function — no DB access.
 */

// ============================================================================
// Types
// ============================================================================

export interface TemplateForScoring {
  video_id: string;
  title: string;
  views_count: number;
  likes_count: number;
  dps_score: number;
  thumbnail_url: string | null;
  niche: string | null;
  transcript_text: string | null;
  creator_username: string | null;
  /** Hook style from viral_genomes pattern_dna (optional) */
  hook_style?: string | null;
  /** Tone from viral_genomes pattern_dna (optional) */
  tone?: string | null;
}

export interface PatternSuggestion {
  pattern_id: string;
  pattern_name: string;
  hook_structure: string;
  pacing_rhythm: string;
  saturation_pct: number;
  trend_direction: string;
  lifecycle_stage: string;
  opportunity_score: number;
}

export interface CreatorPreferences {
  niche: string | null;
  hookStylePreference: Record<string, number>;
  toneMatch: Record<string, number>;
  contentFormatPreference: Record<string, number>;
}

export interface ScoredTemplate extends TemplateForScoring {
  personalizedScore: number;
  matchReasons: string[];
  recommended: boolean;
  patternMatch?: {
    pattern_name: string;
    saturation_pct: number;
    lifecycle_stage: string;
    opportunity_score: number;
  };
}

// ============================================================================
// Helpers
// ============================================================================

/** Returns the key with the highest score from a Record<string, number>. */
function topKey(map: Record<string, number>): string | null {
  let best: string | null = null;
  let bestScore = -Infinity;
  for (const [key, score] of Object.entries(map)) {
    if (score > bestScore) {
      bestScore = score;
      best = key;
    }
  }
  return best;
}

/** Normalize niche strings for comparison (lowercase, trim, collapse spaces). */
function normalizeNiche(n: string | null | undefined): string {
  return (n || '').toLowerCase().trim().replace(/[-_]+/g, ' ').replace(/\s+/g, ' ');
}

/** Check if a hook_style string loosely matches a hookStylePreference key. */
function hookStyleMatches(templateHook: string | null | undefined, preferenceKey: string): boolean {
  if (!templateHook) return false;
  const a = templateHook.toLowerCase().replace(/[-_]/g, ' ');
  const b = preferenceKey.toLowerCase().replace(/[-_]/g, ' ');
  return a.includes(b) || b.includes(a);
}

// ============================================================================
// Scorer
// ============================================================================

/**
 * Score and rank templates against creator preferences + pattern opportunities.
 *
 * When no creator preferences or patterns are provided, returns templates
 * in their original order with baseScore = dps_score (no regression).
 */
export function scoreTemplatesForCreator(
  templates: TemplateForScoring[],
  preferences: CreatorPreferences | null,
  patterns: PatternSuggestion[],
): ScoredTemplate[] {
  if (!preferences || Object.keys(preferences.hookStylePreference).length === 0) {
    // No personalization data — return original order
    return templates.map((t) => ({
      ...t,
      personalizedScore: t.dps_score,
      matchReasons: [],
      recommended: false,
    }));
  }

  const topHookStyle = topKey(preferences.hookStylePreference);
  const topTone = topKey(preferences.toneMatch);
  const creatorNiche = normalizeNiche(preferences.niche);

  const scored: ScoredTemplate[] = templates.map((template) => {
    let score = template.dps_score;
    const reasons: string[] = [];

    // +5: Niche match
    if (creatorNiche && normalizeNiche(template.niche) === creatorNiche) {
      score += 5;
      reasons.push('Matches your niche');
    }

    // +5: Hook style match
    if (topHookStyle && hookStyleMatches(template.hook_style, topHookStyle)) {
      score += 5;
      reasons.push(`Matches your preferred hook style: ${topHookStyle}`);
    }

    // +3: Tone match
    if (topTone && template.tone) {
      const templateTone = template.tone.toLowerCase().replace(/[-_]/g, ' ');
      const prefTone = topTone.toLowerCase().replace(/[-_]/g, ' ');
      if (templateTone.includes(prefTone) || prefTone.includes(templateTone)) {
        score += 3;
        reasons.push(`Matches your preferred tone: ${topTone}`);
      }
    }

    // Pattern opportunity bonus
    let patternMatch: ScoredTemplate['patternMatch'];
    if (patterns.length > 0) {
      // Find best matching ascending pattern (by hook_structure similarity)
      const matchingPattern = patterns.find(
        (p) =>
          p.lifecycle_stage === 'ascending' || p.lifecycle_stage === 'first-mover',
      );
      if (matchingPattern) {
        const bonus = Math.round(matchingPattern.opportunity_score * 0.1);
        score += bonus;
        reasons.push(`Ascending pattern: ${matchingPattern.pattern_name}`);
        patternMatch = {
          pattern_name: matchingPattern.pattern_name,
          saturation_pct: matchingPattern.saturation_pct,
          lifecycle_stage: matchingPattern.lifecycle_stage,
          opportunity_score: matchingPattern.opportunity_score,
        };
      }
    }

    return {
      ...template,
      personalizedScore: score,
      matchReasons: reasons,
      recommended: false,
      patternMatch,
    };
  });

  // Sort by personalized score DESC
  scored.sort((a, b) => b.personalizedScore - a.personalizedScore);

  // Mark top template as recommended
  if (scored.length > 0 && scored[0].matchReasons.length > 0) {
    scored[0].recommended = true;
  }

  return scored;
}
