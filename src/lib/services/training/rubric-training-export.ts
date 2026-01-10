/**
 * Rubric Training Export Service
 *
 * Extracts unified grading results from run_component_results
 * and formats them for XGBoost model training.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UnifiedGradingResult, ATTRIBUTE_NAMES } from '../../rubric-engine/unified-grading-types';

/**
 * Training row format for XGBoost
 */
export interface RubricTrainingRow {
  run_id: string;
  video_id: string;

  // 9 attribute scores (numeric 1-10)
  attr_1_tam_resonance: number;
  attr_2_shareability: number;
  attr_3_value_density: number;
  attr_4_emotional_journey: number;
  attr_5_hook_strength: number;
  attr_6_format_innovation: number;
  attr_7_pacing_rhythm: number;
  attr_8_curiosity_gaps: number;
  attr_9_clear_payoff: number;

  // 7 idea legos (binary 0/1)
  lego_1_topic_identified: number;
  lego_2_audience_relevant: number;
  lego_3_unique_angle: number;
  lego_4_intriguing_hook: number;
  lego_5_story_structure: number;
  lego_6_visual_format: number;
  lego_7_cta_present: number;
  lego_count: number;

  // Hook analysis
  hook_type: string;
  hook_clarity_score: number;

  // Additional dimensions
  pacing_score: number;
  clarity_score: number;
  novelty_score: number;

  // Style classification
  style_label: string;
  style_confidence: number;

  // Overall
  grader_confidence: number;
  avg_attribute_score: number;

  // Timestamp
  created_at: string;
}

/**
 * Get Supabase client for training data access
 */
function getSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY.');
  }

  return createClient(supabaseUrl, supabaseKey, {
    db: { schema: 'public' },
    auth: { persistSession: false }
  });
}

/**
 * Extract rubric features from a unified grading result
 */
function extractRubricFeatures(
  runId: string,
  videoId: string,
  result: UnifiedGradingResult,
  createdAt: string
): RubricTrainingRow {
  // Map attribute scores by position
  const attrScores: Record<string, number> = {};
  for (let i = 0; i < result.attribute_scores.length && i < 9; i++) {
    attrScores[`attr_${i + 1}`] = result.attribute_scores[i].score;
  }

  // Calculate average attribute score
  const avgAttrScore = result.attribute_scores.length > 0
    ? result.attribute_scores.reduce((sum, a) => sum + a.score, 0) / result.attribute_scores.length
    : 0;

  // Count legos
  const legoCount = [
    result.idea_legos.lego_1,
    result.idea_legos.lego_2,
    result.idea_legos.lego_3,
    result.idea_legos.lego_4,
    result.idea_legos.lego_5,
    result.idea_legos.lego_6,
    result.idea_legos.lego_7
  ].filter(Boolean).length;

  return {
    run_id: runId,
    video_id: videoId,

    // Attributes (default to 5 if missing)
    attr_1_tam_resonance: attrScores['attr_1'] ?? 5,
    attr_2_shareability: attrScores['attr_2'] ?? 5,
    attr_3_value_density: attrScores['attr_3'] ?? 5,
    attr_4_emotional_journey: attrScores['attr_4'] ?? 5,
    attr_5_hook_strength: attrScores['attr_5'] ?? 5,
    attr_6_format_innovation: attrScores['attr_6'] ?? 5,
    attr_7_pacing_rhythm: attrScores['attr_7'] ?? 5,
    attr_8_curiosity_gaps: attrScores['attr_8'] ?? 5,
    attr_9_clear_payoff: attrScores['attr_9'] ?? 5,

    // Legos (binary)
    lego_1_topic_identified: result.idea_legos.lego_1 ? 1 : 0,
    lego_2_audience_relevant: result.idea_legos.lego_2 ? 1 : 0,
    lego_3_unique_angle: result.idea_legos.lego_3 ? 1 : 0,
    lego_4_intriguing_hook: result.idea_legos.lego_4 ? 1 : 0,
    lego_5_story_structure: result.idea_legos.lego_5 ? 1 : 0,
    lego_6_visual_format: result.idea_legos.lego_6 ? 1 : 0,
    lego_7_cta_present: result.idea_legos.lego_7 ? 1 : 0,
    lego_count: legoCount,

    // Hook
    hook_type: result.hook.type || 'unknown',
    hook_clarity_score: result.hook.clarity_score ?? 5,

    // Additional dimensions
    pacing_score: result.pacing.score ?? 5,
    clarity_score: result.clarity.score ?? 5,
    novelty_score: result.novelty.score ?? 5,

    // Style
    style_label: result.style_classification.label || 'unknown',
    style_confidence: result.style_classification.confidence ?? 0.5,

    // Overall
    grader_confidence: result.grader_confidence ?? 0.5,
    avg_attribute_score: avgAttrScore,

    // Timestamp
    created_at: createdAt
  };
}

