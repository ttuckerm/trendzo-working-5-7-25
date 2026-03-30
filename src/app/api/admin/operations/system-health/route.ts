import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase-server';
import {
  COMPONENT_REGISTRY,
  DISABLED_COMPONENTS,
  PACK_DEFINITIONS,
  type ComponentDefinition,
} from '@/lib/prediction/system-registry';

// ─── Types ──────────────────────────────────────────────────────────────────
interface ComponentHealth {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'conditional' | 'stub' | 'disabled';
  apiDependency: string | null;
  apiKeyConfigured: boolean | null;
  hasFallback: boolean;
  recentRuns: number;
  successes: number;
  failures: number;
  skipped: number;
  successRate: number | null;
  avgLatencyMs: number | null;
  lastRunAt: string | null;
  lastSuccess: boolean | null;
}

interface PackHealth {
  id: string;
  name: string;
  componentId: string;
  provider: string;
  requiresTranscript: boolean;
  dependsOn: string[];
  recentRuns: number;
  successes: number;
  failures: number;
  successRate: number | null;
  avgLatencyMs: number | null;
  sources: { real: number; mock: number; template: number; unknown: number };
}

interface ApiKeyStatus {
  key: string;
  label: string;
  configured: boolean;
  usedBy: string[];
}

interface SystemHealthResponse {
  components: ComponentHealth[];
  packs: PackHealth[];
  apiKeys: ApiKeyStatus[];
  modelVersion: string;
  totalRecentRuns: number;
  queryWindow: string;
  queriedAt: string;
}

// How many recent prediction runs to analyze
const RECENT_RUNS_LIMIT = 100;

// ─── API Key check ──────────────────────────────────────────────────────────
const API_KEYS_TO_CHECK: { key: string; label: string }[] = [
  { key: 'GOOGLE_GEMINI_AI_API_KEY', label: 'Google Gemini AI' },
  { key: 'GOOGLE_AI_API_KEY', label: 'Google AI (legacy)' },
  { key: 'OPENAI_API_KEY', label: 'OpenAI' },
  { key: 'ANTHROPIC_API_KEY', label: 'Anthropic (Claude)' },
];

function checkApiKey(envVar: string): boolean {
  const val = process.env[envVar];
  return Boolean(val && val.trim().length > 0);
}

// ─── Component status determination ─────────────────────────────────────────
function getComponentStatus(comp: ComponentDefinition): 'active' | 'conditional' | 'stub' | 'disabled' {
  // niche-keywords is always disabled at runtime
  if (comp.id === 'niche-keywords') return 'disabled';
  // If it has an API dependency but no fallback, it's conditional
  if (comp.apiDependency && !comp.hasFallback) return 'conditional';
  // If it has an API dependency WITH fallback, it's active (degrades gracefully)
  if (comp.apiDependency && comp.hasFallback) return 'active';
  return 'active';
}

