import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env';
import { getAgencyCreators } from '@/lib/auth/agency-utils';

function getServiceClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
}

// ── Types ────────────────────────────────────────────────────────────

export interface AgencyStats {
  activeCreators: number;
  avgVPS: number;
  contentThisWeek: number;
  briefsPending: number;
}

export interface AgencyCreator {
  userId: string;
  name: string;
  niche: string;
  status: 'active' | 'inactive' | 'onboarding';
  latestVPS: number;
  avgVPS: number;
  scriptCount: number;
}

export interface AgencyAlert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  detail?: string;
  timestamp: string;
}

export interface BriefVariant {
  variant_label: 'A' | 'B' | 'C';
  brief_content: {
    title: string;
    hook: string;
    angle: string;
    format: string;
    talking_points: string[];
    cta: string;
    estimated_vps: number;
    reasoning: string;
  };
  vps_score: number;
  feature_dimensions_varied: Record<string, string>;
}

export interface AgencyBrief {
  id: string;
  creatorName: string;
  title: string;
  status: 'draft' | 'in-progress' | 'approved' | 'published';
  createdAt: string;
  niche?: string;
  // Pre-generated brief fields (for review)
  briefContent?: {
    title: string;
    hook: string;
    angle: string;
    format: string;
    talking_points: string[];
    cta: string;
    estimated_vps: number;
    reasoning: string;
  };
  vpsScore?: number;
  priorityType?: string;
  eventTitle?: string;
  clientId?: string;
  source?: 'pre_generated' | 'content_brief';
  variants?: BriefVariant[];
  hasMeaningfulAlternatives?: boolean;
  finalCriticScore?: number;
}

export interface CoachingInsight {
  id: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  recommendation: string;
  creatorName?: string;
}

// ── Queries ──────────────────────────────────────────────────────────

export async function getAgencyStats(agencyId: string): Promise<AgencyStats> {
  const db = getServiceClient();
  const creatorIds = await getAgencyCreators(agencyId);

  if (creatorIds.length === 0) {
    return { activeCreators: 0, avgVPS: 0, contentThisWeek: 0, briefsPending: 0 };
  }

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [profilesRes, scriptsRes, briefsRes] = await Promise.all([
    db.from('onboarding_profiles')
      .select('user_id, creator_stage, onboarding_step')
      .in('user_id', creatorIds),
    db.from('generated_scripts')
      .select('id, vps_score, created_at, onboarding_profile_id')
      .in('user_id', creatorIds)
      .gte('created_at', weekAgo),
    db.from('content_briefs')
      .select('id, status')
      .in('user_id', creatorIds)
      .in('status', ['draft', 'in-progress']),
  ]);

  const profiles = profilesRes.data || [];
  const scripts = scriptsRes.data || [];
  const briefs = briefsRes.data || [];

  const activeCount = profiles.filter(p => {
    const stage = p.creator_stage || p.onboarding_step || '';
    return stage === 'complete' || stage === 'completed' || stage === 'active';
  }).length;

  const vpsScores = scripts
    .map(s => s.vps_score as number)
    .filter(v => v > 0);
  const avgVPS = vpsScores.length > 0
    ? Math.round(vpsScores.reduce((a, b) => a + b, 0) / vpsScores.length)
    : 0;

  return {
    activeCreators: activeCount || profiles.length,
    avgVPS,
    contentThisWeek: scripts.length,
    briefsPending: briefs.length,
  };
}

export async function getAgencyCreatorsList(agencyId: string): Promise<AgencyCreator[]> {
  const db = getServiceClient();
  const creatorIds = await getAgencyCreators(agencyId);

  if (creatorIds.length === 0) return [];

  const [profilesRes, scriptsRes] = await Promise.all([
    db.from('onboarding_profiles')
      .select('id, user_id, business_name, niche_key, selected_niche, creator_stage, onboarding_step')
      .in('user_id', creatorIds),
    db.from('generated_scripts')
      .select('id, vps_score, onboarding_profile_id')
      .in('user_id', creatorIds)
      .order('created_at', { ascending: false })
      .limit(200),
  ]);

  const profiles = profilesRes.data || [];
  const scripts = scriptsRes.data || [];

  return profiles.map(p => {
    const creatorScripts = scripts.filter(s => s.onboarding_profile_id === p.id);
    const vpsScores = creatorScripts.map(s => s.vps_score as number).filter(v => v > 0);
    const rawStatus = p.creator_stage || p.onboarding_step || '';
    const status: AgencyCreator['status'] =
      (rawStatus === 'complete' || rawStatus === 'completed') ? 'active'
        : (rawStatus === 'foundation' || rawStatus === 'onboarding' || rawStatus === 'migrated') ? 'onboarding'
          : 'inactive';

    return {
      userId: p.user_id,
      name: p.business_name || 'Unknown Creator',
      niche: p.selected_niche || p.niche_key || 'General',
      status,
      latestVPS: vpsScores.length > 0 ? Math.max(...vpsScores) : 0,
      avgVPS: vpsScores.length > 0
        ? Math.round(vpsScores.reduce((a, b) => a + b, 0) / vpsScores.length)
        : 0,
      scriptCount: creatorScripts.length,
    };
  });
}

