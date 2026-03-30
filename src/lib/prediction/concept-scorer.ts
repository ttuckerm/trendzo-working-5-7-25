/**
 * Concept Scorer — Pre-Mortem Content Scoring
 *
 * Scores a 1-3 sentence video concept BEFORE filming using:
 * 1. Gemini analysis (expands concept into structured classification)
 * 2. Pattern Library matching (archetype + saturation metrics)
 * 3. Creator profile fit scoring (calibration profile dimensions)
 *
 * Returns a VPS estimate with wider confidence range than the full pipeline
 * (less information available = less certainty).
 *
 * Graceful fallback if Gemini is unavailable.
 */

import { GoogleGenAI } from '@google/genai';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { CreatorContext } from '@/lib/prediction/creator-context';
import type { CalibrationProfile } from '@/lib/onboarding/calibration-scorer';
import { getLifecycleStage, computeOpportunityScore } from '@/lib/patterns/pattern-metrics';
import { NICHE_REGISTRY, getNicheDifficultyFactor } from '@/lib/prediction/system-registry';

// ============================================================================
// Types
// ============================================================================

export interface ConceptScoreInput {
  conceptText: string;
  niche: string;
  creatorContext: CreatorContext | null;
}

export interface GeminiConceptAnalysis {
  inferred_hook_type: string;
  inferred_narrative_arc: string;
  inferred_psych_trigger: string;
  inferred_pacing: string;
  inferred_cta: string;
  estimated_length_seconds: number;
  inferred_format: string;
  content_strengths: string[];
  content_weaknesses: string[];
  suggested_pattern_name: string;
  raw_vps_estimate: number;
  confidence: number;
}

export interface CreatorFitScore {
  hookStyleMatch: number;
  toneMatch: number;
  formatMatch: number;
  nicheMatch: number;
  overallFit: number;
}

export interface ConceptAdjustment {
  adjustment_text: string;
  projected_vps_delta: number;
  rationale: string;
}

export interface ConceptDiagnosis {
  primary_limiting_factor: string;
  suggestion: string;
  projected_improvement: number;
  strengths: string[];
  weaknesses: string[];
}

export interface PatternMatchResult {
  pattern_id: string;
  pattern_name: string;
  narrative_arc: string;
}

export interface PatternSaturationResult {
  saturation_pct: number;
  trend_direction: string;
  lifecycle_stage: string;
  opportunity_score: number;
}

export type GateClassification = 'pass' | 'borderline' | 'fail';

/**
 * Mode 1 — Quality Gate: "Will this pass TikTok's batch test?"
 * Driven by hook retention, delivery baseline, content structure, and production floor.
 */
export interface QualityGateScore {
  score: number; // 0-100
  hookRetention: number; // 0-100: inferred hook type strength
  deliveryBaseline: number; // 0-100: creator delivery quality (or 50 if unknown)
  contentStructure: number; // 0-100: pacing quality + narrative arc clarity
  productionFloor: number; // 0-100: minimum format/audio quality threshold
  gateClassification: GateClassification; // < 35 fail, 35-50 borderline, > 50 pass
}

/**
 * Mode 2 — Distribution Potential: "How far will it travel?"
 * Driven by niche saturation, trend alignment, share probability, creator momentum, audience fit.
 */
export interface DistributionPotentialScore {
  score: number; // 0-100
  nicheSaturation: number; // 0-100: inverse saturation (higher = less saturated = better)
  trendAlignment: number; // 0-100: lifecycle stage opportunity
  shareProbability: number; // 0-100: psych trigger + CTA shareability
  creatorMomentum: number; // 0-100: follower count + engagement + stage
  audienceFit: number; // 0-100: calibration profile alignment with concept audience
}

export interface ConceptScoreResult {
  conceptVps: number;
  confidenceRange: [number, number];
  diagnosis: ConceptDiagnosis;
  suggestedAdjustments: ConceptAdjustment[];
  matchedPattern: PatternMatchResult | null;
  patternSaturation: PatternSaturationResult | null;
  creatorFit: CreatorFitScore | null;
  geminiAnalysis: GeminiConceptAnalysis;
  qualityGate: QualityGateScore;
  distributionPotential: DistributionPotentialScore;
}

// ============================================================================
// Valid Enum Values (for validation)
// ============================================================================

const VALID_HOOK_TYPES = [
  'question', 'list_preview',
  'contrarian', 'myth_bust',
  'statistic', 'authority', 'result_preview',
  'personal_story', 'problem_identification',
  'urgency',
] as const;

const VALID_NARRATIVE_ARCS = [
  'transformation', 'revelation', 'warning', 'social_proof',
  'challenge', 'insider_access', 'myth_bust',
] as const;

const VALID_CTAS = ['follow', 'share', 'comment', 'save', 'none'] as const;

// ============================================================================
// Main Export
// ============================================================================

