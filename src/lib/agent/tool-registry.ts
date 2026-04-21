/**
 * Stage 3 Phase 2: agent tool registry.
 *
 * Builds the AI SDK `tool()` definitions the /agency chat loop hands to
 * `streamText`. Two-phase pattern per CEO plan §Guardrail Architecture:
 *
 *   Write/external actions → generate a PAIR:
 *     propose_<id>(input) — safe. Emits `agent.proposal`, returns a confirm-card
 *                           spec for the LLM to render. No DB write.
 *     <id>(input + proposal_id) — real. Calls verifyAndConsumeProposal() which
 *                                atomically consumes a matching
 *                                `agent.proposal_confirmed` row from
 *                                platform_events. If consumed, calls the
 *                                handler adapter. If not, emits
 *                                `agent.write_unauthorized` and returns failure.
 *
 * Read tools are passed through unchanged — they don't need proposals. The
 * caller supplies them via `extraReadTools`.
 *
 * Context propagation: closure-bound. `buildToolsFromRegistry({correlationId,
 * agencyId, userId, mode})` is called once per request; every tool's execute
 * fn captures those values lexically, survives any AI SDK async boundary.
 */
import { tool } from 'ai';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { ADAPTERS, type ActionAdapter } from './handler-adapters';
import { hashPayload, verifyAndConsumeProposal } from './proposal-gate';
import type { AgentContext } from './correlation-context';
import { emitEvent, emitEventStrict } from '@/lib/events/emit';

export interface BuildToolsArgs {
  context: AgentContext;
  /** Pre-built read tools (e.g. get_briefs_by_status) that don't need the proposal gate. */
  extraReadTools?: Record<string, ReturnType<typeof tool>>;
}

const PROPOSAL_TTL_MINUTES = 10;

function proposeDescription(adapter: ActionAdapter): string {
  return (
    `Propose ${adapter.id}. ${adapter.description} ` +
    `Calling this does NOT execute the action — it returns a confirm card for the operator to approve. ` +
    `After calling propose_${adapter.id}, stop and wait for the operator to confirm. ` +
    `The real ${adapter.id} tool can only succeed AFTER an explicit operator confirmation.`
  );
}

function realDescription(adapter: ActionAdapter): string {
  return (
    `Execute ${adapter.id}. ONLY call this after propose_${adapter.id} has been confirmed by the operator. ` +
    `Pass the same input values plus the proposal_id from the prior confirm card. ` +
    `This call is DB-gated — it will fail with agent.write_unauthorized unless a fresh operator ` +
    `confirmation exists in platform_events.`
  );
}

export function buildToolsFromRegistry(args: BuildToolsArgs): Record<string, ReturnType<typeof tool>> {
  const { context } = args;
  const out: Record<string, ReturnType<typeof tool>> = { ...(args.extraReadTools ?? {}) };

  for (const adapter of Object.values(ADAPTERS)) {
    const proposeName = `propose_${adapter.id}`;
    const realName = adapter.id;

    // ─── propose_<id> — safe, returns confirm card spec ──────────────────
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
            },
            actorType: 'agent',
            actorId: context.userId,
            agencyId: context.agencyId,
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
            payload: { ...input, proposal_id: proposalId, payload_hash: payloadHash },
          },
          cancel_button: { action: `${adapter.id}_cancel`, label: 'Cancel' },
        };
      },
    });

    // ─── <id> — real, DB-gated ──────────────────────────────────────────
    const realSchema = (adapter.schema as z.AnyZodObject).extend({
      proposal_id: z
        .string()
        .describe(`The proposal_id returned by propose_${adapter.id} in the prior turn.`),
    });

    // @ts-expect-error — AI SDK v6 tool() generic chain + zod schema hits TS2589 (deep instantiation). Runtime is fine.
    out[realName] = tool({
      description: realDescription(adapter),
      inputSchema: realSchema,
      execute: async (input: Record<string, unknown>) => {
        const proposalId = String(input.proposal_id ?? '');
        if (!proposalId) {
          return { ok: false, error: 'missing_proposal_id', message: `Must pass proposal_id from propose_${adapter.id}.` };
        }

        // Rehash the action payload (excluding proposal_id) so the RPC can verify
        // integrity against what was originally proposed. The LLM can't tamper
        // with the payload between propose and execute without a hash mismatch.
        const { proposal_id: _omit, ...actionInput } = input;
        const payloadHash = hashPayload(actionInput);

        emitEvent({
          eventType: 'tool.called',
          payload: { tool: adapter.id, proposal_id: proposalId, mode: context.mode },
          actorType: 'agent',
          actorId: context.userId,
          agencyId: context.agencyId,
          correlationId: context.correlationId,
        }).catch(() => {});

        let authorized = false;
        if (context.mode === 'headless') {
          // Pre-authorization replaces per-call confirmation in headless mode.
          authorized = (context.preAuthorizedWriteIds ?? []).includes(adapter.id);
          if (!authorized) {
            emitEvent({
              eventType: 'agent.write_blocked_unauthorized',
              payload: { tool: adapter.id, proposal_id: proposalId, reason: 'not_in_preauth_list' },
              actorType: 'agent',
              actorId: context.userId,
              agencyId: context.agencyId,
              correlationId: context.correlationId,
            }).catch(() => {});
          }
        } else {
          authorized = await verifyAndConsumeProposal(proposalId, payloadHash);
          if (!authorized) {
            emitEvent({
              eventType: 'agent.write_unauthorized',
              payload: { tool: adapter.id, proposal_id: proposalId, payload_hash: payloadHash, reason: 'no_matching_confirmation' },
              actorType: 'agent',
              actorId: context.userId,
              agencyId: context.agencyId,
              correlationId: context.correlationId,
            }).catch(() => {});
          }
        }

        if (!authorized) {
          return {
            ok: false,
            error: 'write_unauthorized',
            message:
              context.mode === 'headless'
                ? `Saved prompt is not pre-authorized to run ${adapter.id}. Ask the operator to edit the prompt's pre-authorized tools.`
                : `No operator confirmation found for proposal ${proposalId}. The proposal may have expired or been cancelled.`,
          };
        }

        let result: Awaited<ReturnType<typeof adapter.run>>;
        try {
          result = await adapter.run({ input: actionInput, context });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          emitEvent({
            eventType: 'tool.result',
            payload: { tool: adapter.id, proposal_id: proposalId, ok: false, error: msg },
            actorType: 'agent',
            actorId: context.userId,
            agencyId: context.agencyId,
            correlationId: context.correlationId,
          }).catch(() => {});
          return { ok: false, error: 'adapter_exception', message: msg };
        }

        emitEvent({
          eventType: 'tool.result',
          payload: { tool: adapter.id, proposal_id: proposalId, ok: result.success, message: result.message },
          actorType: 'agent',
          actorId: context.userId,
          agencyId: context.agencyId,
          correlationId: context.correlationId,
        }).catch(() => {});

        return { ok: result.success, message: result.message, result: result.result ?? null };
      },
    });
  }

  return out;
}
