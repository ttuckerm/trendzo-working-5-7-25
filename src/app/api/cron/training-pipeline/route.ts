/**
 * Training Pipeline Manual Trigger API
 *
 * GET /api/cron/training-pipeline?step=backfill|collect|label|evaluate|all
 *
 * Runs individual pipeline steps or the full sequence.
 * Optionally gated by CRON_SECRET for production use.
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max for Vercel Pro

type Step = 'scan' | 'backfill' | 'collect' | 'label' | 'evaluate' | 'scrape-creators' | 'pattern-extract' | 'pattern-metrics' | 'cultural-scan' | 'classify-events' | 'autodream' | 'all';

const VALID_STEPS: Step[] = ['scan', 'backfill', 'collect', 'label', 'evaluate', 'scrape-creators', 'pattern-extract', 'pattern-metrics', 'cultural-scan', 'classify-events', 'autodream', 'all'];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const step = (searchParams.get('step') || 'all') as Step;
  const dryRun = searchParams.get('dry_run') === 'true';

  // Auth check (optional — only if CRON_SECRET is set).
  // Accept either the Vercel cron `Authorization: Bearer` header (scheduled runs)
  // or a ?token= query param (manual testing). Matches the cultural-scan pattern.
  const cronSecret = process.env.CRON_SECRET;
  const headerOk = request.headers.get('authorization') === `Bearer ${cronSecret}`;
  const tokenOk = token === cronSecret;
  if (cronSecret && !headerOk && !tokenOk) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!VALID_STEPS.includes(step)) {
    return NextResponse.json(
      { error: `Invalid step: ${step}. Valid: ${VALID_STEPS.join(', ')}` },
      { status: 400 },
    );
  }

  const results: Record<string, any> = {};
  const startTime = Date.now();

  try {
    // scan is NOT included in 'all' — it has its own cron cadence + DB-level locking
    if (step === 'scan') {
      const { runDiscoveryScan } = await import('@/lib/training/fresh-video-scanner');
      const nicheKey = searchParams.get('niche') || undefined;
      results.scan = await runDiscoveryScan({ nicheKey, dryRun });
    }

    if (step === 'backfill' || step === 'all') {
      const { backfillMetricSchedules } = await import('@/lib/training/schedule-backfill');
      results.backfill = await backfillMetricSchedules({ limit: 100, dryRun });
    }

    if (step === 'collect' || step === 'all') {
      const { runMetricCollector } = await import('@/lib/training/metric-collector');
      results.collect = await runMetricCollector({ limit: 50, dryRun });
    }

    if (step === 'label' || step === 'all') {
      const { runAutoLabeler } = await import('@/lib/training/auto-labeler');
      results.label = await runAutoLabeler({ limit: 50, dryRun });
    }

    if (step === 'evaluate' || step === 'all') {
      const { runSpearmanEvaluation } = await import('@/lib/training/spearman-evaluator');
      results.evaluate = await runSpearmanEvaluation();
    }

    // scrape-creators is NOT included in 'all' (too slow; runs via its own weekly cron)
    if (step === 'scrape-creators') {
      const { scrapeNicheCreators } = await import('@/lib/training/niche-creator-scraper');
      const nichesParam = searchParams.get('niches');
      const niches = nichesParam ? nichesParam.split(',').map(s => s.trim()) : undefined;
      results['scrape-creators'] = await scrapeNicheCreators({ niches, dryRun });
    }

    // pattern-extract and pattern-metrics are NOT included in 'all' (separate cadence)
    if (step === 'pattern-extract') {
      const { runPatternExtractionNow } = await import('@/lib/cron/scheduler');
      results['pattern-extract'] = await runPatternExtractionNow();
    }

    if (step === 'pattern-metrics') {
      const { runPatternMetricsNow } = await import('@/lib/cron/scheduler');
      results['pattern-metrics'] = await runPatternMetricsNow();
    }

    // cultural-scan is NOT included in 'all' (own nightly cron, separate cadence)
    if (step === 'cultural-scan') {
      const { runCulturalScanNow } = await import('@/lib/cron/scheduler');
      const niche = searchParams.get('niche') || undefined;
      results['cultural-scan'] = await runCulturalScanNow(niche);
    }

    // classify-events: converts detected_trends → cultural_events (NOT in 'all', own cadence)
    if (step === 'classify-events') {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
      const niche = searchParams.get('niche') || '';
      const classifyUrl = niche
        ? `${baseUrl}/api/cron/classify-events?niche=${encodeURIComponent(niche)}`
        : `${baseUrl}/api/cron/classify-events`;
      const res = await fetch(classifyUrl, { cache: 'no-store' });
      results['classify-events'] = await res.json();
    }

    // autodream: overnight brief generation pipeline (NOT in 'all', runs at 4am UTC)
    if (step === 'autodream') {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
      const agencyId = searchParams.get('agency_id') || '';
      const dreamUrl = agencyId
        ? `${baseUrl}/api/cron/autodream?agency_id=${encodeURIComponent(agencyId)}`
        : `${baseUrl}/api/cron/autodream`;
      const res = await fetch(dreamUrl, { cache: 'no-store' });
      results['autodream'] = await res.json();
    }

    return NextResponse.json({
      success: true,
      step,
      dry_run: dryRun,
      elapsed_ms: Date.now() - startTime,
      results,
    });
  } catch (error: any) {
    console.error(`[TrainingPipeline] Step ${step} failed:`, error.message);
    return NextResponse.json(
      {
        success: false,
        step,
        error: error.message,
        elapsed_ms: Date.now() - startTime,
        results,
      },
      { status: 500 },
    );
  }
}