/**
 * Score a video concept (1-3 sentences) before filming.
 * Returns null only if a critical error occurs.
 */
export async function scoreConcept(
  input: ConceptScoreInput,
  supabase: SupabaseClient,
): Promise<ConceptScoreResult | null> {
  const apiKey =
    process.env.GOOGLE_GEMINI_AI_API_KEY ||
    process.env.GOOGLE_AI_API_KEY ||
    process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.log('[ConceptScorer] No Gemini API key — using fallback scoring');
    return buildFallbackResult(input);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    // Step 1: Gemini expansion
    const analysis = await expandConceptWithGemini(ai, input);
    if (!analysis) {
      console.log('[ConceptScorer] Gemini expansion failed — using fallback');
      return buildFallbackResult(input);
    }

    // Step 2: Pattern Library match
    const patternMatch = await matchPattern(supabase, analysis);

    // Step 3: Pattern saturation metrics
    const saturation = patternMatch
      ? await getPatternSaturation(supabase, patternMatch.pattern_id, input.niche)
      : null;

    // Step 4: Creator fit scoring
    const creatorFit = input.creatorContext?.calibrationProfile
      ? computeCreatorFit(analysis, input.creatorContext.calibrationProfile.rawScores)
      : null;

    // Step 5a: Mode 1 — Quality Gate
    const qualityGate = computeQualityGate(analysis, input.creatorContext);

    // Step 5b: Mode 2 — Distribution Potential
    const distributionPotential = computeDistributionPotential(analysis, saturation, input.creatorContext);

    // Step 5c: Compute final VPS from both modes
    let { vps, range } = computeConceptVps(analysis, saturation, creatorFit, input.niche, qualityGate, distributionPotential);

    // Step 5d: Novelty decay — penalize repeated hook types
    const noveltyPenalty = await checkNoveltyDecay(supabase, input, analysis.inferred_hook_type);
    if (noveltyPenalty) {
      vps = Math.round(Math.max(0, vps + noveltyPenalty.vpsDelta) * 10) / 10;
      range = [Math.max(0, range[0] + noveltyPenalty.vpsDelta), Math.min(100, range[1] + noveltyPenalty.vpsDelta)];
    }

    // Step 6: Diagnosis + adjustments
    const diagnosis = generateDiagnosis(analysis, saturation, creatorFit);
    const adjustments = generateAdjustments(analysis, saturation, creatorFit, vps);
    if (noveltyPenalty) {
      adjustments.push({
        adjustment_text: 'Consider varying your hook type — you\'ve used this style frequently in recent concepts.',
        projected_vps_delta: 3,
        rationale: `Hook type "${analysis.inferred_hook_type}" used ${noveltyPenalty.count} times in last 10 concepts. Novelty decay applied.`,
      });
    }

    console.log(
      `[ConceptScorer] Scored concept: VPS=${vps} [${range[0]}-${range[1]}], ` +
      `gate=${qualityGate.score} (${qualityGate.gateClassification.toUpperCase()}), ` +
      `dist=${distributionPotential.score}, ` +
      `pattern=${patternMatch?.pattern_name || 'none'}, ` +
      `fit=${creatorFit?.overallFit.toFixed(2) || 'n/a'}`,
    );

    return {
      conceptVps: vps,
      confidenceRange: range,
      diagnosis,
      suggestedAdjustments: adjustments,
      matchedPattern: patternMatch,
      patternSaturation: saturation,
      creatorFit,
      geminiAnalysis: analysis,
      qualityGate,
      distributionPotential,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[ConceptScorer] Error: ${msg}`);
    return buildFallbackResult(input);
  }
}

// ============================================================================
// Step 1: Gemini Concept Expansion
// ============================================================================

async function expandConceptWithGemini(
  ai: GoogleGenAI,
  input: ConceptScoreInput,
): Promise<GeminiConceptAnalysis | null> {
  const nicheLabel = NICHE_REGISTRY.find(n => n.key === input.niche)?.label || input.niche;
  const creatorStage = input.creatorContext?.creatorStage || 'unknown';
  const followers = input.creatorContext?.channelData?.followerCount;
  const subtopics = input.creatorContext?.calibrationProfile?.selectedSubtopics ?? [];
  const creatorStory = input.creatorContext?.calibrationProfile?.creatorStory;

  const prompt = `You are analyzing a short video CONCEPT (not a finished video) for a TikTok creator.

CONCEPT: "${input.conceptText}"
NICHE: "${nicheLabel}"${subtopics.length > 0 ? `\nCREATOR SUBTOPICS: ${subtopics.join(', ')}` : ''}${creatorStory ? `\nCREATOR STORY: ${creatorStory.transformation}${creatorStory.nicheMyths.length > 0 ? `\nNICHE MYTHS THEY DEBUNK: ${creatorStory.nicheMyths.join('; ')}` : ''}\nAUDIENCE WANTS: ${creatorStory.audienceDesiredResult}` : ''}${input.creatorContext?.calibrationProfile?.audienceEnrichment?.location ? `\nCREATOR LOCATION: ${input.creatorContext.calibrationProfile.audienceEnrichment.location}` : ''}
CREATOR STAGE: "${creatorStage}"${followers != null ? ` (${followers.toLocaleString()} followers)` : ''}

Analyze this concept and predict how it would perform as a short-form video. Classify it into a mechanical template:

1. **inferred_hook_type**: How would a video about this concept likely open?
   Options: question, list_preview, contrarian, myth_bust, statistic, authority, result_preview, personal_story, problem_identification, urgency
   Clusters: curiosity_trigger (question, list_preview), cognitive_challenge (contrarian, myth_bust), credibility_signal (statistic, authority, result_preview), emotional_connection (personal_story, problem_identification), urgency_scarcity (urgency)

2. **inferred_narrative_arc**: Which story structure fits best?
   Options: transformation, revelation, warning, social_proof, challenge, insider_access, myth_bust

3. **inferred_psych_trigger**: Primary psychological driver.
   Examples: curiosity_gap, identity_affirmation, fear_of_missing_out, social_proof, authority_bias, loss_aversion, novelty_seeking, tribal_belonging, self_improvement_desire

4. **inferred_pacing**: Likely editing tempo.
   Options: fast_cuts, slow_build, alternating, steady_escalation, climax_first

5. **inferred_cta**: Best call-to-action type.
   Options: follow, share, comment, save, none

6. **estimated_length_seconds**: Optimal video length (15, 30, or 60)

7. **inferred_format**: Visual format.
   Options: talking_head, b_roll_montage, screen_record, text_overlay, mixed

8. **content_strengths**: Array of 2-3 strings describing why this concept has viral potential

9. **content_weaknesses**: Array of 2-3 strings describing potential weak points or risks

10. **suggested_pattern_name**: A hyphenated slug for the closest pattern archetype (e.g., "myth-bust", "transformation-reveal", "curiosity-hook-payoff")

11. **raw_vps_estimate**: Your Viral Prediction Score estimate (0-100). Be realistic and conservative. Consider:
    - How differentiated is this concept? (common = lower)
    - Is the topic oversaturated in "${nicheLabel}"? (saturated = lower)
    - Does this have emotional resonance? (higher emotion = higher)
    - Is the concept clear enough for a short video? (unclear = lower)
    - Most concepts land between 45-75. Only truly exceptional concepts exceed 80.

12. **confidence**: Your confidence in this analysis (0.0-1.0). Use lower (<0.4) for vague or unclear concepts.

Return ONLY a JSON object, no other text:
{
  "inferred_hook_type": "authority",
  "inferred_narrative_arc": "transformation",
  "inferred_psych_trigger": "curiosity_gap",
  "inferred_pacing": "fast_cuts",
  "inferred_cta": "follow",
  "estimated_length_seconds": 30,
  "inferred_format": "talking_head",
  "content_strengths": ["Clear value proposition", "Strong emotional hook"],
  "content_weaknesses": ["Common topic angle", "Needs specific data points"],
  "suggested_pattern_name": "transformation-reveal",
  "raw_vps_estimate": 62,
  "confidence": 0.7
}`;

  try {
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const responseText = result.text || '';
    return parseGeminiResponse(responseText);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[ConceptScorer] Gemini call failed: ${msg}`);
    return null;
  }
}

