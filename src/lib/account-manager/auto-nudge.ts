import { sendBriefToCreator } from '@/lib/email/send-brief';

export interface NudgeResult {
  success: boolean;
  error?: string;
  creator?: string;
  briefId: string;
  emailSent?: boolean;
  newNudgeCount?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DB = any;

// Core nudge logic, callable from both the operator-driven action handler
// (clay/action-handler.ts case 'nudge_creator') and the auto-nudge cron route
// (api/cron/auto-nudge-unacknowledged). Single source of truth — same DB
// updates, same email path, same rate-limit semantics. Pre-filters at the
// caller layer (e.g. cron's nudge_count<3 cap) are not re-checked here.
export async function runNudgeForBrief(db: DB, briefId: string): Promise<NudgeResult> {
  const { data: brief, error: fetchErr } = await db
    .from('content_briefs')
    .select('id, user_id, last_nudged_at, nudge_count, brief_content')
    .eq('id', briefId)
    .single();
  if (fetchErr || !brief) return { success: false, briefId, error: 'Brief not found' };

  if (brief.last_nudged_at) {
    const hoursSince = (Date.now() - new Date(brief.last_nudged_at).getTime()) / 36e5;
    if (hoursSince < 24) {
      const hoursLeft = Math.ceil(24 - hoursSince);
      return {
        success: false,
        briefId,
        error: `Already nudged ${Math.floor(hoursSince)}h ago. Try again in ${hoursLeft}h.`,
      };
    }
  }

  const sendResult = await sendBriefToCreator(briefId);

  const now = new Date().toISOString();
  const newNudgeCount = (brief.nudge_count || 0) + 1;
  const { error: updateErr } = await db
    .from('content_briefs')
    .update({ last_nudged_at: now, nudge_count: newNudgeCount })
    .eq('id', briefId);
  if (updateErr) {
    return { success: false, briefId, error: `Failed to record nudge: ${updateErr.message}` };
  }

  let creator = 'the creator';
  if (brief.user_id) {
    const { data: profile } = await db
      .from('onboarding_profiles')
      .select('business_name')
      .eq('user_id', brief.user_id)
      .maybeSingle();
    if (profile?.business_name) creator = profile.business_name;
  }

  if (!sendResult.success) {
    return {
      success: false,
      briefId,
      creator,
      newNudgeCount,
      error: `Nudge email to ${creator} failed: ${sendResult.error || 'unknown'}`,
    };
  }

  return { success: true, briefId, creator, emailSent: true, newNudgeCount };
}
