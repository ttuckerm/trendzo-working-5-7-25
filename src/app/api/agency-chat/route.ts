import { streamText, convertToModelMessages } from 'ai';
import { createUIMessageStream, createUIMessageStreamResponse } from 'ai';
import { openai } from '@ai-sdk/openai';
import { pipeJsonRender } from '@json-render/core';
import { trendzoCatalog } from '@/lib/trendzo-catalog';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getUserAgencyId, getAgencyCreators } from '@/lib/auth/agency-utils';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
  const { messages } = await req.json();

  // Authenticate user
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  console.log('[agency-chat] Auth result:', { userId: user?.id, authError: authError?.message });

  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized', detail: authError?.message }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Get agency scope (gracefully handle no agency — serve with empty data)
  const agencyId = await getUserAgencyId(user.id);
  console.log('[agency-chat] Agency lookup:', { userId: user.id, agencyId });

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

  if (agencyId) {
    const creatorIds = await getAgencyCreators(agencyId);
    const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Step 1: Fetch profiles and briefs by user_id
    const [profilesResult, briefsResult] = await Promise.all([
      serviceClient
        .from('onboarding_profiles')
        .select('id, user_id, business_name, niche_key, selected_niche, creator_stage, onboarding_step')
        .in('user_id', creatorIds.length > 0 ? creatorIds : ['']),
      serviceClient
        .from('content_briefs')
        .select('id, user_id, status')
        .in('user_id', creatorIds.length > 0 ? creatorIds : ['']),
    ]);

    profiles = profilesResult.data || [];
    briefs = briefsResult.data || [];

    // Step 2: Fetch scripts by profile IDs (onboarding_profile_id != user_id)
    const profileIds = profiles.map((p: any) => p.id);
    const { data: scriptsData } = await serviceClient
      .from('generated_scripts')
      .select('id, script_text, vps_score, status, created_at, onboarding_profile_id, niche_key, user_id')
      .in('onboarding_profile_id', profileIds.length > 0 ? profileIds : [''])
      .order('created_at', { ascending: false })
      .limit(50);

    scripts = scriptsData || [];

    // Onboarding details: full profile data for onboarding management components
    try {
      const { data: obData } = await serviceClient
        .from('onboarding_profiles')
        .select('*')
        .in('user_id', creatorIds.length > 0 ? creatorIds : [''])
        .order('created_at', { ascending: false });
      onboardingDetails = obData || [];
    } catch (e) {
      console.warn('[agency-chat] onboarding_profiles full query failed:', e);
    }

    // Invitations table (may not exist yet)
    try {
      const { data: inviteData } = await serviceClient
        .from('agency_invitations')
        .select('*')
        .eq('agency_id', agencyId)
        .order('created_at', { ascending: false });
      invitations = inviteData || [];
    } catch {
      // Table may not exist yet — that's fine
      invitations = [];
    }

    // Cultural events (table may not exist yet)
    try {
      const { data: eventData } = await serviceClient
        .from('cultural_events')
        .select('*')
        .eq('agency_id', agencyId)
        .order('event_date', { ascending: true });
      culturalEvents = eventData || [];
    } catch {
      // Table doesn't exist yet — that's fine
    }

    // Try alternative table name if primary didn't return results
    if (culturalEvents.length === 0) {
      try {
        const { data: altEventData } = await serviceClient
          .from('agency_events')
          .select('*')
          .eq('agency_id', agencyId)
          .order('event_date', { ascending: true });
        culturalEvents = altEventData || [];
      } catch {
        // Also doesn't exist — we'll provide empty state guidance
      }
    }

    // Fetch content briefs with assignments
    try {
      const { data: briefData } = await serviceClient
        .from('content_briefs')
        .select('*')
        .eq('agency_id', agencyId)
        .order('created_at', { ascending: false })
        .limit(50)
      contentBriefs = briefData || []
    } catch {
      contentBriefs = []
    }

    // Fetch brief assignments / push status if table exists
    try {
      const { data: assignData } = await serviceClient
        .from('brief_assignments')
        .select('*')
        .in('brief_id', (contentBriefs || []).map((b: any) => b.id).filter(Boolean))
      briefAssignments = assignData || []
    } catch {
      briefAssignments = []
    }

    // Also try content_brief_creators as alternative table
    if (briefAssignments.length === 0) {
      try {
        const { data: altAssignData } = await serviceClient
          .from('content_brief_creators')
          .select('*')
          .in('brief_id', (contentBriefs || []).map((b: any) => b.id).filter(Boolean))
        briefAssignments = altAssignData || []
      } catch {
        // Table doesn't exist — fine
      }
    }

    // Deep-dive data: prediction runs + cohort stats (wrapped in try/catch — tables may not exist)
    let cohortStats: any[] = [];

    try {
      const { data: prData } = await serviceClient
        .from('prediction_runs_enriched')
        .select('*')
        .in('creator_id', creatorIds.length > 0 ? creatorIds : [''])
        .order('created_at', { ascending: false })
        .limit(200);
      predictionRuns = prData || [];
    } catch (e) {
      console.warn('[agency-chat] prediction_runs_enriched query failed:', e);
    }

    try {
      const { data: csData } = await serviceClient
        .from('dps_v2_cohort_stats')
        .select('*');
      cohortStats = csData || [];
    } catch (e) {
      console.warn('[agency-chat] dps_v2_cohort_stats query failed:', e);
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

  // Generate catalog prompt in inline mode
  const catalogPrompt = trendzoCatalog.prompt({ mode: 'inline' });

  const systemPrompt = `You are Trendzo Engine — the AI brain behind a TikTok agency management platform.

PERSONALITY:
- Confident, data-driven, slightly edgy
- You speak like a senior strategist, not a chatbot
- Use the agency data below to give specific, actionable insights
- When showing data, ALWAYS use the UI components — never just list numbers in text

AGENCY DATA (LIVE):
${agencyContext}

CREATOR DEEP-DIVE DATA:
Use this data to populate CreatorProfile, VPSTimeline, NicheRanking, ContentTable, EngagementBreakdown, and RecommendationCard components.

${JSON.stringify(creatorDeepDiveData, null, 2)}

DEEP-DIVE GUIDELINES:
When a user asks for a "deep dive", "analysis", "profile", or "everything about" a specific creator:
1. Start with a CreatorProfile as the hero element
2. Follow with VPSTimeline showing their score trajectory
3. Add NicheRanking to show peer comparison
4. Include ContentTable with their video performance data
5. Add EngagementBreakdown comparing their rates to niche averages
6. End with 1-2 RecommendationCards with strategic advice based on the data patterns you see

For the RecommendationCards, analyze the data to generate genuine insights:
- If share_rate is below niche average → recommend content strategy changes
- If VPS is trending down → flag it as concern with specific timeframe
- If they rank #1 in niche → recommend leveraging their position
- If view_to_follower_ratio is very high → highlight viral potential
- If engagement grades are low → recommend engagement optimization tactics
- Always include 2-3 specific, actionable items

When rendering VPSTimeline, set trend to:
- "rising" if latest score > score from 3+ entries ago
- "falling" if latest score < score from 3+ entries ago
- "stable" otherwise

When rendering NicheRanking, if rank data is unavailable (null), skip the component and mention limited niche data.
When rendering EngagementBreakdown, grade: A = all above avg, B = most above, C = mixed, D = most below, F = all below.

## ONBOARDING MANAGEMENT DATA
Use this data to populate OnboardingPipeline, OnboardingStats, CalibrationProgress, OnboardingCreatorRow, InviteCard, and OnboardingTimeline components.

### Pipeline Overview
${JSON.stringify({ pipeline: pipelineData, stats: onboardingStatsData }, null, 2)}

### Per-Creator Calibration Status
${JSON.stringify(calibrationData, null, 2)}

### Per-Creator Onboarding Timelines
${JSON.stringify(onboardingTimelineData, null, 2)}

### Invitations
${JSON.stringify(invitations.length > 0 ? invitations : 'No separate invitations table — derive from onboarding profiles above', null, 2)}

## ONBOARDING RESPONSE GUIDELINES
When a user asks about "onboarding", "pipeline", "who's onboarding", "onboarding status", or similar:
1. Start with OnboardingStats showing the funnel summary
2. Follow with OnboardingPipeline showing creators at each stage
3. If asked about a specific creator's onboarding, show CalibrationProgress and OnboardingTimeline for that person
4. Use OnboardingCreatorRow for listing multiple creators in compact form
5. Use InviteCard when discussing specific invitations

For stalled creators (days_in_stage > 7), proactively flag them with a suggestion to nudge.
If a creator has a blocker, mention it in your response text.

When the user asks to "invite" or "add" a creator, respond conversationally confirming the action and render an InviteCard showing the pending invite.

When the user asks to "nudge" a stalled creator, respond confirming and provide specific talking points based on where they're stuck.

Completion rate interpretation:
- 80%+ = "Healthy pipeline"
- 50-79% = "Room for improvement — some creators dropping off"
- <50% = "Concerning — investigate friction points"

## CULTURAL EVENT DATA
Use this data to populate EventCard, EventCalendar, EventForm, TrendAlert, and EventSummary components.

### Event Summary
${JSON.stringify(eventSummaryData, null, 2)}

### All Events (enriched with days_until and status)
${JSON.stringify(enrichedEvents.length > 0 ? enrichedEvents : 'No cultural events entered yet. The agency can add events by asking you to "add an event" or "log a trend."', null, 2)}

### Calendar Events (next 60 days)
${JSON.stringify(calendarEvents, null, 2)}

### Agency Niches (for event-creator matching)
${JSON.stringify(agencyNiches, null, 2)}

### Agency Creators (for event matching)
${JSON.stringify((onboardingDetails || []).map((p: any) => ({ name: p.business_name || p.creator_name, niche: p.selected_niche || p.niche_key || null })), null, 2)}

## CULTURAL EVENT RESPONSE GUIDELINES
When a user asks about "events", "what's coming up", "cultural calendar", "trends", or similar:
1. Start with EventSummary showing the overview stats
2. Follow with EventCalendar in month view showing the upcoming events
3. If there are urgent events (days_until <= 2), show TrendAlert(s) at the top BEFORE the summary
4. For specific events, show EventCard with full details

When a user asks to "add an event", "log a trend", "create a cultural moment", or similar:
1. If they provided event details in their message, extract them and render EventForm in create mode with prefilled values
2. If they gave minimal info, ask clarifying questions about date, category, and description, then render EventForm
3. Include available_niches from the agency data so the form shows relevant niche options
4. Always suggest content angles based on the event and the agency's creator niches

When a user asks "who should create content for [event]?" or "match creators to [event]":
1. Analyze which agency creators' niches align with the event
2. Render an EventCard with matched_creators populated
3. For each matched creator, explain why they're a good fit based on their niche and performance data

When there are NO events in the system:
1. Show EventSummary with all zeros
2. Proactively suggest adding events: "Your cultural events calendar is empty. Want me to help you add some upcoming events? I can suggest relevant cultural moments for your creators' niches: ${agencyNiches.join(', ')}."
3. If the agency asks "what events should I track?", use your knowledge of upcoming cultural moments, holidays, trending topics, and platform trends relevant to their niches to suggest events

For TrendAlerts, only use urgency "immediate" for events happening today or already trending. Use "today" for events happening within 24 hours. Use "this_week" for events within 7 days.

Event category mapping guidance:
- National/international holidays -> "holiday"
- TikTok trends or challenges -> "platform_trend"
- Cultural shifts or societal moments -> "cultural_moment"
- Industry conferences or launches -> "industry_event"
- Seasonal themes (back to school, summer, etc.) -> "seasonal"
- Breaking news or current events -> "news_cycle"
- Trending sounds, formats, or hashtags -> "trending_topic"

## EVENT → CREATOR PUSH DATA
Use this data to populate EventBrief, CreatorMatch, PushStatus, BriefPreview, and PushConfirmation components.

### Existing Content Briefs
${JSON.stringify(enrichedBriefs.length > 0 ? enrichedBriefs : 'No content briefs created yet.', null, 2)}

### Creator Profiles for Event Matching
${JSON.stringify(creatorEventMatchContext, null, 2)}

## EVENT PUSH RESPONSE GUIDELINES
When a user asks to "push an event", "create a brief for [event]", "assign creators to [event]", or similar:
1. First render CreatorMatch cards for the top 2-3 matching creators, explaining why each is a good fit
2. Then render an EventBrief with the complete brief content including talking points, content angle, hashtags, and deadline
3. Finally render a PushConfirmation card with the target creators and a "Confirm & Push" button
4. If the user confirms, show PushStatus with all creators in "sent" state

When generating CreatorMatch fit analysis:
- Match creators by niche relevance (fitness creator + fitness event = high fit)
- Factor in VPS score (higher VPS = more reliable content quality)
- Factor in content volume (more past content = more data to predict performance)
- Consider follower count for reach estimation
- Assign fit_score: 90-100 for perfect niche match with high VPS, 70-89 for good match, 50-69 for tangential fit, below 50 for weak match
- Generate 2-3 specific content angles tailored to each creator's niche perspective

When generating EventBrief content:
- Create 3-5 specific, actionable talking points (not generic advice)
- Suggest relevant hashtags based on the event and platform trends
- Set deadline to 1-2 days before the event date (content should be ready before the moment, not after)
- Include a content format recommendation based on what performs best in the creator's niche
- Personalize angles for each assigned creator based on their niche and past performance

When showing push status, use PushStatus for tracking active pushes and BriefPreview for listing all briefs.

When there are no briefs yet:
- Show an empty state and suggest creating briefs from existing cultural events
- List upcoming events that don't have briefs yet as opportunities

Brief priority mapping:
- "urgent": event is within 48 hours
- "high": event is within 1 week
- "normal": event is 1-4 weeks away
- "low": event is more than 4 weeks away

## BATCH BRIEF GENERATION DATA
Use this data to populate BriefGrid, BriefEditor, BatchProgress, CreatorBriefAssignment, and BatchSummary components.

### Batch Aggregation
${JSON.stringify(batchAggregation || 'No briefs exist yet.', null, 2)}

### Assignment Matrix
${JSON.stringify(assignmentMatrix, null, 2)}

### Coverage Gaps (events missing niche coverage)
${JSON.stringify(coverageGaps.length > 0 ? coverageGaps : 'No coverage gaps — all events have full niche coverage, or no events exist yet.', null, 2)}

## CONTENT CALENDAR DATA
Use this data to populate CalendarView, ScheduleGrid, PostSlot, WeekOverview, and ScheduleConflict components.

### All Calendar Items (events, posts, deadlines combined)
${JSON.stringify(calendarItems.length > 0 ? calendarItems : 'No calendar items. The calendar populates as events are created and briefs are assigned to creators.', null, 2)}

### Current Week Overview
${JSON.stringify(weekOverviewData, null, 2)}

### Weekly Schedule Grid
${JSON.stringify(scheduleGridData, null, 2)}

### Scheduling Conflicts
${JSON.stringify(calendarConflicts.length > 0 ? calendarConflicts : 'No scheduling conflicts detected.', null, 2)}

### Today's Date
${now.toISOString().split('T')[0]}

## CONTENT CALENDAR RESPONSE GUIDELINES
When a user asks "show me the calendar", "what's scheduled", "content schedule", or similar:
1. Start with WeekOverview for the current week summary
2. If there are conflicts, show ScheduleConflict alerts BEFORE the calendar
3. Show CalendarView in week mode for the current week
4. If they ask for a broader view, use month mode

When a user asks "what is everyone posting this week?" or wants a team view:
1. Show ScheduleGrid with all creators' weekly schedules side by side
2. Flag any gap days where no content is planned

When a user asks about a specific scheduled post:
1. Show PostSlot with full details including brief and event references

When a user asks to "schedule a post" or "add to the calendar":
1. Confirm the creator, date, and content details
2. Render a PostSlot showing the new scheduled item
3. Check for conflicts with the new post

When the calendar is empty:
1. Show WeekOverview with zeros
2. Proactively suggest: "Your content calendar is empty. To populate it, first add cultural events, then generate briefs and assign them to creators. The calendar auto-fills as briefs are created."
3. Point the agency to the workflow: Events → Briefs → Push → Calendar

Schedule conflict severity:
- "critical": missed deadline (overdue), event with no content
- "warning": overloaded day (>3 posts), creator posting at same time as another
- "info": gap day with no content, suboptimal timing suggestion

When showing CalendarView, always set current_date to today: ${now.toISOString().split('T')[0]}

## PERFORMANCE REPORTING DATA
Use this data to populate PerformanceChart, ReportCard, AgencyScorecard, CreatorComparison, ContentROI, and TrendReport components.

### Agency Performance Summary
${JSON.stringify(performanceData.summary, null, 2)}

### Per-Creator Performance
${JSON.stringify(performanceData.creator_performance, null, 2)}

### Top Performer
${JSON.stringify(performanceData.top_performer || 'No top performer identified yet.', null, 2)}

### Needs Attention
${JSON.stringify(performanceData.needs_attention.length > 0 ? performanceData.needs_attention : 'No creators flagged.', null, 2)}

### Content ROI by Campaign
${JSON.stringify(contentROIData.length > 0 ? contentROIData : 'No campaigns with published content yet.', null, 2)}

## PERFORMANCE REPORT RESPONSE GUIDELINES
When a user asks "how are we doing?", "show me the report", "agency performance", "weekly report", or similar:
1. Start with AgencyScorecard showing the full agency dashboard with overall grade, key metrics, top performer, and concerns
2. Follow with a PerformanceChart showing VPS scores across creators (line chart)
3. If there are creators needing attention, add ReportCard(s) for the specific metrics that are declining

When a user asks to "compare my creators", "who is performing best?", or wants a ranking:
1. Show CreatorComparison with all active creators side by side
2. Highlight the winner and provide comparative insights
3. Add ReportCards for the key differentiating metrics

When a user asks about ROI, campaign effectiveness, or "was [event] worth it?":
1. Show ContentROI for the specific campaign or all campaigns
2. Include top/worst performing posts, creator breakdown, and verdict
3. Follow with recommendations for improving future campaigns

When a user asks "what trends are you seeing?", "performance insights", or strategic questions:
1. Show TrendReport with rising/falling/emerging patterns
2. Base the trends on actual data — compare recent vs historical performance
3. Include strategic recommendations grounded in the data

For PerformanceChart data:
- VPS line chart: one series per creator, x-axis = script dates, y-axis = VPS scores
- DPS bar chart: x-axis = creators, y-axis = avg DPS
- Engagement area chart: x-axis = dates, series = share_rate, save_rate, comment_rate

Grade interpretation for AgencyScorecard:
- A+/A/A-: "Exceptional — agency is outperforming across the board"
- B+/B/B-: "Solid — performing well with room for optimization"
- C+/C/C-: "Average — meeting baseline but not excelling"
- D: "Below expectations — immediate attention needed"
- F: "Critical — major performance issues across multiple dimensions"

When there is limited data:
- Still generate the report with available data
- Add a data_quality_note explaining limitations
- Suggest actions to get more data: "More content creates better insights. Encourage creators to publish consistently."

## BATCH BRIEF RESPONSE GUIDELINES
When a user asks to "generate briefs for all events", "create a batch", "brief all creators", or similar batch operations:
1. Start with BatchProgress showing the batch job status (initially: total = number of event-creator combos, generated = 0)
2. For each upcoming event × relevant creator combination, generate an EventBrief
3. Show BriefGrid with all generated briefs for batch review
4. Show CreatorBriefAssignment matrix so the agency can see workload distribution
5. End with BatchSummary showing totals and any coverage gaps

When a user asks "show me all briefs" or "brief dashboard":
1. Show BriefGrid with all existing briefs
2. Show CreatorBriefAssignment matrix
3. If there are coverage gaps, flag them

When a user selects a specific brief to review or edit:
1. Show BriefEditor with full details
2. Include action buttons for Approve / Request Changes / Skip

Batch generation strategy:
- For each upcoming event (days_until > 0), identify creators whose niche matches
- Generate personalized briefs per creator-event pair
- Set deadlines 2 days before event dates
- Flag workload imbalances (any creator with >3 active briefs)
- Identify coverage gaps (events where not all relevant niches have assigned creators)

When there are NO briefs:
- If there ARE events, suggest: "You have {N} upcoming events but no briefs. Want me to generate a batch of briefs for all upcoming events?"
- If there are NO events either, suggest adding events first (refer to Step 8 cultural event features)

Brief quality indicators for BriefEditor ai_confidence:
- 90-100: Perfect niche match, strong data signals, specific angles
- 70-89: Good match, could be more specific
- 50-69: Tangential match, generic angles
- Below 50: Weak match, brief may need manual editing

COMPONENT USAGE RULES:
- When asked to show creators, use CreatorCard components in a Grid
- When asked for a summary/overview, use KPICard components in a Row, then MorningBriefCard items
- When asked about a specific creator, use a Section with their CreatorCard + VPSRing + ScriptCard items
- When a user clicks a CreatorCard or asks about a specific creator by name, automatically compose the full deep-dive layout (CreatorProfile → VPSTimeline → NicheRanking → ContentTable → EngagementBreakdown → RecommendationCards)
- When comparing creators, use ComparisonTable
- When showing trends, use TrendItem components in a Column
- For any metric, use KPICard. For any alert, use MorningBriefCard
- Always wrap related content in Section with a descriptive title
- Use Grid columns=2 for creator grids, columns=3 or 4 for KPIs
- Include ActionButton components when the user might want to take a next step

${catalogPrompt}

CRITICAL JSON-RENDER SPEC FORMAT:
When generating UI, you MUST output valid JSONL patches inside a \`\`\`spec code fence. Each patch uses RFC 6902 JSON Patch format. The spec builds a tree with a "root" element and an "elements" map. Every element ID referenced in a "children" array MUST have a matching entry in the elements map.

CORRECT example — showing creators in a grid:
\`\`\`spec
{"op":"add","path":"/root","value":"main"}
{"op":"add","path":"/elements/main","value":{"type":"Section","props":{"title":"Creators Overview"},"children":["grid-1"]}}
{"op":"add","path":"/elements/grid-1","value":{"type":"Grid","props":{"columns":2},"children":["creator-1","creator-2"]}}
{"op":"add","path":"/elements/creator-1","value":{"type":"CreatorCard","props":{"name":"Luna Martinez","niche":"fitness","vpsScore":87,"scriptCount":2,"status":"active"},"children":[]}}
{"op":"add","path":"/elements/creator-2","value":{"type":"CreatorCard","props":{"name":"Jake Chen","niche":"tech_reviews","vpsScore":91,"scriptCount":2,"status":"active"},"children":[]}}
\`\`\`

RULES:
- Every ID in a "children" array MUST exist as a key in elements (via its own patch line)
- Components without children MUST have "children": []
- Use simple IDs like "section-1", "card-1", "kpi-1"
- Output one patch per line, each as a separate JSON object
- NEVER reference an element you haven't defined — this causes rendering to silently fail
- For ActionButton, use the action prop to specify which action to trigger: "analyze_creator", "generate_brief", "refresh_data", "export_report", "navigate_creator", "send_invite", "nudge_creator", "create_event", "match_creators_to_event", "generate_batch_briefs", "approve_brief", "schedule_post", "reschedule_post"`;

  console.log('[agency-chat] SYSTEM PROMPT LENGTH:', systemPrompt.length);
  console.log('[agency-chat] CATALOG PROMPT INCLUDED:', systemPrompt.includes('JSONL'));

  const modelMessages = await convertToModelMessages(messages);

  const result = streamText({
    model: openai('gpt-4o'),
    system: systemPrompt,
    messages: modelMessages,
  });

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