function parseGeminiResponse(responseText: string): GeminiConceptAnalysis | null {
  try {
    let cleaned = responseText.trim();

    // Strip markdown code blocks
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/```\n?/g, '');
    }

    const parsed = JSON.parse(cleaned.trim());

    // Validate required fields
    if (!parsed.inferred_hook_type || !parsed.inferred_narrative_arc ||
        !parsed.inferred_psych_trigger || !parsed.inferred_format) {
      console.error('[ConceptScorer] Missing required Gemini response fields');
      return null;
    }

    // Normalize and clamp values
    return {
      inferred_hook_type: VALID_HOOK_TYPES.includes(parsed.inferred_hook_type)
        ? parsed.inferred_hook_type
        : 'authority',
      inferred_narrative_arc: VALID_NARRATIVE_ARCS.includes(parsed.inferred_narrative_arc)
        ? parsed.inferred_narrative_arc
        : 'revelation',
      inferred_psych_trigger: String(parsed.inferred_psych_trigger || 'curiosity_gap'),
      inferred_pacing: String(parsed.inferred_pacing || 'fast_cuts'),
      inferred_cta: VALID_CTAS.includes(parsed.inferred_cta)
        ? parsed.inferred_cta
        : 'follow',
      estimated_length_seconds: [15, 30, 60].includes(parsed.estimated_length_seconds)
        ? parsed.estimated_length_seconds
        : 30,
      inferred_format: String(parsed.inferred_format || 'talking_head'),
      content_strengths: Array.isArray(parsed.content_strengths)
        ? parsed.content_strengths.slice(0, 3).map(String)
        : [],
      content_weaknesses: Array.isArray(parsed.content_weaknesses)
        ? parsed.content_weaknesses.slice(0, 3).map(String)
        : [],
      suggested_pattern_name: String(parsed.suggested_pattern_name || 'generic')
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, ''),
      raw_vps_estimate: Math.min(100, Math.max(0, Number(parsed.raw_vps_estimate) || 50)),
      confidence: Math.min(1, Math.max(0, Number(parsed.confidence) || 0.5)),
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[ConceptScorer] Failed to parse Gemini response: ${msg}`);
    console.error(`[ConceptScorer] Raw (first 500 chars): ${responseText.substring(0, 500)}`);
    return null;
  }
}

