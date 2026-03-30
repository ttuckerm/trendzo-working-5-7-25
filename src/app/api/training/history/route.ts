/**
 * Training History — Aggregated Data API
 *
 * GET /api/training/history
 *
 * Returns full training history: timeline events, model versions,
 * data composition, error patterns, evaluation trend, growth curve,
 * and current status summary.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { unstable_noStore as noStore } from 'next/cache';
import { classifyLegacyDpsTier as classifyTier } from '@/lib/training/dps-v2';
import { computeLabelBreakdown, classifyLabelCategory, type LabelCategoryBreakdown } from '@/lib/training/training-eligibility';

export const dynamic = 'force-dynamic';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { persistSession: false } },
  );
}

// ── Types ────────────────────────────────────────────────────────────────────

interface TimelineEvent {
  type: 'model_created' | 'model_deployed' | 'model_deprecated' | 'evaluation_run' | 'training_job' | 'labeling_milestone';
  timestamp: string;
  title: string;
  details: Record<string, any>;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Normalize niche names: side_hustles → side-hustles */
function normalizeNiche(niche: string): string {
  return (niche || 'unknown').replace(/_/g, '-');
}

export async function GET() {
  noStore();
  const supabase = getSupabase();

  try {
    // ══════════════════════════════════════════════════════════════════════════
    // Parallel fetch: all raw data from DB
    // ══════════════════════════════════════════════════════════════════════════

    const [
      { data: modelVersions },
      { data: evaluations },
      { data: trainingJobs },
      { data: labeledRuns },
      { data: segments },
    ] = await Promise.all([
      supabase.from('model_versions').select('*').order('created_at', { ascending: false }),
      supabase.from('vps_evaluation').select('*').order('computed_at', { ascending: false }),
      supabase.from('training_jobs').select('*').order('started_at', { ascending: false }),
      supabase.from('prediction_runs')
        .select('id, video_id, predicted_dps_7d, actual_dps, predicted_tier_7d, confidence, labeling_mode, prediction_range_low, prediction_range_high, actuals_entered_at, created_at, dps_formula_version, dps_label_trust, dps_training_weight, dps_v2_display_score')
        .not('actual_dps', 'is', null),
      supabase.from('model_performance_segments').select('*'),
    ]);

    const safeModels = (modelVersions || []) as any[];
    const safeEvals = (evaluations || []) as any[];
    const safeJobs = (trainingJobs || []) as any[];
    const safeLabeled = (labeledRuns || []) as any[];
    const safeSegments = (segments || []) as any[];

    // ══════════════════════════════════════════════════════════════════════════
    // Resolve niches via video_files (prediction_runs has NO niche column)
    // Pattern: spearman-evaluator.ts lines 93-98
    // ══════════════════════════════════════════════════════════════════════════

    const videoIds = [...new Set(safeLabeled.map(r => r.video_id).filter(Boolean))];
    let nicheMap = new Map<string, string>();
    if (videoIds.length > 0) {
      const { data: videoFiles } = await supabase
        .from('video_files')
        .select('id, niche')
        .in('id', videoIds);
      nicheMap = new Map((videoFiles || []).map((v: any) => [v.id, normalizeNiche(v.niche || 'unknown')]));
    }

    // ══════════════════════════════════════════════════════════════════════════
    // Query 1: Timeline Events
    // ══════════════════════════════════════════════════════════════════════════

    const timeline: TimelineEvent[] = [];

    // Model events (live schema: created_at, deployed_at, archived_at, config.model_type, train_samples)
    for (const m of safeModels) {
      if (m.created_at) {
        timeline.push({
          type: 'model_created',
          timestamp: m.created_at,
          title: `Model ${m.version || m.id} created`,
          details: {
            version: m.version,
            model_type: m.config?.model_type || null,
            training_samples: m.train_samples,
            mae: m.mae,
            rmse: m.rmse,
            status: m.status,
          },
        });
      }
      if (m.deployed_at) {
        timeline.push({
          type: 'model_deployed',
          timestamp: m.deployed_at,
          title: `Model ${m.version || m.id} deployed to production`,
          details: { version: m.version },
        });
      }
      if (m.archived_at) {
        timeline.push({
          type: 'model_deprecated',
          timestamp: m.archived_at,
          title: `Model ${m.version || m.id} archived`,
          details: { version: m.version, reason: m.notes },
        });
      }
    }

    // Evaluation events
    for (const e of safeEvals) {
      timeline.push({
        type: 'evaluation_run',
        timestamp: e.computed_at,
        title: `Spearman Evaluation (n=${e.n || '?'})`,
        details: {
          n: e.n,
          spearman_rho: e.spearman_rho,
          mae: e.mae,
          within_range_pct: e.within_range_pct,
          by_niche: e.by_niche,
        },
      });
    }

    // Training job events (skip entries with no job_type — they add no value)
    for (const j of safeJobs) {
      if (!j.job_type) continue;
      timeline.push({
        type: 'training_job',
        timestamp: j.started_at,
        title: `Training job: ${j.job_type} (${j.status})`,
        details: {
          job_type: j.job_type,
          model_type: j.model_type,
          status: j.status,
          training_samples: j.training_samples,
          completed_at: j.completed_at,
          error_message: j.error_message,
        },
      });
    }

    // Labeling milestones — compute from labeled runs
    const MILESTONES = [10, 25, 50, 100, 300, 500];
    if (safeLabeled.length > 0) {
      // Sort by timestamp (COALESCE: actuals_entered_at or created_at)
      const sorted = [...safeLabeled].sort((a, b) => {
        const ta = a.actuals_entered_at || a.created_at;
        const tb = b.actuals_entered_at || b.created_at;
        return new Date(ta).getTime() - new Date(tb).getTime();
      });

      let cumulative = 0;
      let milestoneIdx = 0;
      for (const run of sorted) {
        cumulative++;
        while (milestoneIdx < MILESTONES.length && cumulative >= MILESTONES[milestoneIdx]) {
          timeline.push({
            type: 'labeling_milestone',
            timestamp: run.actuals_entered_at || run.created_at,
            title: `Reached ${MILESTONES[milestoneIdx]} labeled videos`,
            details: { count: MILESTONES[milestoneIdx] },
          });
          milestoneIdx++;
        }
      }
    }

    // Sort timeline newest first
    timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // ══════════════════════════════════════════════════════════════════════════
    // Query 2: Model Versions + Per-Niche Segments
    // ══════════════════════════════════════════════════════════════════════════

    const modelSegmentMap: Record<string, any[]> = {};
    for (const seg of safeSegments) {
      const key = seg.model_version_id;
      if (!modelSegmentMap[key]) modelSegmentMap[key] = [];
      modelSegmentMap[key].push(seg);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // Query 3: Training Data Composition
    // ══════════════════════════════════════════════════════════════════════════

    // By niche (resolved via nicheMap)
    // Use display score (0-100) when available (v2.1.0+ labels), fall back to raw z-score
    const nicheStats: Record<string, { count: number; sum: number; min: number; max: number; display_sum: number; display_count: number }> = {};
    for (const r of safeLabeled) {
      const niche = nicheMap.get(r.video_id) || 'unknown';
      if (!nicheStats[niche]) nicheStats[niche] = { count: 0, sum: 0, min: Infinity, max: -Infinity, display_sum: 0, display_count: 0 };
      const dps = Number(r.actual_dps);
      const displayDps = r.dps_v2_display_score != null ? Number(r.dps_v2_display_score) : null;
      nicheStats[niche].count++;
      nicheStats[niche].sum += dps;
      nicheStats[niche].min = Math.min(nicheStats[niche].min, dps);
      nicheStats[niche].max = Math.max(nicheStats[niche].max, dps);
      if (displayDps != null) {
        nicheStats[niche].display_sum += displayDps;
        nicheStats[niche].display_count++;
      }
    }
    const byNiche = Object.entries(nicheStats).map(([niche, s]) => ({
      niche,
      count: s.count,
      avg_vps: round2(s.sum / s.count),
      min_vps: round2(s.min),
      max_vps: round2(s.max),
      avg_display_dps: s.display_count > 0 ? round2(s.display_sum / s.display_count) : null,
    })).sort((a, b) => b.count - a.count);

    // By tier (derived from actual_dps using classifyTier)
    const tierCounts: Record<string, number> = {};
    for (const r of safeLabeled) {
      const tier = classifyTier(Number(r.actual_dps));
      tierCounts[tier] = (tierCounts[tier] || 0) + 1;
    }
    const byTier = Object.entries(tierCounts).map(([tier, count]) => ({ tier, count }));

    // By labeling mode
    const modeCounts: Record<string, number> = {};
    for (const r of safeLabeled) {
      const mode = r.labeling_mode || 'legacy';
      modeCounts[mode] = (modeCounts[mode] || 0) + 1;
    }
    const byLabelingMode = Object.entries(modeCounts).map(([mode, count]) => ({ mode, count }));

    // DPS v2 label category breakdown
    const labelCategoryBreakdown: LabelCategoryBreakdown = computeLabelBreakdown(safeLabeled);

    // ══════════════════════════════════════════════════════════════════════════
    // Query 4: Error Pattern Analysis
    // ══════════════════════════════════════════════════════════════════════════

    const withPredictions = safeLabeled.filter(r => r.predicted_dps_7d != null);
    let errorPatterns: any = null;

    if (withPredictions.length > 0) {
      const errors = withPredictions.map(r => {
        const predicted = Number(r.predicted_dps_7d);
        const actual = Number(r.actual_dps);
        const displayDps: number | null = r.dps_v2_display_score != null ? Number(r.dps_v2_display_score) : null;
        const error = predicted - actual;
        const niche = nicheMap.get(r.video_id) || 'unknown';
        const predictedTier = classifyTier(predicted);
        const actualTier = classifyTier(actual);
        // Two distinct metrics:
        // 1. within10vps: absolute error ≤ 10 VPS points (independent, always comparable)
        // 2. withinPredRange: actual falls within [range_low, range_high] (matches vps_evaluation)
        const within10vps = Math.abs(error) <= 10;
        const withinPredRange = r.prediction_range_low != null && r.prediction_range_high != null
          ? actual >= Number(r.prediction_range_low) && actual <= Number(r.prediction_range_high)
          : null; // null = no range data available
        return { predicted, actual, displayDps, error, absError: Math.abs(error), niche, predictedTier, actualTier, confidence: r.confidence, within10vps, withinPredRange, created_at: r.created_at, video_id: r.video_id };
      });

      // Overall metrics
      const totalMAE = round2(errors.reduce((s, e) => s + e.absError, 0) / errors.length);
      const meanError = round2(errors.reduce((s, e) => s + e.error, 0) / errors.length);
      const rmse = round2(Math.sqrt(errors.reduce((s, e) => s + e.error * e.error, 0) / errors.length));
      const within10vpsPct = round2((errors.filter(e => e.within10vps).length / errors.length) * 100);
      const withRangeData = errors.filter(e => e.withinPredRange !== null);
      const withinPredRangePct = withRangeData.length > 0
        ? round2((withRangeData.filter(e => e.withinPredRange).length / withRangeData.length) * 100)
        : null;

      // Per-niche errors
      const nicheErrorGroups: Record<string, typeof errors> = {};
      for (const e of errors) {
        if (!nicheErrorGroups[e.niche]) nicheErrorGroups[e.niche] = [];
        nicheErrorGroups[e.niche].push(e);
      }
      const perNiche = Object.entries(nicheErrorGroups).map(([niche, errs]) => {
        const avgErr = round2(errs.reduce((s, e) => s + e.error, 0) / errs.length);
        const nicheMAE = round2(errs.reduce((s, e) => s + e.absError, 0) / errs.length);
        const bias = avgErr > 10 ? 'Consistently overpredicts' : avgErr < -10 ? 'Consistently underpredicts' : 'Balanced';
        return { niche, n: errs.length, avg_error: avgErr, mae: nicheMAE, bias };
      }).sort((a, b) => b.mae - a.mae);

      // Error buckets
      const buckets = [
        { label: 'Overpredicted 20+', count: 0 },
        { label: 'Overpredicted 10–20', count: 0 },
        { label: 'Within 10', count: 0 },
        { label: 'Underpredicted 10–20', count: 0 },
        { label: 'Underpredicted 20+', count: 0 },
      ];
      for (const e of errors) {
        if (e.error >= 20) buckets[0].count++;
        else if (e.error >= 10) buckets[1].count++;
        else if (e.error > -10) buckets[2].count++;
        else if (e.error > -20) buckets[3].count++;
        else buckets[4].count++;
      }
      const total = errors.length;
      const errorBuckets = buckets.map(b => ({ ...b, pct: round2((b.count / total) * 100) }));

      // Tier confusion matrix (both tiers derived from classifyTier)
      const tiers = ['mega-viral', 'viral', 'good', 'average', 'low'];
      const confusionMatrix: Record<string, Record<string, number>> = {};
      for (const t of tiers) {
        confusionMatrix[t] = {};
        for (const t2 of tiers) confusionMatrix[t][t2] = 0;
      }
      for (const e of errors) {
        if (confusionMatrix[e.predictedTier]?.[e.actualTier] !== undefined) {
          confusionMatrix[e.predictedTier][e.actualTier]++;
        }
      }

      // Confidence calibration (4 quartiles)
      const quartiles = [
        { label: '< 0.25', min: 0, max: 0.25 },
        { label: '0.25 – 0.50', min: 0.25, max: 0.50 },
        { label: '0.50 – 0.75', min: 0.50, max: 0.75 },
        { label: '> 0.75', min: 0.75, max: 1.01 },
      ];
      const confidenceCalibration = quartiles.map(q => {
        const group = errors.filter(e => e.confidence != null && e.confidence >= q.min && e.confidence < q.max);
        if (group.length === 0) return { range: q.label, count: 0, mae: 0, within_10vps_pct: 0 };
        const gMAE = round2(group.reduce((s, e) => s + e.absError, 0) / group.length);
        const gWithin = round2((group.filter(e => e.within10vps).length / group.length) * 100);
        return { range: q.label, count: group.length, mae: gMAE, within_10vps_pct: gWithin };
      });

      // Worst 5 misses
      const worstMisses = [...errors]
        .sort((a, b) => b.absError - a.absError)
        .slice(0, 5)
        .map(e => ({
          predicted: round2(e.predicted),
          actual: round2(e.actual),
          display_dps: e.displayDps != null ? round2(e.displayDps) : null,
          error: round2(e.error),
          niche: e.niche,
          confidence: e.confidence,
          created_at: e.created_at,
        }));

      errorPatterns = {
        overall: { mae: totalMAE, mean_error: meanError, rmse, within_10vps_pct: within10vpsPct, within_pred_range_pct: withinPredRangePct, n: errors.length },
        per_niche: perNiche,
        error_buckets: errorBuckets,
        confusion_matrix: confusionMatrix,
        confidence_calibration: confidenceCalibration,
        worst_misses: worstMisses,
      };
    }

    // ══════════════════════════════════════════════════════════════════════════
    // Query 5: Evaluation Trend
    // ══════════════════════════════════════════════════════════════════════════

    const evalTrend = safeEvals
      .slice()
      .sort((a: any, b: any) => new Date(a.computed_at).getTime() - new Date(b.computed_at).getTime())
      .map((e: any, i: number, arr: any[]) => {
        const prev = i > 0 ? arr[i - 1] : null;
        return {
          computed_at: e.computed_at,
          n: e.n,
          spearman_rho: e.spearman_rho,
          mae: e.mae,
          within_range_pct: e.within_range_pct,
          by_niche: e.by_niche,
          rho_trend: prev ? (e.spearman_rho > prev.spearman_rho ? 'improved' : e.spearman_rho < prev.spearman_rho ? 'declined' : 'unchanged') : null,
          mae_trend: prev ? (e.mae < prev.mae ? 'improved' : e.mae > prev.mae ? 'declined' : 'unchanged') : null,
        };
      });

    // ══════════════════════════════════════════════════════════════════════════
    // Query 6: Data Growth Curve
    // ══════════════════════════════════════════════════════════════════════════

    const dayBuckets: Record<string, number> = {};
    for (const r of safeLabeled) {
      const ts = r.actuals_entered_at || r.created_at;
      const day = (ts || '').slice(0, 10);
      if (day) dayBuckets[day] = (dayBuckets[day] || 0) + 1;
    }
    const sortedDays = Object.keys(dayBuckets).sort();
    let cumTotal = 0;
    const growthCurve = sortedDays.map(date => {
      cumTotal += dayBuckets[date];
      return { date, daily_new: dayBuckets[date], cumulative: cumTotal };
    });

    // ══════════════════════════════════════════════════════════════════════════
    // Query 7: Current Status Summary
    // ══════════════════════════════════════════════════════════════════════════

    const prodModel = safeModels.find((m: any) => m.deployed_at != null) || safeModels.find((m: any) => m.status === 'active');
    const latestEval = safeEvals[0] || null;
    const daysSinceEval = latestEval
      ? Math.floor((Date.now() - new Date(latestEval.computed_at).getTime()) / (24 * 3600 * 1000))
      : null;

    const totalLabeled = safeLabeled.length;
    const milestones = [100, 300, 500];
    const nextMilestone = milestones.find(m => totalLabeled < m) || null;

    // Growth rate: compute labels per week and projection
    let labelsPerWeek: number | null = null;
    let weeksToMilestone: number | null = null;
    let firstLabelDate: string | null = null;
    if (sortedDays.length >= 2) {
      firstLabelDate = sortedDays[0];
      const lastDay = sortedDays[sortedDays.length - 1];
      const spanMs = new Date(lastDay).getTime() - new Date(firstLabelDate).getTime();
      const spanWeeks = Math.max(spanMs / (7 * 24 * 3600 * 1000), 1);
      labelsPerWeek = round2(totalLabeled / spanWeeks);
      if (nextMilestone && labelsPerWeek > 0) {
        weeksToMilestone = Math.ceil((nextMilestone - totalLabeled) / labelsPerWeek);
      }
    }

    // Unique niches count (for insights)
    const uniqueNiches = byNiche.length;
    // Total niches available (approximate from system registry — hardcode known count)
    const totalNichesAvailable = 20;

    const currentStatus = {
      total_labeled: totalLabeled,
      production_model: prodModel ? { version: prodModel.version, status: prodModel.status, trained_at: prodModel.created_at, train_samples: prodModel.train_samples } : null,
      latest_spearman_rho: latestEval?.spearman_rho ?? null,
      days_since_eval: daysSinceEval,
      next_milestone: nextMilestone,
      remaining_to_milestone: nextMilestone ? nextMilestone - totalLabeled : null,
      labels_per_week: labelsPerWeek,
      weeks_to_milestone: weeksToMilestone,
      first_label_date: firstLabelDate,
      unique_niches: uniqueNiches,
      total_niches_available: totalNichesAvailable,
    };

    // ══════════════════════════════════════════════════════════════════════════
    // Response
    // ══════════════════════════════════════════════════════════════════════════

    return NextResponse.json({
      success: true,
      timeline,
      models: safeModels,
      model_segments: modelSegmentMap,
      data_composition: {
        by_niche: byNiche,
        by_tier: byTier,
        by_labeling_mode: byLabelingMode,
        by_label_category: labelCategoryBreakdown,
        total: totalLabeled,
        total_v2_eligible: labelCategoryBreakdown.total_v2_eligible,
        total_legacy: labelCategoryBreakdown.legacy_v1,
      },
      error_patterns: errorPatterns,
      evaluation_trend: evalTrend,
      growth_curve: growthCurve,
      current_status: currentStatus,
    });
  } catch (error: any) {
    console.error('[TrainingHistory] Error:', error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
