/**
 * Content Calendar Generator
 *
 * Pure function that generates a 30-day content calendar (15 briefs) from:
 * - Creator context (preferences, stage, niche)
 * - Pattern Library (archetypes with metrics)
 * - Brief history (avoid repeating recent patterns)
 * - Performance history (boost/penalize based on actual results)
 *
 * Uses Gemini to generate personalized topic angles and hooks.
 * No side effects — returns data only, caller handles persistence.
 */

import { GoogleGenAI } from '@google/genai';
import type { CreatorContext } from '@/lib/prediction/creator-context';
import { computeOpportunityScore } from '@/lib/patterns/pattern-metrics';

// ============================================================================
// Types
// ============================================================================

export type NarrativeArc =
  | 'transformation'
  | 'revelation'
  | 'warning'
  | 'social_proof'
  | 'challenge'
  | 'insider_access'
  | 'myth_bust';

export interface PatternWithMetrics {
  pattern_id: string;
  pattern_name: string;
  narrative_arc: NarrativeArc;
  psych_trigger: string;
  hook_structure: string;
  pacing_rhythm: string;
  cta_type: string;
  saturation_pct: number;
  trend_direction: string;
  opportunity_score: number;
}

export interface BriefHistoryEntry {
  pattern_id: string | null;
  status: string;
  created_at: string;
}

export interface PatternPerformanceEntry {
  pattern_id: string;
  delta: number;
  creator_stage: string | null;
}

export interface CalendarBrief {
  day: number;
  pattern_id: string;
  pattern_name: string;
  narrative_arc: NarrativeArc;
  topic_angle: string;
  hook_text: string;
  format_suggestion: string;
  predicted_vps: number;
  opportunity_score: number;
  status: 'pending' | 'accepted' | 'completed';
  brief_id: string | null;
  actual_vps: number | null;
}

export interface CalendarGenerationInput {
  creatorContext: CreatorContext;
  patterns: PatternWithMetrics[];
  briefHistory: BriefHistoryEntry[];
  niche: string;
  performanceHistory: PatternPerformanceEntry[];
}

export interface CalendarGenerationResult {
  briefs: CalendarBrief[];
  generated_at: string;
  niche: string;
  total_briefs: number;
}

// ============================================================================
// Constants
// ============================================================================

const BRIEF_COUNT = 15;
const CALENDAR_DAYS = 30;
const BRIEF_DAYS = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29];

const ALL_ARCS: NarrativeArc[] = [
  'transformation',
  'revelation',
  'warning',
  'social_proof',
  'challenge',
  'insider_access',
  'myth_bust',
];

// ============================================================================
// Main Export
// ============================================================================

/**
 * Generate a 30-day content calendar with 15 personalized briefs.
 * Returns empty briefs array if insufficient patterns available.
 */
export async function generateContentCalendar(
  input: CalendarGenerationInput,
): Promise<CalendarGenerationResult> {
  const { creatorContext, patterns, briefHistory, niche, performanceHistory } = input;

  if (patterns.length === 0) {
    return {
      briefs: [],
      generated_at: new Date().toISOString(),
      niche,
      total_briefs: 0,
    };
  }

  // Step 1: Filter out recently executed patterns (last 30 days)
  const recentPatternIds = new Set(
    briefHistory
      .filter(b => {
        if (!b.pattern_id) return false;
        const age = Date.now() - new Date(b.created_at).getTime();
        return age < 30 * 24 * 3600 * 1000;
      })
      .map(b => b.pattern_id),
  );

  const availablePatterns = patterns.filter(
    p => !recentPatternIds.has(p.pattern_id) && p.trend_direction !== 'declining',
  );

  // If not enough unused patterns, allow recently used ones but deprioritize
  const candidatePatterns =
    availablePatterns.length >= BRIEF_COUNT
      ? availablePatterns
      : [...availablePatterns, ...patterns.filter(p => !availablePatterns.includes(p) && p.trend_direction !== 'declining')];

  if (candidatePatterns.length === 0) {
    return {
      briefs: [],
      generated_at: new Date().toISOString(),
      niche,
      total_briefs: 0,
    };
  }

  // Step 2: Score patterns
  const performanceByPattern = buildPerformanceMap(performanceHistory);
  const scoredPatterns = candidatePatterns.map(p => ({
    ...p,
    adjustedScore: computeAdjustedScore(p, performanceByPattern, recentPatternIds),
  }));

  // Step 3: Select 15 patterns with arc diversification
  const selectedPatterns = selectDiversePatterns(scoredPatterns, BRIEF_COUNT);

  // Step 4: Generate personalized content via Gemini
  const enrichedBriefs = await generateBriefContent(selectedPatterns, creatorContext, niche);

  // Step 5: Build calendar briefs
  const briefs: CalendarBrief[] = selectedPatterns.map((p, idx) => {
    const enrichment = enrichedBriefs[idx] || { topic_angle: '', hook_text: '' };
    const formatSuggestion = suggestFormat(creatorContext, p);

    return {
      day: BRIEF_DAYS[idx],
      pattern_id: p.pattern_id,
      pattern_name: p.pattern_name,
      narrative_arc: p.narrative_arc,
      topic_angle: enrichment.topic_angle || `${p.pattern_name} angle for ${niche}`,
      hook_text: enrichment.hook_text || `Check this out...`,
      format_suggestion: formatSuggestion,
      predicted_vps: estimateVps(p.opportunity_score),
      opportunity_score: p.opportunity_score,
      status: 'pending' as const,
      brief_id: null,
      actual_vps: null,
    };
  });

  return {
    briefs,
    generated_at: new Date().toISOString(),
    niche,
    total_briefs: briefs.length,
  };
}