// ============================================================================
// Step 2: Pattern Library Match
// ============================================================================

async function matchPattern(
  supabase: SupabaseClient,
  analysis: GeminiConceptAnalysis,
): Promise<PatternMatchResult | null> {
  // Try structural match first: narrative_arc + hook_structure
  const hookStructure = analysis.inferred_hook_type;
  const narrativeArc = analysis.inferred_narrative_arc;

  const { data: structuralMatch } = await supabase
    .from('pattern_archetypes')
    .select('id, pattern_name, narrative_arc')
    .eq('narrative_arc', narrativeArc)
    .eq('hook_structure', hookStructure)
    .limit(1)
    .maybeSingle();

  if (structuralMatch) {
    return {
      pattern_id: structuralMatch.id,
      pattern_name: structuralMatch.pattern_name,
      narrative_arc: structuralMatch.narrative_arc,
    };
  }

  // Fallback: match by pattern_name
  const { data: nameMatch } = await supabase
    .from('pattern_archetypes')
    .select('id, pattern_name, narrative_arc')
    .eq('pattern_name', analysis.suggested_pattern_name)
    .maybeSingle();

  if (nameMatch) {
    return {
      pattern_id: nameMatch.id,
      pattern_name: nameMatch.pattern_name,
      narrative_arc: nameMatch.narrative_arc,
    };
  }

  // Last resort: match on narrative_arc alone (pick most popular)
  const { data: arcMatch } = await supabase
    .from('pattern_archetypes')
    .select('id, pattern_name, narrative_arc')
    .eq('narrative_arc', narrativeArc)
    .limit(1)
    .maybeSingle();

  if (arcMatch) {
    return {
      pattern_id: arcMatch.id,
      pattern_name: arcMatch.pattern_name,
      narrative_arc: arcMatch.narrative_arc,
    };
  }

  return null;
}

// ============================================================================
// Step 3: Pattern Saturation Metrics
// ============================================================================

async function getPatternSaturation(
  supabase: SupabaseClient,
  patternId: string,
  nicheKey: string,
): Promise<PatternSaturationResult | null> {
  const { data: metrics } = await supabase
    .from('archetype_niche_metrics')
    .select('saturation_pct, trend_direction')
    .eq('pattern_id', patternId)
    .eq('niche_key', nicheKey)
    .maybeSingle();

  if (!metrics) {
    // No metrics = likely a new pattern in this niche (first-mover)
    return {
      saturation_pct: 0,
      trend_direction: 'ascending',
      lifecycle_stage: 'first-mover',
      opportunity_score: 150, // High opportunity for new patterns
    };
  }

  const satPct = Number(metrics.saturation_pct) || 0;
  const trend = String(metrics.trend_direction || 'stable');

  return {
    saturation_pct: satPct,
    trend_direction: trend,
    lifecycle_stage: getLifecycleStage(satPct),
    opportunity_score: computeOpportunityScore(satPct, trend),
  };
}

// ============================================================================
// Step 4: Creator Fit Scoring
// ============================================================================

function computeCreatorFit(
  analysis: GeminiConceptAnalysis,
  rawScores: CalibrationProfile,
): CreatorFitScore {
  // Hook style match: how well does the inferred hook type align with creator's preference?
  const hookMatch = computeDimensionMatch(
    analysis.inferred_hook_type,
    rawScores.hookStylePreference,
  );

  // Tone match: use psych_trigger as proxy for tone alignment
  const toneMatch = computeDimensionMatch(
    analysis.inferred_psych_trigger,
    rawScores.toneMatch,
  );

  // Format match: content format preference vs inferred format
  const formatMatch = computeDimensionMatch(
    analysis.inferred_format,
    rawScores.contentFormatPreference,
  );

  // Niche match: how aligned is this concept's niche with creator's affinity?
  const nicheMatch = computeNicheMatch(rawScores.nicheAffinity);

  // Weighted average
  const overallFit = (hookMatch * 0.35) + (toneMatch * 0.20) + (formatMatch * 0.25) + (nicheMatch * 0.20);

  return {
    hookStyleMatch: round2(hookMatch),
    toneMatch: round2(toneMatch),
    formatMatch: round2(formatMatch),
    nicheMatch: round2(nicheMatch),
    overallFit: round2(overallFit),
  };
}

