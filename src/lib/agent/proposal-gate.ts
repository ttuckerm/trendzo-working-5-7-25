/**
 * Stage 3 Phase 2: hard DB gate for agent writes.
 *
 * Every real write tool (`*`) must call verifyAndConsumeProposal() before
 * touching any domain table. The gate checks — atomically, inside Postgres —
 * that a matching `agent.proposal_confirmed` event exists in platform_events,
 * is not older than 10 minutes, and has not already been consumed. If yes,
 * it marks the row consumed in the same transaction and returns true. If no,
 * returns false and the tool must reject with agent.write_unauthorized.
 *
 * DB-row-as-source-of-truth (NOT LLM's recollection) per /plan-eng-review
 * hardening: an attacker-model cannot forge a confirmation by inventing
 * tool-result messages — the real authorization is a row in platform_events
 * written by the human-clickable /api/clay/action endpoint.
 *
 * Requires the `consume_agent_proposal(uuid, text)` Postgres function from
 * supabase/migrations/20260421_agent_proposal_consume.sql.
 */
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env';
import { createHash } from 'node:crypto';

function canonicalize(input: unknown): string {
  if (input === null || typeof input !== 'object') return JSON.stringify(input);
  if (Array.isArray(input)) return '[' + input.map(canonicalize).join(',') + ']';
  const keys = Object.keys(input as Record<string, unknown>).sort();
  return '{' + keys.map((k) => JSON.stringify(k) + ':' + canonicalize((input as Record<string, unknown>)[k])).join(',') + '}';
}

/** Deterministic sha256 of an object's canonical form. Two equivalent inputs produce the same hash. */
export function hashPayload(payload: unknown): string {
  return createHash('sha256').update(canonicalize(payload)).digest('hex');
}

/**
 * Atomically consume an `agent.proposal_confirmed` row matching (proposal_id, payload_hash).
 * Returns true if a fresh, unconsumed row was found and marked consumed. Returns false otherwise.
 * The caller MUST NOT execute the underlying domain write if false.
 */
export async function verifyAndConsumeProposal(proposalId: string, payloadHash: string): Promise<boolean> {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });
  const { data, error } = await db.rpc('consume_agent_proposal', {
    p_proposal_id: proposalId,
    p_payload_hash: payloadHash,
  });
  if (error) {
    console.error('[proposal-gate] consume_agent_proposal RPC failed:', error.message);
    return false;
  }
  return data === true;
}
