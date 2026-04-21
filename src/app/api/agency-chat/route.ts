import { streamText, convertToModelMessages, tool, stepCountIs } from 'ai';
import { z } from 'zod';
import { createUIMessageStream, createUIMessageStreamResponse } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { pipeJsonRender } from '@json-render/core';
import { trendzoCatalog } from '@/lib/trendzo-catalog';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getUserAgencyId, getAgencyCreators } from '@/lib/auth/agency-utils';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env';
import { generateProactiveAlerts } from '@/lib/notifications/proactive-engine';
import { assembleContext } from '@/lib/context/assemble-context';
import { classifyIntent } from '@/lib/clay';

export const runtime = 'nodejs';

const ACTION_RESULT_MARKER = '[__TRENDZO_ACTION_RESULT__]';
const TRIAGE_MARKER = '[__TRENDZO_TRIAGE__]';

type ActionResultConfirmation =
  | {
      kind: 'brief_status';
      briefId: string;
      briefTitle: string;
      creator: string;
      previousStatus: string;
      newStatus: string;
      publishedUrl?: string;
      at: string;
    }
  | {
      kind: 'performance';
      briefId: string;
      briefTitle: string;
      creator: string;
      vpsPrediction: number | null;
      actualViews: number | null;
      actualEngagementRate: number | null;
      performanceDelta: number | null;
      at: string;
    };

function getLastUserText(messages: any[]): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m?.role !== 'user') continue;
    if (typeof m.content === 'string') return m.content;
    const parts = Array.isArray(m.parts) ? m.parts : [];
    const text = parts
      .filter((p: any) => p?.type === 'text' && typeof p.text === 'string')
      .map((p: any) => p.text)
      .join('');
    return text || null;
  }
  return null;
}

function escSpecString(v: unknown): string {
  return JSON.stringify(v == null ? '' : String(v));
}

function formatShortDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    });
  } catch { return iso; }
}

function formatWithCommas(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return Math.round(n).toLocaleString('en-US');
}

function formatSignedDelta(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return 'No prediction on record';
  const rounded = Math.round(n);
  return rounded >= 0 ? `+${rounded.toLocaleString('en-US')}` : rounded.toLocaleString('en-US');
}

function buildBriefStatusSpec(c: Extract<ActionResultConfirmation, { kind: 'brief_status' }>): string {
  const lines: string[] = [];
  lines.push(`{"op":"add","path":"/root","value":"bsc-1"}`);
  lines.push(`{"op":"add","path":"/elements/bsc-1","value":{"type":"Section","props":{"title":"Status updated","accent":"#4A8C6A"},"children":["bsc-kpi-1","bsc-kpi-2","bsc-kpi-3"]}}`);
  lines.push(`{"op":"add","path":"/elements/bsc-kpi-1","value":{"type":"KPICard","props":{"label":"Brief","value":${escSpecString(c.briefTitle)},"subtitle":${escSpecString(c.creator)}},"children":[]}}`);
  lines.push(`{"op":"add","path":"/elements/bsc-kpi-2","value":{"type":"KPICard","props":{"label":"Transition","value":${escSpecString(`${c.previousStatus} → ${c.newStatus}`)},"accent":"#4A8C6A"},"children":[]}}`);
  lines.push(`{"op":"add","path":"/elements/bsc-kpi-3","value":{"type":"KPICard","props":{"label":"At","value":${escSpecString(formatShortDateTime(c.at))}},"children":[]}}`);
  if (c.publishedUrl) {
    lines.push(`{"op":"add","path":"/elements/bsc-1/children/-","value":"bsc-kpi-4"}`);
    lines.push(`{"op":"add","path":"/elements/bsc-kpi-4","value":{"type":"KPICard","props":{"label":"URL","value":${escSpecString(c.publishedUrl)}},"children":[]}}`);
  }
  return lines.join('\n');
}

function buildPerformanceSpec(c: Extract<ActionResultConfirmation, { kind: 'performance' }>): string {
  const deltaAccent = c.performanceDelta == null
    ? '#6B6D6D'
    : c.performanceDelta >= 0 ? '#4A8C6A' : '#C07B74';
  const lines: string[] = [];
  lines.push(`{"op":"add","path":"/root","value":"perf-1"}`);
  lines.push(`{"op":"add","path":"/elements/perf-1","value":{"type":"Section","props":{"title":"Performance logged"},"children":["perf-grid"]}}`);
  lines.push(`{"op":"add","path":"/elements/perf-grid","value":{"type":"Grid","props":{"columns":3},"children":["perf-k1","perf-k2","perf-k3","perf-k4"]}}`);
  lines.push(`{"op":"add","path":"/elements/perf-k1","value":{"type":"KPICard","props":{"label":"Brief","value":${escSpecString(c.briefTitle)},"subtitle":${escSpecString(c.creator)}},"children":[]}}`);
  lines.push(`{"op":"add","path":"/elements/perf-k2","value":{"type":"KPICard","props":{"label":"VPS Predicted","value":${escSpecString(c.vpsPrediction == null ? '—' : String(Math.round(c.vpsPrediction)))}},"children":[]}}`);
  lines.push(`{"op":"add","path":"/elements/perf-k3","value":{"type":"KPICard","props":{"label":"Actual Views","value":${escSpecString(formatWithCommas(c.actualViews))}},"children":[]}}`);
  lines.push(`{"op":"add","path":"/elements/perf-k4","value":{"type":"KPICard","props":{"label":"Delta","value":${escSpecString(formatSignedDelta(c.performanceDelta))},"accent":"${deltaAccent}"},"children":[]}}`);
  return lines.join('\n');
}

function buildFallbackSpec(): string {
  const lines: string[] = [];
  lines.push(`{"op":"add","path":"/root","value":"ack-1"}`);
  lines.push(`{"op":"add","path":"/elements/ack-1","value":{"type":"Section","props":{"title":"Action completed"},"children":["ack-t-1"]}}`);
  lines.push(`{"op":"add","path":"/elements/ack-t-1","value":{"type":"Text","props":{"content":"Done."},"children":[]}}`);
  return lines.join('\n');
}

/**
 * Phase 1 Turn 4: Build a deterministic morning brief spec from pre-computed
 * triage items (agency_triage table). Each item becomes a KPICard inside a
 * Section titled "Good morning. Here's what needs you."
 *
 * Urgency → accent color map:
 *   8-10 → status-error (#C07B74 coral)
 *   5-7  → status-warning (#9A7A3A amber)
 *   1-4  → status-success (#4A8C6A green) — low urgency / informational
 */
/**
 * Map a triage item's suggested_actions to a primary/secondary button spec.
 * Phase 2A: each card has at most 2 visible actions; rest are accessible via
 * deep-dive. Order of preference per item type:
 *   overdue_brief         → Nudge (primary), Mark in production (secondary)
 *   trend_opportunity     → Generate brief (primary), View matches (secondary)
 *   performance_highlight → Generate similar (primary), View deep-dive (secondary)
 */
function actionsForTriageItem(item: any): {
  primary?: { label: string; actionType: string; payload: Record<string, unknown> };
  secondary?: { label: string; actionType: string; payload: Record<string, unknown> };
} {
  const briefId = item?.data?.brief_id;
  const eventId = item?.data?.event_id;
  const creatorId = item?.creator_id;

  switch (item.type) {
    case 'overdue_brief':
      return {
        primary: briefId
          ? { label: 'Nudge', actionType: 'nudge_creator', payload: { briefId, creatorId } }
          : undefined,
        secondary: briefId
          ? { label: 'Check delivery', actionType: 'check_push_status', payload: { briefId } }
          : undefined,
      };
    case 'trend_opportunity':
      return {
        primary: eventId
          ? { label: 'Generate brief', actionType: 'generate_brief', payload: { eventId } }
          : undefined,
        secondary: eventId
          ? { label: 'Match creators', actionType: 'match_creators_to_event', payload: { eventId } }
          : undefined,
      };
    case 'performance_highlight':
      return {
        primary: creatorId
          ? { label: 'Generate similar', actionType: 'generate_brief', payload: { creatorName: item.creator_name } }
          : undefined,
        secondary: creatorId
          ? { label: 'Deep dive', actionType: 'analyze_creator', payload: { creatorName: item.creator_name } }
          : undefined,
      };
    default:
      return {};
  }
}

