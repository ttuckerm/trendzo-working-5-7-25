/**
 * GET /api/training/export?niche=side-hustles
 *
 * Streams a CSV download of training-ready prediction runs with the full
 * 42-feature XGBoost vector reconstructed from run_component_results.
 *
 * Same logic as scripts/export-training-dataset.ts — adapted for HTTP streaming.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { classifyLabelCategory } from '@/lib/training/training-eligibility';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // allow up to 60s for large exports

// ── Supabase client ──────────────────────────────────────────────────────────

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { persistSession: false } },
  );
}

// ── 42 XGBoost v5 feature names ──────────────────────────────────────────────

const XGBOOST_V5_FEATURES = [
  'duration_seconds', 'resolution_width', 'resolution_height', 'fps',
  'motion_score', 'has_faces', 'face_time_ratio', 'has_music',
  'avg_volume', 'brightness_avg', 'contrast_ratio', 'saturation_avg',
  'visual_complexity', 'hook_scene_changes',
  'text_word_count', 'text_char_count', 'text_sentence_count',
  'text_avg_word_length', 'text_question_count', 'text_exclamation_count',
  'text_hashtag_count',
  'hook_scorer_pred', 'hook_scorer_conf',
  '7_legos_pred', '7_legos_conf',
  '9_attributes_pred', '9_attributes_conf',
  '24_styles_pred', '24_styles_conf',
  'niche_keywords_pred', 'niche_keywords_conf',
  'virality_matrix_pred', 'virality_matrix_conf',
  'pattern_extraction_pred', 'pattern_extraction_conf',
  'trend_timing_pred', 'trend_timing_conf',
  'posting_time_pred', 'posting_time_conf',
  'gpt4_score', 'claude_score',
  'feature_coverage_ratio',
] as const;

const MIN_FEATURE_COVERAGE = 0.25;

// ── Types ────────────────────────────────────────────────────────────────────

interface EnrichedRun {
  id: string;
  video_id: string;
  created_at: string;
  actual_dps: number | null;
  predicted_dps_7d: number | null;
  transcription_source: string | null;
  raw_result: any;
  niche: string;
  account_size_band: string | null;
  // DPS v2 fields
  dps_formula_version: string | null;
  dps_label_trust: string | null;
  dps_training_weight: number | null;
  actual_tier: string | null;
  actual_completion_rate: number | null;
  actual_share_rate: number | null;
  actual_save_rate: number | null;
  actual_velocity_score: number | null;
  actual_view_to_follower_ratio: number | null;
  actual_comment_rate: number | null;
  // v2 decomposition (Step 8)
  dps_signal_confidence: number | null;
  dps_cohort_sample_size: number | null;
  dps_threshold_version: string | null;
  dps_within_cohort_percentile: number | null;
  dps_population_percentile: number | null;
}

interface ComponentRow {
  run_id: string;
  component_id: string;
  success: boolean;
  prediction: number | null;
  confidence: number | null;
  features: Record<string, any> | null;
}

// ── Feature reconstruction (mirrors scripts/export-training-dataset.ts) ──────

function reconstructFeatures(
  components: ComponentRow[],
  _rawResult: any,
): Record<string, number | string | null> {
  const feat: Record<string, number | string | null> = {};
  const byId = new Map<string, ComponentRow>();
  for (const c of components) byId.set(c.component_id, c);

  // 1. FFmpeg features
  const ffmpeg = byId.get('ffmpeg');
  if (ffmpeg?.features) {
    const f = ffmpeg.features;
    feat.duration_seconds = f.duration ?? f.duration_seconds ?? null;
    feat.resolution_width = f.width ?? f.resolution_width ?? null;
    feat.resolution_height = f.height ?? f.resolution_height ?? null;
    feat.fps = f.fps ?? null;
    feat.motion_score = f.motionScore ?? f.motion_score ?? null;
    feat.has_faces = f.hasFaces ?? f.has_faces ?? null;
    feat.face_time_ratio = f.faceTimeRatio ?? f.face_time_ratio ?? null;
    feat.has_music = f.hasMusic ?? f.has_music ?? (f.hasAudio ? 1 : null);
    feat.avg_volume = f.avgVolume ?? f.avg_volume ?? null;
    feat.brightness_avg = f.avgBrightness ?? f.brightness_avg ?? null;
    feat.contrast_ratio = f.contrastRatio ?? f.contrast_ratio ?? null;
    feat.saturation_avg = f.saturationAvg ?? f.saturation_avg ?? null;
    feat.visual_complexity = f.visualComplexity ?? f.visual_complexity ?? null;
    feat.hook_scene_changes = f.hookSceneChanges ?? f.hook_scene_changes ?? f.sceneChanges ?? null;
  }

  // 2. Text features
  const featureExtraction = byId.get('feature-extraction');
  if (featureExtraction?.features) {
    const f = featureExtraction.features;
    feat.text_word_count = f.text_word_count ?? f.word_count ?? null;
    feat.text_char_count = f.text_char_count ?? f.char_count ?? null;
    feat.text_sentence_count = f.text_sentence_count ?? f.sentence_count ?? null;
    feat.text_avg_word_length = f.text_avg_word_length ?? f.avg_word_length ?? null;
    feat.text_question_count = f.text_question_count ?? f.question_count ?? null;
    feat.text_exclamation_count = f.text_exclamation_count ?? f.exclamation_count ?? null;
    feat.text_hashtag_count = f.text_hashtag_count ?? f.hashtag_count ?? null;
  }

  // 2b. Nested features fallback from feature-extraction
  const nestedFeatures = featureExtraction?.features?.features;
  if (nestedFeatures && typeof nestedFeatures === 'object') {
    const nf = nestedFeatures as Record<string, any>;
    feat.duration_seconds ??= nf.ffmpeg_duration ?? nf.duration_seconds ?? null;
    feat.resolution_width ??= nf.ffmpeg_resolution_width ?? nf.resolution_width ?? null;
    feat.resolution_height ??= nf.ffmpeg_resolution_height ?? nf.resolution_height ?? null;
    feat.fps ??= nf.ffmpeg_fps ?? nf.fps ?? null;
    feat.motion_score ??= nf.ffmpeg_avg_motion ?? nf.motion_score ?? null;
    feat.has_faces ??= nf.has_faces ?? null;
    feat.face_time_ratio ??= nf.face_time_ratio ?? null;
    feat.has_music ??= nf.ffmpeg_has_audio ?? nf.has_music ?? null;
    feat.avg_volume ??= nf.avg_volume ?? null;
    feat.brightness_avg ??= nf.ffmpeg_brightness_avg ?? nf.brightness_avg ?? null;
    feat.contrast_ratio ??= nf.ffmpeg_contrast_score ?? nf.contrast_ratio ?? null;
    feat.saturation_avg ??= nf.ffmpeg_color_variance ?? nf.saturation_avg ?? null;
    feat.visual_complexity ??= nf.visual_complexity ?? nf.complexity_score ?? null;
    feat.hook_scene_changes ??= nf.ffmpeg_scene_changes ?? nf.hook_scene_changes ?? null;
    feat.text_word_count ??= nf.word_count ?? nf.text_word_count ?? null;
    feat.text_char_count ??= nf.char_count ?? nf.text_char_count ?? null;
    feat.text_sentence_count ??= nf.sentence_count ?? nf.text_sentence_count ?? null;
    feat.text_avg_word_length ??= nf.avg_word_length ?? nf.text_avg_word_length ?? null;
    feat.text_question_count ??= nf.question_mark_count ?? nf.text_question_count ?? null;
    feat.text_exclamation_count ??= nf.exclamation_mark_count ?? nf.text_exclamation_count ?? null;
    feat.text_hashtag_count ??= nf.hashtag_count ?? nf.text_hashtag_count ?? null;
  }

  // Fallback: xgboost component
  const xgb = byId.get('xgboost-virality-ml');
  if (xgb?.features?.top_contributing_features) {
    for (const tcf of xgb.features.top_contributing_features) {
      if ((XGBOOST_V5_FEATURES as readonly string[]).includes(tcf.feature) && feat[tcf.feature] == null) {
        feat[tcf.feature] = tcf.value;
      }
    }
  }

  // 3. Component predictions
  const compPredMap: Record<string, { pred: string; conf: string }> = {
    'hook-scorer': { pred: 'hook_scorer_pred', conf: 'hook_scorer_conf' },
    '7-legos': { pred: '7_legos_pred', conf: '7_legos_conf' },
    '9-attributes': { pred: '9_attributes_pred', conf: '9_attributes_conf' },
    '24-styles': { pred: '24_styles_pred', conf: '24_styles_conf' },
    'niche-keywords': { pred: 'niche_keywords_pred', conf: 'niche_keywords_conf' },
    'virality-matrix': { pred: 'virality_matrix_pred', conf: 'virality_matrix_conf' },
    'pattern-extraction': { pred: 'pattern_extraction_pred', conf: 'pattern_extraction_conf' },
    'trend-timing': { pred: 'trend_timing_pred', conf: 'trend_timing_conf' },
    'posting-time': { pred: 'posting_time_pred', conf: 'posting_time_conf' },
  };
  for (const [compId, mapping] of Object.entries(compPredMap)) {
    const comp = byId.get(compId);
    if (comp) {
      feat[mapping.pred] = comp.prediction ?? null;
      feat[mapping.conf] = comp.confidence ?? null;
    }
  }

  // 4. LLM scores
  feat.gpt4_score = byId.get('gpt4')?.prediction ?? null;
  feat.claude_score = byId.get('claude')?.prediction ?? null;

  // 4b. LLM fallback from nested features
  if (nestedFeatures && typeof nestedFeatures === 'object') {
    const nf = nestedFeatures as Record<string, any>;
    if (feat.hook_scorer_pred == null && nf.llm_hook_quality != null) {
      feat.hook_scorer_pred = Math.round((nf.llm_hook_quality as number) * 100 * 100) / 100;
    }
    if (feat['7_legos_pred'] == null && nf.llm_seven_legos != null) {
      feat['7_legos_pred'] = Math.round((nf.llm_seven_legos as number) * 100 * 100) / 100;
    }
    if (feat['9_attributes_pred'] == null && nf.llm_nine_attributes != null) {
      feat['9_attributes_pred'] = Math.round((nf.llm_nine_attributes as number) * 100 * 100) / 100;
    }
    if (feat.niche_keywords_pred == null && nf.niche_alignment != null) {
      feat.niche_keywords_pred = Math.round((nf.niche_alignment as number) * 100 * 100) / 100;
    }
  }

  // Fill missing with null
  for (const name of XGBOOST_V5_FEATURES) {
    if (feat[name] === undefined) feat[name] = null;
  }

  // 5. Coverage ratio
  const baseFeatureCount = XGBOOST_V5_FEATURES.length - 1;
  let nonNullCount = 0;
  for (const name of XGBOOST_V5_FEATURES) {
    if (name === 'feature_coverage_ratio') continue;
    if (feat[name] != null) nonNullCount++;
  }
  feat.feature_coverage_ratio = Math.round((nonNullCount / baseFeatureCount) * 10000) / 10000;

  return feat;
}

// ── CSV helper ───────────────────────────────────────────────────────────────

function csvEscape(val: any): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

// ── GET handler ──────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const niche = (request.nextUrl.searchParams.get('niche') || 'side-hustles').toLowerCase().replace(/_/g, '-');
    const supabase = getSupabase();

    // 1. Fetch v2-eligible runs with decomposition columns
    const { data: rawRuns, error: runErr } = await supabase
      .from('prediction_runs_enriched')
      .select(
        'id, video_id, created_at, actual_dps, predicted_dps_7d, ' +
        'transcription_source, raw_result, niche, account_size_band, ' +
        'dps_formula_version, dps_label_trust, dps_training_weight, actual_tier, ' +
        'actual_completion_rate, actual_share_rate, actual_save_rate, ' +
        'actual_velocity_score, actual_view_to_follower_ratio, actual_comment_rate, ' +
        'dps_signal_confidence, dps_cohort_sample_size, dps_threshold_version, ' +
        'dps_within_cohort_percentile, dps_population_percentile',
      )
      .eq('training_label_eligible', true)
      .eq('niche', niche)
      .order('created_at', { ascending: true });

    const runs = rawRuns as unknown as EnrichedRun[] | null;

    if (runErr) {
      return NextResponse.json(
        { success: false, error: runErr.message },
        { status: 500 },
      );
    }

    if (!runs || runs.length === 0) {
      return NextResponse.json(
        { success: true, message: 'No training-ready rows', count: 0 },
        { status: 200 },
      );
    }

    // 2. Fetch all component results for these runs
    const runIds = runs.map((r) => r.id);

    // Supabase .in() has a practical limit — batch if needed
    const BATCH_SIZE = 200;
    const allComponents: ComponentRow[] = [];
    for (let i = 0; i < runIds.length; i += BATCH_SIZE) {
      const batch = runIds.slice(i, i + BATCH_SIZE);
      const { data: rawComps, error: compErr } = await supabase
        .from('run_component_results')
        .select('run_id, component_id, success, prediction, confidence, features')
        .in('run_id', batch);
      if (compErr) {
        return NextResponse.json(
          { success: false, error: compErr.message },
          { status: 500 },
        );
      }
      const comps = rawComps as unknown as ComponentRow[] | null;
      if (comps) allComponents.push(...comps);
    }

    // Group components by run_id
    const compsByRun = new Map<string, ComponentRow[]>();
    for (const c of allComponents) {
      if (!compsByRun.has(c.run_id)) compsByRun.set(c.run_id, []);
      compsByRun.get(c.run_id)!.push(c);
    }

    // 3. Build CSV with v2 breakdown columns
    const v2MetaColumns = [
      'dps_formula_version', 'dps_label_trust', 'dps_training_weight', 'label_category',
      'actual_tier', 'actual_completion_rate', 'actual_share_rate', 'actual_save_rate',
      'actual_velocity_score', 'actual_view_to_follower_ratio', 'actual_comment_rate',
      // v2 decomposition (Step 8)
      'dps_signal_confidence', 'dps_cohort_sample_size', 'dps_threshold_version',
      'dps_within_cohort_percentile', 'dps_population_percentile',
    ];
    const metaColumns = [
      'run_id', 'video_id', 'created_at', 'account_size',
      'transcription_source', 'actual_dps', 'predicted_dps_7d',
      ...v2MetaColumns,
    ];
    const header = [...metaColumns, ...XGBOOST_V5_FEATURES, 'component_preds'].join(',');

    const csvLines: string[] = [header];

    for (const run of runs) {
      const components = compsByRun.get(run.id) || [];
      const features = reconstructFeatures(components, run.raw_result);
      const coverage = features.feature_coverage_ratio as number;

      // Skip rows below minimum coverage
      if (coverage < MIN_FEATURE_COVERAGE) continue;

      // Build component_preds JSON
      const compPreds: Record<string, { prediction: number | null; confidence: number | null }> = {};
      for (const c of components) {
        if (c.success) {
          compPreds[c.component_id] = { prediction: c.prediction, confidence: c.confidence };
        }
      }

      const metaValues = [
        run.id,
        run.video_id,
        run.created_at,
        run.account_size_band || '',
        run.transcription_source || '',
        run.actual_dps,
        run.predicted_dps_7d,
        // v2 columns
        run.dps_formula_version ?? '',
        run.dps_label_trust ?? '',
        run.dps_training_weight ?? '',
        classifyLabelCategory(run),
        run.actual_tier ?? '',
        run.actual_completion_rate ?? '',
        run.actual_share_rate ?? '',
        run.actual_save_rate ?? '',
        run.actual_velocity_score ?? '',
        run.actual_view_to_follower_ratio ?? '',
        run.actual_comment_rate ?? '',
        // v2 decomposition (Step 8)
        run.dps_signal_confidence ?? '',
        run.dps_cohort_sample_size ?? '',
        run.dps_threshold_version ?? '',
        run.dps_within_cohort_percentile ?? '',
        run.dps_population_percentile ?? '',
      ];

      const featureValues = XGBOOST_V5_FEATURES.map((f) => features[f]);
      const csvRow = [...metaValues, ...featureValues, JSON.stringify(compPreds)]
        .map(csvEscape)
        .join(',');
      csvLines.push(csvRow);
    }

    const rowCount = csvLines.length - 1; // minus header
    const csvBody = csvLines.join('\n');
    const filename = `trendzo_${niche}_training_${Date.now()}.csv`;

    return new NextResponse(csvBody, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Row-Count': String(rowCount),
      },
    });
  } catch (err: any) {
    console.error('[training/export] Error:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}
