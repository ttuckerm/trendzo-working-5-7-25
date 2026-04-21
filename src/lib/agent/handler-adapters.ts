/**
 * Stage 3 Phase 2 (v2): handler adapters for the 12 write/external actions.
 *
 * Each adapter declares a zod input schema, a human description, a
 * consequence-string function (renders into the confirm card), and a `run`
 * fn that wraps handleComponentAction. The tool registry (tool-registry.ts)
 * consumes this list and generates one propose_<id> tool per adapter.
 *
 * Why thin adapters instead of calling handleComponentAction directly from
 * the tool registry? Keeps action-handler.ts's switch untouched (it's also
 * the code path for direct-click ActionButtons from list-rendered cards).
 *
 * Skip intentionally: check_push_status — it's a read despite kind='write'
 * in the registry, so it doesn't need a propose/confirm step. If the agent
 * ever needs it, expose it as a regular read tool separately.
 */
import { z } from 'zod';
import { handleComponentAction } from '@/lib/clay/action-handler';
import type { AgentContext } from './correlation-context';

export interface AdapterInput {
  input: Record<string, unknown>;
  context: AgentContext;
}

export interface AdapterResult {
  success: boolean;
  message: string;
  result?: unknown;
}

export interface ActionAdapter {
  id: string;
  description: string;
  consequence: (input: Record<string, unknown>) => string;
  schema: z.ZodTypeAny;
  run: (args: AdapterInput) => Promise<AdapterResult>;
}

// Small helper — every adapter's `run` is essentially the same wrap call.
async function callHandler(
  type: string,
  actionId: string,
  payload: Record<string, unknown>,
  context: AgentContext,
): Promise<AdapterResult> {
  const r = await handleComponentAction(
    { actionId, type, payload },
    { agencyId: context.agencyId, userId: context.userId },
  );
  return { success: r.success, message: r.message, result: r.confirmation ?? null };
}

// ═══════════════════════════════════════════════════════════════════════════
// WRITE ADAPTERS
// ═══════════════════════════════════════════════════════════════════════════

const nudgeCreatorSchema = z.object({
  briefId: z.string().describe('The content_briefs.id of the overdue brief.'),
  creatorId: z.string().describe('The profiles.user_id of the creator receiving the nudge.'),
});
export const nudgeCreatorAdapter: ActionAdapter = {
  id: 'nudge_creator',
  description: 'Send an email nudge to a creator whose brief is overdue. Updates content_briefs.last_nudged_at.',
  consequence: (i) => `Send nudge email to creator ${i.creatorId} about brief ${i.briefId}.`,
  schema: nudgeCreatorSchema,
  run: ({ input, context }) => callHandler('nudge_creator', String(input.briefId ?? ''), { briefId: input.briefId, creatorId: input.creatorId }, context),
};

const updateBriefStatusSchema = z.object({
  briefId: z.string().describe('The content_briefs.id of the brief to update.'),
  new_status: z.enum(['acknowledged', 'in_production', 'published']).describe('The new completion_status.'),
  published_url: z.string().optional().describe("Required when new_status='published'. The public TikTok/etc URL."),
});
export const updateBriefStatusAdapter: ActionAdapter = {
  id: 'update_brief_status',
  description: 'Move a content brief through its lifecycle: delivered → acknowledged → in_production → published.',
  consequence: (i) => {
    const url = i.published_url ? ` with url ${i.published_url}` : '';
    return `Set brief ${i.briefId} completion_status to "${i.new_status}"${url}.`;
  },
  schema: updateBriefStatusSchema,
  run: ({ input, context }) => callHandler(
    'update_brief_status',
    String(input.briefId ?? ''),
    { briefId: input.briefId, new_status: input.new_status, published_url: input.published_url },
    context,
  ),
};