function buildTriageSpec(payload: { stale?: boolean; triage_date?: string | null; items: any[] }): string {
  const lines: string[] = [];
  const rootId = 'mb-1';
  const items = Array.isArray(payload.items) ? payload.items : [];

  lines.push(`{"op":"add","path":"/root","value":"${rootId}"}`);

  const title = items.length === 0
    ? 'All quiet on the roster.'
    : `Good morning. ${items.length} thing${items.length === 1 ? '' : 's'} need${items.length === 1 ? 's' : ''} you.`;
  const subtitle = payload.stale
    ? `Stale: briefing from ${payload.triage_date || 'an earlier day'}. [Re-run to refresh]`
    : items.length === 0
      ? 'Nothing needs you right now. Pulse below.'
      : undefined;
  const headerProps: string[] = [`"title":${escSpecString(title)}`];
  if (subtitle) headerProps.push(`"subtitle":${escSpecString(subtitle)}`);
  if (!payload.stale && items.length > 0) headerProps.push(`"accent":"#6C92A0"`);
  if (payload.stale) headerProps.push(`"accent":"#9A7A3A"`);
  if (items.length > 1) headerProps.push(`"layout":"grid"`);

  const cardIds = items.map((_, i) => `mb-card-${i + 1}`);
  lines.push(
    `{"op":"add","path":"/elements/${rootId}","value":{"type":"Section","props":{${headerProps.join(',')}},"children":${JSON.stringify(cardIds)}}}`,
  );

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const urgency = Number(item.urgency) || 0;
    const bottomAccent = urgency >= 8 ? '#C07B74' : urgency >= 5 ? '#9A7A3A' : '#4A8C6A';
    const typeLabel =
      item.type === 'overdue_brief' ? 'OVERDUE'
      : item.type === 'trend_opportunity' ? 'TREND'
      : item.type === 'performance_highlight' ? 'WIN'
      : String(item.type || '').replace(/_/g, ' ').toUpperCase();

    const creatorName = String(item.creator_name || 'Unknown');
    const avatarInitial = (creatorName.trim()[0] || '?').toUpperCase();

    // Status text under creator name — short, action-relevant
    const statusText = (() => {
      if (item.type === 'overdue_brief') {
        const days = item?.data?.days_overdue;
        return days ? `${days} day${days === 1 ? '' : 's'} overdue` : 'overdue';
      }
      if (item.type === 'trend_opportunity') {
        const hrs = item?.data?.hours_left;
        return typeof hrs === 'number' ? `closes in ${Math.ceil(hrs)}h` : 'trend opportunity';
      }
      if (item.type === 'performance_highlight') {
        const pct = item?.data?.pct_delta;
        return typeof pct === 'number' ? `+${Math.round(pct)}% vs prediction` : 'performance win';
      }
      return '';
    })();

    // Context block — the headline that was previously the KPICard's value
    const briefTitleMatch = String(item.summary || '').match(/"([^"]+)"/);
    const context = briefTitleMatch ? briefTitleMatch[1] : item.summary;
    const contextDetail = (() => {
      if (item.type === 'overdue_brief') {
        return item?.data?.opened ? 'Opened by creator, no response' : 'No open signal yet';
      }
      if (item.type === 'trend_opportunity') {
        return item?.data?.matched_creator
          ? `Matched: ${item.data.matched_creator.name}`
          : 'No creator matched yet';
      }
      return undefined;
    })();

    const bottomLabel = (() => {
      if (item.type === 'overdue_brief') {
        return item?.data?.opened ? 'OPENED · NO REPLY' : 'DELIVERED · NO OPEN SIGNAL';
      }
      if (item.type === 'trend_opportunity') return `URGENCY ${urgency}/10`;
      if (item.type === 'performance_highlight') return 'POSITIVE SURPRISE';
      return undefined;
    })();

    const { primary, secondary } = actionsForTriageItem(item);

    const cardProps: Record<string, unknown> = {
      metaLeft: typeLabel,
      metaRight: `urgency ${urgency}/10`,
      avatarInitial,
      creatorName,
      statusText,
      statusDotColor: bottomAccent,
      context,
      contextDetail,
      bottomLabel,
      bottomAccent,
    };
    if (primary) cardProps.primaryAction = primary;
    if (secondary) cardProps.secondaryAction = secondary;

    lines.push(
      `{"op":"add","path":"/elements/${cardIds[i]}","value":{"type":"ActionDecisionCard","props":${JSON.stringify(cardProps)},"children":[]}}`,
    );
  }

  if (items.length === 0) {
    const emptyId = 'mb-empty-1';
    lines.push(`{"op":"add","path":"/elements/${rootId}/children/-","value":"${emptyId}"}`);
    lines.push(`{"op":"add","path":"/elements/${emptyId}","value":{"type":"Text","props":{"content":"No overdue briefs, no trend windows closing soon, no surprises overnight. Come back tomorrow."},"children":[]}}`);
  }

  return lines.join('\n');
}

function tryBuildTriageStream(messages: any[]): ReadableStream<any> | null {
  const text = getLastUserText(messages);
  if (!text || !text.startsWith(TRIAGE_MARKER)) return null;

  let payload: { stale?: boolean; triage_date?: string | null; items: any[] } = { items: [] };
  try {
    const json = text.slice(TRIAGE_MARKER.length).trim();
    payload = JSON.parse(json);
  } catch {
    payload = { items: [] };
  }

  const specBody = buildTriageSpec(payload);
  const responseText = '```spec\n' + specBody + '\n```';
  const textId = (globalThis.crypto?.randomUUID?.() ?? `tri-${Date.now()}`);
  const messageId = (globalThis.crypto?.randomUUID?.() ?? `trim-${Date.now()}`);

  const synthetic = new ReadableStream<any>({
    start(controller) {
      controller.enqueue({ type: 'start', messageId });
      controller.enqueue({ type: 'text-start', id: textId });
      controller.enqueue({ type: 'text-delta', id: textId, delta: responseText });
      controller.enqueue({ type: 'text-end', id: textId });
      controller.enqueue({ type: 'finish' });
      controller.close();
    },
  });

  return createUIMessageStream({
    execute: async ({ writer }) => {
      writer.merge(pipeJsonRender(synthetic));
    },
    onError: (error) => (error instanceof Error ? error.message : String(error)),
  });
}

function tryBuildActionResultStream(messages: any[]): ReadableStream<any> | null {
  const text = getLastUserText(messages);
  if (!text || !text.startsWith(ACTION_RESULT_MARKER)) return null;

  let payload: ActionResultConfirmation | null = null;
  try {
    const json = text.slice(ACTION_RESULT_MARKER.length).trim();
    payload = JSON.parse(json) as ActionResultConfirmation;
  } catch {
    payload = null;
  }

  let specBody: string;
  if (payload?.kind === 'brief_status') {
    specBody = buildBriefStatusSpec(payload);
  } else if (payload?.kind === 'performance') {
    specBody = buildPerformanceSpec(payload);
  } else {
    specBody = buildFallbackSpec();
  }

  const responseText = '```spec\n' + specBody + '\n```';
  const textId = (globalThis.crypto?.randomUUID?.() ?? `sc-${Date.now()}`);
  const messageId = (globalThis.crypto?.randomUUID?.() ?? `scm-${Date.now()}`);

  const synthetic = new ReadableStream<any>({
    start(controller) {
      controller.enqueue({ type: 'start', messageId });
      controller.enqueue({ type: 'text-start', id: textId });
      controller.enqueue({ type: 'text-delta', id: textId, delta: responseText });
      controller.enqueue({ type: 'text-end', id: textId });
      controller.enqueue({ type: 'finish' });
      controller.close();
    },
  });

  return createUIMessageStream({
    execute: async ({ writer }) => {
      writer.merge(pipeJsonRender(synthetic));
    },
    onError: (error) => (error instanceof Error ? error.message : String(error)),
  });
}