// ============================================================================
// Scoring
// ============================================================================

function buildPerformanceMap(
  history: PatternPerformanceEntry[],
): Map<string, { avgDelta: number; count: number }> {
  const map = new Map<string, { totalDelta: number; count: number }>();

  for (const entry of history) {
    const existing = map.get(entry.pattern_id);
    if (existing) {
      existing.totalDelta += entry.delta;
      existing.count++;
    } else {
      map.set(entry.pattern_id, { totalDelta: entry.delta, count: 1 });
    }
  }

  const result = new Map<string, { avgDelta: number; count: number }>();
  for (const [id, stats] of map) {
    result.set(id, { avgDelta: stats.totalDelta / stats.count, count: stats.count });
  }
  return result;
}

function computeAdjustedScore(
  pattern: PatternWithMetrics,
  performanceMap: Map<string, { avgDelta: number; count: number }>,
  recentPatternIds: Set<string | null>,
): number {
  let score = pattern.opportunity_score;

  // Trend multiplier
  if (pattern.trend_direction === 'ascending') score *= 1.3;
  // stable = 1.0, declining already filtered

  // Performance history adjustment
  const perf = performanceMap.get(pattern.pattern_id);
  if (perf && perf.count > 0) {
    // Boost or penalize based on creator's actual results with this pattern
    const adjustment = 1 + Math.max(-0.5, Math.min(0.5, perf.avgDelta / 20));
    score *= adjustment;
  }

  // Deprioritize recently used patterns
  if (recentPatternIds.has(pattern.pattern_id)) {
    score *= 0.5;
  }

  return Math.max(0, score);
}

// ============================================================================
// Pattern Selection with Arc Diversification
// ============================================================================

interface ScoredPattern extends PatternWithMetrics {
  adjustedScore: number;
}

function selectDiversePatterns(
  patterns: ScoredPattern[],
  count: number,
): ScoredPattern[] {
  const sorted = [...patterns].sort((a, b) => b.adjustedScore - a.adjustedScore);
  const selected: ScoredPattern[] = [];
  const arcCounts = new Map<string, number>();

  for (const pattern of sorted) {
    if (selected.length >= count) break;

    // Check consecutive arc constraint
    if (selected.length > 0) {
      const lastArc = selected[selected.length - 1].narrative_arc;
      if (pattern.narrative_arc === lastArc) {
        // Try to find a different-arc pattern with comparable score
        const alternative = sorted.find(
          p =>
            !selected.includes(p) &&
            p.narrative_arc !== lastArc &&
            p.adjustedScore >= pattern.adjustedScore * 0.7,
        );
        if (alternative) {
          arcCounts.set(
            alternative.narrative_arc,
            (arcCounts.get(alternative.narrative_arc) || 0) + 1,
          );
          selected.push(alternative);
          continue;
        }
      }
    }

    arcCounts.set(
      pattern.narrative_arc,
      (arcCounts.get(pattern.narrative_arc) || 0) + 1,
    );
    selected.push(pattern);
  }

  // If we didn't get enough, fill from remaining
  if (selected.length < count) {
    for (const pattern of sorted) {
      if (selected.length >= count) break;
      if (!selected.includes(pattern)) {
        selected.push(pattern);
      }
    }
  }

  return selected.slice(0, count);
}

// ============================================================================
// Gemini Brief Generation
// ============================================================================

interface BriefEnrichment {
  topic_angle: string;
  hook_text: string;
}

