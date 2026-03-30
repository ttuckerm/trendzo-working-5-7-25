import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase-server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// ── Signal family definitions ────────────────────────────────────────────────

interface Signal {
  id: string;
  name: string;
  family: string;
  status: 'measured' | 'partial' | 'missing';
  source: string;
  detail: string;
}

const SIGNAL_FAMILIES: Record<string, Signal[]> = {
  content: [
    { id: 'ffmpeg-visual', name: 'Visual Analysis', family: 'content', status: 'measured', source: 'ffmpeg-canonical-analyzer', detail: 'Scene changes, motion, brightness, contrast, resolution — 12 features' },
    { id: 'audio-prosodic', name: 'Audio Prosody', family: 'content', status: 'measured', source: 'audio-prosodic-analyzer', detail: 'Pitch, loudness, silence ratio, contour slope — 10 features' },
    { id: 'audio-classify', name: 'Audio Classification', family: 'content', status: 'measured', source: 'audio-classifier', detail: 'Music/speech ratio, energy variance — 4 features' },
    { id: 'speaking-rate', name: 'Speaking Rate', family: 'content', status: 'measured', source: 'speaking-rate estimator', detail: 'WPM, variance, acceleration, peak count — 6 features' },
    { id: 'hook-quality', name: 'Hook Quality', family: 'content', status: 'measured', source: 'hook-scorer', detail: 'Multi-channel scoring (text/audio/visual/pace/tone) — 8 features' },
    { id: 'text-analysis', name: 'Text & Transcript', family: 'content', status: 'measured', source: 'text NLP pipeline', detail: 'Readability, sentiment, CTA, word stats — 14 features' },
    { id: 'visual-scene', name: 'Visual Scene Detection', family: 'content', status: 'measured', source: 'visual-scene-detector', detail: 'Scene count, avg duration, visual score — 3 features' },
    { id: 'thumbnail', name: 'Thumbnail Quality', family: 'content', status: 'measured', source: 'thumbnail-analyzer', detail: 'Brightness, contrast, colorfulness — 5 features' },
    { id: 'segment-features', name: 'Temporal Segments', family: 'content', status: 'measured', source: 'ffmpeg-segment-features', detail: 'Hook motion, energy buildup, scene pacing — 5 features' },
    { id: 'vision-hook', name: 'Vision Hook Features', family: 'content', status: 'measured', source: 'Gemini Vision (fallback: rule-based)', detail: 'Face present, text overlay, emotion intensity — 3 features' },
    { id: 'gemini-vision', name: 'Gemini Vision Scoring', family: 'content', status: 'measured', source: 'gemini-vision-scorer (Pack V)', detail: 'Frame-level quality scoring via Gemini — blended 60/40 with rules' },
    { id: 'visual-proof', name: 'Visual Proof Ratio', family: 'content', status: 'measured', source: 'Gemini Vision frame classifier (v9)', detail: 'Fraction of frames showing dashboards/receipts/screen recordings — r(dev)=0.222' },
    { id: 'text-overlay', name: 'Text Overlay Density', family: 'content', status: 'measured', source: 'Gemini Vision frame classifier (v9)', detail: 'Text overlay appearances per minute — r(dev)=0.442, strongest new signal' },
    { id: 'vocal-confidence', name: 'Vocal Confidence Composite', family: 'content', status: 'measured', source: 'audio-prosodic-analyzer (composite)', detail: 'Pitch stability + loudness consistency + silence ratio composite — r(dev)=0.076' },
    { id: 'emotional-words', name: 'Emotional & Power Words', family: 'content', status: 'missing', source: 'not yet implemented', detail: 'Group D: 20 emotion/power/urgency features — highest-impact unbuilt group' },
    { id: 'viral-patterns', name: 'Viral Pattern Words', family: 'content', status: 'missing', source: 'not yet implemented', detail: 'Group E: 15 Cialdini-principle features — social proof, scarcity, storytelling' },
  ],
  creator: [
    { id: 'follower-count', name: 'Follower Count', family: 'creator', status: 'measured', source: 'scraped_videos.creator_followers_count', detail: 'Raw follower count from TikTok profile via Apify' },
    { id: 'creator-stage', name: 'Creator Stage', family: 'creator', status: 'measured', source: 'creator-context.ts', detail: 'Classified as new/growing/established/large/mega from followers' },
    { id: 'creator-niche', name: 'Creator Niche', family: 'creator', status: 'partial', source: 'calibration profile / scraped_videos.niche', detail: 'Inferred from calibration or video metadata — not always accurate' },
    { id: 'channel-stats', name: 'Channel Performance', family: 'creator', status: 'partial', source: 'user_channels (when verified)', detail: 'Avg views, engagement rate, delivery baseline — requires TikTok handle' },
    { id: 'posting-history', name: 'Posting Frequency', family: 'creator', status: 'missing', source: 'not yet implemented', detail: 'Upload cadence, consistency, time-of-day patterns' },
    { id: 'creator-baseline', name: 'Per-Creator Baseline DPS', family: 'creator', status: 'partial', source: 'computed from scraped_videos', detail: 'Avg DPS per creator — only 20 creators with 2+ videos currently' },
  ],
  distribution: [
    { id: 'posting-time', name: 'Posting Time', family: 'distribution', status: 'missing', source: 'not yet implemented', detail: 'Day-of-week and hour-of-day posting time analysis' },
    { id: 'hashtag-strategy', name: 'Hashtag Strategy', family: 'distribution', status: 'missing', source: 'removed (D15 — meta_hashtag_count was bias)', detail: 'Intentionally removed — hashtags are distribution metadata, not content quality' },
    { id: 'platform-trends', name: 'Platform Trend Alignment', family: 'distribution', status: 'missing', source: 'not yet implemented', detail: 'TikTok trending sounds/effects/formats — requires trend API' },
    { id: 'fyp-algorithm', name: 'FYP Algorithm Signals', family: 'distribution', status: 'missing', source: 'structurally unavailable', detail: 'Black box — external tools cannot access TikTok algorithm internals' },
  ],
  cultural: [
    { id: 'trend-alignment', name: 'Cultural Trend Alignment', family: 'cultural', status: 'partial', source: 'last30days weekly research (manual)', detail: 'Weekly last30days briefings tracking trending topics, formats, and skepticism patterns in the niche' },
    { id: 'seasonal-patterns', name: 'Seasonal Patterns', family: 'cultural', status: 'missing', source: 'not yet implemented', detail: 'Holiday, back-to-school, New Year resolution cycles' },
    { id: 'meme-format', name: 'Meme Format Detection', family: 'cultural', status: 'missing', source: 'not yet implemented', detail: 'Whether content uses a currently-trending meme template' },
    { id: 'niche-saturation', name: 'Niche Saturation', family: 'cultural', status: 'missing', source: 'not yet implemented', detail: 'How crowded the content space is for this topic right now' },
  ],
  audience: [
    { id: 'audience-size-band', name: 'Audience Size Band', family: 'audience', status: 'measured', source: 'system-registry.ts accountSizeBands', detail: 'small/medium/large/mega classification for DPS cohort matching' },
    { id: 'audience-demographics', name: 'Audience Demographics', family: 'audience', status: 'partial', source: 'calibration audienceEnrichment', detail: 'Location, occupation — only available after calibration onboarding' },
    { id: 'engagement-patterns', name: 'Engagement Patterns', family: 'audience', status: 'partial', source: 'DPS formula engagement percentile', detail: 'Engagement rate percentile within cohort — available post-publication only' },
    { id: 'audience-retention', name: 'Audience Retention Curve', family: 'audience', status: 'missing', source: 'not available via API', detail: 'Watch-through rate at each second — TikTok Creator Tools only' },
  ],
};