/**
 * Export rubric features for training from specified runs
 *
 * @param runIds - Array of prediction run IDs to export
 * @returns Array of training rows
 */
export async function exportRubricFeaturesForTraining(
  runIds: string[]
): Promise<RubricTrainingRow[]> {
  if (runIds.length === 0) {
    return [];
  }

  const supabase = getSupabaseClient();

  // Query run_component_results for unified-grading component
  const { data: componentResults, error } = await supabase
    .from('run_component_results')
    .select('run_id, video_id, features, created_at')
    .in('run_id', runIds)
    .eq('component_id', 'unified-grading')
    .eq('success', true);

  if (error) {
    console.error('[RubricExport] Query error:', error.message);
    throw new Error(`Failed to query component results: ${error.message}`);
  }

  if (!componentResults || componentResults.length === 0) {
    console.warn('[RubricExport] No unified-grading results found for specified runs');
    return [];
  }

  console.log(`[RubricExport] Found ${componentResults.length} unified-grading results`);

  const trainingRows: RubricTrainingRow[] = [];

  for (const row of componentResults) {
    try {
      // Extract the unified grading result from features
      const features = row.features as Record<string, unknown>;
      const gradingResult = features?.unified_grading_result as UnifiedGradingResult | undefined;

      if (!gradingResult) {
        console.warn(`[RubricExport] No unified_grading_result in features for run ${row.run_id}`);
        continue;
      }

      const trainingRow = extractRubricFeatures(
        row.run_id,
        row.video_id,
        gradingResult,
        row.created_at
      );

      trainingRows.push(trainingRow);
    } catch (extractError: any) {
      console.warn(`[RubricExport] Failed to extract features for run ${row.run_id}:`, extractError.message);
    }
  }

  console.log(`[RubricExport] Exported ${trainingRows.length} training rows`);
  return trainingRows;
}

/**
 * Export all available rubric features for training
 *
 * @param limit - Maximum number of rows to export
 * @param offset - Offset for pagination
 * @returns Array of training rows
 */
export async function exportAllRubricFeatures(
  limit: number = 1000,
  offset: number = 0
): Promise<RubricTrainingRow[]> {
  const supabase = getSupabaseClient();

  // Query all successful unified-grading results
  const { data: componentResults, error } = await supabase
    .from('run_component_results')
    .select('run_id, video_id, features, created_at')
    .eq('component_id', 'unified-grading')
    .eq('success', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('[RubricExport] Query error:', error.message);
    throw new Error(`Failed to query component results: ${error.message}`);
  }

  if (!componentResults || componentResults.length === 0) {
    return [];
  }

  console.log(`[RubricExport] Found ${componentResults.length} unified-grading results`);

  const trainingRows: RubricTrainingRow[] = [];

  for (const row of componentResults) {
    try {
      const features = row.features as Record<string, unknown>;
      const gradingResult = features?.unified_grading_result as UnifiedGradingResult | undefined;

      if (!gradingResult) {
        continue;
      }

      const trainingRow = extractRubricFeatures(
        row.run_id,
        row.video_id,
        gradingResult,
        row.created_at
      );

      trainingRows.push(trainingRow);
    } catch (extractError: any) {
      console.warn(`[RubricExport] Failed to extract features for run ${row.run_id}:`, extractError.message);
    }
  }

  return trainingRows;
}

/**
 * Get count of available rubric training samples
 */
export async function getRubricTrainingCount(): Promise<number> {
  const supabase = getSupabaseClient();

  const { count, error } = await supabase
    .from('run_component_results')
    .select('*', { count: 'exact', head: true })
    .eq('component_id', 'unified-grading')
    .eq('success', true);

  if (error) {
    console.error('[RubricExport] Count error:', error.message);
    return 0;
  }

  return count ?? 0;
}