async function generateBriefContent(
  patterns: ScoredPattern[],
  creatorContext: CreatorContext,
  niche: string,
): Promise<BriefEnrichment[]> {
  const apiKey =
    process.env.GOOGLE_GEMINI_AI_API_KEY ||
    process.env.GOOGLE_AI_API_KEY ||
    process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.log('[ContentCalendar] No Gemini API key, using fallback briefs');
    return patterns.map(p => ({
      topic_angle: `${p.pattern_name} content idea for ${niche}`,
      hook_text: buildFallbackHook(p),
    }));
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    // Extract creator preferences
    const hookStyles = getTopPreferences(
      creatorContext.calibrationProfile?.rawScores?.hookStylePreference,
      3,
    );
    const tones = getTopPreferences(
      creatorContext.calibrationProfile?.rawScores?.toneMatch,
      2,
    );
    const formats = getTopPreferences(
      creatorContext.calibrationProfile?.rawScores?.contentFormatPreference,
      2,
    );

    const subtopics = creatorContext.calibrationProfile?.selectedSubtopics ?? [];
    const creatorStory = creatorContext.calibrationProfile?.creatorStory;
    const audienceEnrichment = creatorContext.calibrationProfile?.audienceEnrichment;

    const prompt = `You are generating personalized content briefs for a TikTok creator.

CREATOR PROFILE:
- Niche: ${niche}
- Stage: ${creatorContext.creatorStage}
- Preferred hook styles: ${hookStyles.join(', ') || 'varied'}
- Tone preferences: ${tones.join(', ') || 'authentic'}
- Content formats: ${formats.join(', ') || 'short-form video'}${subtopics.length > 0 ? `\n- Focus subtopics: ${subtopics.join(', ')}` : ''}${creatorStory ? `\n- Creator story: ${creatorStory.transformation}\n- Niche myths they debunk: ${creatorStory.nicheMyths.join('; ')}\n- Audience desired result: ${creatorStory.audienceDesiredResult}` : ''}${audienceEnrichment?.location ? `\n- Creator location: ${audienceEnrichment.location}` : ''}${audienceEnrichment?.occupation ? `\n- Creator occupation: ${audienceEnrichment.occupation}` : ''}

For each pattern below, generate:
- topic_angle: A SPECIFIC, original content idea (NOT generic — include a concrete topic, scenario, or example). Max 2 sentences.
- hook_text: An opening hook in the creator's preferred style. Max 15 words.

PATTERNS:
${JSON.stringify(
  patterns.map(p => ({
    pattern_name: p.pattern_name,
    narrative_arc: p.narrative_arc,
    hook_structure: p.hook_structure,
    pacing_rhythm: p.pacing_rhythm,
    psych_trigger: p.psych_trigger,
  })),
  null,
  2,
)}

Return ONLY a JSON array (same order as input, ${patterns.length} items):
[
  { "topic_angle": "...", "hook_text": "..." },
  ...
]`;

    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const responseText = result.text || '';
    return parseBriefResponse(responseText, patterns.length);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[ContentCalendar] Gemini brief generation failed: ${msg}`);
    return patterns.map(p => ({
      topic_angle: `${p.pattern_name} content idea for ${niche}`,
      hook_text: buildFallbackHook(p),
    }));
  }
}

function parseBriefResponse(
  responseText: string,
  expectedCount: number,
): BriefEnrichment[] {
  try {
    let cleaned = responseText.trim();

    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/```\n?/g, '');
    }

    const parsed = JSON.parse(cleaned);

    if (!Array.isArray(parsed)) {
      console.error('[ContentCalendar] Gemini response is not an array');
      return Array(expectedCount).fill({ topic_angle: '', hook_text: '' });
    }

    return parsed.map((item: any) => ({
      topic_angle: typeof item.topic_angle === 'string' ? item.topic_angle : '',
      hook_text: typeof item.hook_text === 'string' ? item.hook_text : '',
    }));
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[ContentCalendar] Failed to parse brief response: ${msg}`);
    return Array(expectedCount).fill({ topic_angle: '', hook_text: '' });
  }
}

// ============================================================================
// Helpers
// ============================================================================

function getTopPreferences(
  scores: Record<string, number> | undefined,
  count: number,
): string[] {
  if (!scores || Object.keys(scores).length === 0) return [];
  return Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, count)
    .map(([key]) => key);
}

function suggestFormat(
  creatorContext: CreatorContext,
  pattern: PatternWithMetrics,
): string {
  const formats = creatorContext.calibrationProfile?.rawScores?.contentFormatPreference;
  if (formats && Object.keys(formats).length > 0) {
    // Match format to pacing rhythm where possible
    const topFormat = Object.entries(formats)
      .sort(([, a], [, b]) => b - a)[0][0];
    return topFormat;
  }

  // Fallback based on pacing
  switch (pattern.pacing_rhythm) {
    case 'fast_cuts':
      return 'montage';
    case 'slow_build':
      return 'storytelling';
    case 'climax_first':
      return 'results-first';
    default:
      return 'talking-head';
  }
}

function buildFallbackHook(pattern: PatternWithMetrics): string {
  switch (pattern.hook_structure) {
    case 'question':
      return 'Have you ever wondered why this works?';
    case 'list_preview':
      return 'Here are the top 3 things you need to know.';
    case 'contrarian':
      return 'Nobody talks about this, but they should.';
    case 'myth_bust':
      return 'Most people get this completely wrong.';
    case 'statistic':
      return '87% of people miss this — here\'s why it matters.';
    case 'authority':
      return "After years of doing this, here's what I learned.";
    case 'result_preview':
      return 'Here are the results — they surprised me.';
    case 'personal_story':
      return 'This changed everything for me.';
    case 'problem_identification':
      return 'If you struggle with this, watch till the end.';
    case 'urgency':
      return 'Stop scrolling. You need to see this now.';
    default:
      return 'You need to know this.';
  }
}

function estimateVps(opportunityScore: number): number {
  const raw = 50 + opportunityScore / 4;
  return Math.round(Math.min(85, Math.max(30, raw)) * 10) / 10;
}