/**
 * Check if a specific attribute key has a high score in the creator's preference map.
 * Falls back to checking partial matches (e.g., "bold" in "bold_claim").
 */
function computeDimensionMatch(
  inferredKey: string,
  preferenceMap: Record<string, number>,
): number {
  if (!preferenceMap || Object.keys(preferenceMap).length === 0) return 0.5; // neutral

  // Normalize the key
  const normalizedKey = inferredKey.toLowerCase().replace(/[_-]/g, '');

  // Direct match
  for (const [key, score] of Object.entries(preferenceMap)) {
    const normalizedPref = key.toLowerCase().replace(/[_-]/g, '');
    if (normalizedPref === normalizedKey || normalizedPref.includes(normalizedKey) || normalizedKey.includes(normalizedPref)) {
      return Math.min(1, score / 100); // Scores are 0-100, normalize to 0-1
    }
  }

  // No direct match — use the average preference as a baseline
  const values = Object.values(preferenceMap).filter(v => typeof v === 'number');
  if (values.length === 0) return 0.5;

  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  return Math.min(1, avg / 100) * 0.7; // Discount for non-match
}

function computeNicheMatch(nicheAffinity: Record<string, number>): number {
  if (!nicheAffinity || Object.keys(nicheAffinity).length === 0) return 0.5;

  // Use the highest affinity score as the match (creator is working in their preferred niche)
  const maxScore = Math.max(...Object.values(nicheAffinity).filter(v => typeof v === 'number'));
  return Math.min(1, maxScore / 100);
}

// ============================================================================
// Step 5a: Quality Gate (Mode 1) — "Will this pass TikTok's batch test?"
// ============================================================================

const HOOK_RETENTION_SCORES: Record<string, number> = {
  question: 75, list_preview: 70,
  contrarian: 85, myth_bust: 80,
  statistic: 78, authority: 72, result_preview: 82,
  personal_story: 68, problem_identification: 76,
  urgency: 88,
};

const FORMAT_QUALITY_SCORES: Record<string, number> = {
  talking_head: 65, b_roll_montage: 75, screen_record: 55,
  text_overlay: 50, mixed: 70,
};

const PACING_QUALITY_SCORES: Record<string, number> = {
  fast_cuts: 80, slow_build: 55, alternating: 75,
  steady_escalation: 70, climax_first: 85,
};

const NARRATIVE_CLARITY_SCORES: Record<string, number> = {
  transformation: 80, revelation: 75, warning: 70, social_proof: 65,
  challenge: 60, insider_access: 72, myth_bust: 78,
};

function classifyGate(score: number): GateClassification {
  if (score < 35) return 'fail';
  if (score <= 50) return 'borderline';
  return 'pass';
}

function computeQualityGate(
  analysis: GeminiConceptAnalysis,
  creatorContext: CreatorContext | null,
): QualityGateScore {
  const hookRetention = HOOK_RETENTION_SCORES[analysis.inferred_hook_type] ?? 65;

  let deliveryBaseline = 50;
  if (creatorContext?.channelData?.deliveryBaseline) {
    const db = creatorContext.channelData.deliveryBaseline;
    deliveryBaseline = Math.min(100, Math.max(0,
      db.speakingRateWpm * 0.3 + db.energyLevel * 0.4 + db.speakingRateVariance * 0.2 + (1 - db.silenceRatio) * 10
    ));
  }

  // content_structure: pacing quality + narrative arc clarity
  const pacingScore = PACING_QUALITY_SCORES[analysis.inferred_pacing] ?? 65;
  const narrativeClarity = NARRATIVE_CLARITY_SCORES[analysis.inferred_narrative_arc] ?? 65;
  const contentStructure = Math.round((pacingScore * 0.6 + narrativeClarity * 0.4) * 10) / 10;

  // production_floor: minimum format/audio quality threshold
  const formatScore = FORMAT_QUALITY_SCORES[analysis.inferred_format] ?? 60;
  const productionFloor = formatScore;

  // hook_strength 0.45 + delivery_baseline 0.25 + content_structure 0.20 + production_floor 0.10
  const score = Math.round(
    (hookRetention * 0.45 + deliveryBaseline * 0.25 + contentStructure * 0.20 + productionFloor * 0.10) * 10
  ) / 10;

  return {
    score,
    hookRetention,
    deliveryBaseline: Math.round(deliveryBaseline * 10) / 10,
    contentStructure,
    productionFloor,
    gateClassification: classifyGate(score),
  };
}

// ============================================================================
// Step 5b: Distribution Potential (Mode 2) — "How far will it travel?"
// ============================================================================

