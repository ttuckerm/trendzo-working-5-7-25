/**
 * Proactive Notification Engine
 *
 * Scans agency data and generates prioritized alerts that the AI can
 * surface at the start of a session without being asked.
 *
 * Pure function — takes data in, returns alerts out. No DB calls.
 */

export interface ProactiveAlert {
  id: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  type:
    | 'stalled_creator'
    | 'upcoming_event_no_content'
    | 'overdue_deadline'
    | 'performance_drop'
    | 'milestone'
    | 'coverage_gap';
  title: string;
  description: string;
  affected_creators?: string[];
  affected_event?: string;
  suggested_action: string;
  data?: Record<string, any>;
}

interface AgencyData {
  onboardingProfiles: any[];
  enrichedEvents: any[];
  enrichedBriefs: any[];
  predictionRuns: any[];
  scripts: any[];
  calendarItems: any[];
}

const PRIORITY_ORDER: Record<ProactiveAlert['priority'], number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const MAX_ALERTS = 5;

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

// ---------------------------------------------------------------------------
// Detection rules
// ---------------------------------------------------------------------------

function detectStalledCreators(data: AgencyData): ProactiveAlert[] {
  const now = Date.now();
  const alerts: ProactiveAlert[] = [];

  for (const profile of data.onboardingProfiles) {
    const stage = profile.creator_stage || profile.onboarding_step || '';
    if (stage === 'active') continue;

    const updatedAt = profile.updated_at ? new Date(profile.updated_at).getTime() : 0;
    if (!updatedAt) continue;

    const daysSinceUpdate = Math.floor((now - updatedAt) / (1000 * 60 * 60 * 24));
    if (daysSinceUpdate < 7) continue;

    const name = profile.business_name || profile.creator_name || 'Unknown';
    alerts.push({
      id: `stalled_creator_${slugify(name)}`,
      priority: 'high',
      type: 'stalled_creator',
      title: `${name} has been stalled in ${stage} for ${daysSinceUpdate} days`,
      description: `This creator hasn't progressed since ${new Date(updatedAt).toLocaleDateString()}.`,
      affected_creators: [name],
      suggested_action: 'Send a nudge to get them moving',
      data: { creator_name: name, stage, days_stalled: daysSinceUpdate },
    });
  }

  return alerts;
}

function detectUpcomingEventsNoContent(data: AgencyData): ProactiveAlert[] {
  const alerts: ProactiveAlert[] = [];

  for (const event of data.enrichedEvents) {
    const daysUntil = event.days_until;
    if (daysUntil == null || daysUntil < 0 || daysUntil > 7) continue;

    // Check if any brief references this event
    const hasBrief = data.enrichedBriefs.some(
      (b: any) =>
        b.event_name === event.event_name ||
        b.event_id === event.id ||
        b.cultural_event_id === event.id,
    );
    if (hasBrief) continue;
    if (event.content_planned || event.brief_id) continue;

    const name = event.event_name || event.title || 'Unnamed event';
    alerts.push({
      id: `upcoming_event_no_content_${slugify(name)}`,
      priority: daysUntil <= 3 ? 'critical' : 'high',
      type: 'upcoming_event_no_content',
      title: `${name} is in ${daysUntil} day${daysUntil === 1 ? '' : 's'} with no content planned`,
      description: `This event is approaching fast and no brief or content assignment exists yet.`,
      affected_event: name,
      suggested_action: 'Generate briefs and assign creators now',
      data: { event_name: name, days_until: daysUntil, event_date: event.event_date },
    });
  }

  return alerts;
}

function detectOverdueDeadlines(data: AgencyData): ProactiveAlert[] {
  const now = new Date();
  const alerts: ProactiveAlert[] = [];

  for (const brief of data.enrichedBriefs) {
    const deadline = brief.deadline || brief.due_date;
    if (!deadline) continue;
    if (new Date(deadline) >= now) continue;
    if (brief.status === 'completed' || brief.status === 'published') continue;

    const unpublished = (brief.assigned_creators || []).filter(
      (c: any) => c.status !== 'published' && c.status !== 'completed',
    );
    if (unpublished.length === 0) continue;

    const title = brief.title || brief.event_name || 'Untitled brief';
    const names = unpublished.map((c: any) => c.name || c.creator_name || 'Unknown');

    alerts.push({
      id: `overdue_deadline_${slugify(title)}`,
      priority: 'critical',
      type: 'overdue_deadline',
      title: `Brief '${title}' deadline has passed — ${unpublished.length} creator${unpublished.length === 1 ? '' : 's'} haven't published`,
      description: `Deadline was ${new Date(deadline).toLocaleDateString()}.`,
      affected_creators: names,
      suggested_action: 'Follow up with creators or extend the deadline',
      data: { brief_title: title, deadline, unpublished_count: unpublished.length },
    });
  }

  return alerts;
}