export async function getAgencyAlerts(agencyId: string): Promise<AgencyAlert[]> {
  // TODO: Wire to proactive-engine.ts when it exists.
  // For now, derive alerts from creator data heuristics.
  const creators = await getAgencyCreatorsList(agencyId);
  const alerts: AgencyAlert[] = [];
  const now = new Date().toISOString();

  const inactive = creators.filter(c => c.status === 'inactive');
  if (inactive.length > 0) {
    alerts.push({
      id: 'alert-inactive',
      severity: 'warning',
      message: `${inactive.length} creator${inactive.length > 1 ? 's' : ''} inactive`,
      detail: inactive.map(c => c.name).join(', '),
      timestamp: now,
    });
  }

  const lowVPS = creators.filter(c => c.latestVPS > 0 && c.latestVPS < 40);
  if (lowVPS.length > 0) {
    alerts.push({
      id: 'alert-low-vps',
      severity: 'critical',
      message: `${lowVPS.length} creator${lowVPS.length > 1 ? 's' : ''} below VPS 40`,
      detail: lowVPS.map(c => `${c.name} (${c.latestVPS})`).join(', '),
      timestamp: now,
    });
  }

  const noContent = creators.filter(c => c.scriptCount === 0 && c.status === 'active');
  if (noContent.length > 0) {
    alerts.push({
      id: 'alert-no-content',
      severity: 'info',
      message: `${noContent.length} active creator${noContent.length > 1 ? 's' : ''} with no scripts`,
      detail: 'Consider generating briefs for these creators',
      timestamp: now,
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      id: 'alert-all-good',
      severity: 'info',
      message: 'All systems nominal',
      detail: 'No issues detected across your roster',
      timestamp: now,
    });
  }

  return alerts;
}