const SHAREABLE_TRIGGERS = new Set([
  'curiosity_gap', 'identity_affirmation', 'social_proof',
  'fear_of_missing_out', 'tribal_belonging', 'loss_aversion',
]);

const CTA_SHARE_SCORES: Record<string, number> = {
  share: 90, comment: 75, save: 70, follow: 55, none: 30,
};

function computeDistributionPotential(
  analysis: GeminiConceptAnalysis,
  saturation: PatternSaturationResult | null,
  creatorContext: CreatorContext | null,
): DistributionPotentialScore {
  // Niche saturation (inverse: lower saturation = higher score)
  let nicheSaturation = 70;
  if (saturation) {
    nicheSaturation = Math.max(0, Math.min(100, 100 - saturation.saturation_pct));
  }

  // Trend alignment from lifecycle stage
  let trendAlignment = 50;
  if (saturation) {
    const stageScores: Record<string, number> = {
      'first-mover': 95, 'ascending': 80, 'stable': 55, 'declining': 25,
    };
    trendAlignment = stageScores[saturation.lifecycle_stage] ?? 50;
    if (saturation.opportunity_score > 100) trendAlignment = Math.min(100, trendAlignment + 10);
  }

  // Share probability from psych trigger + CTA
  const triggerShareable = SHAREABLE_TRIGGERS.has(analysis.inferred_psych_trigger) ? 80 : 50;
  const ctaShare = CTA_SHARE_SCORES[analysis.inferred_cta] ?? 50;
  const shareProbability = Math.round((triggerShareable * 0.6 + ctaShare * 0.4) * 10) / 10;

  // Creator momentum from channel data
  let creatorMomentum = 50;
  if (creatorContext?.channelData) {
    const ch = creatorContext.channelData;
    let momentum = 50;
    if (ch.followerCount != null) {
      if (ch.followerCount >= 100_000) momentum += 15;
      else if (ch.followerCount >= 10_000) momentum += 8;
      else if (ch.followerCount >= 1_000) momentum += 3;
    }
    if (ch.avgEngagementRate != null) {
      if (ch.avgEngagementRate >= 0.08) momentum += 15;
      else if (ch.avgEngagementRate >= 0.04) momentum += 8;
      else if (ch.avgEngagementRate >= 0.02) momentum += 3;
    }
    creatorMomentum = Math.min(100, Math.max(0, momentum));
  }

  // Audience fit: how well concept's inferred pain points match creator's calibration
  let audienceFit = 50;
  if (creatorContext?.calibrationProfile) {
    const painScores = creatorContext.calibrationProfile.rawScores.audiencePainAlignment;
    const painValues = Object.values(painScores).filter((v): v is number => typeof v === 'number');
    if (painValues.length > 0) {
      const maxPain = Math.max(...painValues);
      const avgPain = painValues.reduce((a, b) => a + b, 0) / painValues.length;
      audienceFit = Math.min(100, Math.max(0, (maxPain * 0.6 + avgPain * 0.4)));
    }
    const enrichment = creatorContext.calibrationProfile.audienceEnrichment;
    if (enrichment?.location || enrichment?.occupation) audienceFit = Math.min(100, audienceFit + 8);
  }

  // pattern_freshness 0.25, trend_alignment 0.20, share_probability 0.25,
  // creator_momentum 0.15, audience_fit 0.15
  const score = Math.round(
    (nicheSaturation * 0.25 + trendAlignment * 0.20 + shareProbability * 0.25 +
     creatorMomentum * 0.15 + audienceFit * 0.15) * 10
  ) / 10;

  return {
    score,
    nicheSaturation: Math.round(nicheSaturation * 10) / 10,
    trendAlignment,
    shareProbability,
    creatorMomentum,
    audienceFit: Math.round(audienceFit * 10) / 10,
  };
}

// ============================================================================
// Step 5c: VPS Computation (combines both modes)
// ============================================================================

function computeConceptVps(
  analysis: GeminiConceptAnalysis,
  saturation: PatternSaturationResult | null,
  creatorFit: CreatorFitScore | null,
  niche: string,
  qualityGate: QualityGateScore,
  distributionPotential: DistributionPotentialScore,
): { vps: number; range: [number, number] } {
  let vps: number;

  switch (qualityGate.gateClassification) {
    case 'fail':
      // FAIL: VPS driven solely by gate score — no distribution influence
      vps = qualityGate.score * 0.6;
      break;
    case 'borderline':
      // BORDERLINE: 50/50 blend
      vps = qualityGate.score * 0.5 + distributionPotential.score * 0.5;
      break;
    case 'pass':
      // PASS: distribution dominates
      vps = qualityGate.score * 0.3 + distributionPotential.score * 0.7;
      break;
  }

  // Apply niche difficulty factor
  const difficultyFactor = getNicheDifficultyFactor(niche);
  vps *= difficultyFactor;

  // Creator fit adjustment
  if (creatorFit) {
    const fitDelta = (creatorFit.overallFit - 0.5) * 6; // -3 to +3
    vps += fitDelta;
  }

  vps = Math.round(Math.min(100, Math.max(0, vps)) * 10) / 10;

  // Confidence range: narrower when both modes agree, wider when they diverge
  const modeGap = Math.abs(qualityGate.score - distributionPotential.score);
  const baseWidth = 12 + (1 - analysis.confidence) * 8;
  const gapWidth = modeGap > 30 ? 5 : modeGap > 15 ? 2 : 0;
  const confidenceWidth = Math.round(baseWidth + gapWidth);
  const low = Math.round(Math.max(0, vps - confidenceWidth) * 10) / 10;
  const high = Math.round(Math.min(100, vps + confidenceWidth) * 10) / 10;

  return { vps, range: [low, high] };
}

