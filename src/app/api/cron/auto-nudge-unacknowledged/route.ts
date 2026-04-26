/**
 * Auto-Nudge Unacknowledged Briefs — AM Step 4
 *
 * GET /api/cron/auto-nudge-unacknowledged
 *
 * Finds briefs where:
 *   - completion_status = 'delivered'
 *   - delivered_at < NOW() - 24h
 *   - (last_nudged_at IS NULL OR last_nudged_at < NOW() - 24h)
 *   - nudge_count < 3
 *   - agency_id IS NOT NULL
 *
 * For each, fires the same nudge logic the operator-driven 'nudge_creator'
 * action uses (shared helper at src/lib/account-manager/auto-nudge.ts).
 *
 * Cap: after 3 auto-nudges, no more emails fire — instead a chairman_alerts
 * row is inserted (alert_type='manual_outreach_needed', dedup'd by brief_id
 * stored in payload) so the operator sees the brief needs manual outreach.
 *
 * Dry-run: AUTO_NUDGE_DRY_RUN env var. Default true (unset → true) for
 * safety. When true, the route runs end-to-end but skips email send + DB
 * mutation; what would have happened is logged to platform_events
 * (event_type='auto_nudge.dry_run').
 *
 * Auth: Authorization: Bearer ${CRON_SECRET} — matches existing cron routes
 * (overnight-triage, cultural-scan, classify-events).
 *
 * NOT WIRED TO vercel.json. Route exists and is invokable on demand. The
 * cron schedule will be added in a separate workstream after substrate
 * stabilization (per AM Step 4 prompt).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env';
import { runNudgeForBrief } from '@/lib/account-manager/auto-nudge';
import { emitEventStrict } from '@/lib/events/emit';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const ELIGIBLE_LIMIT = 50;
const NUDGE_CAP = 3;

interface PerBriefError {
  brief_id: string;
  error: string;
}

interface RouteResult {
  dry_run: boolean;
  eligible_count: number;
  nudged_count: number;
  dry_run_count: number;
  escalated_count: number;
  errors: PerBriefError[];
}

export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization');
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Default true if unset — safer default per AM Step 4 spec.
  const dryRun = process.env.AUTO_NUDGE_DRY_RUN !== 'false';

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return NextResponse.json({ error: 'Missing Supabase config' }, { status: 500 });
  }
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });

  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const errors: PerBriefError[] = [];
  let nudgedCount = 0;
  let dryRunCount = 0;
  let escalatedCount = 0;

  // ── 1. Eligible briefs (under the cap) ──────────────────────────────
  const { data: eligible, error: eligibleErr } = await db
    .from('content_briefs')
    .select('id, agency_id, user_id, nudge_count, last_nudged_at, delivered_at, brief_content')
    .eq('completion_status', 'delivered')
    .not('delivered_at', 'is', null)
    .lt('delivered_at', cutoff)
    .lt('nudge_count', NUDGE_CAP)
    .not('agency_id', 'is', null)
    .or(`last_nudged_at.is.null,last_nudged_at.lt.${cutoff}`)
    .order('delivered_at', { ascending: true })
    .limit(ELIGIBLE_LIMIT);

  if (eligibleErr) {
    return NextResponse.json(
      { error: `Failed to query eligible briefs: ${eligibleErr.message}` },
      { status: 500 },
    );
  }

  const eligibleRows = eligible || [];

  for (const row of eligibleRows) {
    const briefId = row.id as string;
    const wouldBeNudgeCount = (row.nudge_count || 0) + 1;
    try {
      if (dryRun) {
        await emitEventStrict({
          eventType: 'auto_nudge.dry_run',
          payload: {
            source: 'auto-nudge-unacknowledged',
            brief_id: briefId,
            creator_id: row.user_id,
            current_nudge_count: row.nudge_count || 0,
            would_be_nudge_count: wouldBeNudgeCount,
            delivered_at: row.delivered_at,
            last_nudged_at: row.last_nudged_at,
          },
          actorType: 'cron',
          agencyId: row.agency_id,
          entityType: 'content_brief',
          entityId: briefId,
        });
        dryRunCount += 1;
        continue;
      }

      const result = await runNudgeForBrief(db, briefId);
      if (!result.success) {
        errors.push({ brief_id: briefId, error: result.error || 'unknown nudge failure' });
        continue;
      }

      await emitEventStrict({
        eventType: 'auto_nudge.sent',
        payload: {
          source: 'auto-nudge-unacknowledged',
          brief_id: briefId,
          creator: result.creator,
          new_nudge_count: result.newNudgeCount,
          email_sent: result.emailSent === true,
        },
        actorType: 'cron',
        agencyId: row.agency_id,
        entityType: 'content_brief',
        entityId: briefId,
      });
      nudgedCount += 1;
    } catch (e: any) {
      errors.push({ brief_id: briefId, error: e?.message || 'exception during nudge' });
    }
  }

  // ── 2. Cap-reached briefs needing escalation ────────────────────────
  const { data: capped, error: cappedErr } = await db
    .from('content_briefs')
    .select('id, agency_id, user_id, nudge_count, delivered_at, brief_content')
    .eq('completion_status', 'delivered')
    .gte('nudge_count', NUDGE_CAP)
    .not('agency_id', 'is', null)
    .order('delivered_at', { ascending: true })
    .limit(ELIGIBLE_LIMIT);

  if (cappedErr) {
    errors.push({ brief_id: 'cap_query', error: cappedErr.message });
  } else {
    for (const row of capped || []) {
      const briefId = row.id as string;
      try {
        // Dedup: skip if a live chairman_alert for this brief already exists.
        // We encode brief_id in payload->>'brief_id' so multiple briefs from the
        // same agency can each have their own alert (the chairman_alerts dedup
        // index keys on alert_type+agency_id, which would otherwise collapse
        // them to one per agency).
        const { data: existing, error: existingErr } = await db
          .from('chairman_alerts')
          .select('id')
          .eq('alert_type', 'manual_outreach_needed')
          .eq('agency_id', row.agency_id)
          .filter('payload->>brief_id', 'eq', briefId)
          .in('status', ['open', 'acknowledged', 'snoozed'])
          .limit(1);

        if (existingErr) {
          errors.push({ brief_id: briefId, error: `cap dedup query: ${existingErr.message}` });
          continue;
        }
        if ((existing || []).length > 0) continue;

        if (dryRun) {
          await emitEventStrict({
            eventType: 'auto_nudge.escalated_dry_run',
            payload: {
              source: 'auto-nudge-unacknowledged',
              brief_id: briefId,
              creator_id: row.user_id,
              nudge_count: row.nudge_count,
              would_create_chairman_alert: true,
            },
            actorType: 'cron',
            agencyId: row.agency_id,
            entityType: 'content_brief',
            entityId: briefId,
          });
          escalatedCount += 1;
          continue;
        }

        // Lookup creator name + brief title for a useful alert body.
        let creatorName = 'Creator';
        if (row.user_id) {
          const { data: profile } = await db
            .from('onboarding_profiles')
            .select('business_name')
            .eq('user_id', row.user_id)
            .maybeSingle();
          if (profile?.business_name) creatorName = profile.business_name;
        }
        const briefTitle =
          (row.brief_content as any)?.title ||
          (row.brief_content as any)?.campaign_name ||
          'Untitled brief';
        const daysAgo = row.delivered_at
          ? Math.floor((Date.now() - new Date(row.delivered_at).getTime()) / (1000 * 60 * 60 * 24))
          : null;

        const { error: insertErr } = await db.from('chairman_alerts').insert({
          alert_type: 'manual_outreach_needed',
          severity: 'warning',
          title: 'Brief needs manual outreach',
          body: `${creatorName} has been auto-nudged ${row.nudge_count} times without acknowledgment. Brief: ${briefTitle}.${daysAgo !== null ? ` Delivered ${daysAgo} day${daysAgo === 1 ? '' : 's'} ago.` : ''}`,
          payload: {
            brief_id: briefId,
            agency_id: row.agency_id,
            creator_id: row.user_id,
            creator_name: creatorName,
            nudge_count: row.nudge_count,
            delivered_at: row.delivered_at,
          },
          agency_id: row.agency_id,
          status: 'open',
        });

        if (insertErr) {
          errors.push({ brief_id: briefId, error: `chairman_alert insert: ${insertErr.message}` });
          continue;
        }

        await emitEventStrict({
          eventType: 'auto_nudge.escalated',
          payload: {
            source: 'auto-nudge-unacknowledged',
            brief_id: briefId,
            creator_name: creatorName,
            nudge_count: row.nudge_count,
          },
          actorType: 'cron',
          agencyId: row.agency_id,
          entityType: 'content_brief',
          entityId: briefId,
        });
        escalatedCount += 1;
      } catch (e: any) {
        errors.push({ brief_id: briefId, error: e?.message || 'exception during escalation' });
      }
    }
  }

  const result: RouteResult = {
    dry_run: dryRun,
    eligible_count: eligibleRows.length,
    nudged_count: nudgedCount,
    dry_run_count: dryRunCount,
    escalated_count: escalatedCount,
    errors,
  };

  console.info(
    `[cron:auto-nudge-unacknowledged] dry_run=${dryRun} eligible=${eligibleRows.length} nudged=${nudgedCount} dry_run_logged=${dryRunCount} escalated=${escalatedCount} errors=${errors.length}`,
  );

  return NextResponse.json(result);
}