// ── Prompt initiative definitions ────────────────────────────────────────────

interface PromptEntry {
  number: number;
  title: string;
  status: 'complete' | 'in-progress' | 'pending' | 'blocked';
  outputDoc: string | null;
  unlockedNext: string;
}

const PROMPT_INITIATIVE: PromptEntry[] = [
  { number: 1, title: 'Format Ontology', status: 'complete', outputDoc: 'docs/FORMAT_ONTOLOGY.md', unlockedNext: 'Canonical vocabulary for side-hustles talking-head format' },
  { number: 2, title: 'Signal Ontology', status: 'complete', outputDoc: 'docs/SIGNAL_ONTOLOGY.md', unlockedNext: '3-layer signal/mechanism/feature taxonomy with 12 mechanisms' },
  { number: 3, title: 'Manual Annotation Schema', status: 'complete', outputDoc: 'docs/MANUAL_ANNOTATION_SCHEMA.md', unlockedNext: 'Benchmark set design and human annotation system' },
  { number: 4, title: 'Post-Publication Analysis', status: 'complete', outputDoc: 'docs/POST_PUB_ANALYSIS_REPORT.md', unlockedNext: 'Evidence base for which signals actually drive DPS' },
  { number: 5, title: 'Creator Baseline Analysis', status: 'complete', outputDoc: 'docs/CREATOR_BASELINE_ANALYSIS.md', unlockedNext: 'Features that survive creator-control filtering' },
  { number: 6, title: 'Response Stack Report', status: 'complete', outputDoc: 'docs/RESPONSE_STACK_REPORT.md', unlockedNext: 'What drives save-heavy vs share-heavy vs comment-heavy response' },
  { number: 7, title: 'Counterfactual Sets + Endogenous/Exogenous Model', status: 'complete', outputDoc: 'docs/COUNTERFACTUAL_SETS.md', unlockedNext: 'Content ceiling vs distribution ceiling defined' },
  { number: 8, title: 'Tier Mechanism Profiles + Definitions', status: 'complete', outputDoc: 'docs/TIER_DEFINITIONS.md', unlockedNext: 'Evidence-backed tier boundaries and upgrade paths' },
  { number: 9, title: 'Next Feature Queue', status: 'complete', outputDoc: 'docs/NEXT_FEATURE_QUEUE.md', unlockedNext: '6 KEEP / 5 DROP / 5 DEFER with evidence justification' },
  { number: 10, title: 'Train & Evaluate Baseline Models', status: 'complete', outputDoc: 'docs/TRAINING_EVAL_REPORT.md', unlockedNext: 'CV Spearman 0.614 baseline established' },
  { number: 11, title: 'Initiative Intelligence Page', status: 'complete', outputDoc: null, unlockedNext: 'Live status board for initiative auditability' },
  { number: 12, title: 'Feature Implementation + v9 Retrain', status: 'complete', outputDoc: 'docs/RETRAIN_REPORT_REAL.md', unlockedNext: 'Holdout Spearman 0.8002, tier accuracy +4pp, v9 deployed' },
];