function detectPerformanceDrops(data: AgencyData): ProactiveAlert[] {
  const alerts: ProactiveAlert[] = [];

  // Group prediction runs by creator, sorted by date desc
  const byCreator = new Map<string, any[]>();
  for (const run of data.predictionRuns) {
    const key = run.creator_id || run.user_id || '';
    if (!key) continue;
    if (!byCreator.has(key)) byCreator.set(key, []);
    byCreator.get(key)!.push(run);
  }

  for (const [creatorId, runs] of byCreator) {
    const sorted = runs
      .filter((r: any) => r.vps_score != null || r.predicted_vps != null)
      .sort(
        (a: any, b: any) =>
          new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime(),
      );

    if (sorted.length < 2) continue;

    const current = sorted[0].vps_score ?? sorted[0].predicted_vps ?? 0;
    const previous = sorted[1].vps_score ?? sorted[1].predicted_vps ?? 0;

    if (previous - current < 10) continue;

    // Resolve name from onboarding profiles
    const profile = data.onboardingProfiles.find(
      (p: any) => p.id === creatorId || p.user_id === creatorId,
    );
    const name = profile?.business_name || profile?.creator_name || creatorId;

    alerts.push({
      id: `performance_drop_${slugify(name)}`,
      priority: 'high',
      type: 'performance_drop',
      title: `${name}'s VPS dropped from ${Math.round(previous)} to ${Math.round(current)}`,
      description: `A ${Math.round(previous - current)}-point VPS decline detected in the most recent prediction.`,
      affected_creators: [name],
      suggested_action: 'Review their recent content and adjust strategy',
      data: { creator_name: name, previous_vps: previous, current_vps: current },
    });
  }

  return alerts;
}

function detectMilestones(data: AgencyData): ProactiveAlert[] {
  const alerts: ProactiveAlert[] = [];

  for (const run of data.predictionRuns) {
    const score = run.vps_score ?? run.predicted_vps ?? 0;
    if (score < 85) continue;

    const creatorId = run.creator_id || run.user_id || '';
    const profile = data.onboardingProfiles.find(
      (p: any) => p.id === creatorId || p.user_id === creatorId,
    );
    const name = profile?.business_name || profile?.creator_name || creatorId;
    if (!name) continue;

    // Only keep the highest-scoring milestone per creator
    const existing = alerts.find((a) => a.affected_creators?.[0] === name);
    if (existing) {
      if ((existing.data?.score ?? 0) >= score) continue;
      // Replace with higher score
      alerts.splice(alerts.indexOf(existing), 1);
    }

    alerts.push({
      id: `milestone_${slugify(name)}`,
      priority: 'low',
      type: 'milestone',
      title: `${name} hit a VPS of ${Math.round(score)} — top performer!`,
      description: `Outstanding prediction score. Consider leveraging this momentum.`,
      affected_creators: [name],
      suggested_action: 'Leverage this momentum with high-priority briefs',
      data: { creator_name: name, score },
    });
  }

  return alerts;
}

function detectCoverageGaps(data: AgencyData): ProactiveAlert[] {
  const alerts: ProactiveAlert[] = [];

  // Collect all niches from creators
  const niches = new Set<string>();
  for (const p of data.onboardingProfiles) {
    const niche = p.selected_niche || p.niche_key;
    if (niche) niches.add(niche);
  }

  const fourteenDaysFromNow = 14;

  for (const niche of niches) {
    // Check if any upcoming events or briefs cover this niche
    const hasUpcomingEvent = data.enrichedEvents.some(
      (e: any) =>
        e.days_until != null &&
        e.days_until >= 0 &&
        e.days_until <= fourteenDaysFromNow &&
        (e.relevant_niches?.includes(niche) || e.niche === niche || e.category === niche),
    );

    const hasUpcomingBrief = data.enrichedBriefs.some(
      (b: any) =>
        b.niche === niche ||
        b.assigned_creators?.some((c: any) => c.niche === niche),
    );

    const hasCalendarItem = data.calendarItems.some(
      (item: any) => item.niche === niche || item.creator_niche === niche,
    );

    if (hasUpcomingEvent || hasUpcomingBrief || hasCalendarItem) continue;

    alerts.push({
      id: `coverage_gap_${slugify(niche)}`,
      priority: 'medium',
      type: 'coverage_gap',
      title: `No content planned for ${niche} niche in the next 2 weeks`,
      description: `Creators in this niche have no upcoming events, briefs, or scheduled posts.`,
      suggested_action: `Add cultural events or create briefs for ${niche} creators`,
      data: { niche },
    });
  }

  return alerts;
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export function generateProactiveAlerts(agencyData: AgencyData): ProactiveAlert[] {
  const all: ProactiveAlert[] = [
    ...detectStalledCreators(agencyData),
    ...detectUpcomingEventsNoContent(agencyData),
    ...detectOverdueDeadlines(agencyData),
    ...detectPerformanceDrops(agencyData),
    ...detectMilestones(agencyData),
    ...detectCoverageGaps(agencyData),
  ];

  // Deduplicate: if a creator triggers multiple alert types, keep highest priority
  const byCreator = new Map<string, ProactiveAlert>();
  const nonCreatorAlerts: ProactiveAlert[] = [];

  for (const alert of all) {
    const creatorKey = alert.affected_creators?.[0];
    if (!creatorKey) {
      nonCreatorAlerts.push(alert);
      continue;
    }

    const existing = byCreator.get(creatorKey);
    if (!existing || PRIORITY_ORDER[alert.priority] < PRIORITY_ORDER[existing.priority]) {
      byCreator.set(creatorKey, alert);
    }
  }

  const deduplicated = [...byCreator.values(), ...nonCreatorAlerts];

  // Sort by priority
  deduplicated.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);

  return deduplicated.slice(0, MAX_ALERTS);
}