const logPerformanceSchema = z.object({
  briefId: z.string().describe('The content_briefs.id of the published brief.'),
  actual_views: z.number().describe('The actual view count (integer).'),
  actual_engagement_rate: z.number().optional().describe('Optional engagement rate as a fraction (0.05 = 5%).'),
});
export const logPerformanceAdapter: ActionAdapter = {
  id: 'log_performance',
  description: 'Record post-publication performance (actual views, engagement rate) against a published brief.',
  consequence: (i) => `Log performance for brief ${i.briefId}: ${i.actual_views} views${i.actual_engagement_rate != null ? `, ${((i.actual_engagement_rate as number) * 100).toFixed(1)}% engagement` : ''}.`,
  schema: logPerformanceSchema,
  run: ({ input, context }) => callHandler(
    'log_performance',
    String(input.briefId ?? ''),
    { briefId: input.briefId, actual_views: input.actual_views, actual_engagement_rate: input.actual_engagement_rate },
    context,
  ),
};

const approveBriefSchema = z.object({
  briefId: z.string().describe('The content_briefs.id of the brief to approve.'),
});
export const approveBriefAdapter: ActionAdapter = {
  id: 'approve_brief',
  description: 'Approve a generated content brief (sets content_briefs.status = "approved").',
  consequence: (i) => `Approve brief ${i.briefId}.`,
  schema: approveBriefSchema,
  run: ({ input, context }) => callHandler('approve_brief', String(input.briefId ?? ''), { briefId: input.briefId }, context),
};

const sendInviteSchema = z.object({
  creatorEmail: z.string().describe('The email address of the creator being invited.'),
  creatorName: z.string().describe('The display name of the creator (used in the email body).'),
});
export const sendInviteAdapter: ActionAdapter = {
  id: 'send_invite',
  description: 'Send an email invitation to a creator to join the agency.',
  consequence: (i) => `Send invite email to ${i.creatorName} <${i.creatorEmail}>.`,
  schema: sendInviteSchema,
  run: ({ input, context }) => callHandler(
    'send_invite',
    String(input.creatorEmail ?? ''),
    { creatorEmail: input.creatorEmail, creatorName: input.creatorName },
    context,
  ),
};

const createEventSchema = z.object({
  eventName: z.string().describe('Display name of the event.'),
  eventDate: z.string().describe('Event date in ISO 8601 (YYYY-MM-DD or full timestamp).'),
  category: z.enum(['holiday', 'platform_trend', 'cultural_moment', 'industry_event', 'seasonal', 'news_cycle', 'trending_topic']).describe('Event category.'),
});
export const createEventAdapter: ActionAdapter = {
  id: 'create_event',
  description: 'Create a new agency event (e.g. a cultural moment, trend, or industry event creators should respond to).',
  consequence: (i) => `Create ${i.category} event "${i.eventName}" on ${i.eventDate}.`,
  schema: createEventSchema,
  run: ({ input, context }) => callHandler(
    'create_event',
    String(input.eventName ?? ''),
    { eventName: input.eventName, eventDate: input.eventDate, category: input.category },
    context,
  ),
};

const matchCreatorsToEventSchema = z.object({
  eventId: z.string().describe('The agency_events.id of the event to match creators against.'),
});
export const matchCreatorsToEventAdapter: ActionAdapter = {
  id: 'match_creators_to_event',
  description: 'Find creators whose niche matches a given event category. Returns ranked candidates.',
  consequence: (i) => `Match creators to event ${i.eventId}.`,
  schema: matchCreatorsToEventSchema,
  run: ({ input, context }) => callHandler('match_creators_to_event', String(input.eventId ?? ''), { eventId: input.eventId }, context),
};

const pushBriefToCreatorsSchema = z.object({
  briefId: z.string().describe('The content_briefs.id of the brief to push.'),
  creatorIds: z.array(z.string()).describe('Array of profiles.user_id values to push to.'),
});
export const pushBriefToCreatorsAdapter: ActionAdapter = {
  id: 'push_brief_to_creators',
  description: 'Push (email + in-app notify) a content brief to one or more creators.',
  consequence: (i) => `Push brief ${i.briefId} to ${(i.creatorIds as string[]).length} creator(s).`,
  schema: pushBriefToCreatorsSchema,
  run: ({ input, context }) => callHandler(
    'push_brief_to_creators',
    String(input.briefId ?? ''),
    { briefId: input.briefId, creatorIds: input.creatorIds },
    context,
  ),
};

