'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useChat } from '@ai-sdk/react';
import type { UIMessage } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import {
  Send,
  ArrowLeft,
  DollarSign,
  Building2,
  Users,
  Video,
  TrendingUp,
  AlertTriangle,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getSupabaseClient } from '@/lib/supabase/client';

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────

type LayerStatus = 'built' | 'active' | 'partial' | 'not_started';
type SkillStatus = 'done' | 'in_progress' | 'blocked';
type ProjectStatus = 'active' | 'live' | 'running' | 'partial';
type TabKey = 'map' | 'queue' | 'decisions' | 'loops' | 'performance';

interface PerformanceRow {
  id: string;
  creator: string;
  title: string;
  vpsPrediction: number | null;
  actualViews: number | null;
  delta: number | null;
  measuredAt: string;
}
type ProjectKey = 'Layer Build' | 'Agency Operations' | 'Model Training' | 'Lead Funnel';

interface LayerRow {
  id: number;
  layer_num: string;
  layer_name: string;
  trendzo_equivalent: string;
  status: LayerStatus;
}

interface SkillRow {
  id: number;
  skill_id: string;
  skill_name: string;
  status: SkillStatus;
  blocked_by: string | null;
  progress_pct: number;
}

interface LoopRow {
  id: string;
  description: string;
  resolved: boolean;
}

interface DecisionRow {
  date: string;
  decision: string;
  status: string;
}

interface ProjectTile {
  key: ProjectKey;
  title: string;
  subtitle: string;
  status: ProjectStatus;
  statusLabel: string;
}

interface ServiceHealth {
  name: string;
  status: string; // 'operational' | 'degraded' | 'down'
  latency?: number;
}

// ────────────────────────────────────────────────────────────────────────────
// Static data (Layer Build workspace)
// ────────────────────────────────────────────────────────────────────────────

const OPENING_MESSAGE =
  'Chairman. Layer 2 is active. SKILL-001 is done. SKILL-002 is next — I need the 10 category names from your 58-feature fingerprint to build it. What do you want to work on?';

const INITIAL_UI_MESSAGES: UIMessage[] = [
  {
    id: 'opening',
    role: 'assistant',
    parts: [{ type: 'text', text: OPENING_MESSAGE }],
  } as UIMessage,
];

const DECISIONS: DecisionRow[] = [
  { date: 'April 2026', decision: 'Build order follows Anthropic layer architecture', status: 'Locked' },
  { date: 'April 2026', decision: 'Creator Profiling is first skill — it IS the substrate', status: 'Locked' },
  { date: 'April 2026', decision: 'Chairman OS lives at /admin/chairman', status: 'Locked' },
];

const PROJECT_TILES: ProjectTile[] = [
  { key: 'Layer Build', title: 'Layer Build', subtitle: 'Trendzo Model Substrate · Layer 2 Active', status: 'active', statusLabel: 'ACTIVE' },
  { key: 'Agency Operations', title: 'Agency Operations', subtitle: '4 agencies · 147 creators', status: 'live', statusLabel: 'LIVE' },
  { key: 'Model Training', title: 'Model Training', subtitle: '12,847 samples · XGBoost v2.3.1', status: 'running', statusLabel: 'RUNNING' },
  { key: 'Lead Funnel', title: 'Lead Funnel', subtitle: 'Public /free routes · Beehiiv sync', status: 'partial', statusLabel: 'PARTIAL' },
];

// ────────────────────────────────────────────────────────────────────────────
// Badge helpers
// ────────────────────────────────────────────────────────────────────────────