export async function getAgencyBriefs(agencyId: string): Promise<AgencyBrief[]> {
  const db = getServiceClient();
  const creatorIds = await getAgencyCreators(agencyId);

  if (creatorIds.length === 0) return [];

  // Fetch both content_briefs AND pre_generated_briefs (for review queue)
  const [briefsRes, preGenRes, profilesRes] = await Promise.all([
    db.from('content_briefs')
      .select('id, user_id, status, created_at, topic, niche_key')
      .in('user_id', creatorIds)
      .order('created_at', { ascending: false })
      .limit(20),
    db.from('pre_generated_briefs')
      .select('id, client_id, brief_content, vps_score, priority_type, status, generated_at, niche, final_critic_score, cultural_event_id')
      .eq('agency_id', agencyId)
      .in('status', ['draft', 'presented'])
      .order('vps_score', { ascending: false })
      .limit(30),
    db.from('onboarding_profiles')
      .select('user_id, business_name')
      .in('user_id', creatorIds),
  ]);

  const profiles = profilesRes.data || [];
  const nameMap = new Map(profiles.map((p: any) => [p.user_id, p.business_name || 'Unknown']));

  // Fetch cultural event titles for pre-generated briefs
  const preGenBriefs = preGenRes.data || [];
  const eventIds = [...new Set(preGenBriefs.map((b: any) => b.cultural_event_id).filter(Boolean))];
  let eventMap: Record<number, string> = {};
  if (eventIds.length > 0) {
    const { data: events } = await db.from('cultural_events').select('id, event_title').in('id', eventIds);
    (events || []).forEach((e: any) => { eventMap[e.id] = e.event_title; });
  }

  // Fetch variants for pre-generated briefs
  const preGenIds = preGenBriefs.map((b: any) => b.id);
  let variantsMap: Record<number, BriefVariant[]> = {};
  if (preGenIds.length > 0) {
    const { data: variants } = await db
      .from('brief_variants')
      .select('brief_id, variant_label, brief_content, vps_score, feature_dimensions_varied')
      .in('brief_id', preGenIds)
      .order('variant_label', { ascending: true });
    for (const v of variants || []) {
      if (!variantsMap[v.brief_id]) variantsMap[v.brief_id] = [];
      variantsMap[v.brief_id].push({
        variant_label: v.variant_label,
        brief_content: v.brief_content,
        vps_score: v.vps_score,
        feature_dimensions_varied: v.feature_dimensions_varied,
      });
    }
  }

  // Map content_briefs (already approved/published)
  const statusMap: Record<string, AgencyBrief['status']> = {
    draft: 'draft', pending: 'draft', 'in-progress': 'in-progress',
    active: 'in-progress', approved: 'approved', completed: 'published',
    published: 'published', generated: 'in-progress', accepted: 'approved',
  };

  const contentBriefs: AgencyBrief[] = (briefsRes.data || []).map((b: any) => ({
    id: `cb-${b.id}`,
    creatorName: nameMap.get(b.user_id) || 'Unknown',
    title: b.topic || 'Untitled Brief',
    status: statusMap[b.status] || 'draft',
    createdAt: b.created_at,
    niche: b.niche_key,
    source: 'content_brief' as const,
  }));

  // Map pre_generated_briefs (pending review) with variants
  const pendingBriefs: AgencyBrief[] = preGenBriefs.map((b: any) => {
    const variants = variantsMap[b.id] || [];
    const variantA = variants.find((v: any) => v.variant_label === 'A');
    const alternatives = variants.filter((v: any) => v.variant_label !== 'A');
    const primaryVps = variantA?.vps_score ?? b.vps_score ?? 0;
    const hasMeaningful = alternatives.some(
      (v: any) => Math.abs((v.vps_score ?? 0) - primaryVps) > 5
    );

    return {
      id: String(b.id),
      creatorName: nameMap.get(b.client_id) || 'Unknown',
      clientId: b.client_id,
      title: b.brief_content?.title || 'Untitled Brief',
      status: 'draft' as const,
      createdAt: b.generated_at,
      niche: b.niche,
      briefContent: b.brief_content,
      vpsScore: b.vps_score,
      priorityType: b.priority_type,
      eventTitle: eventMap[b.cultural_event_id] || undefined,
      finalCriticScore: b.final_critic_score,
      source: 'pre_generated' as const,
      variants: variants.length > 0 ? variants : undefined,
      hasMeaningfulAlternatives: hasMeaningful,
    };
  });

  // Pending briefs first (for review), then content briefs (already processed)
  return [...pendingBriefs, ...contentBriefs];
}

export function getCoachingInsights(creators: AgencyCreator[]): CoachingInsight[] {
  const insights: CoachingInsight[] = [];

  const topPerformer = creators.reduce<AgencyCreator | null>(
    (best, c) => (!best || c.latestVPS > best.latestVPS) ? c : best, null
  );
  if (topPerformer && topPerformer.latestVPS > 60) {
    insights.push({
      id: 'insight-top-study',
      priority: 'medium',
      title: 'Study top performer patterns',
      recommendation: `${topPerformer.name}'s content (VPS ${topPerformer.latestVPS}) has replicable patterns. Generate briefs based on their formula.`,
      creatorName: topPerformer.name,
    });
  }

  const struggling = creators.filter(c => c.latestVPS > 0 && c.latestVPS < 35);
  if (struggling.length > 0) {
    insights.push({
      id: 'insight-struggling',
      priority: 'high',
      title: 'Creators need coaching',
      recommendation: `${struggling.map(c => c.name).join(', ')} scored below 35 VPS. Review their hooks and delivery baseline.`,
    });
  }

  const highPotential = creators.filter(c => c.avgVPS >= 50 && c.scriptCount >= 3);
  if (highPotential.length > 0) {
    insights.push({
      id: 'insight-momentum',
      priority: 'low',
      title: 'Momentum builders',
      recommendation: `${highPotential.map(c => c.name).join(', ')} maintain VPS 50+. Increase posting frequency to capitalize.`,
    });
  }

  if (insights.length === 0) {
    insights.push({
      id: 'insight-default',
      priority: 'low',
      title: 'Build your roster',
      recommendation: 'Add creators to start generating coaching insights and performance patterns.',
    });
  }

  return insights;
}
