/**
 * Stage 3 Phase 2 (v2): agent tool registry — propose-only design.
 *
 * The agent registers ONE tool per adapter: `propose_<id>`. Calling it emits
 * an `agent.proposal` event (with proposal_id + payload_hash + action_payload)
 * and returns a confirm-card spec for the LLM to render. The real write does
 * NOT happen in the agent loop.
 *
 * When the operator clicks the Confirm button, the client POSTs to
 * /api/clay/action with the payload carrying proposal_id + payload_hash.
 * That endpoint looks up the matching `agent.proposal` event via the
 * consume_agent_proposal RPC (atomic lock + consume) and, if authorized,
 * runs handleComponentAction directly. Simpler, one request per confirm,
 * no multi-turn tool-call dance.
 *
 * Context propagation: closure-bound. buildToolsFromRegistry({correlationId,
 * agencyId, userId, mode}) is called once per request and each tool captures
 * those values lexically.
 */
import { tool } from 'ai';
import { randomUUID } from 'node:crypto';
import { ADAPTERS, type ActionAdapter } from './handler-adapters';
import { hashPayload } from './proposal-gate';
import { type AgentContext, uuidOrNull } from './correlation-context';
import { emitEventStrict } from '@/lib/events/emit';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyTool = any;

export interface BuildToolsArgs {
  context: AgentContext;
  /**
   * Pre-built read tools (e.g. get_briefs_by_status) that don't need a proposal.
   * Typed loosely — AI SDK's tool() return type trips TS2589 (deep instantiation)
   * when mixed with inline tool() calls that use zod schemas.
   */
  extraReadTools?: Record<string, AnyTool>;
}

const PROPOSAL_TTL_MINUTES = 10;

function proposeDescription(adapter: ActionAdapter): string {
  return (
    `Propose ${adapter.id}. ${adapter.description} ` +
    `Calling this records a proposal but does NOT execute the action. ` +
    `Render the returned confirm_button as a Clay ActionButton and wait for ` +
    `the operator to click it — the click is what runs the action (via /api/clay/action), ` +
    `not you. After calling propose_${adapter.id}, stop calling tools and render the card.`
  );
}

export function buildToolsFromRegistry(args: BuildToolsArgs): Record<string, AnyTool> {
  const { context } = args;
  const out: Record<string, AnyTool> = { ...(args.extraReadTools ?? {}) };

  for (const adapter of Object.values(ADAPTERS)) {
    const proposeName = `propose_${adapter.id}`;

    // @ts-expect-error — AI SDK v6 tool() generic chain + zod schema hits TS2589 (deep instantiation). Runtime is fine.
    out[proposeName] = tool({
      description: proposeDescription(adapter),
      inputSchema: adapter.schema,
      execute: async (input: Record<string, unknown>) => {
        const proposalId = randomUUID();
        const payloadHash = hashPayload(input);
        const expiresAt = new Date(Date.now() + PROPOSAL_TTL_MINUTES * 60_000).toISOString();

        try {
          await emitEventStrict({
            eventType: 'agent.proposal',
            payload: {
              proposal_id: proposalId,
              payload_hash: payloadHash,
              action_id: adapter.id,
              action_payload: input,
              expires_at: expiresAt,
              consumed: false,
              // Preserve the raw caller IDs in payload for audit even when the
              // top-level uuid columns coerce to null (e.g. dev-user).
              raw_user_id: context.userId,
              raw_agency_id: context.agencyId,
            },
            actorType: 'agent',
            actorId: uuidOrNull(context.userId),
            agencyId: uuidOrNull(context.agencyId),
            correlationId: context.correlationId,
          });
        } catch (err) {
          console.error(`[tool-registry] propose_${adapter.id} strict emit failed:`, err);
          return {
            ok: false,
            error: 'proposal_emit_failed',
            message: 'Could not record the proposal. The operator will not be able to confirm it. Please try again.',
          };
        }

        return {
          ok: true,
          kind: 'confirm_write',
          proposal_id: proposalId,
          payload_hash: payloadHash,
          action_id: adapter.id,
          consequence: adapter.consequence(input),
          expires_at: expiresAt,
          confirm_button: {
            action: adapter.id,
            label: 'Confirm',
            payload: {
              ...input,
              proposal_id: proposalId,
              payload_hash: payloadHash,
              correlation_id: context.correlationId,
            },
          },
        };
      },
    });
  }

  return out;
}
