/**
 * Stage 3 Phase 2: agent correlation context.
 *
 * Every agent turn carries a correlation_id so platform_events emitted during
 * that turn (tool.called, tool.result, agent.proposal, agent.proposal_confirmed,
 * agent.write_unauthorized, etc.) can be joined to form a replayable session.
 *
 * Two-tier propagation (per CEO plan § Baseline, hardened by /plan-eng-review):
 *   - PRIMARY: closure binding — buildToolsFromRegistry(...) is called once per
 *     request with { correlationId, agencyId, userId }, and each tool's execute
 *     fn captures those values lexically. Survives any AI SDK tool-loop async
 *     boundary because it doesn't rely on async-local state at all.
 *   - SECONDARY: AsyncLocalStorage — for helpers called transitively (e.g.
 *     emit.ts invoked deep inside a handler) that don't have closure access.
 *     Not load-bearing; best-effort convenience.
 */
import { AsyncLocalStorage } from 'node:async_hooks';

export type AgentMode = 'interactive' | 'headless';

export interface AgentContext {
  correlationId: string;
  agencyId: string;
  userId: string;
  mode: AgentMode;
  /** For headless runs only — action IDs the saved prompt was pre-authorized to execute. */
  preAuthorizedWriteIds?: string[];
}

const storage = new AsyncLocalStorage<AgentContext>();

/** Run `fn` with the given agent context available via getAgentContext() for any transitive callers. */
export function runWithAgentContext<T>(ctx: AgentContext, fn: () => Promise<T> | T): Promise<T> | T {
  return storage.run(ctx, fn);
}

/** Returns the current AsyncLocalStorage-scoped context, or undefined if not inside runWithAgentContext. */
export function getAgentContext(): AgentContext | undefined {
  return storage.getStore();
}