export async function POST(req: Request) {
  try {
  const { messages } = await req.json();

  // Authenticate user
  let userId: string;
  if (process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true') {
    userId = 'dev-user';
    console.log('[agency-chat] Auth disabled, using dev user');
  } else {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    console.log('[agency-chat] Auth result:', { userId: user?.id, authError: authError?.message });

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized', detail: authError?.message }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    userId = user.id;
  }

  // ── ACTION_RESULT short-circuit ──────────────────────────────────────
  // When the client injects a hidden user message starting with
  // [__TRENDZO_ACTION_RESULT__], bypass the model entirely and stream a
  // deterministic JSONL spec. Prevents the model from ignoring the
  // priority-override rule and re-rendering a morning briefing.
  const shortCircuit = tryBuildActionResultStream(messages);
  if (shortCircuit) {
    return createUIMessageStreamResponse({ stream: shortCircuit });
  }

  // ── TRIAGE short-circuit (Phase 1 Turn 4) ────────────────────────────
  // When the client injects a hidden user message starting with
  // [__TRENDZO_TRIAGE__], bypass the model and stream a deterministic
  // morning-brief spec built from agency_triage. Replaces the GPT
  // cold-start that fireAutoGreeting used to send.
  const triageShortCircuit = tryBuildTriageStream(messages);
  if (triageShortCircuit) {
    return createUIMessageStreamResponse({ stream: triageShortCircuit });
  }

  // Get agency scope (gracefully handle no agency — serve with empty data)
  const agencyId = await getUserAgencyId(userId);
  console.log('[agency-chat] Agency lookup:', { userId, agencyId });

  let profiles: any[] = [];
  let scripts: any[] = [];
  let briefs: any[] = [];
  let creatorDeepDiveData: any[] = [];
  let onboardingDetails: any[] = [];
  let invitations: any[] = [];
  let culturalEvents: any[] = [];
  let contentBriefs: any[] = [];
  let briefAssignments: any[] = [];
  let predictionRuns: any[] = [];
  let pendingBriefs: any[] = [];

  if (agencyId) {
    const creatorIds = await getAgencyCreators(agencyId);
    const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const safeCreatorIds = creatorIds.length > 0 ? creatorIds : [''];

    // ── MEGA PARALLEL BATCH: fire ALL independent queries at once ──────
    const safeQuery = async <T>(fn: () => Promise<{ data: T | null; error: any }>): Promise<T | null> => {
      try { const r = await fn(); return r.data; } catch { return null; }
    };

    const [
      profilesData, briefsByUserData, obFullData,
      inviteData, eventData, altEventData,
      contentBriefData, pgBriefsData, predRunsData, cohortData
    ] = await Promise.all([
      safeQuery(() => serviceClient.from('onboarding_profiles')
        .select('id, user_id, business_name, niche_key, selected_niche, creator_stage, onboarding_step')
        .in('user_id', safeCreatorIds)),
      safeQuery(() => serviceClient.from('content_briefs')
        .select('id, user_id, status')
        .in('user_id', safeCreatorIds)),
      safeQuery(() => serviceClient.from('onboarding_profiles')
        .select('*').in('user_id', safeCreatorIds).order('created_at', { ascending: false })),
      safeQuery(() => serviceClient.from('agency_invitations')
        .select('*').eq('agency_id', agencyId).order('created_at', { ascending: false })),
      safeQuery(() => serviceClient.from('cultural_events')
        .select('*').eq('agency_id', agencyId).order('event_date', { ascending: true })),
      safeQuery(() => serviceClient.from('agency_events')
        .select('*').eq('agency_id', agencyId).order('event_date', { ascending: true })),
      safeQuery(() => serviceClient.from('content_briefs')
        .select('*').eq('agency_id', agencyId).order('created_at', { ascending: false }).limit(50)),
      safeQuery(() => serviceClient.from('pre_generated_briefs')
        .select('id, client_id, brief_content, vps_score, priority_type, status, niche, cultural_event_id, final_critic_score')
        .eq('agency_id', agencyId).in('status', ['draft', 'presented']).order('vps_score', { ascending: false }).limit(20)),
      safeQuery(() => serviceClient.from('prediction_runs_enriched')
        .select('*').in('creator_id', safeCreatorIds).order('created_at', { ascending: false }).limit(200)),
      safeQuery(() => serviceClient.from('dps_v2_cohort_stats').select('*')),
    ]);


    profiles = (profilesData as any[]) || [];
    briefs = (briefsByUserData as any[]) || [];
    onboardingDetails = (obFullData as any[]) || [];
    invitations = (inviteData as any[]) || [];
    culturalEvents = (eventData as any[]) || [];
    if (culturalEvents.length === 0) culturalEvents = (altEventData as any[]) || [];
    contentBriefs = (contentBriefData as any[]) || [];
    predictionRuns = (predRunsData as any[]) || [];
    let cohortStats: any[] = (cohortData as any[]) || [];

    // Scripts query depends on profile IDs (second wave)
    const profileIds = profiles.map((p: any) => p.id);
    const pgBriefs = (pgBriefsData as any[]) || [];

    const [scriptsResult, pgProfilesResult, pgVariantsResult, assignResult] = await Promise.all([
      safeQuery(() => serviceClient.from('generated_scripts')
        .select('id, script_text, vps_score, status, created_at, onboarding_profile_id, niche_key, user_id')
        .in('onboarding_profile_id', profileIds.length > 0 ? profileIds : [''])
        .order('created_at', { ascending: false }).limit(50)),
      pgBriefs.length > 0
        ? safeQuery(() => serviceClient.from('onboarding_profiles')
            .select('user_id, business_name')
            .in('user_id', [...new Set(pgBriefs.map((b: any) => b.client_id))]))
        : Promise.resolve(null),
      pgBriefs.length > 0
        ? safeQuery(() => serviceClient.from('brief_variants')
            .select('brief_id, variant_label, vps_score')
            .in('brief_id', pgBriefs.map((b: any) => b.id)))
        : Promise.resolve(null),
      safeQuery(() => serviceClient.from('brief_assignments')
        .select('*')
        .in('brief_id', (contentBriefs || []).map((b: any) => b.id).filter(Boolean))),
    ]);


    scripts = (scriptsResult as any[]) || [];
    briefAssignments = (assignResult as any[]) || [];

    // Enrich pending briefs with names + variants
    if (pgBriefs.length > 0) {
      const pgNameMap = new Map(((pgProfilesResult as any[]) || []).map((p: any) => [p.user_id, p.business_name || 'Unknown']));
      const variantCounts: Record<number, number> = {};
      for (const v of ((pgVariantsResult as any[]) || [])) {
        variantCounts[v.brief_id] = (variantCounts[v.brief_id] || 0) + 1;
      }
      pendingBriefs = pgBriefs.map((b: any) => ({
        id: b.id,
        creator_name: pgNameMap.get(b.client_id) || 'Unknown',
        title: b.brief_content?.title || 'Untitled',
        hook: b.brief_content?.hook || '',
        angle: b.brief_content?.angle || '',
        format: b.brief_content?.format || '',
        vps_score: b.vps_score,
        priority_type: b.priority_type,
        niche: b.niche,
        critic_score: b.final_critic_score,
        variant_count: variantCounts[b.id] || 1,
      }));
    }

    // Build per-creator deep-dive summaries
    creatorDeepDiveData = profiles.map((creator: any) => {
      const creatorPredictions = predictionRuns.filter((p: any) => p.creator_id === creator.user_id);
      const creatorScripts = scripts.filter((s: any) => s.onboarding_profile_id === creator.id);
      const nichePeers = profiles.filter((p: any) => (p.selected_niche || p.niche_key) === (creator.selected_niche || creator.niche_key));
      const nicheStats = cohortStats.find((c: any) => c.niche === (creator.selected_niche || creator.niche_key));

      const avgViews = creatorPredictions.length > 0
        ? Math.round(creatorPredictions.reduce((sum: number, p: any) => sum + (p.view_count || 0), 0) / creatorPredictions.length)
        : 0;
      const avgDps = creatorPredictions.length > 0
        ? Math.round(creatorPredictions.reduce((sum: number, p: any) => sum + (p.dps_score || p.composite_score || 0), 0) / creatorPredictions.length * 10) / 10
        : null;
      const topDps = creatorPredictions.length > 0
        ? Math.max(...creatorPredictions.map((p: any) => p.dps_score || p.composite_score || 0))
        : null;

      const vpsHistory = creatorScripts
        .filter((s: any) => s.vps_score != null)
        .map((s: any) => ({ date: s.created_at, score: s.vps_score, label: s.script_text?.slice(0, 30) || s.id }))
        .slice(0, 20);

      const nichePeerScores = nichePeers
        .map((p: any) => {
          const pScripts = scripts.filter((s: any) => s.onboarding_profile_id === p.id);
          const latestVps = pScripts.length > 0 ? pScripts[0].vps_score : null;
          return { id: p.id, name: p.business_name, vps: latestVps };
        })
        .filter((p: any) => p.vps != null)
        .sort((a: any, b: any) => (b.vps || 0) - (a.vps || 0));

      const rank = nichePeerScores.findIndex((p: any) => p.id === creator.id) + 1;
      const nicheAvgVps = nichePeerScores.length > 0
        ? Math.round(nichePeerScores.reduce((sum: number, p: any) => sum + (p.vps || 0), 0) / nichePeerScores.length)
        : null;

      const contentEntries = creatorPredictions.slice(0, 25).map((p: any) => ({
        title: p.video_title || p.tiktok_url || 'Untitled',
        dps_score: p.dps_score || p.composite_score || null,
        views: p.view_count || 0,
        shares: p.share_count || null,
        saves: p.save_count || null,
        comments: p.comment_count || null,
        posted_date: p.video_posted_at || p.created_at,
        url: p.tiktok_url || null,
      }));

      const engagementMetrics: any[] = [];
      if (creatorPredictions.length > 0) {
        const avgShareRate = creatorPredictions.reduce((sum: number, p: any) => sum + (p.share_rate || 0), 0) / creatorPredictions.length;
        const avgSaveRate = creatorPredictions.reduce((sum: number, p: any) => sum + (p.save_rate || 0), 0) / creatorPredictions.length;
        const avgCommentRate = creatorPredictions.reduce((sum: number, p: any) => sum + (p.comment_rate || 0), 0) / creatorPredictions.length;
        const avgVtfRatio = creatorPredictions.reduce((sum: number, p: any) => sum + (p.view_to_follower_ratio || 0), 0) / creatorPredictions.length;

        engagementMetrics.push(
          { metric_name: 'Share Rate', creator_value: Math.round(avgShareRate * 10000) / 100, niche_avg: nicheStats?.avg_share_rate ? Math.round(nicheStats.avg_share_rate * 10000) / 100 : 0, unit: 'percent' },
          { metric_name: 'Save Rate', creator_value: Math.round(avgSaveRate * 10000) / 100, niche_avg: nicheStats?.avg_save_rate ? Math.round(nicheStats.avg_save_rate * 10000) / 100 : 0, unit: 'percent' },
          { metric_name: 'Comment Rate', creator_value: Math.round(avgCommentRate * 10000) / 100, niche_avg: nicheStats?.avg_comment_rate ? Math.round(nicheStats.avg_comment_rate * 10000) / 100 : 0, unit: 'percent' },
          { metric_name: 'View/Follower Ratio', creator_value: Math.round(avgVtfRatio * 100) / 100, niche_avg: nicheStats?.avg_view_to_follower_ratio ? Math.round(nicheStats.avg_view_to_follower_ratio * 100) / 100 : 0, unit: 'ratio' },
        );
      }

      return {
        id: creator.id,
        name: creator.business_name || 'Unknown',
        handle: creator.tiktok_handle || `@${(creator.business_name || 'unknown').toLowerCase().replace(/\s/g, '')}`,
        niche: creator.selected_niche || creator.niche_key || 'unknown',
        follower_count: creator.follower_count || creator.actual_follower_count || 0,
        current_vps: creatorScripts[0]?.vps_score || null,
        status: toCardStatus(creator.creator_stage, creator.onboarding_step),
        bio: creator.bio || null,
        join_date: creator.created_at,
        total_videos: creatorPredictions.length,
        avg_dps: avgDps,
        top_dps: topDps,
        vps_history: vpsHistory,
        niche_ranking: {
          rank: rank || null,
          total_in_niche: nichePeerScores.length,
          percentile: nichePeerScores.length > 0 && rank > 0 ? Math.round((1 - (rank - 1) / nichePeerScores.length) * 100) : null,
          niche_avg_vps: nicheAvgVps,
          top_vps: nichePeerScores[0]?.vps || null,
          bottom_vps: nichePeerScores[nichePeerScores.length - 1]?.vps || null,
        },
        content: contentEntries,
        engagement: engagementMetrics,
      };
    });
  } else {
    console.warn('[agency-chat] No agency found for user, serving with empty data');
  }

  // ── Onboarding pipeline data construction ────────────────────────────

  const PIPELINE_STAGES = [
    { stage_name: 'Invited', stage_key: 'invited', color: '#7c3aed' },
    { stage_name: 'Profile Setup', stage_key: 'profile_setup', color: '#00d4ff' },
    { stage_name: 'Calibrating', stage_key: 'calibrating', color: '#f59e0b' },
    { stage_name: 'Ready', stage_key: 'ready', color: '#2dd4a8' },
    { stage_name: 'Active', stage_key: 'active', color: '#2dd4a8' },
  ];

  function determineStage(profile: any): string {
    if (profile.activated_at || profile.status === 'active') return 'active';
    if (profile.calibration_completed_at || profile.calibration_status === 'completed') return 'ready';
    if (profile.calibration_started_at || profile.calibration_status === 'in_progress' || profile.onboarding_step === 'calibration') return 'calibrating';
    if (profile.profile_completed_at || profile.onboarding_step === 'profile' || profile.accepted_at) return 'profile_setup';
    if (profile.invited_at || profile.status === 'invited' || profile.status === 'pending') return 'invited';
    return 'profile_setup';
  }

  function daysSince(dateStr: string | null | undefined): number | null {
    if (!dateStr) return null;
    const diff = Date.now() - new Date(dateStr).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  const onboardingProfiles = onboardingDetails ?? [];

  const pipelineData = PIPELINE_STAGES.map(stage => ({
    ...stage,
    creators: onboardingProfiles
      .filter((p: any) => determineStage(p) === stage.stage_key)
      .map((p: any) => ({
        name: p.business_name || p.creator_name || 'Unknown',
        handle: p.tiktok_handle || null,
        niche: p.selected_niche || p.niche_key || null,
        days_in_stage: daysSince(p.updated_at || p.created_at),
        avatar_initials: (p.business_name || p.creator_name || 'U').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase(),
      })),
  }));

  const totalOnboarding = onboardingProfiles.length;
  const activeCreators = onboardingProfiles.filter((p: any) => determineStage(p) === 'active').length;
  const droppedCreators = onboardingProfiles.filter((p: any) => p.status === 'dropped' || p.status === 'inactive').length;
  const currentlyOnboarding = totalOnboarding - activeCreators - droppedCreators;
  const completionRate = totalOnboarding > 0 ? Math.round((activeCreators / totalOnboarding) * 100) : 0;

  const onboardingStatsData = {
    total_invited: totalOnboarding,
    currently_onboarding: currentlyOnboarding,
    completed: activeCreators,
    dropped_off: droppedCreators,
    completion_rate: completionRate,
    avg_days_to_complete: null as number | null,
  };

  const completedCreatorProfiles = onboardingProfiles.filter((p: any) => p.activated_at && p.created_at);
  if (completedCreatorProfiles.length > 0) {
    const totalDays = completedCreatorProfiles.reduce((sum: number, p: any) => {
      return sum + (new Date(p.activated_at).getTime() - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24);
    }, 0);
    onboardingStatsData.avg_days_to_complete = Math.round(totalDays / completedCreatorProfiles.length);
  }

  // Per-creator calibration data
  const calibrationData = onboardingProfiles.map((p: any) => {
    const steps: Array<{ step_name: string; status: 'completed' | 'in_progress' | 'not_started'; completed_at: string | null }> = [
      { step_name: 'Profile Basics', status: 'not_started', completed_at: null },
      { step_name: 'Video Reactions', status: 'not_started', completed_at: null },
      { step_name: 'Niche Preferences', status: 'not_started', completed_at: null },
      { step_name: 'Content Style', status: 'not_started', completed_at: null },
      { step_name: 'Posting Schedule', status: 'not_started', completed_at: null },
    ];

    const progress = p.calibration_progress || p.onboarding_progress || null;
    let completionPercent = 0;

    if (typeof progress === 'number') {
      completionPercent = progress;
      const stepsCompleted = Math.floor((progress / 100) * steps.length);
      steps.forEach((step, i) => {
        if (i < stepsCompleted) step.status = 'completed';
        else if (i === stepsCompleted && progress > 0) step.status = 'in_progress';
      });
    } else if (progress && typeof progress === 'object') {
      Object.entries(progress).forEach(([key, val]: [string, any]) => {
        const matchingStep = steps.find(s => s.step_name.toLowerCase().includes(key.toLowerCase()));
        if (matchingStep && val) {
          matchingStep.status = val === true || val === 'completed' ? 'completed' : 'in_progress';
          if (val === true || val === 'completed') matchingStep.completed_at = p.updated_at;
        }
      });
      const completedSteps = steps.filter(s => s.status === 'completed').length;
      completionPercent = Math.round((completedSteps / steps.length) * 100);
    } else {
      const stage = determineStage(p);
      if (stage === 'active' || stage === 'ready') {
        completionPercent = 100;
        steps.forEach(s => { s.status = 'completed'; });
      } else if (stage === 'calibrating') {
        completionPercent = 40;
        steps[0].status = 'completed';
        steps[1].status = 'in_progress';
      } else if (stage === 'profile_setup') {
        completionPercent = 10;
        steps[0].status = 'in_progress';
      }
    }

    return {
      creator_name: p.business_name || p.creator_name || 'Unknown',
      handle: p.tiktok_handle || null,
      completion_percent: completionPercent,
      steps,
      started_at: p.created_at,
      last_activity: p.updated_at,
      stage: determineStage(p),
    };
  });

  // Per-creator onboarding timeline events
  const onboardingTimelineData = onboardingProfiles.map((p: any) => {
    const events: Array<{ event_type: string; description: string; timestamp: string; metadata?: string }> = [];

    if (p.created_at || p.invited_at) {
      events.push({ event_type: 'invited', description: 'Invited to join agency', timestamp: p.invited_at || p.created_at });
    }
    if (p.accepted_at) {
      events.push({ event_type: 'accepted', description: 'Accepted invitation', timestamp: p.accepted_at });
    }
    if (p.profile_completed_at) {
      events.push({ event_type: 'profile_completed', description: 'Completed profile setup', timestamp: p.profile_completed_at });
    }
    if (p.calibration_started_at) {
      events.push({ event_type: 'calibration_started', description: 'Started Viral DNA Fingerprint calibration', timestamp: p.calibration_started_at });
    }
    if (p.calibration_completed_at) {
      events.push({ event_type: 'calibration_completed', description: 'Completed calibration', timestamp: p.calibration_completed_at });
    }
    if (p.activated_at) {
      events.push({ event_type: 'activated', description: 'Fully onboarded and active', timestamp: p.activated_at });
    }

    if (events.length === 0) {
      events.push({ event_type: 'invited', description: 'Added to agency', timestamp: p.created_at });
    }

    events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return {
      creator_name: p.business_name || p.creator_name || 'Unknown',
      events,
      current_stage: determineStage(p),
      total_days: daysSince(events[0]?.timestamp),
    };
  });

  // ── Cultural event data construction ─────────────────────────────────

  const now = new Date();
  function daysUntilEvent(dateStr: string): number {
    const eventDate = new Date(dateStr);
    return Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  const enrichedEvents = culturalEvents.map((event: any) => ({
    ...event,
    days_until: daysUntilEvent(event.event_date),
    status: daysUntilEvent(event.event_date) < 0 ? 'passed'
      : daysUntilEvent(event.event_date) === 0 ? 'active'
      : 'upcoming',
  }));

  const upcomingEvents = enrichedEvents.filter((e: any) => e.days_until >= 0);
  const thisWeekEvents = upcomingEvents.filter((e: any) => e.days_until <= 7);
  const thisMonthEvents = upcomingEvents.filter((e: any) => e.days_until <= 30);

  const agencyNiches = [...new Set(
    (onboardingDetails || []).map((p: any) => p.selected_niche || p.niche_key).filter(Boolean)
  )] as string[];

  const eventSummaryData = {
    total_events: culturalEvents.length,
    upcoming_this_week: thisWeekEvents.length,
    upcoming_this_month: thisMonthEvents.length,
    with_content_planned: enrichedEvents.filter((e: any) => e.content_planned || e.brief_id).length,
    without_content: enrichedEvents.filter((e: any) => e.days_until >= 0 && !e.content_planned && !e.brief_id).length,
    top_category: culturalEvents.length > 0
      ? Object.entries(
          culturalEvents.reduce((acc: Record<string, number>, e: any) => {
            acc[e.category || 'uncategorized'] = (acc[e.category || 'uncategorized'] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        ).sort(([, a], [, b]) => (b as number) - (a as number))[0]?.[0] || null
      : null,
    next_event: upcomingEvents[0] ? {
      name: upcomingEvents[0].event_name,
      date: upcomingEvents[0].event_date,
      days_until: upcomingEvents[0].days_until,
    } : null,
  };

  const calendarEvents = enrichedEvents
    .filter((e: any) => e.days_until >= -7 && e.days_until <= 60)
    .map((e: any) => ({
      event_name: e.event_name,
      event_date: e.event_date,
      category: e.category || 'cultural_moment',
      relevance_score: e.relevance_score || null,
      days_until: e.days_until,
    }));

  // ── Push / Brief enrichment ─────────────────────────────────────────

  // Enrich briefs with assignment data
  const enrichedBriefs = contentBriefs.map((brief: any) => {
    const assignments = briefAssignments.filter((a: any) => a.brief_id === brief.id)
    const assignedCreators = assignments.map((a: any) => {
      const creator = (onboardingDetails || []).find((p: any) => p.id === a.creator_id)
      return {
        name: creator?.creator_name || a.creator_name || 'Unknown',
        niche: creator?.niche || null,
        status: a.status || 'pending',
        sent_at: a.sent_at || a.created_at,
        responded_at: a.responded_at || null,
        content_url: a.content_url || null,
      }
    })

    // Match to event if event_id or event_name exists
    const linkedEvent = brief.event_id
      ? (culturalEvents || []).find((e: any) => e.id === brief.event_id)
      : (culturalEvents || []).find((e: any) => e.event_name === brief.event_name)

    return {
      id: brief.id,
      brief_title: brief.title || brief.brief_title || 'Untitled Brief',
      event_name: linkedEvent?.event_name || brief.event_name || null,
      event_date: linkedEvent?.event_date || brief.event_date || null,
      content_angle: brief.content_angle || brief.angle || brief.description || '',
      talking_points: brief.talking_points || [],
      content_format: brief.content_format || null,
      tone: brief.tone || null,
      hashtags: brief.hashtags || [],
      deadline: brief.deadline || null,
      priority: brief.priority || 'normal',
      assigned_creators: assignedCreators,
      status: assignedCreators.length === 0 ? 'draft'
        : assignedCreators.every((c: any) => c.status === 'published') ? 'completed'
        : assignedCreators.some((c: any) => ['in_progress', 'submitted', 'accepted'].includes(c.status)) ? 'in_progress'
        : 'sent',
      creator_count: assignedCreators.length,
      completion_percent: assignedCreators.length > 0
        ? Math.round((assignedCreators.filter((c: any) => c.status === 'published').length / assignedCreators.length) * 100)
        : 0,
    }
  })

  // Build batch-level aggregation from existing brief data
  const batchAggregation = (() => {
    if (enrichedBriefs.length === 0) return null

    const priorityCounts = { urgent: 0, high: 0, normal: 0, low: 0 }
    enrichedBriefs.forEach(b => {
      const p = (b.priority || 'normal') as keyof typeof priorityCounts
      if (p in priorityCounts) priorityCounts[p]++
    })

    const uniqueCreators = new Set<string>()
    const uniqueEvents = new Set<string>()
    enrichedBriefs.forEach(b => {
      if (b.event_name) uniqueEvents.add(b.event_name)
      ;(b.assigned_creators || []).forEach((c: any) => uniqueCreators.add(c.name))
    })

    return {
      total_briefs: enrichedBriefs.length,
      total_creators_covered: uniqueCreators.size,
      total_events_covered: uniqueEvents.size,
      priority_breakdown: priorityCounts,
      by_status: {
        draft: enrichedBriefs.filter(b => b.status === 'draft').length,
        sent: enrichedBriefs.filter(b => b.status === 'sent').length,
        in_progress: enrichedBriefs.filter(b => b.status === 'in_progress').length,
        completed: enrichedBriefs.filter(b => b.status === 'completed').length,
      },
    }
  })()

  // Build creator-brief assignment matrix
  const assignmentMatrix = (() => {
    const creators = (onboardingDetails || []).map(p => {
      const creatorBriefs = enrichedBriefs.filter(b =>
        (b.assigned_creators || []).some((c: any) => c.name === p.creator_name)
      )
      return {
        name: p.creator_name || 'Unknown',
        niche: p.niche || null,
        total_assigned: creatorBriefs.length,
        total_completed: creatorBriefs.filter(b => b.status === 'completed').length,
      }
    })

    const events = [...new Set(enrichedBriefs.map(b => b.event_name).filter(Boolean))].map(eventName => {
      const brief = enrichedBriefs.find(b => b.event_name === eventName)
      return {
        event_name: eventName,
        deadline: brief?.deadline || null,
      }
    })

    const assignments: Array<{ creator_name: string; event_name: string; status: string }> = []
    creators.forEach(creator => {
      events.forEach(event => {
        const brief = enrichedBriefs.find(b => b.event_name === event.event_name)
        const creatorAssignment = (brief?.assigned_creators || []).find((c: any) => c.name === creator.name)
        assignments.push({
          creator_name: creator.name,
          event_name: event.event_name!,
          status: creatorAssignment?.status || 'not_assigned',
        })
      })
    })

    // Check for overloaded creators (assigned to more than 3 briefs this week)
    const overloaded = creators.filter(c => c.total_assigned > 3)
    const workloadWarning = overloaded.length > 0
      ? `${overloaded.map(c => c.name).join(', ')} ${overloaded.length === 1 ? 'has' : 'have'} more than 3 active briefs`
      : null

    return { creators, events, assignments, workload_warning: workloadWarning }
  })()

  // Identify coverage gaps: events without full niche coverage
  const coverageGaps = (() => {
    const gaps: Array<{ event_name: string; missing_niches: string[] }> = []

    ;(enrichedEvents || []).filter(e => e.days_until >= 0).forEach((event: any) => {
      const brief = enrichedBriefs.find(b => b.event_name === event.event_name)
      const coveredNiches = (brief?.assigned_creators || []).map((c: any) => {
        const creator = (onboardingDetails || []).find(p => p.creator_name === c.name)
        return creator?.niche
      }).filter(Boolean)

      const missingNiches = agencyNiches.filter(n => !coveredNiches.includes(n))
      if (missingNiches.length > 0) {
        gaps.push({ event_name: event.event_name, missing_niches: missingNiches })
      }
    })

    return gaps
  })()

  // ── Step 11: Build unified content calendar from existing data sources ──
  const currentWeekStart = new Date(now)
  currentWeekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7)) // Monday
  currentWeekStart.setHours(0, 0, 0, 0)
  const currentWeekEnd = new Date(currentWeekStart)
  currentWeekEnd.setDate(currentWeekStart.getDate() + 6) // Sunday

  // Combine all calendar items
  const calendarItems: Array<{
    id: string
    title: string
    date: string
    time?: string
    type: 'post' | 'event' | 'brief_deadline' | 'milestone' | 'reminder'
    creator_name?: string
    niche?: string
    status?: string
  }> = []

  // Add cultural events
  ;(enrichedEvents || []).forEach((event: any, i: number) => {
    calendarItems.push({
      id: `event-${i}`,
      title: event.event_name,
      date: event.event_date,
      type: 'event',
      status: event.status || 'scheduled',
    })
  })

  // Add brief deadlines and post slots from brief assignments
  ;(enrichedBriefs || []).forEach((brief: any, i: number) => {
    if (brief.deadline) {
      calendarItems.push({
        id: `brief-deadline-${i}`,
        title: `Brief due: ${brief.brief_title}`,
        date: brief.deadline,
        type: 'brief_deadline',
        status: brief.status || 'draft',
      })
    }
    ;(brief.assigned_creators || []).forEach((creator: any, j: number) => {
      if (brief.deadline || brief.event_date) {
        calendarItems.push({
          id: `post-${i}-${j}`,
          title: brief.brief_title,
          date: brief.deadline || brief.event_date,
          type: 'post',
          creator_name: creator.name,
          niche: creator.niche,
          status: creator.status === 'published' ? 'published'
            : creator.status === 'in_progress' ? 'in_production'
            : creator.status === 'accepted' ? 'scheduled'
            : 'draft',
        })
      }
    })
  })

  // Week-level overview
  const thisWeekItems = calendarItems.filter(item => {
    const itemDate = new Date(item.date)
    return itemDate >= currentWeekStart && itemDate <= currentWeekEnd
  })

  const weekOverviewData = {
    week_label: `Week of ${currentWeekStart.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`,
    week_start: currentWeekStart.toISOString().split('T')[0],
    total_scheduled: thisWeekItems.filter(i => i.type === 'post').length,
    by_status: {
      scheduled: thisWeekItems.filter(i => i.status === 'scheduled').length,
      draft: thisWeekItems.filter(i => i.status === 'draft').length,
      published: thisWeekItems.filter(i => i.status === 'published').length,
      overdue: thisWeekItems.filter(i => i.status === 'overdue').length,
    },
    by_creator: Object.entries(
      thisWeekItems.filter(i => i.creator_name).reduce((acc: Record<string, number>, item) => {
        acc[item.creator_name!] = (acc[item.creator_name!] || 0) + 1
        return acc
      }, {})
    ).map(([name, count]) => ({ name, post_count: count as number })),
    upcoming_events: thisWeekItems.filter(i => i.type === 'event').map(i => ({
      event_name: i.title,
      event_date: i.date,
    })),
    gap_days: (() => {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      return days.filter((_, idx) => {
        const dayDate = new Date(currentWeekStart)
        dayDate.setDate(currentWeekStart.getDate() + idx)
        const dateStr = dayDate.toISOString().split('T')[0]
        return !thisWeekItems.some(i => i.date.startsWith(dateStr))
      })
    })(),
  }

  // Per-creator weekly schedule for ScheduleGrid
  const scheduleGridData = {
    week_start: currentWeekStart.toISOString().split('T')[0],
    creators: (onboardingDetails || []).map((creator: any) => {
      const dayKeysArr: Array<'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'> = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
      const schedule = dayKeysArr.map((day, idx) => {
        const dayDate = new Date(currentWeekStart)
        dayDate.setDate(currentWeekStart.getDate() + idx)
        const dateStr = dayDate.toISOString().split('T')[0]
        const dayItems = calendarItems.filter(i =>
          i.creator_name === creator.creator_name && i.date.startsWith(dateStr)
        )
        return {
          day,
          items: dayItems.map(i => ({
            title: i.title,
            time: i.time,
            type: i.type as 'post' | 'brief_deadline' | 'event',
            status: i.status as 'scheduled' | 'draft' | 'published' | 'overdue' | undefined,
          })),
        }
      })
      return {
        name: creator.creator_name || 'Unknown',
        niche: creator.niche || null,
        schedule,
      }
    }),
  }

  // Detect scheduling conflicts
  const calendarConflicts: Array<{ day: string; description: string }> = []
  const calendarDayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
  calendarDayKeys.forEach((_, idx) => {
    const dayDate = new Date(currentWeekStart)
    dayDate.setDate(currentWeekStart.getDate() + idx)
    const dateStr = dayDate.toISOString().split('T')[0]
    const dayPosts = calendarItems.filter(i => i.type === 'post' && i.date.startsWith(dateStr))
    if (dayPosts.length > 3) {
      calendarConflicts.push({
        day: dateStr,
        description: `${dayPosts.length} posts scheduled on the same day — consider spreading out for better audience reach`,
      })
    }
  })
  ;(enrichedEvents || []).forEach((event: any) => {
    if (event.days_until >= 0 && event.days_until <= 14) {
      const hasPosts = calendarItems.some(i => i.type === 'post' && i.date === event.event_date)
      if (!hasPosts) {
        calendarConflicts.push({
          day: event.event_date,
          description: `"${event.event_name}" is in ${event.days_until} days but no content is scheduled for it`,
        })
      }
    }
  })

  // Build creator-event matching context
  const creatorEventMatchContext = (onboardingDetails || []).map((creator: any) => {
    const creatorPredictions = (predictionRuns || []).filter((p: any) => p.creator_id === creator.id)
    return {
      name: creator.creator_name,
      niche: creator.niche,
      vps: (scripts || []).find((s: any) => s.creator_id === creator.id)?.vps_score || null,
      follower_count: creator.follower_count || creator.actual_follower_count || 0,
      content_count: creatorPredictions.length,
      avg_dps: creatorPredictions.length > 0
        ? Math.round(creatorPredictions.reduce((sum: number, p: any) => sum + (p.dps_score || p.composite_score || 0), 0) / creatorPredictions.length)
        : null,
      strengths: [],
    }
  })

  // ============ STEP 13: PERFORMANCE REPORTING DATA ============

  // Agency-level performance metrics
  const performanceData = (() => {
    const allPredictions = predictionRuns || []
    const allScripts = scripts || []
    const creators = onboardingDetails || []

    // Overall metrics
    const totalVideos = allPredictions.length
    const totalViews = allPredictions.reduce((sum: number, p: any) => sum + (p.view_count || 0), 0)
    const avgDps = totalVideos > 0
      ? Math.round(allPredictions.reduce((sum: number, p: any) => sum + (p.dps_score || p.composite_score || 0), 0) / totalVideos * 10) / 10
      : null
    const avgVps = allScripts.filter((s: any) => s.vps_score != null).length > 0
      ? Math.round(allScripts.filter((s: any) => s.vps_score != null).reduce((sum: number, s: any) => sum + s.vps_score, 0) / allScripts.filter((s: any) => s.vps_score != null).length * 10) / 10
      : null
    const totalEngagement = allPredictions.reduce((sum: number, p: any) =>
      sum + (p.share_count || 0) + (p.save_count || 0) + (p.comment_count || 0), 0)

    // Per-creator performance
    const creatorPerformance = creators.map((c: any) => {
      const cPredictions = allPredictions.filter((p: any) => p.creator_id === c.id)
      const cScripts = allScripts.filter((s: any) => s.creator_id === c.id)
      const cViews = cPredictions.reduce((sum: number, p: any) => sum + (p.view_count || 0), 0)
      const cAvgDps = cPredictions.length > 0
        ? Math.round(cPredictions.reduce((sum: number, p: any) => sum + (p.dps_score || p.composite_score || 0), 0) / cPredictions.length * 10) / 10
        : null
      const latestVps = cScripts.length > 0 ? cScripts[0].vps_score : null
      const prevVps = cScripts.length > 1 ? cScripts[1].vps_score : null

      // Engagement rates
      const avgShareRate = cPredictions.length > 0
        ? cPredictions.reduce((sum: number, p: any) => sum + (p.share_rate || 0), 0) / cPredictions.length
        : 0
      const avgSaveRate = cPredictions.length > 0
        ? cPredictions.reduce((sum: number, p: any) => sum + (p.save_rate || 0), 0) / cPredictions.length
        : 0

      // Determine trend
      let trend: 'up' | 'down' | 'stable' = 'stable'
      if (latestVps && prevVps) {
        if (latestVps > prevVps + 2) trend = 'up'
        else if (latestVps < prevVps - 2) trend = 'down'
      }

      // Engagement grade
      let engagementGrade: 'A' | 'B' | 'C' | 'D' | 'F' = 'C'
      const totalRate = avgShareRate + avgSaveRate
      if (totalRate > 0.05) engagementGrade = 'A'
      else if (totalRate > 0.03) engagementGrade = 'B'
      else if (totalRate > 0.01) engagementGrade = 'C'
      else if (totalRate > 0) engagementGrade = 'D'
      else engagementGrade = 'F'

      return {
        name: c.creator_name || 'Unknown',
        niche: c.niche,
        vps_score: latestVps,
        avg_dps: cAvgDps,
        total_views: cViews,
        total_videos: cPredictions.length,
        engagement_grade: engagementGrade,
        share_rate: Math.round(avgShareRate * 10000) / 100,
        save_rate: Math.round(avgSaveRate * 10000) / 100,
        follower_count: c.follower_count || c.actual_follower_count || 0,
        trend,
      }
    })

    // Identify top performer
    const topPerformer = creatorPerformance
      .filter((c: any) => c.vps_score != null)
      .sort((a: any, b: any) => (b.vps_score || 0) - (a.vps_score || 0))[0]

    // Identify needs attention
    const needsAttention = creatorPerformance
      .filter((c: any) => c.trend === 'down' || c.engagement_grade === 'D' || c.engagement_grade === 'F')
      .map((c: any) => ({
        creator_name: c.name,
        issue: c.trend === 'down' ? 'VPS trending down' : `Low engagement grade (${c.engagement_grade})`,
      }))

    // Overall grade
    let overallGrade: string = 'C'
    if (avgVps && avgVps >= 85) overallGrade = 'A'
    else if (avgVps && avgVps >= 75) overallGrade = 'B+'
    else if (avgVps && avgVps >= 65) overallGrade = 'B'
    else if (avgVps && avgVps >= 55) overallGrade = 'C+'
    else if (avgVps && avgVps >= 45) overallGrade = 'C'
    else if (avgVps) overallGrade = 'D'

    return {
      summary: {
        total_videos: totalVideos,
        total_views: totalViews,
        avg_dps: avgDps,
        avg_vps: avgVps,
        total_engagement: totalEngagement,
        active_creators: creators.length,
        overall_grade: overallGrade,
      },
      creator_performance: creatorPerformance,
      top_performer: topPerformer ? {
        name: topPerformer.name,
        metric: 'VPS Score',
        value: topPerformer.vps_score || 0,
      } : null,
      needs_attention: needsAttention,
    }
  })()

  // Content ROI data (per event that has published content)
  const contentROIData = (() => {
    return (enrichedEvents || [])
      .filter((event: any) => {
        const eventBriefs = enrichedBriefs.filter((b: any) => b.event_name === event.event_name)
        return eventBriefs.some((b: any) => (b.assigned_creators || []).some((c: any) => c.status === 'published'))
      })
      .map((event: any) => {
        const eventBriefs = enrichedBriefs.filter((b: any) => b.event_name === event.event_name)
        const allCreatorAssignments = eventBriefs.flatMap((b: any) => b.assigned_creators || [])
        const publishedCreators = allCreatorAssignments.filter((c: any) => c.status === 'published')

        // Get prediction data for published content
        const eventPredictions = (predictionRuns || []).filter((p: any) => {
          const creatorNames = publishedCreators.map((c: any) => c.name)
          const creator = (onboardingDetails || []).find((o: any) => creatorNames.includes(o.creator_name) && o.id === p.creator_id)
          return !!creator
        })

        return {
          campaign_name: event.event_name,
          total_posts: publishedCreators.length,
          total_views: eventPredictions.reduce((sum: number, p: any) => sum + (p.view_count || 0), 0),
          avg_dps: eventPredictions.length > 0
            ? Math.round(eventPredictions.reduce((sum: number, p: any) => sum + (p.dps_score || p.composite_score || 0), 0) / eventPredictions.length)
            : null,
        }
      })
  })()

  // Map DB status values to CreatorCard enum values
  function toCardStatus(stage?: string, step?: string): 'active' | 'inactive' | 'onboarding' {
    const raw = stage || step || '';
    if (raw === 'complete' || raw === 'completed') return 'active';
    if (raw === 'foundation' || raw === 'onboarding' || raw === 'migrated') return 'onboarding';
    if (raw === 'inactive' || raw === '') return 'inactive';
    return 'active'; // default for unknown non-empty statuses
  }

  // Build creator context
  const creators = profiles.map(p => {
    const creatorScripts = scripts.filter(s => s.onboarding_profile_id === p.id);
    const vpsScores = creatorScripts.map(s => s.vps_score || 0).filter(v => v > 0);
    return {
      name: p.business_name || 'Unknown',
      userId: p.user_id,
      niche: p.selected_niche || p.niche_key || 'unknown',
      status: toCardStatus(p.creator_stage, p.onboarding_step),
      scriptCount: creatorScripts.length,
      latestVPS: vpsScores.length > 0 ? Math.max(...vpsScores) : 0,
      avgVPS: vpsScores.length > 0
        ? Math.round(vpsScores.reduce((a, b) => a + b, 0) / vpsScores.length)
        : 0,
      activeBriefs: briefs.filter(b => b.user_id === p.user_id).length,
    };
  });

  const agencyContext = JSON.stringify({
    totalCreators: creators.length,
    creators: creators.map(c => ({
      name: c.name,
      niche: c.niche,
      status: c.status,
      latestVPS: c.latestVPS,
      avgVPS: c.avgVPS,
      scriptCount: c.scriptCount,
      activeBriefs: c.activeBriefs,
    })),
    recentScripts: scripts.slice(0, 10).map(s => ({
      title: (s.script_text || '').slice(0, 80),
      vpsScore: s.vps_score,
      status: s.status,
      createdAt: s.created_at,
    })),
    averageVPS: creators.length > 0
      ? Math.round(creators.reduce((sum, c) => sum + c.latestVPS, 0) / creators.length)
      : 0,
    topPerformer: creators.length > 0
      ? [...creators].sort((a, b) => b.latestVPS - a.latestVPS)[0]?.name || 'N/A'
      : 'N/A',
    totalScripts: scripts.length,
    totalBriefs: briefs.length,
  }, null, 2);

  // Generate proactive alerts from agency data
  const proactiveAlerts = generateProactiveAlerts({
    onboardingProfiles: onboardingDetails || [],
    enrichedEvents: enrichedEvents || [],
    enrichedBriefs: enrichedBriefs || [],
    predictionRuns: predictionRuns || [],
    scripts: scripts || [],
    calendarItems: calendarItems || [],
  });

  // ── Data compression helpers ──────────────────────────────────────────
  function compressCreatorData(data: any[]): string {
    if (data.length === 0) return 'No creator data available.'
    return data.map(c =>
      `${c.name} (${c.niche}): VPS=${c.current_vps ?? '?'}, ` +
      `DPS_avg=${c.avg_dps ?? '?'}, videos=${c.total_videos}, ` +
      `followers=${c.follower_count}, trend=${c.vps_history?.length > 1 ?
        (c.vps_history[0]?.score > c.vps_history[c.vps_history.length - 1]?.score ? 'falling' : 'rising') : 'unknown'}, ` +
      `rank=${c.niche_ranking?.rank ?? '?'}/${c.niche_ranking?.total_in_niche ?? '?'}, ` +
      `engagement=[${c.engagement?.map((e: any) => `${e.metric_name}:${e.creator_value}`).join(', ') || 'none'}]`
    ).join('\n')
  }

  function compressOnboardingData(pipeline: any[], stats: any): string {
    const stagesStr = pipeline
      .filter(s => s.creators.length > 0)
      .map(s => `${s.stage_name}: ${s.creators.map((c: any) => c.name).join(', ')} (${s.creators.length})`)
      .join(' → ')
    return `Pipeline: ${stagesStr || 'empty'}\n` +
      `Stats: ${stats.total_invited} invited, ${stats.currently_onboarding} onboarding, ` +
      `${stats.completed} completed, ${stats.dropped_off} dropped, ${stats.completion_rate}% rate` +
      (stats.avg_days_to_complete ? `, avg ${stats.avg_days_to_complete}d to complete` : '')
  }

  function compressEventData(events: any[]): string {
    if (events.length === 0) return 'No events. Suggest adding events for agency niches.'
    return events.map(e =>
      `${e.event_name} (${e.category || 'uncategorized'}): ${e.event_date}, ${e.days_until}d away, status=${e.status}`
    ).join('\n')
  }

  function compressBriefData(data: any[]): string {
    if (data.length === 0) return 'No briefs created yet.'
    return data.map(b =>
      `"${b.brief_title}" for ${b.event_name || 'N/A'}: ${b.creator_count} creators, ` +
      `status=${b.status}, deadline=${b.deadline || 'none'}, priority=${b.priority}`
    ).join('\n')
  }

  function compressPendingBriefs(data: any[]): string {
    if (data.length === 0) return 'No pending briefs to review.'
    return `${data.length} briefs awaiting review:\n` + data.map(b =>
      `- "${b.title}" for ${b.creator_name} (${b.niche}): VPS=${b.vps_score}, priority=${b.priority_type}, ` +
      `critic_score=${b.critic_score ?? 'N/A'}${b.variant_count > 1 ? `, ${b.variant_count} variants available` : ''}`
    ).join('\n')
  }

  function compressCalendarData(items: any[], weekOverview: any): string {
    const weekStr = `This week: ${weekOverview.total_scheduled} scheduled, ` +
      `gaps=[${weekOverview.gap_days?.join(', ') || 'none'}]`
    const conflicts = calendarConflicts.length > 0
      ? `\nConflicts: ${calendarConflicts.map(c => `${c.day}: ${c.description}`).join('; ')}`
      : ''
    const itemStr = items.length > 0
      ? items.slice(0, 15).map(i => `${i.date}: ${i.title} (${i.type}${i.creator_name ? ', ' + i.creator_name : ''})`).join('\n')
      : 'No calendar items.'
    return `${weekStr}${conflicts}\n${itemStr}`
  }

  function compressPerformanceData(perf: any): string {
    const s = perf.summary
    return `Agency: grade=${s.overall_grade}, avgVPS=${s.avg_vps}, avgDPS=${s.avg_dps}, ` +
      `videos=${s.total_videos}, views=${s.total_views}, creators=${s.active_creators}\n` +
      `Creators: ${perf.creator_performance?.map((c: any) =>
        `${c.name}(${c.niche}): VPS=${c.vps_score ?? '?'}, DPS=${c.avg_dps ?? '?'}, views=${c.total_views}, trend=${c.trend}, grade=${c.engagement_grade}`
      ).join('; ') || 'none'}\n` +
      `Top: ${perf.top_performer?.name || 'none'} (${perf.top_performer?.metric}: ${perf.top_performer?.value})\n` +
      `Attention: ${perf.needs_attention?.map((a: any) => `${a.creator_name}: ${a.issue}`).join('; ') || 'none'}`
  }

  function compressAlerts(alerts: any[]): string {
    if (alerts.length === 0) return 'No alerts. Everything looks good.'
    return alerts.map(a =>
      `[${a.priority?.toUpperCase() || 'INFO'}] ${a.title} → ${a.suggested_action}`
    ).join('\n')
  }

  // ── Contextual data inclusion based on user query ────────────────────
  const lastUserMessage = (messages[messages.length - 1]?.content || '').toLowerCase()

  const contextSections: string[] = []

  // Creator summary always included (compressed = small)
  contextSections.push(`## CREATORS\n${compressCreatorData(creatorDeepDiveData)}`)

  // Alerts always included
  contextSections.push(`## ALERTS\n${compressAlerts(proactiveAlerts)}`)

  // Pending briefs always included (operator needs to review these)
  if (pendingBriefs.length > 0) {
    contextSections.push(`## PENDING BRIEF REVIEW\n${compressPendingBriefs(pendingBriefs)}`)
  }

  // Keyword-based conditional sections
  const includeOnboarding = /onboard|pipeline|calibrat|invite|stall/.test(lastUserMessage)
  const includeEvents = /event|cultur|trend|calendar|coming up|schedul/.test(lastUserMessage)
  const includeBriefs = /brief|push|assign|batch|content plan/.test(lastUserMessage)
  const includePerformance = /report|perform|compar|roi|how are|doing|score/.test(lastUserMessage)
  const includeCalendar = /calendar|schedul|week|post|slot/.test(lastUserMessage)
  const includeDeepDive = /deep dive|analy[sz]|profile|everything about|tell me about/.test(lastUserMessage)
  const isGeneral = /^(hi|hello|hey|good|morning|brief me|what's up|update|status|what should|what needs)/.test(lastUserMessage)

  if (includeOnboarding || isGeneral) {
    contextSections.push(`## ONBOARDING\n${compressOnboardingData(pipelineData, onboardingStatsData)}`)
  }
  if (includeEvents || includeCalendar || isGeneral) {
    contextSections.push(`## EVENTS\n${compressEventData(enrichedEvents)}`)
  }
  if (includeBriefs || isGeneral) {
    contextSections.push(`## BRIEFS\n${compressBriefData(enrichedBriefs)}`)
  }
  if (includeCalendar || isGeneral) {
    contextSections.push(`## CALENDAR\n${compressCalendarData(calendarItems, weekOverviewData)}`)
  }
  if (includePerformance || isGeneral) {
    contextSections.push(`## PERFORMANCE\n${compressPerformanceData(performanceData)}`)
  }
  if (includeDeepDive) {
    // For deep dives, include full detail for the mentioned creator only
    const mentionedCreator = creatorDeepDiveData.find((c: any) =>
      lastUserMessage.includes(c.name?.toLowerCase())
    )
    if (mentionedCreator) {
      contextSections.push(`## DEEP DIVE TARGET\n${JSON.stringify(mentionedCreator, null, 2)}`)
    }
  }

  const dataContext = contextSections.join('\n\n')

  // ── Intent classification + context assembly IN PARALLEL ─────────
  const recentComponentsHeader = (messages[messages.length - 2]?.metadata as Record<string, unknown>)?.suggestedComponents as string[] || []

  const [intentResult, centralContextBlock] = await Promise.all([
    classifyIntent(lastUserMessage, {
      role: 'operator',
      tier: 'standard',
      recentComponents: recentComponentsHeader as any[],
      agencyId: agencyId || undefined,
    }),
    (async () => {
      if (!agencyId) return '';
      try {
        const serviceDb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });
        const ctx = await assembleContext(serviceDb, agencyId, 'AgencyChat');
        return ctx.systemPrompt;
      } catch (err) {
        console.warn('[agency-chat] assembleContext failed:', err);
        return '';
      }
    })(),
  ]);


  const clayComponentHint = intentResult.suggestedComponents.length > 0
    ? `\n## CLAY COMPONENTS READY\nThe operator is asking about: ${intentResult.intents.join(', ')}.\nYou have the following data ready to display as visual components: ${intentResult.suggestedComponents.join(', ')}.\nAcknowledge what you're showing them naturally — don't say "I'm rendering a component", just refer to it conversationally (e.g. "Here's your morning brief" or "I can see [creator] is showing some momentum decay").\n`
    : ''

  // ── Build compressed system prompt ───────────────────────────────────
  const isRestoredSession = messages.length > 4;
  const catalogPrompt = trendzoCatalog.prompt({ mode: 'inline' });

  const systemPrompt = `You are the Trendzo Intelligent Clay engine — an AI that dynamically assembles UI components for TikTok agency operators. Confident, data-driven, slightly edgy. Speak like a senior strategist. ALWAYS use UI components to show data — never just list numbers in text.

${catalogPrompt}

${centralContextBlock ? `${centralContextBlock}\n\n` : ''}${clayComponentHint}## AGENCY DATA
Today: ${now.toISOString().split('T')[0]}
Niches: ${agencyNiches.join(', ') || 'none yet'}

${dataContext}

## RESPONSE RULES
- "deep dive" / "analysis" / "profile" on creator: CreatorProfile → VPSTimeline → NicheRanking → ContentTable → EngagementBreakdown → RecommendationCard(s). Analyze data for genuine insights (engagement vs niche avg, VPS trend, rank position). Always 2-3 actionable items.
- "onboarding" / "pipeline": OnboardingStats → OnboardingPipeline. Specific creator: CalibrationProgress + OnboardingTimeline. Flag stalled creators (>7d in stage).
- "events" / "calendar" / "what's coming up": EventSummary → EventCalendar. Urgent events (≤2d) get TrendAlert first.
- "add event" / "log trend": EventForm with prefilled values. Categories: holiday, platform_trend, cultural_moment, industry_event, seasonal, news_cycle, trending_topic.
- "push" / "brief for [event]": CreatorMatch (fit_score: 90-100 perfect niche+high VPS, 70-89 good, 50-69 tangential, <50 weak) → EventBrief (3-5 talking points, deadline 1-2d before event) → PushConfirmation.
- "all briefs" / "batch": BriefGrid + CreatorBriefAssignment. Flag workload >3 briefs/creator and coverage gaps.
- "calendar" / "schedule": WeekOverview → CalendarView or ScheduleGrid. Show ScheduleConflict if any. current_date=${now.toISOString().split('T')[0]}.
- "report" / "how are we doing" / "performance": AgencyScorecard → PerformanceChart → CreatorComparison. Grade: A≥85 B+≥75 B≥65 C+≥55 C≥45 D<45.
- "compare creators": CreatorComparison with all creators.
- "trends" / "insights": TrendReport with rising/falling/emerging from actual data.
- Greetings / "brief me": if PENDING BRIEF REVIEW section has briefs, lead with "I generated [N] briefs overnight" and highlight the top brief by VPS with creator name and score. Then surface alerts. If no pending briefs, surface alerts then "What would you like to work on?"
- "show briefs" / "review briefs" / "pending briefs": show all pending briefs as KPICard grid with VPS scores, creator names, priority badges. Include ActionButton with action="approve_brief" for each. If a brief has variants, mention "N variants available — ask to see alternatives."
- "alternatives for [brief]" / "show variants": describe the variant options (different hook type or format) with their VPS scores. Include ActionButton with action="approve_brief" for each variant.
- VPS color: green≥80, gold 70-79, red<70. Priority: urgent≤48h, high≤1wk, normal 1-4wk, low>4wk.
- Use KPICard for metrics, Grid columns=2 for creators / columns=3-4 for KPIs, Section with titles, ActionButton for next steps.
- Populate components with REAL data. Never invent data. Skip components if data is missing.
- Actions: analyze_creator, generate_brief, refresh_data, export_report, navigate_creator, send_invite, nudge_creator, create_event, match_creators_to_event, generate_batch_briefs, approve_brief, schedule_post, reschedule_post, update_brief_status, log_performance.
- update_brief_status: use when the operator asks to mark a brief acknowledged/in-production/published. Render an ActionButton with action="update_brief_status" and payload { briefId, new_status: 'acknowledged'|'in_production'|'published', published_url?: string }. For 'published', ask for the TikTok URL first if the operator has not provided one. **Multi-match rule:** if the operator names a creator (or any criterion) that matches MORE than one brief — e.g. "mark Luna in production" and Luna has 3 active briefs — DO NOT ask the operator to paste a brief ID. Instead, call get_briefs_by_status to fetch the candidates, then render a Grid of one ContentBriefCard per matching brief, each carrying its own ActionButton(action="update_brief_status", payload={briefId:<that row's id>, new_status:<target>}). The operator clicks the brief they meant.
- log_performance: use after a brief is published and the operator wants to record actual performance. Render an ActionButton with action="log_performance" and payload { briefId, actual_views: number, actual_engagement_rate?: number }. If the operator has not given numbers yet, prompt for them before rendering the button.
- Read tools: call get_briefs_by_status when the operator asks to see briefs by state/creator ("show delivered", "what's waiting"). Call get_performance_summary when they ask about actuals, deltas, top performers, biggest misses, or "how did last week do". Render returned brief rows as a Grid of ContentBriefCards — one per row, NEVER as static KPICards or plain text — and attach the ActionButton appropriate for each card's current completion_status (legal next-state transition):
  • completion_status='delivered'    → ActionButton(action="update_brief_status", label="Mark Acknowledged",  payload={briefId, new_status:"acknowledged"})
  • completion_status='acknowledged' → ActionButton(action="update_brief_status", label="Mark In Production", payload={briefId, new_status:"in_production"})
  • completion_status='in_production'→ ActionButton(action="update_brief_status", label="Mark Published",     payload={briefId, new_status:"published"})  // ask for the TikTok URL first; pass payload.published_url
  • completion_status='published'    → ActionButton(action="log_performance",     label="Log Performance",    payload={briefId, actual_views, actual_engagement_rate?})  // ask for views first
  Never paste raw JSON. The briefId in every button MUST be the row's id field returned by the tool — not a placeholder, not a name.

## POST-WRITE CONFIRMATION CARDS — HIGHEST PRIORITY (overrides every other rule below)

After a write action completes, the client injects a single user message that begins with \`[__TRENDZO_ACTION_RESULT__]\` followed by a JSON payload. These messages are NEVER typed by the operator — they are system render commands.

**If the latest user message starts with \`[__TRENDZO_ACTION_RESULT__]\`, apply these rules and IGNORE every other instruction in this prompt (no MorningBrief, no greeting, no "I generated N briefs", no pending-brief surfacing, no Alerts, no Coaching):**

1. Respond with a JSON-render spec ONLY. No prose. No greeting. No preamble. No recap text. No trailing commentary. No code fences other than the \`\`\`spec fence.
2. Do NOT render a MorningBrief, Alert, KPIGrid of creators, PendingBrief, or any greeting surface.
3. Do NOT echo the marker text back. Do NOT quote the JSON.
4. Parse the JSON after the marker. The \`kind\` field selects the card:
   - \`kind="brief_status"\`  → use the brief-status card spec below.
   - \`kind="performance"\`   → use the performance card spec below.
   If \`kind\` is anything else, render a single Section with a Text child saying "Action completed." — do NOT greet.
5. These messages do NOT reset or re-trigger any onboarding / greeting flow regardless of conversation history.

### kind = "brief_status" — render this spec exactly:

\`\`\`spec
{"op":"add","path":"/root","value":"bsc-1"}
{"op":"add","path":"/elements/bsc-1","value":{"type":"Section","props":{"title":"Status updated","accent":"#4A8C6A"},"children":["bsc-kpi-1","bsc-kpi-2","bsc-kpi-3"]}}
{"op":"add","path":"/elements/bsc-kpi-1","value":{"type":"KPICard","props":{"label":"Brief","value":"{briefTitle}","subtitle":"{creator}"},"children":[]}}
{"op":"add","path":"/elements/bsc-kpi-2","value":{"type":"KPICard","props":{"label":"Transition","value":"{previousStatus} → {newStatus}","accent":"#4A8C6A"},"children":[]}}
{"op":"add","path":"/elements/bsc-kpi-3","value":{"type":"KPICard","props":{"label":"At","value":"{at formatted as short datetime}"},"children":[]}}
\`\`\`

If \`publishedUrl\` is present in the payload, add a fourth KPICard with label "Published URL" and value set to the URL (add its id to the Section children).

### kind = "performance" — render this spec exactly:

\`\`\`spec
{"op":"add","path":"/root","value":"perf-1"}
{"op":"add","path":"/elements/perf-1","value":{"type":"Section","props":{"title":"Performance logged"},"children":["perf-grid"]}}
{"op":"add","path":"/elements/perf-grid","value":{"type":"Grid","props":{"columns":3},"children":["perf-k1","perf-k2","perf-k3","perf-k4"]}}
{"op":"add","path":"/elements/perf-k1","value":{"type":"KPICard","props":{"label":"Brief","value":"{briefTitle}","subtitle":"{creator}"},"children":[]}}
{"op":"add","path":"/elements/perf-k2","value":{"type":"KPICard","props":{"label":"VPS Predicted","value":"{vpsPrediction or '—'}"},"children":[]}}
{"op":"add","path":"/elements/perf-k3","value":{"type":"KPICard","props":{"label":"Actual Views","value":"{actualViews formatted with commas}"},"children":[]}}
{"op":"add","path":"/elements/perf-k4","value":{"type":"KPICard","props":{"label":"Delta","value":"{performanceDelta with +/- sign, or 'No prediction on record' if null}","accent":"{'#4A8C6A' if delta>=0, '#C07B74' if delta<0, '#6B6D6D' if null}"},"children":[]}}
\`\`\`

If \`actualEngagementRate\` is non-null, add a fifth KPICard "Engagement" with value "\{rate\}%" and include its id in the Grid children.

Never respond to a \`[__TRENDZO_ACTION_RESULT__]\` message with text only. The operator must always see the card.
- No events? Suggest adding for agency niches. No briefs? Suggest generating from events. Empty calendar? Point to Events → Briefs → Push → Calendar workflow.

CRITICAL JSON-RENDER SPEC FORMAT:
Output valid JSONL patches in \`\`\`spec code fence. RFC 6902 JSON Patch. Every ID in "children" MUST have matching entry in elements. Components without children: "children": []. Simple IDs: "section-1", "card-1". One patch per line.
\`\`\`spec
{"op":"add","path":"/root","value":"main"}
{"op":"add","path":"/elements/main","value":{"type":"Section","props":{"title":"Overview"},"children":["grid-1"]}}
{"op":"add","path":"/elements/grid-1","value":{"type":"Grid","props":{"columns":2},"children":["c-1"]}}
{"op":"add","path":"/elements/c-1","value":{"type":"CreatorCard","props":{"name":"Luna","niche":"fitness","vpsScore":87},"children":[]}}
\`\`\`

## SESSION
${isRestoredSession ? "Continuing session — don't re-introduce or repeat alerts already shown. If auto-greeting fires on restored session, give brief 'Welcome back' instead of full briefing." : 'New session.'}
Operator may reference prior context — use conversation history.`;

  console.log(`[agency-chat] System prompt: ~${Math.ceil(systemPrompt.length / 4)} tokens (${systemPrompt.length} chars)`);

  // Cap messages sent to model at 40 most recent to manage token costs
  const cappedMessages = messages.length > 40 ? messages.slice(-40) : messages;
  const modelMessages = await convertToModelMessages(cappedMessages);

  // Silent read tools — fetch data the model can reference in its spec response.
  // Writes remain ActionButton-driven (see action-handler.ts cases
  // update_brief_status and log_performance).
  const origin = new URL(req.url).origin;
  const cookieHeader = req.headers.get('cookie') || '';

  // Zod schemas hoisted + typed so the AI SDK's tool() generic chain doesn't blow
  // up TS inference (TS2589). Execute args are annotated explicitly for the same reason.
  const briefStatusSchema = z.object({
    status: z
      .enum(['pending', 'delivered', 'acknowledged', 'in_production', 'published', 'failed'])
      .optional()
      .describe('Status filter. delivered/acknowledged/in_production/published match completion_status; pending/failed match delivery_status.'),
    creator_name: z.string().optional().describe('Case-insensitive substring match on the creator business name.'),
  });
  type BriefStatusInput = z.infer<typeof briefStatusSchema>;

  const performanceSchema = z.object({
    period: z.enum(['week', 'month', 'all']).optional().describe("Window over measured briefs. Defaults to 'all'."),
    creator_name: z.string().optional().describe('Case-insensitive substring match on the creator business name.'),
  });
  type PerformanceInput = z.infer<typeof performanceSchema>;

  // @ts-expect-error — AI SDK v6 tool() generic chain + zod schema hits TS2589 (deep instantiation). Runtime is fine.
  const getBriefsByStatus = tool({
    description:
      "Fetch content briefs filtered by completion status and/or creator name. " +
      "Use when the operator asks things like 'show me delivered briefs', 'what's waiting to be acknowledged', " +
      "'what did Luna publish this week'. Returns brief rows (id, creator, title, completion_status, timestamps) " +
      "for the model to render through the normal JSONL-spec pipeline.",
    inputSchema: briefStatusSchema,
    execute: async (input: BriefStatusInput) => {
      const { status, creator_name } = input;
      const url = new URL('/api/brief-status', origin);
      if (status) url.searchParams.set('status', status);
      if (creator_name) url.searchParams.set('creator_name', creator_name);
      try {
        const r = await fetch(url.toString(), { headers: { cookie: cookieHeader } });
        const data = await r.json();
        if (!r.ok) return { error: data?.error || `brief-status GET failed (${r.status})`, briefs: [] };
        return data;
      } catch (e: any) {
        return { error: e?.message || 'fetch failed', briefs: [] };
      }
    },
  });

  // @ts-expect-error — AI SDK v6 tool() generic chain + zod schema hits TS2589 (deep instantiation). Runtime is fine.
  const getPerformanceSummary = tool({
    description:
      "Fetch aggregate performance across published briefs with logged actuals. " +
      "Use when the operator asks 'how did last week's briefs do', 'performance across all creators', " +
      "'top performer', 'biggest miss'. Returns total count, avg delta, top performer, biggest miss, and the underlying rows.",
    inputSchema: performanceSchema,
    execute: async (input: PerformanceInput) => {
      const { period, creator_name } = input;
      const url = new URL('/api/brief-performance', origin);
      if (period) url.searchParams.set('period', period);
      if (creator_name) url.searchParams.set('creator_name', creator_name);
      try {
        const r = await fetch(url.toString(), { headers: { cookie: cookieHeader } });
        const data = await r.json();
        if (!r.ok) return { error: data?.error || `brief-performance GET failed (${r.status})` };
        return data;
      } catch (e: any) {
        return { error: e?.message || 'fetch failed' };
      }
    },
  });

  // Stage 3 Phase 1: Anthropic + prompt caching. System message carries
  // providerOptions.anthropic.cacheControl so Claude reuses the cached system
  // across turns in the same session (90% discount on cached input tokens).
  // Acceptance: second call in the same session should show cachedInputTokens > 0.
  const result = streamText({
    model: anthropic('claude-haiku-4-5'),
    messages: [
      {
        role: 'system',
        content: systemPrompt,
        providerOptions: {
          anthropic: { cacheControl: { type: 'ephemeral' } },
        },
      },
      ...modelMessages,
    ],
    tools: {
      get_briefs_by_status: getBriefsByStatus,
      get_performance_summary: getPerformanceSummary,
    },
    stopWhen: stepCountIs(3),
  });

  // Fire-and-forget usage log — proves cache is working without blocking stream.
  result.usage
    .then((u: any) => {
      const cached = u.cachedInputTokens ?? u.cache_read_input_tokens ?? 0;
      console.log(
        `[agency-chat] Usage: input=${u.inputTokens ?? u.promptTokens ?? '?'} ` +
        `output=${u.outputTokens ?? u.completionTokens ?? '?'} cached=${cached}`
      );
    })
    .catch(() => {});

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      writer.merge(pipeJsonRender(result.toUIMessageStream()));
    },
    onError: (error) => {
      console.error('[agency-chat] Stream error:', error);
      return error instanceof Error ? error.message : String(error);
    },
  });

  return createUIMessageStreamResponse({ stream });
  } catch (error) {
    console.error('[agency-chat] Unhandled error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', detail: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