// ─── GET handler ────────────────────────────────────────────────────────────
export async function GET() {
  try {
    const supabase = getServerSupabase();

    // 1. Fetch recent completed prediction runs
    const { data: recentRuns, error: runsError } = await supabase
      .from('prediction_runs')
      .select('id, created_at, status, latency_ms_total, pack1_meta, pack2_meta')
      .in('status', ['completed', 'failed'])
      .order('created_at', { ascending: false })
      .limit(RECENT_RUNS_LIMIT);

    if (runsError) {
      console.error('[system-health] Failed to fetch prediction_runs:', runsError);
      return NextResponse.json({ error: 'Failed to query prediction runs' }, { status: 500 });
    }

    const runIds = (recentRuns || []).map(r => r.id);

    // 2. Fetch component results for those runs
    let componentResults: Array<{
      run_id: string;
      component_id: string;
      success: boolean;
      skipped: boolean;
      latency_ms: number | null;
      created_at: string;
      features: Record<string, unknown> | null;
    }> = [];

    if (runIds.length > 0) {
      const { data: compData, error: compError } = await supabase
        .from('run_component_results')
        .select('run_id, component_id, success, skipped, latency_ms, created_at, features')
        .in('run_id', runIds);

      if (compError) {
        console.error('[system-health] Failed to fetch component results:', compError);
      } else {
        componentResults = compData || [];
      }
    }

    // 3. Build per-component stats
    const componentStatsMap = new Map<string, {
      runs: number;
      successes: number;
      failures: number;
      skipped: number;
      totalLatency: number;
      latencyCount: number;
      lastRunAt: string | null;
      lastSuccess: boolean | null;
    }>();

    for (const cr of componentResults) {
      let stats = componentStatsMap.get(cr.component_id);
      if (!stats) {
        stats = { runs: 0, successes: 0, failures: 0, skipped: 0, totalLatency: 0, latencyCount: 0, lastRunAt: null, lastSuccess: null };
        componentStatsMap.set(cr.component_id, stats);
      }
      stats.runs++;
      if (cr.skipped) {
        stats.skipped++;
      } else if (cr.success) {
        stats.successes++;
      } else {
        stats.failures++;
      }
      if (cr.latency_ms != null) {
        stats.totalLatency += cr.latency_ms;
        stats.latencyCount++;
      }
      if (!stats.lastRunAt || cr.created_at > stats.lastRunAt) {
        stats.lastRunAt = cr.created_at;
        stats.lastSuccess = cr.success;
      }
    }

    // 4. Build component health list
    const apiKeyConfigCache = new Map<string, boolean>();
    const components: ComponentHealth[] = Object.values(COMPONENT_REGISTRY).map(comp => {
      const stats = componentStatsMap.get(comp.id);
      let apiKeyConfigured: boolean | null = null;
      if (comp.apiDependency) {
        if (!apiKeyConfigCache.has(comp.apiDependency)) {
          apiKeyConfigCache.set(comp.apiDependency, checkApiKey(comp.apiDependency));
        }
        apiKeyConfigured = apiKeyConfigCache.get(comp.apiDependency)!;
      }

      const nonSkippedRuns = stats ? stats.successes + stats.failures : 0;

      return {
        id: comp.id,
        name: comp.name,
        type: comp.type,
        status: getComponentStatus(comp),
        apiDependency: comp.apiDependency || null,
        apiKeyConfigured,
        hasFallback: comp.hasFallback || false,
        recentRuns: stats?.runs || 0,
        successes: stats?.successes || 0,
        failures: stats?.failures || 0,
        skipped: stats?.skipped || 0,
        successRate: nonSkippedRuns > 0 ? Math.round((stats!.successes / nonSkippedRuns) * 100) : null,
        avgLatencyMs: stats && stats.latencyCount > 0 ? Math.round(stats.totalLatency / stats.latencyCount) : null,
        lastRunAt: stats?.lastRunAt || null,
        lastSuccess: stats?.lastSuccess ?? null,
      };
    });

    // 5. Build pack health
    // For pack meta sources, query from the raw pack meta on prediction_runs
    const packComponentIds = PACK_DEFINITIONS.map(p => p.componentId);
    const packResultsMap = new Map<string, typeof componentResults>();
    for (const cr of componentResults) {
      if (packComponentIds.includes(cr.component_id)) {
        if (!packResultsMap.has(cr.component_id)) {
          packResultsMap.set(cr.component_id, []);
        }
        packResultsMap.get(cr.component_id)!.push(cr);
      }
    }

    const packs: PackHealth[] = PACK_DEFINITIONS.map(pack => {
      const results = packResultsMap.get(pack.componentId) || [];
      const successes = results.filter(r => r.success && !r.skipped).length;
      const failures = results.filter(r => !r.success && !r.skipped).length;
      const nonSkipped = successes + failures;
      const totalLatency = results.reduce((sum, r) => sum + (r.latency_ms || 0), 0);
      const latencyCount = results.filter(r => r.latency_ms != null).length;

      // Determine source from features._meta.source if available
      const sources = { real: 0, mock: 0, template: 0, unknown: 0 };
      for (const r of results) {
        if (!r.success) continue;
        const meta = (r.features as Record<string, unknown>)?._meta as Record<string, unknown> | undefined;
        const source = (meta?.source as string) || '';
        if (source === 'real' || source === 'llm' || source === 'gemini' || source === 'google-ai') {
          sources.real++;
        } else if (source === 'mock' || source === 'heuristic') {
          sources.mock++;
        } else if (source === 'template') {
          sources.template++;
        } else if (r.success) {
          sources.unknown++;
        }
      }

      return {
        id: pack.id,
        name: pack.name,
        componentId: pack.componentId,
        provider: pack.provider,
        requiresTranscript: pack.requiresTranscript,
        dependsOn: pack.dependsOn || [],
        recentRuns: results.length,
        successes,
        failures,
        successRate: nonSkipped > 0 ? Math.round((successes / nonSkipped) * 100) : null,
        avgLatencyMs: latencyCount > 0 ? Math.round(totalLatency / latencyCount) : null,
        sources,
      };
    });

    // 6. API key status
    // Build reverse map: which components use which key
    const keyUsageMap = new Map<string, string[]>();
    for (const comp of Object.values(COMPONENT_REGISTRY)) {
      if (comp.apiDependency) {
        if (!keyUsageMap.has(comp.apiDependency)) {
          keyUsageMap.set(comp.apiDependency, []);
        }
        keyUsageMap.get(comp.apiDependency)!.push(comp.name);
      }
    }

    const apiKeys: ApiKeyStatus[] = API_KEYS_TO_CHECK.map(ak => ({
      key: ak.key,
      label: ak.label,
      configured: checkApiKey(ak.key),
      usedBy: keyUsageMap.get(ak.key) || [],
    }));

    // 7. Model version
    const modelVersion = process.env.MODEL_VERSION || 'v5-heuristic';

    // 8. Query window description
    const oldestRun = recentRuns && recentRuns.length > 0
      ? recentRuns[recentRuns.length - 1].created_at
      : null;

    const response: SystemHealthResponse = {
      components,
      packs,
      apiKeys,
      modelVersion,
      totalRecentRuns: recentRuns?.length || 0,
      queryWindow: oldestRun
        ? `Last ${recentRuns!.length} runs (since ${new Date(oldestRun).toLocaleDateString()})`
        : 'No prediction runs found',
      queriedAt: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error('[system-health] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