// ── GET handler ──────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const supabase = getServerSupabase();

    // 1. Fetch latest Spearman from vps_evaluation
    let spearman: { rho: number | null; p_value: number | null; n: number; mae: number | null; computed_at: string | null } = {
      rho: null, p_value: null, n: 0, mae: null, computed_at: null,
    };

    try {
      const { data: evalRows } = await supabase
        .from('vps_evaluation')
        .select('spearman_rho, p_value, n, mae, computed_at')
        .order('computed_at', { ascending: false })
        .limit(1);

      if (evalRows && evalRows.length > 0) {
        const row = evalRows[0];
        spearman = {
          rho: row.spearman_rho,
          p_value: row.p_value,
          n: row.n,
          mae: row.mae,
          computed_at: row.computed_at,
        };
      }
    } catch {
      // vps_evaluation table may not exist yet — fall back to model metadata
    }

    // 2. Fall back to model metadata if no vps_evaluation data
    let modelMeta: { version: string; trainedAt: string; cvSpearman: number | null; holdoutSpearman: number | null; featureCount: number; datasetSize: number } | null = null;

    const modelsDir = join(process.cwd(), 'models');
    for (const version of ['v10', 'v9', 'v8', 'v7']) {
      const metaPath = join(modelsDir, `xgboost-${version}-metadata.json`);
      if (existsSync(metaPath)) {
        try {
          const raw = JSON.parse(readFileSync(metaPath, 'utf-8'));
          modelMeta = {
            version: raw.model_version || version,
            trainedAt: raw.trained_at || '',
            cvSpearman: raw.performance?.cv_5fold?.spearman_mean ?? null,
            holdoutSpearman: raw.performance?.holdout?.spearman_rho ?? null,
            featureCount: raw.feature_count || 0,
            datasetSize: raw.dataset?.total_rows || 0,
          };
          break;
        } catch { /* skip corrupt metadata */ }
      }
    }

    // If no live Spearman but model metadata exists, use model CV Spearman
    if (spearman.rho === null && modelMeta?.cvSpearman != null) {
      spearman.rho = modelMeta.cvSpearman;
      spearman.n = modelMeta.datasetSize;
    }

    // 3. Count labeled prediction runs (for initiative progress)
    let labeledCount = 0;
    let v2TrustedLabeledCount = 0;
    let legacyLabeledCount = 0;
    try {
      const { count } = await supabase
        .from('prediction_runs')
        .select('id', { count: 'exact', head: true })
        .not('actual_dps', 'is', null);
      labeledCount = count || 0;

      // v2 trusted count — must explicitly match version LIKE '2%'
      const { count: v2Count } = await supabase
        .from('prediction_runs')
        .select('id', { count: 'exact', head: true })
        .not('actual_dps', 'is', null)
        .like('dps_formula_version', '2%')
        .neq('dps_label_trust', 'untrusted')
        .gt('dps_training_weight', 0);
      v2TrustedLabeledCount = v2Count || 0;

      // legacy count — includes both unarchived (NULL) and archived ('legacy_v1')
      const { count: legCount } = await supabase
        .from('prediction_runs')
        .select('id', { count: 'exact', head: true })
        .not('actual_dps', 'is', null)
        .or('dps_formula_version.is.null,dps_formula_version.eq.legacy_v1');
      legacyLabeledCount = legCount || 0;
    } catch { /* table may not exist */ }

    // 4. Count total training features (side-hustles)
    let trainingFeaturesCount = 0;
    try {
      const { count } = await supabase
        .from('training_features')
        .select('id', { count: 'exact', head: true });
      trainingFeaturesCount = count || 0;
    } catch { /* table may not exist */ }

    // 5. Compute signal coverage summary
    const families = Object.entries(SIGNAL_FAMILIES).map(([familyId, signals]) => {
      const measured = signals.filter(s => s.status === 'measured').length;
      const partial = signals.filter(s => s.status === 'partial').length;
      const missing = signals.filter(s => s.status === 'missing').length;
      return {
        id: familyId,
        name: familyId.charAt(0).toUpperCase() + familyId.slice(1),
        signals,
        measured,
        partial,
        missing,
        total: signals.length,
        coveragePct: Math.round(((measured + partial * 0.5) / signals.length) * 100),
      };
    });

    // 6. Prompt initiative status
    const prompts = PROMPT_INITIATIVE.map(p => ({
      ...p,
      outputExists: p.outputDoc ? existsSync(join(process.cwd(), p.outputDoc)) : false,
    }));

    const completed = prompts.filter(p => p.status === 'complete').length;
    const total = prompts.length;

    return NextResponse.json({
      spearman,
      modelMeta,
      labeledCount,
      v2TrustedLabeledCount,
      legacyLabeledCount,
      trainingFeaturesCount,
      signalFamilies: families,
      prompts,
      initiativeProgress: { completed, total, pct: Math.round((completed / total) * 100) },
      queriedAt: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('[Initiative API] Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
