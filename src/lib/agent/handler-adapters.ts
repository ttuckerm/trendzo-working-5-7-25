/**
 * Stage 3 Phase 2: handler adapters.
 *
 * Each adapter is a thin wrapper around `handleComponentAction`. It maps the
 * shape AI SDK tools use `({ input, context }) => ToolResult` onto the shape
 * `handleComponentAction` already exposes `({ actionId, type, payload }, { agencyId, userId })`.
 *
 * Why adapters instead of calling handleComponentAction directly from the tool
 * registry? Per CEO plan § Baseline: keeps `action-handler.ts` untouched
 * (the switch stays as-is, used by both the /api/clay/action HTTP path for
 * operator clicks AND the agent tool-execution path). Each adapter is 3–5 lines
 * and declares explicitly which registry fields map to which handler args.
 *
 * Each adapter also declares its input schema and a human description — the
 * tool registry (tool-registry.ts) consumes these to build the AI SDK tool
 * definition, so the LLM knows what args to pass.
 *
 * This file starts with TWO adapters (nudge_creator + update_brief_status) to
 * prove the end-to-end pattern. Remaining 11 write-action adapters are added
 * in a follow-up commit once the pattern is verified.
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
  /** Opaque result — confirmation payload, follow-up components, etc. */
  result?: unknown;
}

export interface ActionAdapter {
  /** Registry action id — matches ACTION_REGISTRY key + action-handler.ts switch case. */
  id: string;
  /** One-line human description the LLM reads to decide when to call this tool. */
  description: string;
  /** Plain-English description of what happens when the operator confirms — used in the confirm card. */
  consequence: (input: Record<string, unknown>) => string;
  /** Zod schema for the tool's input object. */
  schema: z.ZodTypeAny;
  /** Executes the real DB write. Called ONLY after the proposal gate consumes a matching confirmation. */
  run: (args: AdapterInput) => Promise<AdapterResult>;
}

// ─── nudge_creator ─────────────────────────────────────────────────────────
const nudgeCreatorSchema = z.object({
  briefId: z.string().describe('The content_briefs.id of the overdue brief to nudge.'),
  creatorId: z.string().describe('The profiles.user_id of the creator receiving the nudge.'),
});

export const nudgeCreatorAdapter: ActionAdapter = {
  id: 'nudge_creator',
  description:
    'Send an email nudge to a creator whose brief is overdue. Updates content_briefs.last_nudged_at. ' +
    'Use when the operator asks to nudge, poke, remind, or follow up with a creator about a specific brief.',
  consequence: (i) => `Send nudge email to creator ${i.creatorId} about brief ${i.briefId}.`,
  schema: nudgeCreatorSchema,
  run: async ({ input, context }) => {
    const briefId = String(input.briefId ?? '');
    const creatorId = String(input.creatorId ?? '');
    const r = await handleComponentAction(
      { actionId: briefId, type: 'nudge_creator', payload: { briefId, creatorId } },
      { agencyId: context.agencyId, userId: context.userId },
    );
    return { success: r.success, message: r.message, result: r.confirmation ?? null };
  },
};

// ─── update_brief_status ───────────────────────────────────────────────────
const updateBriefStatusSchema = z.object({
  briefId: z.string().describe('The content_briefs.id of the brief to update.'),
  new_status: z
    .enum(['acknowledged', 'in_production', 'published'])
    .describe('The new completion_status. Must be a legal next-state transition from the current status.'),
  published_url: z
    .string()
    .optional()
    .describe("Required when new_status='published'. The public TikTok/etc URL of the posted video."),
});

export const updateBriefStatusAdapter: ActionAdapter = {
  id: 'update_brief_status',
  description:
    'Move a content brief through its lifecycle: delivered → acknowledged → in_production → published. ' +
    'Use when the operator asks to mark a brief acknowledged, in production, or published.',
  consequence: (i) => {
    const url = i.published_url ? ` with url ${i.published_url}` : '';
    return `Set brief ${i.briefId} completion_status to "${i.new_status}"${url}.`;
  },
  schema: updateBriefStatusSchema,
  run: async ({ input, context }) => {
    const briefId = String(input.briefId ?? '');
    const newStatus = String(input.new_status ?? '');
    const publishedUrl = typeof input.published_url === 'string' ? input.published_url : undefined;
    const r = await handleComponentAction(
      {
        actionId: briefId,
        type: 'update_brief_status',
        payload: { briefId, new_status: newStatus, published_url: publishedUrl },
      },
      { agencyId: context.agencyId, userId: context.userId },
    );
    return { success: r.success, message: r.message, result: r.confirmation ?? null };
  },
};

/** Action-id → adapter. Tool registry builds one propose_* / * pair per entry. */
export const ADAPTERS: Record<string, ActionAdapter> = {
  nudge_creator: nudgeCreatorAdapter,
  update_brief_status: updateBriefStatusAdapter,
};
