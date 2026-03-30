/**
 * Pattern Extractor — Gemini-based mechanical template classification
 *
 * Takes a scraped viral video and classifies it into a pattern archetype
 * (narrative arc, psychological trigger, hook structure, pacing rhythm, CTA type).
 *
 * Works primarily from scraped_videos metadata. If the video was also run through
 * the prediction pipeline, pack analysis data can be passed as optional enrichment.
 *
 * On any Gemini failure, returns null (graceful degradation).
 */

import { GoogleGenAI } from '@google/genai';
import type { SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// Types
// ============================================================================

/** A row from scraped_videos with the fields we need */
export interface ScrapedVideo {
  id: string;
  title?: string | null;
  description?: string | null;
  hashtags?: string[] | null;
  niche?: string | null;
  views_count?: number | null;
  likes_count?: number | null;
  comments_count?: number | null;
  shares_count?: number | null;
  saves_count?: number | null;
  duration_seconds?: number | null;
  creator_name?: string | null;
  creator_unique_id?: string | null;
  creator_followers_count?: number | null;
}

/** Optional pack analysis enrichment */
export interface PackEnrichment {
  pack1?: {
    attribute_scores?: Array<{ attribute: string; score: number; evidence?: string }>;
    hook?: { type?: string; clarity_score?: number; pattern?: string };
    idea_legos?: Record<string, boolean>;
  } | null;
  pack3?: {
    mechanics?: Array<{ name: string; strength: number; evidence?: string[] }>;
  } | null;
  packV?: {
    visual_hook_score?: { score: number };
    pacing_score?: { score: number };
    pattern_interrupts_score?: { score: number };
    overall_visual_score?: number;
  } | null;
}

/** The classification Gemini returns */
export interface PatternClassification {
  pattern_name: string;
  narrative_arc: NarrativeArc;
  psych_trigger: string;
  hook_structure: string;
  pacing_rhythm: string;
  cta_type: CTAType;
  confidence: number;
}

export interface PatternExtractionResult {
  pattern_id: string;
  pattern_name: string;
  instance_id: string;
  is_new_pattern: boolean;
  classification: PatternClassification;
}

type NarrativeArc = 'transformation' | 'revelation' | 'warning' | 'social_proof' | 'challenge' | 'insider_access' | 'myth_bust';
type CTAType = 'follow' | 'share' | 'comment' | 'save' | 'none';

const VALID_ARCS: NarrativeArc[] = ['transformation', 'revelation', 'warning', 'social_proof', 'challenge', 'insider_access', 'myth_bust'];
const VALID_CTAS: CTAType[] = ['follow', 'share', 'comment', 'save', 'none'];

// ============================================================================
// Main Export: Single Video Extraction
// ============================================================================

/**
 * Extract a pattern classification from a single scraped video.
 * Returns null if Gemini is unavailable or classification fails.
 */
export async function extractPattern(
  video: ScrapedVideo,
  supabase: SupabaseClient,
  packData?: PackEnrichment,
): Promise<PatternExtractionResult | null> {
  const apiKey =
    process.env.GOOGLE_GEMINI_AI_API_KEY ||
    process.env.GOOGLE_AI_API_KEY ||
    process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.log('[PatternExtractor] No Gemini API key available, skipping');
    return null;
  }

  try {
    // Step 1: Classify with Gemini
    const ai = new GoogleGenAI({ apiKey });
    const classification = await classifyWithGemini(ai, video, packData);

    if (!classification) {
      console.log(`[PatternExtractor] Classification failed for video ${video.id}`);
      return null;
    }

    // Step 2: Find or create the pattern archetype
    const { pattern_id, is_new } = await findOrCreateArchetype(supabase, classification);

    // Step 3: Create the instance record
    const { data: instance, error: instanceError } = await supabase
      .from('archetype_instances')
      .upsert(
        {
          pattern_id,
          video_id: video.id,
          niche_key: video.niche || 'unknown',
          views_count: video.views_count || 0,
          detected_at: new Date().toISOString(),
          confidence: classification.confidence,
        },
        { onConflict: 'pattern_id,video_id' },
      )
      .select('id')
      .single();

    if (instanceError) {
      console.error(`[PatternExtractor] Failed to create instance: ${instanceError.message}`);
      return null;
    }

    console.log(
      `[PatternExtractor] ${is_new ? 'NEW' : 'Matched'} pattern "${classification.pattern_name}" for video ${video.id} (confidence: ${classification.confidence})`,
    );

    return {
      pattern_id,
      pattern_name: classification.pattern_name,
      instance_id: instance.id,
      is_new_pattern: is_new,
      classification,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[PatternExtractor] Error processing video ${video.id}: ${msg}`);
    return null;
  }
}

// ============================================================================
// Batch Export
// ============================================================================

/**
 * Extract patterns for a batch of videos. Processes in groups of 5 to avoid
 * rate limiting on Gemini API.
 */
export async function extractPatternsBatch(
  videos: ScrapedVideo[],
  supabase: SupabaseClient,
): Promise<PatternExtractionResult[]> {
  const results: PatternExtractionResult[] = [];
  const batchSize = 5;

  for (let i = 0; i < videos.length; i += batchSize) {
    const batch = videos.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(
      batch.map(v => extractPattern(v, supabase)),
    );

    for (const r of batchResults) {
      if (r.status === 'fulfilled' && r.value) {
        results.push(r.value);
      }
    }

    // Brief pause between batches to respect rate limits
    if (i + batchSize < videos.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log(`[PatternExtractor] Batch complete: ${results.length}/${videos.length} classified`);
  return results;
}

// ============================================================================
// Gemini Classification
// ============================================================================

async function classifyWithGemini(
  ai: GoogleGenAI,
  video: ScrapedVideo,
  packData?: PackEnrichment,
): Promise<PatternClassification | null> {
  const prompt = buildClassificationPrompt(video, packData);

  const result = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  });

  const responseText = result.text || '';
  return parseClassificationResponse(responseText);
}

function buildClassificationPrompt(video: ScrapedVideo, packData?: PackEnrichment): string {
  const engagement = [
    video.views_count ? `${(video.views_count / 1000).toFixed(0)}K views` : null,
    video.likes_count ? `${(video.likes_count / 1000).toFixed(0)}K likes` : null,
    video.comments_count ? `${video.comments_count} comments` : null,
    video.shares_count ? `${video.shares_count} shares` : null,
  ]
    .filter(Boolean)
    .join(', ');

  let packContext = '';

  if (packData?.pack1) {
    const attrs = packData.pack1.attribute_scores
      ?.map(a => `${a.attribute}: ${a.score}/10`)
      .join(', ');
    const hookType = packData.pack1.hook?.type || 'unknown';
    packContext += `\n\nPack 1 Analysis:\n- Hook type: ${hookType}\n- Attributes: ${attrs || 'unavailable'}`;
  }

  if (packData?.pack3?.mechanics?.length) {
    const mechanics = packData.pack3.mechanics
      .map(m => `${m.name} (${m.strength}%)`)
      .join(', ');
    packContext += `\n\nPack 3 Viral Mechanics: ${mechanics}`;
  }

  if (packData?.packV) {
    packContext += `\n\nPack V Visual Scores: hook=${packData.packV.visual_hook_score?.score || '?'}, pacing=${packData.packV.pacing_score?.score || '?'}, overall=${packData.packV.overall_visual_score || '?'}/100`;
  }

  return `You are classifying a viral TikTok video into a "Mechanical Template" — the underlying content pattern, NOT the surface topic.

VIDEO METADATA:
- Title: ${video.title || 'N/A'}
- Description: ${video.description || 'N/A'}
- Hashtags: ${video.hashtags?.join(', ') || 'N/A'}
- Niche: ${video.niche || 'unknown'}
- Engagement: ${engagement || 'N/A'}
- Duration: ${video.duration_seconds ? `${video.duration_seconds}s` : 'unknown'}
- Creator: ${video.creator_unique_id || video.creator_name || 'unknown'} (${video.creator_followers_count ? `${(video.creator_followers_count / 1000).toFixed(0)}K followers` : 'unknown followers'})${packContext}

CLASSIFY THIS VIDEO into these fields:

1. **pattern_name**: A short, hyphenated slug describing the mechanical template (e.g., "myth-bust", "transformation-reveal", "insider-access", "social-proof-cascade", "challenge-escalation", "results-first-proof", "curiosity-hook-payoff"). Use existing names when possible.

2. **narrative_arc**: EXACTLY one of: transformation, revelation, warning, social_proof, challenge, insider_access, myth_bust

3. **psych_trigger**: The primary psychological driver. Examples: curiosity_gap, identity_affirmation, fear_of_missing_out, social_proof, authority_bias, loss_aversion, novelty_seeking, tribal_belonging, self_improvement_desire

4. **hook_structure**: How the video opens. Examples: provocative_question, bold_claim, results_first, pattern_interrupt, shocking_stat, controversy, relatable_pain, authority_flex

5. **pacing_rhythm**: The editing/delivery tempo. Examples: fast_cuts, slow_build, alternating, steady_escalation, climax_first

6. **cta_type**: EXACTLY one of: follow, share, comment, save, none

7. **confidence**: Your confidence in this classification (0.0 to 1.0). Use lower values (<0.5) if the video doesn't clearly fit one pattern.

Return ONLY a JSON object, no other text:
{
  "pattern_name": "myth-bust",
  "narrative_arc": "myth_bust",
  "psych_trigger": "curiosity_gap",
  "hook_structure": "bold_claim",
  "pacing_rhythm": "fast_cuts",
  "cta_type": "comment",
  "confidence": 0.85
}`;
}

function parseClassificationResponse(responseText: string): PatternClassification | null {
  try {
    let cleaned = responseText.trim();

    // Strip markdown code blocks
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/```\n?/g, '');
    }

    const parsed = JSON.parse(cleaned);

    // Validate required fields
    if (!parsed.pattern_name || !parsed.narrative_arc || !parsed.psych_trigger ||
        !parsed.hook_structure || !parsed.pacing_rhythm || !parsed.cta_type) {
      console.error('[PatternExtractor] Missing required classification fields');
      return null;
    }

    // Enforce valid enum values
    if (!VALID_ARCS.includes(parsed.narrative_arc)) {
      console.error(`[PatternExtractor] Invalid narrative_arc: ${parsed.narrative_arc}`);
      return null;
    }
    if (!VALID_CTAS.includes(parsed.cta_type)) {
      console.error(`[PatternExtractor] Invalid cta_type: ${parsed.cta_type}`);
      return null;
    }

    // Normalize pattern_name to lowercase hyphenated slug
    parsed.pattern_name = parsed.pattern_name
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    // Clamp confidence
    parsed.confidence = Math.min(1, Math.max(0, Number(parsed.confidence) || 0.5));

    return parsed as PatternClassification;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[PatternExtractor] Failed to parse Gemini response: ${msg}`);
    console.error(`[PatternExtractor] Raw (first 500 chars): ${responseText.substring(0, 500)}`);
    return null;
  }
}

// ============================================================================
// Database: Find or Create Archetype
// ============================================================================

async function findOrCreateArchetype(
  supabase: SupabaseClient,
  classification: PatternClassification,
): Promise<{ pattern_id: string; is_new: boolean }> {
  // Try to match on the 5 structural fields
  const { data: existing } = await supabase
    .from('pattern_archetypes')
    .select('id')
    .eq('narrative_arc', classification.narrative_arc)
    .eq('psych_trigger', classification.psych_trigger)
    .eq('hook_structure', classification.hook_structure)
    .eq('pacing_rhythm', classification.pacing_rhythm)
    .eq('cta_type', classification.cta_type)
    .limit(1)
    .maybeSingle();

  if (existing) {
    return { pattern_id: existing.id, is_new: false };
  }

  // Also check if pattern_name already exists (different structural combo but same name)
  const { data: byName } = await supabase
    .from('pattern_archetypes')
    .select('id')
    .eq('pattern_name', classification.pattern_name)
    .maybeSingle();

  if (byName) {
    // Name exists but structural fields differ — use the existing pattern
    return { pattern_id: byName.id, is_new: false };
  }

  // Create new archetype
  const { data: created, error } = await supabase
    .from('pattern_archetypes')
    .insert({
      pattern_name: classification.pattern_name,
      narrative_arc: classification.narrative_arc,
      psych_trigger: classification.psych_trigger,
      hook_structure: classification.hook_structure,
      pacing_rhythm: classification.pacing_rhythm,
      cta_type: classification.cta_type,
    })
    .select('id')
    .single();

  if (error) {
    // Race condition: another process may have created it. Try to find it again.
    const { data: retry } = await supabase
      .from('pattern_archetypes')
      .select('id')
      .eq('pattern_name', classification.pattern_name)
      .maybeSingle();

    if (retry) {
      return { pattern_id: retry.id, is_new: false };
    }

    throw new Error(`Failed to create archetype: ${error.message}`);
  }

  return { pattern_id: created.id, is_new: true };
}