// ============================================================================
// Step 5d: Novelty Decay — Hook Usage Tracking
// ============================================================================

async function checkNoveltyDecay(
  supabase: SupabaseClient,
  input: ConceptScoreInput,
  inferredHookType: string,
): Promise<{ vpsDelta: number; count: number } | null> {
  if (!input.creatorContext) return null;

  try {
    // Query last 10 concept scores for this niche to track hook type frequency
    const { data: recentConcepts } = await supabase
      .from('concept_scores')
      .select('gemini_analysis')
      .eq('niche_key', input.niche)
      .order('created_at', { ascending: false })
      .limit(10);

    if (!recentConcepts || recentConcepts.length === 0) return null;

    const recentHooks = recentConcepts
      .map(c => (c.gemini_analysis as any)?.inferred_hook_type)
      .filter(Boolean) as string[];

    const count = recentHooks.filter(h => h === inferredHookType).length;
    if (count >= 3) {
      return { vpsDelta: -3, count };
    }
    return null;
  } catch {
    return null;
  }
}

// ============================================================================
// Step 6: Diagnosis & Adjustments
// ============================================================================

function generateDiagnosis(
  analysis: GeminiConceptAnalysis,
  saturation: PatternSaturationResult | null,
  creatorFit: CreatorFitScore | null,
): ConceptDiagnosis {
  // Find the primary limiting factor
  const factors: Array<{ factor: string; severity: number; suggestion: string; improvement: number }> = [];

  // Saturation risk
  if (saturation && saturation.lifecycle_stage === 'declining') {
    factors.push({
      factor: `Pattern "${saturation.lifecycle_stage}" — this content format is becoming oversaturated`,
      severity: 3,
      suggestion: 'Add a unique twist or use an unconventional hook to differentiate',
      improvement: 5,
    });
  } else if (saturation && saturation.saturation_pct > 70) {
    factors.push({
      factor: `High saturation (${saturation.saturation_pct.toFixed(0)}%) — many creators using this pattern`,
      severity: 2,
      suggestion: 'Combine this pattern with an unexpected angle or personal story',
      improvement: 4,
    });
  }

  // Creator fit gap
  if (creatorFit && creatorFit.hookStyleMatch < 0.4) {
    factors.push({
      factor: 'Hook style mismatch — this hook type doesn\'t align with your proven strengths',
      severity: 2,
      suggestion: 'Adapt the hook to your preferred style while keeping the core concept',
      improvement: 3,
    });
  }
  if (creatorFit && creatorFit.formatMatch < 0.4) {
    factors.push({
      factor: 'Format mismatch — the inferred format doesn\'t match your content style',
      severity: 1,
      suggestion: 'Reframe this concept for your strongest format (e.g., talking head vs. b-roll)',
      improvement: 3,
    });
  }

  // Gemini-identified weaknesses
  for (const weakness of analysis.content_weaknesses) {
    factors.push({
      factor: weakness,
      severity: 1,
      suggestion: `Address: ${weakness}`,
      improvement: 2,
    });
  }

  // Low Gemini confidence
  if (analysis.confidence < 0.4) {
    factors.push({
      factor: 'Concept is vague — the idea needs more specificity to predict accurately',
      severity: 2,
      suggestion: 'Add concrete details: a specific number, timeframe, or outcome',
      improvement: 4,
    });
  }

  // Sort by severity (highest first)
  factors.sort((a, b) => b.severity - a.severity);

  const primary = factors[0] || {
    factor: 'No major limiting factors identified',
    suggestion: 'This concept has solid fundamentals — focus on execution quality',
    improvement: 0,
  };

  return {
    primary_limiting_factor: primary.factor,
    suggestion: primary.suggestion,
    projected_improvement: primary.improvement,
    strengths: analysis.content_strengths,
    weaknesses: analysis.content_weaknesses,
  };
}