function layerStatusBadge(status: LayerStatus) {
  const map: Record<LayerStatus, { label: string; cls: string }> = {
    built: { label: 'BUILT', cls: 'bg-green-500/10 text-green-400 border-green-500/30' },
    active: { label: 'ACTIVE', cls: 'bg-purple-500/15 text-purple-300 border-purple-500/40' },
    partial: { label: 'PARTIAL', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
    not_started: { label: 'NOT STARTED', cls: 'bg-gray-500/10 text-gray-500 border-gray-500/20' },
  };
  const { label, cls } = map[status];
  return (
    <span className={cn('text-[10px] font-semibold tracking-wider px-2 py-1 rounded border', cls)}>
      {label}
    </span>
  );
}

function skillStatusBadge(status: SkillStatus) {
  const map: Record<SkillStatus, { label: string; cls: string }> = {
    done: { label: 'DONE', cls: 'bg-green-500/10 text-green-400 border-green-500/30' },
    in_progress: { label: 'IN PROGRESS', cls: 'bg-purple-500/15 text-purple-300 border-purple-500/40' },
    blocked: { label: 'BLOCKED', cls: 'bg-gray-500/10 text-gray-500 border-gray-500/20' },
  };
  const { label, cls } = map[status];
  return (
    <span className={cn('text-[10px] font-semibold tracking-wider px-2 py-1 rounded border', cls)}>
      {label}
    </span>
  );
}

function projectStatusStyles(status: ProjectStatus): { border: string; accent: string; badge: string } {
  const map: Record<ProjectStatus, { border: string; accent: string; badge: string }> = {
    active: {
      border: 'border-l-purple-500',
      accent: 'text-purple-300',
      badge: 'bg-purple-500/15 text-purple-300 border-purple-500/40',
    },
    live: {
      border: 'border-l-green-500',
      accent: 'text-green-400',
      badge: 'bg-green-500/10 text-green-400 border-green-500/30',
    },
    running: {
      border: 'border-l-amber-500',
      accent: 'text-amber-400',
      badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    },
    partial: {
      border: 'border-l-amber-500',
      accent: 'text-amber-400',
      badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    },
  };
  return map[status];
}

function ProgressBar({ progress, status }: { progress: number; status: SkillStatus }) {
  const fillColor =
    status === 'done' ? 'bg-green-500' : status === 'in_progress' ? 'bg-purple-500' : 'bg-transparent';
  return (
    <div className="h-1 w-full bg-[#1a1a2e] rounded-full overflow-hidden">
      <div className={cn('h-full transition-all', fillColor)} style={{ width: `${progress}%` }} />
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Page
// ────────────────────────────────────────────────────────────────────────────

export default function ChairmanOSPage() {
  const [draft, setDraft] = useState('');
  const [activeProject, setActiveProject] = useState<ProjectKey | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('map');

  // Holdout designation (one-time button)
  const [holdoutLoading, setHoldoutLoading] = useState(false);
  const [holdoutDone, setHoldoutDone] = useState(false);
  const [holdoutResult, setHoldoutResult] = useState<{
    totalLocked: number;
    perNiche: Array<{ niche: string; eligible: number; allocated: number }>;
  } | null>(null);
  const [holdoutError, setHoldoutError] = useState<string | null>(null);

  const handleDesignateHoldout = useCallback(async () => {
    if (holdoutLoading) return;
    setHoldoutLoading(true);
    setHoldoutError(null);
    try {
      // Routed to the scraped_videos designation endpoint; force=true is
      // applied server-side so this can be re-run safely.
      const res = await fetch('/api/admin/training/designate-holdout', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setHoldoutError(data?.error || `Request failed (${res.status})`);
      } else {
        setHoldoutResult({
          totalLocked: data.totalLocked,
          perNiche: (data.perNiche || []).map((n: { niche: string; eligible: number; holdout?: number; allocated?: number }) => ({
            niche: n.niche,
            eligible: n.eligible,
            allocated: n.holdout ?? n.allocated ?? 0,
          })),
        });
        setHoldoutDone(true);
      }
    } catch (err: unknown) {
      setHoldoutError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setHoldoutLoading(false);
    }
  }, [holdoutLoading]);

  // Data quality gate (one-time button, disables after success)
  const [qualityGateLoading, setQualityGateLoading] = useState(false);
  const [qualityGateDone, setQualityGateDone] = useState(false);
  const [qualityGateError, setQualityGateError] = useState<string | null>(null);
  const [qualityGateResult, setQualityGateResult] = useState<{
    totalRows: number;
    disqualified: {
      no_video_analysis: number;
      followers_below_1k: number;
      high_null_rate: number;
      total: number;
    };
    eligible: number;
    warnings: string[];
    errors: string[];
  } | null>(null);

  const handleRunQualityGate = useCallback(async () => {
    if (qualityGateLoading || qualityGateDone) return;
    setQualityGateLoading(true);
    setQualityGateError(null);
    try {
      const res = await fetch('/api/admin/training/quality-gate', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setQualityGateError(data?.error || `Request failed (${res.status})`);
        if (res.status === 400) setQualityGateDone(true);
      } else {
        setQualityGateResult({
          totalRows: data.totalRows,
          disqualified: data.disqualified,
          eligible: data.eligible,
          warnings: data.warnings || [],
          errors: data.errors || [],
        });
        setQualityGateDone(true);
      }
    } catch (err: unknown) {
      setQualityGateError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setQualityGateLoading(false);
    }
  }, [qualityGateLoading, qualityGateDone]);

  // Scraped video quality gate (separate — filters scraped_videos training source)
  const [scrapedGateLoading, setScrapedGateLoading] = useState(false);
  const [scrapedGateDone, setScrapedGateDone] = useState(false);
  const [scrapedGateError, setScrapedGateError] = useState<string | null>(null);
  const [scrapedGateResult, setScrapedGateResult] = useState<{
    totalRows: number;
    disqualified: {
      no_dps_score: number;
      followers_below_1k: number;
      high_null_rate: number;
      total: number;
    };
    eligible: number;
    verdict: 'PASS' | 'WARNING' | 'FAIL';
    verdictMessage: string;
    coverage: Array<{ column_name: string; group: string; non_null_count: number; fill_rate_percent: number }>;
    groupSummary: Array<{ group_name: string; column_count: number; average_fill_rate: number }>;
    warnings: string[];
    errors: string[];
  } | null>(null);

  const handleRunScrapedGate = useCallback(async () => {
    if (scrapedGateLoading || scrapedGateDone) return;
    setScrapedGateLoading(true);
    setScrapedGateError(null);
    try {
      const res = await fetch('/api/admin/training/scraped-quality-gate', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setScrapedGateError(data?.error || `Request failed (${res.status})`);
      } else {
        setScrapedGateResult(data);
        setScrapedGateDone(true);
      }
    } catch (err: unknown) {
      setScrapedGateError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setScrapedGateLoading(false);
    }
  }, [scrapedGateLoading, scrapedGateDone]);

  // Scraped video holdout designation (one-time, 200 videos stratified by niche)
  const [scrapedHoldoutLoading, setScrapedHoldoutLoading] = useState(false);
  const [scrapedHoldoutDone, setScrapedHoldoutDone] = useState(false);
  const [scrapedHoldoutError, setScrapedHoldoutError] = useState<string | null>(null);
  const [scrapedHoldoutResult, setScrapedHoldoutResult] = useState<{
    totalEligible: number;
    totalLocked: number;
    remainingTraining: number;
    perNiche: Array<{ niche: string; eligible: number; holdout: number }>;
    lockedAt: string;
  } | null>(null);

  const handleDesignateScrapedHoldout = useCallback(async () => {
    if (scrapedHoldoutLoading) return;
    if (
      !window.confirm(
        'This will reset any existing holdout and re-lock 200 videos as the evaluation holdout. Proceed?',
      )
    ) {
      return;
    }
    setScrapedHoldoutLoading(true);
    setScrapedHoldoutError(null);
    try {
      const res = await fetch('/api/admin/training/designate-holdout', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setScrapedHoldoutError(data?.error || `Request failed (${res.status})`);
      } else {
        setScrapedHoldoutResult(data);
        setScrapedHoldoutDone(true);
      }
    } catch (err: unknown) {
      setScrapedHoldoutError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setScrapedHoldoutLoading(false);
    }
  }, [scrapedHoldoutLoading]);

  // Scraped training data export (CSVs for Python XGBoost)
  const [exportDataLoading, setExportDataLoading] = useState(false);
  const [exportDataError, setExportDataError] = useState<string | null>(null);
  const [exportDataResult, setExportDataResult] = useState<{
    training_rows: number;
    holdout_rows: number;
    features: number;
    metadata_feature_count?: number;
    content_feature_count?: number;
    training_rows_full_join?: number;
    training_rows_metadata_only?: number;
    holdout_rows_full_join?: number;
    holdout_rows_metadata_only?: number;
    content_feature_coverage_training_pct?: number;
    content_feature_coverage_holdout_pct?: number;
    content_feature_sanity?: {
      hook_column: string | null;
      loudness_column: string | null;
      scene_column: string | null;
      readability_column: string | null;
      contrast_column: string | null;
      resolution_column: string | null;
      missing_categories: string[];
    };
    bimodal_detected: boolean;
    bimodal_details?: {
      cohortA: { mean: number; count: number };
      cohortB: { mean: number; count: number };
    };
    file_paths: { training: string; holdout: string; metadata: string };
  } | null>(null);

  const handleExportTrainingData = useCallback(async () => {
    if (exportDataLoading) return;
    setExportDataLoading(true);
    setExportDataError(null);
    try {
      const res = await fetch('/api/admin/training/export-data', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setExportDataError(data?.error || `Request failed (${res.status})`);
      } else {
        setExportDataResult(data);
      }
    } catch (err: unknown) {
      setExportDataError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setExportDataLoading(false);
    }
  }, [exportDataLoading]);

  // Training-data backfill (followers → performance → features)
  const [backfillLoading, setBackfillLoading] = useState(false);
  const [backfillDone, setBackfillDone] = useState(false);
  const [backfillResult, setBackfillResult] = useState<{
    followers?: { updated: number; skipped: number };
    performance?: { updated: number; skipped: number };
    features?: { total: number; culturalValid: number; culturalZeroed: number };
  } | null>(null);
  const [backfillError, setBackfillError] = useState<string | null>(null);

  const handleRunBackfill = useCallback(async () => {
    if (backfillLoading) return;
    setBackfillLoading(true);
    setBackfillError(null);
    try {
      const res = await fetch('/api/admin/backfill/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 'all' }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBackfillError(data?.error || `Request failed (${res.status})`);
        if (data?.partial) setBackfillResult(data.partial);
      } else {
        setBackfillResult({
          followers: data.followers,
          performance: data.performance,
          features: data.features,
        });
        setBackfillDone(true);
      }
    } catch (err: unknown) {
      setBackfillError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setBackfillLoading(false);
    }
  }, [backfillLoading]);

  // Training dataset preparation (filter → row-floor → bimodal → scaling)
  const [prepLoading, setPrepLoading] = useState(false);
  const [prepResult, setPrepResult] = useState<{
    totalEligible: number;
    totalAfterFilter: number;
    rowFloor: { met: boolean; count: number; action: string; suggestion?: string };
    dpsDistribution?: {
      isBimodal: boolean;
      mean: number;
      popA: { count: number; mean: number };
      popB: { count: number; mean: number };
      flagAdded: boolean;
    };
    scalingParams?: { featuresScaled: number };
    readyForS6: boolean;
  } | null>(null);
  const [prepError, setPrepError] = useState<string | null>(null);

  const handleRunPrep = useCallback(async () => {
    if (prepLoading) return;
    setPrepLoading(true);
    setPrepError(null);
    try {
      const res = await fetch('/api/admin/training/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) {
        setPrepError(data?.error || `Request failed (${res.status})`);
        // Partial result (row floor miss) still carries the diagnostic numbers.
        if (data?.rowFloor) {
          setPrepResult({
            totalEligible: data.totalEligible,
            totalAfterFilter: data.totalAfterFilter,
            rowFloor: data.rowFloor,
            readyForS6: false,
          });
        }
      } else {
        setPrepResult(data);
      }
    } catch (err: unknown) {
      setPrepError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setPrepLoading(false);
    }
  }, [prepLoading]);

  // S6 retrain — 5-variant XGBoost training with Optuna
  interface S6Variant {
    variant: string;
    cv_spearman: number;
    holdout_spearman: number;
    holdout_mae: number;
    feature_count: number;
    training_rows: number;
    feature_importance_top15: Array<{ feature: string; gain: number }>;
  }
  interface S6RetrainResult {
    experimentName: string;
    modelVersion: string;
    winner: string;
    variants: S6Variant[];
    decisions: string[];
  }
  const [retrainLoading, setRetrainLoading] = useState(false);
  const [retrainError, setRetrainError] = useState<string | null>(null);
  const [retrainResult, setRetrainResult] = useState<S6RetrainResult | null>(null);
  const [promotedVariant, setPromotedVariant] = useState<string | null>(null);

  const handleRunRetrain = useCallback(async () => {
    if (retrainLoading) return;
    if (!window.confirm('Train 5 variants with Optuna, 20–60 minutes. Proceed?')) return;
    setRetrainLoading(true);
    setRetrainError(null);
    setPromotedVariant(null);
    try {
      const res = await fetch('/api/admin/training/retrain', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) setRetrainError(data?.error || `Request failed (${res.status})`);
      else setRetrainResult(data);
    } catch (err) {
      setRetrainError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setRetrainLoading(false);
    }
  }, [retrainLoading]);

  const handlePromoteVariant = useCallback(async (variant: string) => {
    if (!retrainResult) return;
    if (!window.confirm(`Promote variant "${variant}" as the approved v15 model?`)) return;
    try {
      const res = await fetch('/api/admin/training/retrain/promote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ experimentName: retrainResult.experimentName, variant }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRetrainError(data?.error || `Promote failed (${res.status})`);
        return;
      }
      setPromotedVariant(variant);
    } catch (err) {
      setRetrainError(err instanceof Error ? err.message : 'Network error');
    }
  }, [retrainResult]);

  // Chairman chat — real Claude API via /api/chairman-chat
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const transport = useMemo(
    () => new DefaultChatTransport({ api: '/api/chairman-chat' }) as any,
    []
  );
  const { messages, sendMessage, status } = useChat({
    transport,
    messages: INITIAL_UI_MESSAGES,
  } as Parameters<typeof useChat>[0]);
  const isLoading = status === 'streaming' || status === 'submitted';

  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Live system health from /api/operations/stats (same endpoint as /admin/operations)
  const [services, setServices] = useState<ServiceHealth[]>([]);
  const [healthWarning, setHealthWarning] = useState<string | null>(null);

  // Chairman build state from Supabase (layers, skills, loops)
  const [layers, setLayers] = useState<LayerRow[]>([]);
  const [skills, setSkills] = useState<SkillRow[]>([]);
  const [loops, setLoops] = useState<LoopRow[]>([]);
  const [performanceRows, setPerformanceRows] = useState<PerformanceRow[]>([]);
  const [performanceLoading, setPerformanceLoading] = useState(false);
  const [performanceError, setPerformanceError] = useState<string | null>(null);
  const [buildStateLoading, setBuildStateLoading] = useState(true);
  const [buildStateError, setBuildStateError] = useState<string | null>(null);

  // Hardcoded business metrics — matches what /admin/dashboard's ChairmanDashboard currently shows
  const stats = {
    totalRevenue: 416100,
    revenueTrend: 12.3,
    agencies: 4,
    creators: 147,
    videos: 4470,
    avgDps: 67.8,
  };
  const pendingPayouts = 12;
  const pendingApprovals = 5;

  useEffect(() => {
    let cancelled = false;
    async function fetchHealth() {
      try {
        const res = await fetch('/api/operations/stats');
        const result = await res.json();
        if (cancelled) return;
        if (result?.success && Array.isArray(result.data?.services)) {
          const svc: ServiceHealth[] = result.data.services.map((s: any) => ({
            name: s.name,
            status: s.status === 'healthy' ? 'operational' : s.status === 'down' ? 'down' : 'degraded',
            latency: s.latencyMs ?? s.componentsActive,
          }));
          setServices(svc);
          const degraded = svc.find((s) => s.status !== 'operational');
          setHealthWarning(degraded ? `${degraded.name} is ${degraded.status}` : null);
        }
      } catch {
        // silent — health indicators simply stay empty
      }
    }
    fetchHealth();
    return () => {
      cancelled = true;
    };
  }, []);

  // Per-table refetchers (shared by initial load + realtime + resolve handler)
  const refetchLayers = useCallback(async () => {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('chairman_layers')
        .select('*')
        .order('id', { ascending: true });
      if (error) throw error;
      setLayers((data || []) as LayerRow[]);
    } catch (err: any) {
      console.error('[chairman] refetchLayers:', err);
      setBuildStateError(err?.message || 'Failed to load layers');
    }
  }, []);

  const refetchSkills = useCallback(async () => {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('chairman_skills')
        .select('*')
        .order('skill_id', { ascending: true });
      if (error) throw error;
      setSkills((data || []) as SkillRow[]);
    } catch (err: any) {
      console.error('[chairman] refetchSkills:', err);
      setBuildStateError(err?.message || 'Failed to load skills');
    }
  }, []);

  const refetchPerformance = useCallback(async () => {
    setPerformanceLoading(true);
    setPerformanceError(null);
    try {
      const res = await fetch('/api/chairman/performance');
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to load performance');
      setPerformanceRows((data.rows || []) as PerformanceRow[]);
    } catch (err: any) {
      console.error('[chairman] refetchPerformance:', err);
      setPerformanceError(err?.message || 'Failed to load performance');
    } finally {
      setPerformanceLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'performance') refetchPerformance();
  }, [activeTab, refetchPerformance]);

  const refetchLoops = useCallback(async () => {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('chairman_loops')
        .select('id, description, resolved')
        .eq('resolved', false)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setLoops((data || []) as LoopRow[]);
    } catch (err: any) {
      console.error('[chairman] refetchLoops:', err);
      setBuildStateError(err?.message || 'Failed to load loops');
    }
  }, []);

  // Initial load
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setBuildStateLoading(true);
      setBuildStateError(null);
      await Promise.all([refetchLayers(), refetchSkills(), refetchLoops()]);
      if (!cancelled) setBuildStateLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [refetchLayers, refetchSkills, refetchLoops]);

  // Real-time subscription — refetch on any row change in chairman tables.
  // Pattern matches src/hooks/useOperations.ts (channel + postgres_changes + unsubscribe cleanup).
  useEffect(() => {
    const supabase = getSupabaseClient();
    const channel = supabase
      .channel('chairman-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chairman_layers' },
        () => refetchLayers()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chairman_skills' },
        () => refetchSkills()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chairman_loops' },
        () => refetchLoops()
      )
      .subscribe();
    return () => {
      channel.unsubscribe();
    };
  }, [refetchLayers, refetchSkills, refetchLoops]);

  async function handleResolveLoop(loopId: string) {
    // Optimistic removal
    const previous = loops;
    setLoops((current) => current.filter((l) => l.id !== loopId));
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('chairman_loops')
        .update({ resolved: true })
        .eq('id', loopId);
      if (error) throw error;
    } catch (err) {
      console.error('[chairman] Failed to resolve loop:', err);
      setLoops(previous);
    }
  }

  function handleSend() {
    const text = draft.trim();
    if (!text || isLoading) return;
    sendMessage({ text });
    setDraft('');
  }

  const hasAlerts = pendingPayouts > 0 || pendingApprovals > 0 || !!healthWarning;

  return (
    <div className="flex h-full w-full bg-[#0a0a0f] text-white overflow-hidden">
      {/* ─────────────────────────── LEFT: Chat ─────────────────────────── */}
      <section className="w-1/2 flex flex-col border-r border-[#1a1a2e] min-h-0">
        <header className="flex items-center justify-between px-6 py-4 border-b border-[#1a1a2e] bg-[#0a0a0f] flex-shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-white">Chairman OS</h1>
            <span className="text-[10px] font-semibold tracking-wider px-2 py-1 rounded border bg-purple-500/15 text-purple-300 border-purple-500/40">
              LAYER 2 — ACTIVE
            </span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 min-h-0">
          {messages.map((msg) => {
            const parts = (msg.parts || []) as Array<{ type: string; text?: string }>;
            const text = parts
              .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
              .map((p) => p.text)
              .join('');
            // AI SDK v6 represents tool calls as parts with type 'tool-<name>'
            const hasToolCall =
              msg.role === 'assistant' && parts.some((p) => p.type.startsWith('tool-'));

            return (
              <React.Fragment key={msg.id}>
                {text && (
                  <div
                    className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
                  >
                    <div
                      className={cn(
                        'max-w-[80%] px-4 py-3 rounded-xl text-sm leading-relaxed border whitespace-pre-wrap',
                        msg.role === 'user'
                          ? 'bg-purple-500/15 border-purple-500/30 text-purple-50'
                          : 'bg-[#111118] border-[#1a1a2e] text-gray-200'
                      )}
                    >
                      {text}
                    </div>
                  </div>
                )}
                {hasToolCall && (
                  <div
                    className="text-center text-gray-500"
                    style={{ fontSize: '11px', padding: '4px 0' }}
                  >
                    — Dashboard updated —
                  </div>
                )}
              </React.Fragment>
            );
          })}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] px-4 py-3 rounded-xl text-sm border bg-[#111118] border-[#1a1a2e] text-gray-500">
                <span className="inline-flex gap-1">
                  <span className="animate-pulse">•</span>
                  <span className="animate-pulse" style={{ animationDelay: '0.15s' }}>•</span>
                  <span className="animate-pulse" style={{ animationDelay: '0.3s' }}>•</span>
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-[#1a1a2e] bg-[#0a0a0f] px-6 py-4 flex-shrink-0">
          <div className="flex items-center gap-2 bg-[#111118] border border-[#1a1a2e] rounded-xl px-4 py-3 focus-within:border-purple-500/40 transition-colors">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Talk to your OS..."
              className="flex-1 bg-transparent text-sm text-white placeholder:text-gray-500 focus:outline-none"
            />
            <button
              onClick={handleSend}
              className="p-2 rounded-lg bg-purple-500/15 border border-purple-500/40 text-purple-300 hover:bg-purple-500/25 transition-colors"
              aria-label="Send message"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* ──────────────────────── RIGHT: Macro Dashboard ──────────────────────── */}
      <section className="w-1/2 flex flex-col min-h-0">
        {/* Platform Pulse — always visible */}
        <div className="flex-shrink-0 px-6 pt-5 pb-4 border-b border-[#1a1a2e] bg-[#0a0a0f]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Platform Pulse
            </h2>
          </div>
          <div className="grid grid-cols-5 gap-2">
            <PulseCard
              icon={DollarSign}
              label="Revenue"
              value={`$${(stats.totalRevenue / 1000).toFixed(1)}K`}
              trend={stats.revenueTrend}
              color="text-green-400"
            />
            <PulseCard icon={Building2} label="Agencies" value={stats.agencies} color="text-blue-400" />
            <PulseCard icon={Users} label="Creators" value={stats.creators} color="text-purple-400" />
            <PulseCard icon={Video} label="Videos" value={stats.videos.toLocaleString()} color="text-gray-300" />
            <PulseCard icon={TrendingUp} label="Avg DPS" value={stats.avgDps} color="text-green-400" />
          </div>

          {/* System health row */}
          {services.length > 0 && (
            <div className="mt-3 flex items-center gap-3">
              <Activity size={12} className="text-cyan-400 flex-shrink-0" />
              <div className="flex items-center gap-3 flex-wrap">
                {services.slice(0, 4).map((s) => (
                  <div key={s.name} className="flex items-center gap-1.5 text-[11px]">
                    <span
                      className={cn(
                        'w-1.5 h-1.5 rounded-full',
                        s.status === 'operational'
                          ? 'bg-green-500'
                          : s.status === 'degraded'
                            ? 'bg-amber-500'
                            : 'bg-red-500'
                      )}
                    />
                    <span className="text-gray-400">{s.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Alert bar — only rendered when something needs attention */}
        {hasAlerts && (
          <div className="flex-shrink-0 px-6 pt-4">
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 flex items-center gap-3">
              <AlertTriangle size={16} className="text-yellow-400 flex-shrink-0" />
              <div className="flex items-center gap-4 text-sm flex-wrap">
                {pendingPayouts > 0 && (
                  <span className="text-yellow-300">
                    <span className="font-semibold">{pendingPayouts}</span> pending payouts
                  </span>
                )}
                {pendingApprovals > 0 && (
                  <span className="text-yellow-300">
                    <span className="font-semibold">{pendingApprovals}</span> pending approvals
                  </span>
                )}
                {healthWarning && <span className="text-yellow-300">{healthWarning}</span>}
              </div>
            </div>
          </div>
        )}

        {/* Body: project tiles OR zoomed workspace */}
        <div className="flex-1 overflow-y-auto min-h-0 px-6 py-5">
          {activeProject === null && (
            <div>
              <div className="mb-5 p-4 rounded-xl border border-[#1a1a2e] bg-[#111118]">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <div className="text-sm font-semibold text-white mb-0.5">Holdout Set</div>
                    <div className="text-xs text-gray-500">
                      Lock 200 stratified videos. One-time, irreversible.
                    </div>
                  </div>
                  <button
                    onClick={handleDesignateHoldout}
                    disabled={holdoutLoading}
                    className={cn(
                      'text-xs font-semibold px-4 py-2 rounded-lg border transition-colors',
                      holdoutLoading
                        ? 'bg-[#1a1a2e] border-[#2a2a4e] text-gray-400 cursor-wait'
                        : holdoutDone
                          ? 'bg-green-500/15 border-green-500/40 text-green-300 hover:bg-green-500/25'
                          : 'bg-purple-500/15 border-purple-500/40 text-purple-200 hover:bg-purple-500/25'
                    )}
                  >
                    {holdoutLoading
                      ? 'Designating…'
                      : holdoutDone
                        ? 'Holdout designated ✓ (re-run)'
                        : 'Designate Holdout Set'}
                  </button>
                </div>
                {holdoutError && (
                  <div className="mt-3 text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                    {holdoutError}
                  </div>
                )}
                {holdoutResult && (
                  <div className="mt-3 text-xs">
                    <div className="text-green-300 mb-2">
                      Locked <span className="font-semibold">{holdoutResult.totalLocked}</span> rows.
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-gray-400">
                      {holdoutResult.perNiche
                        .filter((n) => n.allocated > 0)
                        .map((n) => (
                          <div key={n.niche} className="flex justify-between">
                            <span className="truncate mr-2">{n.niche}</span>
                            <span className="text-gray-300 flex-shrink-0">
                              {n.allocated} / {n.eligible}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mb-5 p-4 rounded-xl border border-[#1a1a2e] bg-[#111118]">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <div className="text-sm font-semibold text-white mb-0.5">Data Quality Gate</div>
                    <div className="text-xs text-gray-500">
                      Disqualifies rows with no video analysis, sub-1k creators, or high null rates. Run before holdout.
                    </div>
                  </div>
                  <button
                    onClick={handleRunQualityGate}
                    disabled={qualityGateLoading || qualityGateDone}
                    className={cn(
                      'text-xs font-semibold px-4 py-2 rounded-lg border transition-colors',
                      qualityGateDone
                        ? 'bg-green-500/15 border-green-500/40 text-green-300 cursor-not-allowed'
                        : qualityGateLoading
                          ? 'bg-[#1a1a2e] border-[#2a2a4e] text-gray-400 cursor-wait'
                          : 'bg-purple-500/15 border-purple-500/40 text-purple-200 hover:bg-purple-500/25'
                    )}
                  >
                    {qualityGateDone && qualityGateResult
                      ? `Quality gate complete ✓ — ${qualityGateResult.eligible} rows eligible`
                      : qualityGateDone
                        ? 'Quality gate complete ✓'
                        : qualityGateLoading
                          ? 'Running quality gate…'
                          : 'Run Data Quality Gate'}
                  </button>
                </div>
                {qualityGateError && (
                  <div className="mt-3 text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                    {qualityGateError}
                  </div>
                )}
                {qualityGateResult && (
                  <div className="mt-3 text-xs">
                    <div className="text-green-300 mb-2">
                      <span className="font-semibold">{qualityGateResult.totalRows}</span> total,{' '}
                      <span className="font-semibold">{qualityGateResult.disqualified.total}</span> disqualified,{' '}
                      <span className="font-semibold">{qualityGateResult.eligible}</span> eligible.
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-gray-400">
                      <div className="flex justify-between">
                        <span>no_video_analysis</span>
                        <span className="text-gray-300">{qualityGateResult.disqualified.no_video_analysis}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>followers_below_1k</span>
                        <span className="text-gray-300">{qualityGateResult.disqualified.followers_below_1k}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>high_null_rate</span>
                        <span className="text-gray-300">{qualityGateResult.disqualified.high_null_rate}</span>
                      </div>
                    </div>
                    {qualityGateResult.errors.length > 0 && (
                      <div className="mt-2 text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                        {qualityGateResult.errors.map((e, i) => (
                          <div key={i}>⚠ {e}</div>
                        ))}
                      </div>
                    )}
                    {qualityGateResult.warnings.length > 0 && (
                      <div className="mt-2 text-yellow-300 bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-2">
                        {qualityGateResult.warnings.map((w, i) => (
                          <div key={i}>⚠ {w}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mb-5 p-4 rounded-xl border border-[#1a1a2e] bg-[#111118]">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <div className="text-sm font-semibold text-white mb-0.5">Scraped Video Quality Gate</div>
                    <div className="text-xs text-gray-500">
                      Filters scraped_videos (XGBoost training source). Drops rows with no DPS score, sub-1k creators,
                      or high null rates. Produces a per-column coverage report.
                    </div>
                  </div>
                  <button
                    onClick={handleRunScrapedGate}
                    disabled={scrapedGateLoading || scrapedGateDone}
                    className={cn(
                      'text-xs font-semibold px-4 py-2 rounded-lg border transition-colors',
                      scrapedGateDone
                        ? 'bg-green-500/15 border-green-500/40 text-green-300 cursor-not-allowed'
                        : scrapedGateLoading
                          ? 'bg-[#1a1a2e] border-[#2a2a4e] text-gray-400 cursor-wait'
                          : 'bg-purple-500/15 border-purple-500/40 text-purple-200 hover:bg-purple-500/25'
                    )}
                  >
                    {scrapedGateDone && scrapedGateResult
                      ? `Quality gate complete — ${scrapedGateResult.eligible} rows eligible`
                      : scrapedGateLoading
                        ? 'Running quality gate…'
                        : 'Run Scraped Video Quality Gate'}
                  </button>
                </div>
                {scrapedGateError && (
                  <div className="mt-3 text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                    {scrapedGateError}
                  </div>
                )}
                {scrapedGateResult && (
                  <div className="mt-3 text-xs">
                    <div
                      className={cn(
                        'mb-2 font-semibold',
                        scrapedGateResult.verdict === 'PASS'
                          ? 'text-green-300'
                          : scrapedGateResult.verdict === 'WARNING'
                            ? 'text-yellow-300'
                            : 'text-red-300'
                      )}
                    >
                      {scrapedGateResult.verdictMessage}
                    </div>
                    <div className="text-gray-300 mb-2">
                      <span className="font-semibold">{scrapedGateResult.totalRows}</span> total,{' '}
                      <span className="font-semibold">{scrapedGateResult.disqualified.total}</span> disqualified,{' '}
                      <span className="font-semibold">{scrapedGateResult.eligible}</span> eligible.
                    </div>
                    <div className="grid grid-cols-3 gap-x-4 gap-y-1 text-gray-400 mb-3">
                      <div className="flex justify-between">
                        <span>no_dps_score</span>
                        <span className="text-gray-300">{scrapedGateResult.disqualified.no_dps_score}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>followers_below_1k</span>
                        <span className="text-gray-300">{scrapedGateResult.disqualified.followers_below_1k}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>high_null_rate</span>
                        <span className="text-gray-300">{scrapedGateResult.disqualified.high_null_rate}</span>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="text-gray-400 font-semibold mb-1">Coverage by group (eligible rows)</div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        {scrapedGateResult.groupSummary.map((g) => {
                          const low = g.average_fill_rate < 50;
                          return (
                            <div
                              key={g.group_name}
                              className={cn(
                                'flex justify-between px-2 py-1 rounded',
                                low
                                  ? 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-200'
                                  : 'text-gray-300'
                              )}
                            >
                              <span>
                                {g.group_name}{' '}
                                <span className="text-gray-500">({g.column_count})</span>
                              </span>
                              <span>{g.average_fill_rate}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <details className="mt-3">
                      <summary className="cursor-pointer text-gray-400 hover:text-gray-200">
                        Per-column fill rates
                      </summary>
                      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-0.5 text-gray-400">
                        {scrapedGateResult.coverage.map((c) => (
                          <div key={c.column_name} className="flex justify-between">
                            <span className="truncate mr-2">
                              {c.column_name}{' '}
                              <span className="text-gray-600">[{c.group}]</span>
                            </span>
                            <span className="text-gray-300 flex-shrink-0">
                              {c.non_null_count} ({c.fill_rate_percent}%)
                            </span>
                          </div>
                        ))}
                      </div>
                    </details>
                    {scrapedGateResult.errors.length > 0 && (
                      <div className="mt-2 text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                        {scrapedGateResult.errors.map((e, i) => (
                          <div key={i}>⚠ {e}</div>
                        ))}
                      </div>
                    )}
                    {scrapedGateResult.warnings.length > 0 && (
                      <div className="mt-2 text-yellow-300 bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-2">
                        {scrapedGateResult.warnings.map((w, i) => (
                          <div key={i}>⚠ {w}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mb-5 p-4 rounded-xl border border-[#1a1a2e] bg-[#111118]">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <div className="text-sm font-semibold text-white mb-0.5">Scraped Video Holdout</div>
                    <div className="text-xs text-gray-500">
                      Locks 200 videos from scraped_videos as the evaluation holdout, stratified by niche
                      with a seeded RNG. One-time, irreversible. Run after the quality gate.
                    </div>
                  </div>
                  <button
                    onClick={handleDesignateScrapedHoldout}
                    disabled={scrapedHoldoutLoading}
                    className={cn(
                      'text-xs font-semibold px-4 py-2 rounded-lg border transition-colors',
                      scrapedHoldoutLoading
                        ? 'bg-[#1a1a2e] border-[#2a2a4e] text-gray-400 cursor-wait'
                        : scrapedHoldoutDone
                          ? 'bg-green-500/15 border-green-500/40 text-green-300 hover:bg-green-500/25'
                          : 'bg-purple-500/15 border-purple-500/40 text-purple-200 hover:bg-purple-500/25'
                    )}
                  >
                    {scrapedHoldoutLoading
                      ? 'Designating holdout…'
                      : scrapedHoldoutDone && scrapedHoldoutResult
                        ? `Holdout designated ✓ — ${scrapedHoldoutResult.totalLocked} locked (re-run)`
                        : 'Designate Holdout Set (200 videos)'}
                  </button>
                </div>
                {scrapedHoldoutError && (
                  <div className="mt-3 text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                    {scrapedHoldoutError}
                  </div>
                )}
                {scrapedHoldoutResult && (
                  <div className="mt-3 text-xs">
                    <div className="text-green-300 mb-2">
                      Locked <span className="font-semibold">{scrapedHoldoutResult.totalLocked}</span> of{' '}
                      <span className="font-semibold">{scrapedHoldoutResult.totalEligible}</span> eligible
                      rows. Remaining for training:{' '}
                      <span className="font-semibold">{scrapedHoldoutResult.remainingTraining}</span>.
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-gray-400">
                      {scrapedHoldoutResult.perNiche.map((n) => (
                        <div key={n.niche} className="flex justify-between">
                          <span className="truncate mr-2">{n.niche}</span>
                          <span className="text-gray-300 flex-shrink-0">
                            {n.holdout} / {n.eligible}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mb-5 p-4 rounded-xl border border-[#1a1a2e] bg-[#111118]">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <div className="text-sm font-semibold text-white mb-0.5">Export Training Data</div>
                    <div className="text-xs text-gray-500">
                      Writes scraped_videos rows (engagement + timing + sound) and LEFT JOINs training_features
                      content columns to CSV for the Python XGBoost trainer. Read-only; safe to re-run.
                    </div>
                  </div>
                  <button
                    onClick={handleExportTrainingData}
                    disabled={exportDataLoading}
                    className={cn(
                      'text-xs font-semibold px-4 py-2 rounded-lg border transition-colors',
                      exportDataLoading
                        ? 'bg-[#1a1a2e] border-[#2a2a4e] text-gray-400 cursor-wait'
                        : exportDataResult
                          ? 'bg-green-500/15 border-green-500/40 text-green-300 hover:bg-green-500/25'
                          : 'bg-purple-500/15 border-purple-500/40 text-purple-200 hover:bg-purple-500/25'
                    )}
                  >
                    {exportDataLoading
                      ? 'Exporting…'
                      : exportDataResult
                        ? 'Re-export'
                        : 'Export Training Data'}
                  </button>
                </div>
                {exportDataError && (
                  <div className="mt-3 text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                    {exportDataError}
                  </div>
                )}
                {exportDataResult && (
                  <div className="mt-3 text-xs">
                    <div className="text-green-300 mb-2">
                      Exported <span className="font-semibold">{exportDataResult.training_rows}</span>{' '}
                      training rows, <span className="font-semibold">{exportDataResult.holdout_rows}</span>{' '}
                      holdout rows, <span className="font-semibold">{exportDataResult.features}</span>{' '}
                      feature columns
                      {exportDataResult.metadata_feature_count != null &&
                        exportDataResult.content_feature_count != null && (
                          <>
                            {' '}
                            (<span className="font-semibold">{exportDataResult.metadata_feature_count}</span>{' '}
                            metadata +{' '}
                            <span className="font-semibold">{exportDataResult.content_feature_count}</span>{' '}
                            content).
                          </>
                        )}
                    </div>
                    {exportDataResult.training_rows_full_join != null &&
                      exportDataResult.content_feature_coverage_training_pct != null && (
                        <div className="text-gray-300 mb-2 space-y-0.5">
                          <div>
                            Training — rows with content features:{' '}
                            <span className="font-semibold text-green-200">
                              {exportDataResult.training_rows_full_join}
                            </span>{' '}
                            / {exportDataResult.training_rows} (
                            <span className="font-semibold">
                              {exportDataResult.content_feature_coverage_training_pct}%
                            </span>{' '}
                            coverage); metadata-only:{' '}
                            <span className="font-semibold">
                              {exportDataResult.training_rows_metadata_only ?? '—'}
                            </span>
                          </div>
                          {exportDataResult.holdout_rows_full_join != null &&
                            exportDataResult.content_feature_coverage_holdout_pct != null && (
                              <div>
                                Holdout — with content:{' '}
                                <span className="font-semibold text-green-200">
                                  {exportDataResult.holdout_rows_full_join}
                                </span>{' '}
                                / {exportDataResult.holdout_rows} (
                                <span className="font-semibold">
                                  {exportDataResult.content_feature_coverage_holdout_pct}%
                                </span>
                                ); metadata-only:{' '}
                                <span className="font-semibold">
                                  {exportDataResult.holdout_rows_metadata_only ?? '—'}
                                </span>
                              </div>
                            )}
                        </div>
                      )}
                    {exportDataResult.content_feature_sanity &&
                      exportDataResult.content_feature_sanity.missing_categories.length > 0 && (
                        <div className="mb-2 text-yellow-200/90 bg-yellow-500/10 border border-yellow-500/25 rounded-lg px-3 py-2">
                          Expected content signals missing from column set:{' '}
                          {exportDataResult.content_feature_sanity.missing_categories.join(', ')}
                        </div>
                      )}
                    {exportDataResult.bimodal_detected && exportDataResult.bimodal_details && (
                      <div className="mb-2 text-yellow-300 bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-2">
                        ⚠ Bimodal DPS detected — cohort A mean{' '}
                        {exportDataResult.bimodal_details.cohortA.mean.toFixed(2)} (n=
                        {exportDataResult.bimodal_details.cohortA.count}), cohort B mean{' '}
                        {exportDataResult.bimodal_details.cohortB.mean.toFixed(2)} (n=
                        {exportDataResult.bimodal_details.cohortB.count}). Exported as{' '}
                        <code>dps_cohort</code>.
                      </div>
                    )}
                    <div className="text-gray-400 space-y-0.5">
                      <div className="truncate">Training: {exportDataResult.file_paths.training}</div>
                      <div className="truncate">Holdout: {exportDataResult.file_paths.holdout}</div>
                      <div className="truncate">Metadata: {exportDataResult.file_paths.metadata}</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mb-5 p-4 rounded-xl border border-[#1a1a2e] bg-[#111118]">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <div className="text-sm font-semibold text-white mb-0.5">Training Data Backfill</div>
                    <div className="text-xs text-gray-500">
                      Fills follower counts, actual performance, and the 20-feature cache. Safe to re-run.
                    </div>
                  </div>
                  <button
                    onClick={handleRunBackfill}
                    disabled={backfillLoading}
                    className={cn(
                      'text-xs font-semibold px-4 py-2 rounded-lg border transition-colors',
                      backfillDone
                        ? 'bg-green-500/15 border-green-500/40 text-green-300 hover:bg-green-500/25'
                        : backfillLoading
                          ? 'bg-[#1a1a2e] border-[#2a2a4e] text-gray-400 cursor-wait'
                          : 'bg-purple-500/15 border-purple-500/40 text-purple-200 hover:bg-purple-500/25'
                    )}
                  >
                    {backfillLoading
                      ? 'Running… (can take a few minutes)'
                      : backfillDone
                        ? 'Run Again'
                        : 'Run Backfill'}
                  </button>
                </div>
                {backfillError && (
                  <div className="mt-3 text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                    {backfillError}
                  </div>
                )}
                {backfillResult && (
                  <div className="mt-3 text-xs grid grid-cols-1 md:grid-cols-3 gap-3">
                    {backfillResult.followers && (
                      <div className="bg-[#0a0a0f] border border-[#1a1a2e] rounded-lg p-2">
                        <div className="text-gray-500 mb-1">Follower counts</div>
                        <div className="text-gray-200">
                          updated <span className="font-semibold text-green-300">{backfillResult.followers.updated}</span>
                          <span className="text-gray-500"> · skipped {backfillResult.followers.skipped}</span>
                        </div>
                      </div>
                    )}
                    {backfillResult.performance && (
                      <div className="bg-[#0a0a0f] border border-[#1a1a2e] rounded-lg p-2">
                        <div className="text-gray-500 mb-1">Actual performance</div>
                        <div className="text-gray-200">
                          updated <span className="font-semibold text-green-300">{backfillResult.performance.updated}</span>
                          <span className="text-gray-500"> · skipped {backfillResult.performance.skipped}</span>
                        </div>
                      </div>
                    )}
                    {backfillResult.features && (
                      <div className="bg-[#0a0a0f] border border-[#1a1a2e] rounded-lg p-2">
                        <div className="text-gray-500 mb-1">Feature cache</div>
                        <div className="text-gray-200">
                          cached <span className="font-semibold text-green-300">{backfillResult.features.total}</span>
                          <span className="text-gray-500">
                            {' '}· cultural valid {backfillResult.features.culturalValid} / zeroed {backfillResult.features.culturalZeroed}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mb-5 p-4 rounded-xl border border-[#1a1a2e] bg-[#111118]">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <div className="text-sm font-semibold text-white mb-0.5">Training Prep</div>
                    <div className="text-xs text-gray-500">
                      Filter rows, row-floor check, DPS bimodal check, scaling params. Safe to re-run.
                    </div>
                  </div>
                  <button
                    onClick={handleRunPrep}
                    disabled={prepLoading}
                    className={cn(
                      'text-xs font-semibold px-4 py-2 rounded-lg border transition-colors',
                      prepResult?.readyForS6
                        ? 'bg-green-500/15 border-green-500/40 text-green-300 hover:bg-green-500/25'
                        : prepLoading
                          ? 'bg-[#1a1a2e] border-[#2a2a4e] text-gray-400 cursor-wait'
                          : 'bg-purple-500/15 border-purple-500/40 text-purple-200 hover:bg-purple-500/25'
                    )}
                  >
                    {prepLoading ? 'Running…' : prepResult?.readyForS6 ? 'Run Again' : 'Run Training Prep'}
                  </button>
                </div>
                {prepError && (
                  <div className="mt-3 text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                    {prepError}
                    {prepResult?.rowFloor?.suggestion && (
                      <div className="mt-1 text-red-200/80">Suggestion: {prepResult.rowFloor.suggestion}</div>
                    )}
                  </div>
                )}
                {prepResult && (
                  <div className="mt-3 text-xs space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="bg-[#0a0a0f] border border-[#1a1a2e] rounded-lg p-2">
                        <div className="text-gray-500 mb-1">Rows</div>
                        <div className="text-gray-200">
                          filtered <span className="font-semibold text-green-300">{prepResult.totalAfterFilter}</span>
                          <span className="text-gray-500"> / {prepResult.totalEligible} eligible</span>
                        </div>
                      </div>
                      <div className="bg-[#0a0a0f] border border-[#1a1a2e] rounded-lg p-2">
                        <div className="text-gray-500 mb-1">Row floor (1,500)</div>
                        <div className={cn('font-semibold', prepResult.rowFloor.met ? 'text-green-300' : 'text-yellow-300')}>
                          {prepResult.rowFloor.met ? 'met' : `not met — ${prepResult.rowFloor.action}`}
                        </div>
                      </div>
                      <div className="bg-[#0a0a0f] border border-[#1a1a2e] rounded-lg p-2">
                        <div className="text-gray-500 mb-1">Ready for S6</div>
                        <div className={cn('font-semibold', prepResult.readyForS6 ? 'text-green-300' : 'text-yellow-300')}>
                          {prepResult.readyForS6 ? 'yes' : 'no'}
                        </div>
                      </div>
                    </div>
                    {prepResult.dpsDistribution && (
                      <div className="bg-[#0a0a0f] border border-[#1a1a2e] rounded-lg p-2">
                        <div className="text-gray-500 mb-1">DPS distribution</div>
                        <div className="text-gray-200">
                          {prepResult.dpsDistribution.isBimodal
                            ? <>
                                <span className="text-yellow-300 font-semibold">bimodal</span>
                                <span className="text-gray-500">
                                  {' '}· Pop A: {prepResult.dpsDistribution.popA.count} rows mean {prepResult.dpsDistribution.popA.mean.toFixed(1)}
                                  {' '}· Pop B: {prepResult.dpsDistribution.popB.count} rows mean {prepResult.dpsDistribution.popB.mean.toFixed(1)}
                                  {prepResult.dpsDistribution.flagAdded && <span className="text-green-300"> · flag written</span>}
                                </span>
                              </>
                            : <>unimodal <span className="text-gray-500">· overall mean {prepResult.dpsDistribution.mean.toFixed(1)}</span></>}
                        </div>
                      </div>
                    )}
                    {prepResult.scalingParams && (
                      <div className="bg-[#0a0a0f] border border-[#1a1a2e] rounded-lg p-2">
                        <div className="text-gray-500 mb-1">Scaling</div>
                        <div className="text-gray-200">
                          <span className="font-semibold text-green-300">{prepResult.scalingParams.featuresScaled}</span>
                          <span className="text-gray-500"> features min-max scaled and written to feature_scaling_params</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mb-5 p-4 rounded-xl border border-[#1a1a2e] bg-[#111118]">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <div className="text-sm font-semibold text-white mb-0.5">Run S6 Retrain</div>
                    <div className="text-xs text-gray-500">
                      Trains 5 XGBoost variants with Optuna (100 trials each), evaluates on the locked holdout. Saves as v15, pending approval. Takes 20–60 minutes.
                    </div>
                  </div>
                  <button
                    onClick={handleRunRetrain}
                    disabled={retrainLoading}
                    className={cn(
                      'text-xs font-semibold px-4 py-2 rounded-lg border transition-colors',
                      retrainResult
                        ? 'bg-green-500/15 border-green-500/40 text-green-300 hover:bg-green-500/25'
                        : retrainLoading
                          ? 'bg-[#1a1a2e] border-[#2a2a4e] text-gray-400 cursor-wait'
                          : 'bg-purple-500/15 border-purple-500/40 text-purple-200 hover:bg-purple-500/25'
                    )}
                  >
                    {retrainLoading ? 'Running… (20–60 min)' : retrainResult ? 'Run Again' : 'Run S6 Retrain'}
                  </button>
                </div>
                {retrainError && (
                  <div className="mt-3 text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                    {retrainError}
                  </div>
                )}
                {retrainLoading && (
                  <div className="mt-3 text-xs text-gray-400 italic">
                    Running Optuna hyperparameter search — keep this tab open. Progress is logged server-side.
                  </div>
                )}
                {retrainResult && (
                  <div className="mt-3 text-xs space-y-3">
                    <div className="text-gray-300">
                      Experiment: <span className="font-mono text-gray-200">{retrainResult.experimentName}</span>{' · '}
                      Winner: <span className="font-semibold text-green-300">{retrainResult.winner}</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-[11px] border border-[#1a1a2e] rounded-lg overflow-hidden">
                        <thead className="bg-[#0a0a0f] text-gray-400">
                          <tr>
                            <th className="text-left px-2 py-1.5">Variant</th>
                            <th className="text-right px-2 py-1.5">Feats</th>
                            <th className="text-right px-2 py-1.5">Rows</th>
                            <th className="text-right px-2 py-1.5">CV ρ</th>
                            <th className="text-right px-2 py-1.5">Holdout ρ</th>
                            <th className="text-right px-2 py-1.5">MAE</th>
                            <th className="text-left px-2 py-1.5">Top feature</th>
                            <th className="text-right px-2 py-1.5">Action</th>
                          </tr>
                        </thead>
                        <tbody className="text-gray-200">
                          {retrainResult.variants.map((v) => {
                            const isWinner = v.variant === retrainResult.winner;
                            const isPromoted = promotedVariant === v.variant;
                            const top = v.feature_importance_top15?.[0]?.feature ?? '—';
                            return (
                              <tr key={v.variant} className={cn(isWinner && 'bg-green-500/5')}>
                                <td className="px-2 py-1.5 font-mono">{v.variant}</td>
                                <td className="px-2 py-1.5 text-right">{v.feature_count}</td>
                                <td className="px-2 py-1.5 text-right">{v.training_rows}</td>
                                <td className="px-2 py-1.5 text-right">{v.cv_spearman.toFixed(4)}</td>
                                <td className={cn('px-2 py-1.5 text-right font-semibold', isWinner && 'text-green-300')}>
                                  {v.holdout_spearman.toFixed(4)}
                                </td>
                                <td className="px-2 py-1.5 text-right">{v.holdout_mae.toFixed(4)}</td>
                                <td className="px-2 py-1.5 font-mono text-gray-400 truncate max-w-[160px]">{top}</td>
                                <td className="px-2 py-1.5 text-right">
                                  <button
                                    onClick={() => handlePromoteVariant(v.variant)}
                                    disabled={!!promotedVariant}
                                    className={cn(
                                      'px-2 py-1 rounded border text-[10px] font-semibold',
                                      isPromoted
                                        ? 'bg-green-500/20 border-green-500/50 text-green-200'
                                        : promotedVariant
                                          ? 'bg-[#1a1a2e] border-[#2a2a4e] text-gray-500 cursor-not-allowed'
                                          : 'bg-purple-500/15 border-purple-500/40 text-purple-200 hover:bg-purple-500/25',
                                    )}
                                  >
                                    {isPromoted ? 'Promoted' : 'Promote'}
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    {retrainResult.decisions.length > 0 && (
                      <div className="bg-[#0a0a0f] border border-[#1a1a2e] rounded-lg p-2 space-y-0.5">
                        {retrainResult.decisions.map((d, i) => (
                          <div key={i} className="text-gray-300">• {d}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Projects
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {PROJECT_TILES.map((tile) => {
                  const styles = projectStatusStyles(tile.status);
                  return (
                    <button
                      key={tile.key}
                      onClick={() => setActiveProject(tile.key)}
                      className={cn(
                        'text-left p-4 rounded-xl border border-[#1a1a2e] border-l-2 bg-[#111118]',
                        'hover:border-[#2a2a4e] hover:bg-[#14141d] transition-all',
                        styles.border
                      )}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="text-sm font-semibold text-white">{tile.title}</div>
                        <span
                          className={cn(
                            'text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded border flex-shrink-0',
                            styles.badge
                          )}
                        >
                          {tile.statusLabel}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 leading-relaxed">{tile.subtitle}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {activeProject !== null && (
            <div className="h-full flex flex-col min-h-0">
              {/* Zoom header with back button */}
              <div className="flex items-center gap-3 mb-4 flex-shrink-0">
                <button
                  onClick={() => setActiveProject(null)}
                  className="p-1.5 rounded-lg bg-[#111118] border border-[#1a1a2e] text-gray-400 hover:border-purple-500/40 hover:text-purple-300 transition-colors"
                  aria-label="Back to macro view"
                >
                  <ArrowLeft size={14} />
                </button>
                <h2 className="text-sm font-semibold text-white">{activeProject}</h2>
              </div>

              {activeProject === 'Layer Build' ? (
                <LayerBuildWorkspace
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  layers={layers}
                  skills={skills}
                  loops={loops}
                  loading={buildStateLoading}
                  error={buildStateError}
                  onResolveLoop={handleResolveLoop}
                  performanceRows={performanceRows}
                  performanceLoading={performanceLoading}
                  performanceError={performanceError}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center min-h-0">
                  <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-8 text-center max-w-sm">
                    <div className="text-sm font-medium text-gray-300 mb-1">Zoom view coming soon</div>
                    <div className="text-xs text-gray-500">
                      {activeProject} workspace is not wired up yet.
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Pulse metric card
// ────────────────────────────────────────────────────────────────────────────

interface PulseCardProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string | number;
  trend?: number;
  color: string;
}

function PulseCard({ icon: Icon, label, value, trend, color }: PulseCardProps) {
  return (
    <div className="bg-[#323434] border border-[#3A3C3C] rounded-lg px-3 py-2.5">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon size={11} className={color} />
        <span className="text-[10px] uppercase tracking-wider text-[#A8A9A9] truncate">{label}</span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-sm font-medium text-[#D4D4D4]">{value}</span>
        {trend != null && (
          <span className="text-[10px] text-[#4A8C6A]">+{trend}%</span>
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Layer Build zoom workspace (reuses the Map/Queue/Decisions/Loops content)
// ────────────────────────────────────────────────────────────────────────────

interface LayerBuildWorkspaceProps {
  activeTab: TabKey;
  setActiveTab: (t: TabKey) => void;
  layers: LayerRow[];
  skills: SkillRow[];
  loops: LoopRow[];
  loading: boolean;
  error: string | null;
  onResolveLoop: (id: string) => void;
  performanceRows: PerformanceRow[];
  performanceLoading: boolean;
  performanceError: string | null;
}

function SkeletonCard() {
  return (
    <div className="p-4 rounded-xl border border-[#3A3C3C] bg-[#323434] animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-9 h-9 rounded-lg bg-[#3A3C3C]" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-2/3 bg-[#3A3C3C] rounded" />
          <div className="h-2 w-1/2 bg-[#3A3C3C] rounded" />
        </div>
        <div className="h-5 w-16 bg-[#3A3C3C] rounded" />
      </div>
    </div>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <div className="p-4 rounded-xl border border-[#8C4A4A]/30 bg-[#2E1A1A] text-sm text-[#8C4A4A]">
      <div className="font-medium mb-1">Failed to load build state</div>
      <div className="text-xs text-[#8C4A4A]/80">{message}</div>
    </div>
  );
}

function LayerBuildWorkspace({
  activeTab,
  setActiveTab,
  layers,
  skills,
  loops,
  loading,
  error,
  onResolveLoop,
  performanceRows,
  performanceLoading,
  performanceError,
}: LayerBuildWorkspaceProps) {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <nav className="flex gap-1 border-b border-[#3A3C3C] flex-shrink-0">
        {(['map', 'queue', 'decisions', 'loops', 'performance'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition-colors',
              activeTab === tab
                ? 'border-[#6C92A0] text-[#D4D4D4]'
                : 'border-transparent text-[#6B6D6D] hover:text-[#D4D4D4]'
            )}
          >
            {tab}
          </button>
        ))}
      </nav>

      <div className="flex-1 overflow-y-auto pt-4 min-h-0">
        {error && (activeTab === 'map' || activeTab === 'queue' || activeTab === 'loops') && (
          <ErrorCard message={error} />
        )}

        {activeTab === 'map' && !error && (
          <div className="space-y-2">
            {loading && layers.length === 0 && (
              <>
                {Array.from({ length: 9 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </>
            )}
            {!loading &&
              layers.map((layer) => {
                const highlighted = layer.status === 'active';
                return (
                    <div
                    key={layer.id}
                    className={cn(
                      'flex items-center gap-4 p-4 rounded-lg border transition-all',
                      highlighted
                        ? 'bg-[#1A2830] border-[#6C92A0] border-l-[3px]'
                        : 'bg-[#323434] border-[#3A3C3C] hover:border-[#4A6B78]'
                    )}
                  >
                    <div
                      className={cn(
                        'flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-sm font-medium border',
                        highlighted
                          ? 'bg-[#1A2830] border-[#6C92A0]/40 text-[#6C92A0]'
                          : 'bg-[#282929] border-[#3A3C3C] text-[#A8A9A9]'
                      )}
                    >
                      {layer.layer_num}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-[#D4D4D4] truncate">{layer.layer_name}</div>
                      <div className="text-xs text-[#6B6D6D] truncate mt-0.5">
                        {layer.trendzo_equivalent}
                      </div>
                    </div>
                    <div className="flex-shrink-0">{layerStatusBadge(layer.status)}</div>
                  </div>
                );
              })}
          </div>
        )}

        {activeTab === 'queue' && !error && (
          <div className="space-y-3">
            {loading && skills.length === 0 && (
              <>
                {Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </>
            )}
            {!loading &&
              skills.map((skill) => {
                const highlighted = skill.status === 'in_progress';
                const subtitle = skill.blocked_by ? `Waiting on ${skill.blocked_by}` : null;
                return (
                  <div
                    key={skill.id}
                    className={cn(
                      'p-4 rounded-lg border transition-all',
                      highlighted
                        ? 'bg-[#1A2830] border-[#6C92A0] border-l-[3px]'
                        : 'bg-[#323434] border-[#3A3C3C]'
                    )}
                  >
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex-shrink-0 text-xs font-mono text-[#6B6D6D]">{skill.skill_id}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-[#D4D4D4] truncate">{skill.skill_name}</div>
                        {subtitle && <div className="text-xs text-[#6B6D6D] mt-0.5">{subtitle}</div>}
                      </div>
                      <div className="flex-shrink-0">{skillStatusBadge(skill.status)}</div>
                    </div>
                    <ProgressBar progress={skill.progress_pct} status={skill.status} />
                  </div>
                );
              })}
          </div>
        )}

        {activeTab === 'decisions' && (
          <div className="bg-[#323434] border border-[#3A3C3C] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#3A3C3C] bg-[#282929]">
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#6B6D6D] uppercase tracking-wider">
                    Date
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#6B6D6D] uppercase tracking-wider">
                    Decision
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#6B6D6D] uppercase tracking-wider w-24">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {DECISIONS.map((d, i) => (
                  <tr key={i} className="border-b border-[#3A3C3C] last:border-b-0 hover:bg-[#282929]/50 transition-colors">
                    <td className="px-4 py-3 text-[#A8A9A9] whitespace-nowrap">{d.date}</td>
                    <td className="px-4 py-3 text-[#D4D4D4]">{d.decision}</td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-medium tracking-wider px-2 py-1 rounded border bg-[#1A2830] text-[#6C92A0] border-[#6C92A0]/40">
                        {d.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="space-y-3">
            {performanceError && <ErrorCard message={performanceError} />}
            {!performanceError && (
              <div className="bg-[#323434] border border-[#3A3C3C] rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#3A3C3C] bg-[#282929]">
                      <th className="text-left px-4 py-3 text-xs font-medium text-[#6B6D6D] uppercase tracking-wider">Creator</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-[#6B6D6D] uppercase tracking-wider">Brief Title</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-[#6B6D6D] uppercase tracking-wider">VPS Predicted</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-[#6B6D6D] uppercase tracking-wider">Actual Views</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-[#6B6D6D] uppercase tracking-wider">Delta</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-[#6B6D6D] uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performanceLoading && performanceRows.length === 0 && (
                      <tr><td colSpan={6} className="px-4 py-6 text-center text-xs text-[#6B6D6D]">Loading…</td></tr>
                    )}
                    {!performanceLoading && performanceRows.length === 0 && (
                      <tr><td colSpan={6} className="px-4 py-6 text-center text-xs text-[#6B6D6D]">No measured briefs yet.</td></tr>
                    )}
                    {performanceRows.map((r) => {
                      const deltaColor = r.delta == null
                        ? 'text-[#A8A9A9]'
                        : r.delta >= 0 ? 'text-[#4A8C6A]' : 'text-[#C07B74]';
                      const deltaText = r.delta == null
                        ? '—'
                        : `${r.delta >= 0 ? '+' : ''}${r.delta.toLocaleString('en-US')}`;
                      const dateText = r.measuredAt
                        ? new Date(r.measuredAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : '—';
                      return (
                        <tr key={r.id} className="border-b border-[#3A3C3C] last:border-b-0 hover:bg-[#282929]/50 transition-colors">
                          <td className="px-4 py-3 text-[#D4D4D4] whitespace-nowrap">{r.creator}</td>
                          <td className="px-4 py-3 text-[#D4D4D4] max-w-xs truncate">{r.title}</td>
                          <td className="px-4 py-3 text-[#A8A9A9] text-right whitespace-nowrap">{r.vpsPrediction != null ? r.vpsPrediction : '—'}</td>
                          <td className="px-4 py-3 text-[#A8A9A9] text-right whitespace-nowrap">{r.actualViews != null ? r.actualViews.toLocaleString('en-US') : '—'}</td>
                          <td className={cn('px-4 py-3 text-right whitespace-nowrap font-medium', deltaColor)}>{deltaText}</td>
                          <td className="px-4 py-3 text-[#A8A9A9] whitespace-nowrap">{dateText}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'loops' && !error && (
          <ul className="space-y-2">
            {loading && loops.length === 0 && (
              <>
                {Array.from({ length: 3 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </>
            )}
            {!loading && loops.length === 0 && (
              <li className="p-4 bg-[#323434] border border-[#3A3C3C] rounded-xl text-sm text-[#6B6D6D] text-center">
                No open loops.
              </li>
            )}
            {!loading &&
              loops.map((loop) => (
                <li
                  key={loop.id}
                  className="flex items-start gap-3 p-4 bg-[#323434] border border-[#3A3C3C] rounded-xl text-sm text-[#D4D4D4]"
                >
                  <span className="text-[#6C92A0] flex-shrink-0 mt-0.5">•</span>
                  <span className="leading-relaxed flex-1">{loop.description}</span>
                  <button
                    onClick={() => onResolveLoop(loop.id)}
                    className="flex-shrink-0 text-[11px] font-medium tracking-wider px-2.5 py-1 rounded border bg-[#1A2E23] text-[#4A8C6A] border-[#4A8C6A]/30 hover:bg-[#4A8C6A]/15 transition-colors"
                  >
                    RESOLVE
                  </button>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
}