const generateBatchBriefsSchema = z.object({
  creatorIds: z.array(z.string()).describe('Array of creator profile ids to generate briefs for.'),
  topic: z.string().describe('Brief topic / theme to base all generated briefs on.'),
});
export const generateBatchBriefsAdapter: ActionAdapter = {
  id: 'generate_batch_briefs',
  description: 'Generate content briefs in bulk — one per creator, all on the same topic.',
  consequence: (i) => `Generate briefs for ${(i.creatorIds as string[]).length} creator(s) on topic "${i.topic}".`,
  schema: generateBatchBriefsSchema,
  run: ({ input, context }) => callHandler(
    'generate_batch_briefs',
    'batch',
    { creatorIds: input.creatorIds, topic: input.topic },
    context,
  ),
};

const schedulePostSchema = z.object({
  briefId: z.string().describe('The content_briefs.id of the brief to schedule.'),
  scheduledFor: z.string().describe('ISO 8601 timestamp for when the post should publish.'),
});
export const schedulePostAdapter: ActionAdapter = {
  id: 'schedule_post',
  description: 'Schedule a brief for future publication through the scheduler.',
  consequence: (i) => `Schedule brief ${i.briefId} for ${i.scheduledFor}.`,
  schema: schedulePostSchema,
  run: ({ input, context }) => callHandler(
    'schedule_post',
    String(input.briefId ?? ''),
    { briefId: input.briefId, scheduledFor: input.scheduledFor },
    context,
  ),
};

const generateReportSchema = z.object({
  timeWindow: z.enum(['week', 'month', 'quarter', 'all']).describe('Reporting window.'),
});
export const generateReportAdapter: ActionAdapter = {
  id: 'generate_report',
  description: 'Generate an agency performance report aggregating content_briefs metrics over a time window.',
  consequence: (i) => `Generate ${i.timeWindow} performance report.`,
  schema: generateReportSchema,
  run: ({ input, context }) => callHandler(
    'generate_report',
    'report',
    { timeWindow: input.timeWindow, agencyId: context.agencyId },
    context,
  ),
};

const reschedulePostSchema = z.object({
  scheduledActionId: z.string().describe('The scheduled_actions.id of the pending post.'),
  newScheduledFor: z.string().describe('New ISO 8601 timestamp for publication.'),
});
export const reschedulePostAdapter: ActionAdapter = {
  id: 'reschedule_post',
  description: 'Reschedule a pending scheduled post to a new time.',
  consequence: (i) => `Reschedule post ${i.scheduledActionId} to ${i.newScheduledFor}.`,
  schema: reschedulePostSchema,
  run: ({ input, context }) => callHandler(
    'reschedule_post',
    String(input.scheduledActionId ?? ''),
    { scheduledActionId: input.scheduledActionId, newScheduledFor: input.newScheduledFor },
    context,
  ),
};

/** Action-id → adapter. Tool registry builds one propose_<id> tool per entry. */
export const ADAPTERS: Record<string, ActionAdapter> = {
  nudge_creator: nudgeCreatorAdapter,
  update_brief_status: updateBriefStatusAdapter,
  log_performance: logPerformanceAdapter,
  approve_brief: approveBriefAdapter,
  send_invite: sendInviteAdapter,
  create_event: createEventAdapter,
  match_creators_to_event: matchCreatorsToEventAdapter,
  push_brief_to_creators: pushBriefToCreatorsAdapter,
  generate_batch_briefs: generateBatchBriefsAdapter,
  schedule_post: schedulePostAdapter,
  generate_report: generateReportAdapter,
  reschedule_post: reschedulePostAdapter,
};