function generateAdjustments(
  analysis: GeminiConceptAnalysis,
  saturation: PatternSaturationResult | null,
  creatorFit: CreatorFitScore | null,
  currentVps: number,
): ConceptAdjustment[] {
  const adjustments: ConceptAdjustment[] = [];

  // Adjustment 1: Hook optimization (aligned with 10-type taxonomy clusters)
  const hookType = analysis.inferred_hook_type;
  const credibilityHooks = ['statistic', 'authority', 'result_preview'];
  const emotionalHooks = ['personal_story', 'problem_identification'];
  const cognitiveHooks = ['contrarian', 'myth_bust'];
  const curiosityHooks = ['question', 'list_preview'];

  if (credibilityHooks.includes(hookType)) {
    adjustments.push({
      adjustment_text: 'Open with a specific number or counterintuitive claim in the first 3 seconds',
      projected_vps_delta: 4,
      rationale: 'Specificity in credibility hooks increases curiosity gap and retention rate by 15-25%',
    });
  } else if (emotionalHooks.includes(hookType)) {
    adjustments.push({
      adjustment_text: 'Lead with the most relatable version of the problem — make the viewer think "that\'s me"',
      projected_vps_delta: 4,
      rationale: 'Emotional identification in the first 2 seconds drives 2x higher completion rates',
    });
  } else if (cognitiveHooks.includes(hookType)) {
    adjustments.push({
      adjustment_text: 'Make the contrarian claim more polarizing — target a common belief that\'s wrong',
      projected_vps_delta: 3,
      rationale: 'Cognitive challenge hooks drive 2x more comments and shares',
    });
  } else if (curiosityHooks.includes(hookType)) {
    adjustments.push({
      adjustment_text: 'Tease the answer/list immediately but delay the full reveal — create an open loop',
      projected_vps_delta: 3,
      rationale: 'Curiosity gaps increase average watch time by 20-40%',
    });
  } else {
    adjustments.push({
      adjustment_text: 'Lead with the most surprising element of your concept in the first 2 seconds',
      projected_vps_delta: 3,
      rationale: 'Front-loading the hook increases scroll-stop rate',
    });
  }

  // Adjustment 2: Based on saturation or fit
  if (saturation && saturation.saturation_pct > 50) {
    adjustments.push({
      adjustment_text: `This pattern is ${saturation.lifecycle_stage} in your niche — add a personal story or contrarian angle to stand out`,
      projected_vps_delta: 5,
      rationale: `${saturation.saturation_pct.toFixed(0)}% saturation means audiences have seen this format before — differentiation is key`,
    });
  } else if (creatorFit && creatorFit.overallFit > 0.7) {
    adjustments.push({
      adjustment_text: 'This concept fits your style well — double down on your strongest format and add an open loop at the midpoint',
      projected_vps_delta: 3,
      rationale: 'High creator-concept fit + retention architecture = optimal performance',
    });
  } else {
    adjustments.push({
      adjustment_text: 'Add a "curiosity gap" — tease the payoff early but delay the reveal until the end',
      projected_vps_delta: 4,
      rationale: 'Open loops increase average watch time by 20-40%',
    });
  }

  return adjustments.slice(0, 2);
}

// ============================================================================
// Fallback (no Gemini)
// ============================================================================

function buildFallbackResult(input: ConceptScoreInput): ConceptScoreResult {
  const difficultyFactor = getNicheDifficultyFactor(input.niche);
  const baseVps = Math.round(55 * difficultyFactor * 10) / 10;

  return {
    conceptVps: baseVps,
    confidenceRange: [Math.max(0, baseVps - 20), Math.min(100, baseVps + 20)],
    diagnosis: {
      primary_limiting_factor: 'Gemini unavailable — concept analysis is approximate',
      suggestion: 'Detailed concept scoring requires the Gemini API. Score is based on niche average.',
      projected_improvement: 0,
      strengths: [],
      weaknesses: ['Unable to analyze concept in detail without Gemini'],
    },
    suggestedAdjustments: [],
    matchedPattern: null,
    patternSaturation: null,
    creatorFit: null,
    geminiAnalysis: {
      inferred_hook_type: 'authority',
      inferred_narrative_arc: 'revelation',
      inferred_psych_trigger: 'curiosity_gap',
      inferred_pacing: 'fast_cuts',
      inferred_cta: 'follow',
      estimated_length_seconds: 30,
      inferred_format: 'talking_head',
      content_strengths: [],
      content_weaknesses: [],
      suggested_pattern_name: 'generic',
      raw_vps_estimate: baseVps,
      confidence: 0.1,
    },
    qualityGate: {
      score: 50,
      hookRetention: 72,
      deliveryBaseline: 50,
      contentStructure: 65,
      productionFloor: 60,
      gateClassification: 'borderline' as GateClassification,
    },
    distributionPotential: {
      score: 50,
      nicheSaturation: 70,
      trendAlignment: 50,
      shareProbability: 50,
      creatorMomentum: 50,
      audienceFit: 50,
    },
  };
}

// ============================================================================
// Helpers
// ============================================================================

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
