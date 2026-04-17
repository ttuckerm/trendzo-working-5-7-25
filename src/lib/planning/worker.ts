/**
 * Prompt 38 — Planning session worker (local-dev only, see TODO)
 *
 * This is the function that actually runs one planning session end
 * to end. It is intentionally structured like Prompt 37's coordinator
 * dispatcher: `startSession()` inserts the row + returns immediately,
 * `runInBackground()` is the fire-and-forget async worker.
 *
 * Two execution paths:
 *
 *   1. TEST MODE (session.test_mode === true)
 *      — No Anthropic API call is made.
 *      — A canned fake stream is emitted over ~1.5 seconds so the UI
 *        can render progress and we can verify DB writes without
 *        burning real Opus dollars. Fake usage numbers are small and
 *        realistic. Fake cost is 0.
 *      — This is the DEFAULT for new sessions.
 *
 *   2. REAL MODE (session.test_mode === false)
 *      — Calls Anthropic's messages.stream() with Opus 4.6 and
 *        extended thinking enabled.
 *      — Streams text deltas into planning_sessions.plan_output and
 *        updates cost_usd + output_tokens live.
 *      — Aborts the stream as soon as ANY cap is hit (time, tokens,
 *        or estimated cost). Whichever trips first wins.
 *      — On abort, session flips to 'reviewing' with a note in
 *        plan_output.stop_reason so the Chairman still sees partial
 *        output and can approve/reject the truncated plan.
 *
 * TODO(prod-deploy): This module calls the Anthropic SDK from inside
 * the Next.js dev-server process via `void runInBackground(...)`.
 * That works locally for up to 10 minutes because nothing kills the
 * Node process. On Vercel serverless it will NOT work — the process
 * is torn down seconds after the HTTP response flushes. For a real
 * production deployment, move this worker into either:
 *   a) A Supabase Edge Function + cron picker (max 400s runtime,
 *      so caps must drop to PRODUCTION_MAX_SECONDS = 240s), or
 *   b) A dedicated queue worker (Inngest / Trigger.dev / a long-lived
 *      Node process somewhere). That's the only option that fits the
 *      full 10-minute local cap.
 * See `types.ts` PRODUCTION_MAX_SECONDS + caps constants.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import {
  DEFAULT_CAPS,
  CHAIRMAN_MAX_CAPS,
  estimateCostUsd,
  type ContextSnapshot,
  type PlanningSessionCaps,
  type RequesterRole,
} from './types';
import {
  assemblePlatformContext,
  assembleAgencyContext,
} from './context-assembler';

const OPUS_MODEL = 'claude-opus-4-6';

// Reasonable default extended-thinking budget. Must be < max_tokens.
const EXTENDED_THINKING_BUDGET = 16_000;

export interface StartSessionArgs {
  requesterRole: RequesterRole;
  requesterUserId?: string | null;
  agencyId?: string | null;
  inputPrompt: string;
  testMode?: boolean;
  /**
   * Per-session cap overrides. Clamped to CHAIRMAN_MAX_CAPS — anything
   * beyond that requires a code change, by design.
   */
  caps?: Partial<PlanningSessionCaps>;
  db: SupabaseClient;
}

export interface StartSessionResult {
  sessionId: string;
}

export async function startSession(args: StartSessionArgs): Promise<StartSessionResult> {
  const {
    requesterRole,
    requesterUserId = null,
    agencyId = null,
    inputPrompt,
    testMode = true, // safety default — real calls require explicit opt-in
    caps: capsOverride = {},
    db,
  } = args;

  if (!inputPrompt || inputPrompt.trim().length === 0) {
    throw new Error('input_prompt is required');
  }

  // Clamp caps to the Chairman ceiling. Any attempt to exceed the
  // ceiling silently falls back to the ceiling — we log a warning
  // but don't fail the request.
  const caps: PlanningSessionCaps = {
    maxSeconds: Math.min(
      capsOverride.maxSeconds ?? DEFAULT_CAPS.maxSeconds,
      CHAIRMAN_MAX_CAPS.maxSeconds,
    ),
    maxOutputTokens: Math.min(
      capsOverride.maxOutputTokens ?? DEFAULT_CAPS.maxOutputTokens,
      CHAIRMAN_MAX_CAPS.maxOutputTokens,
    ),
    maxCostUsd: Math.min(
      capsOverride.maxCostUsd ?? DEFAULT_CAPS.maxCostUsd,
      CHAIRMAN_MAX_CAPS.maxCostUsd,
    ),
  };

  const { data: inserted, error: insertErr } = await db
    .from('planning_sessions')
    .insert({
      requester_role: requesterRole,
      requester_user_id: requesterUserId,
      agency_id: agencyId,
      input_prompt: inputPrompt,
      model_used: OPUS_MODEL,
      status: 'queued',
      test_mode: testMode,
      cap_max_seconds: caps.maxSeconds,
      cap_max_output_tokens: caps.maxOutputTokens,
      cap_max_cost_usd: caps.maxCostUsd,
    })
    .select('id')
    .single();

  if (insertErr || !inserted) {
    throw new Error(`Failed to create planning_sessions row: ${insertErr?.message}`);
  }

  const sessionId = inserted.id as string;

  // Fire-and-forget. Same pattern as Prompt 37's coordinator.
  void runInBackground(sessionId, {
    requesterRole,
    agencyId,
    inputPrompt,
    testMode,
    caps,
    db,
  }).catch((err) => {
    console.error(`[planning] runInBackground crashed for ${sessionId}:`, err);
  });

  return { sessionId };
}

interface RunContext {
  requesterRole: RequesterRole;
  agencyId: string | null;
  inputPrompt: string;
  testMode: boolean;
  caps: PlanningSessionCaps;
  db: SupabaseClient;
}

async function runInBackground(sessionId: string, ctx: RunContext): Promise<void> {
  const { db } = ctx;

  await db
    .from('planning_sessions')
    .update({ status: 'running', started_at: new Date().toISOString() })
    .eq('id', sessionId);

  try {
    // Step 1: assemble context snapshot.
    let contextSnapshot: ContextSnapshot;
    if (ctx.requesterRole === 'chairman' || !ctx.agencyId) {
      contextSnapshot = await assemblePlatformContext(db);
    } else {
      contextSnapshot = await assembleAgencyContext(db, ctx.agencyId);
    }

    await db
      .from('planning_sessions')
      .update({ context_snapshot: contextSnapshot })
      .eq('id', sessionId);

    // Step 2: run the session (fake or real).
    if (ctx.testMode) {
      await runTestMode(sessionId, ctx, contextSnapshot);
    } else {
      await runRealMode(sessionId, ctx, contextSnapshot);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db
      .from('planning_sessions')
      .update({
        status: 'failed',
        error_message: message,
        completed_at: new Date().toISOString(),
      })
      .eq('id', sessionId);
  }
}

// ── TEST MODE ───────────────────────────────────────────────────────────

/**
 * Canned streaming response. Emits a few chunks over ~1.5s so the UI
 * can render progress updates without any network traffic or cost.
 */
async function runTestMode(
  sessionId: string,
  ctx: RunContext,
  contextSnapshot: ContextSnapshot,
): Promise<void> {
  const { db } = ctx;

  const chunks = [
    '# Test-mode planning response\n\n',
    `This is a canned fake response. No Anthropic API call was made.\n\n`,
    `**Scope:** ${contextSnapshot.scope}\n`,
    `**Agency:** ${contextSnapshot.agency_name ?? '(platform-wide)'}\n\n`,
    `## Recommendations\n\n`,
    `1. Flip \`test_mode\` off in the UI when you want a real Opus session.\n`,
    `2. Review the cost caps (\`cap_max_*\` columns) before doing so.\n`,
    `3. Start with a short prompt for your first real run.\n\n`,
    `*Generated in test mode at ${new Date().toISOString()}.*\n`,
  ];

  let accumulated = '';
  for (let i = 0; i < chunks.length; i++) {
    accumulated += chunks[i];
    await db
      .from('planning_sessions')
      .update({
        plan_output: {
          partial_text: accumulated,
          blocks_count: 1,
        },
      })
      .eq('id', sessionId);
    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  // Finalize with fake usage + zero cost.
  await db
    .from('planning_sessions')
    .update({
      status: 'reviewing',
      plan_output: {
        text: accumulated,
        usage: { input_tokens: 150, output_tokens: 120 },
        stop_reason: 'end_turn',
        model: 'test-mode-fake',
        test_mode: true,
      },
      input_tokens: 150,
      output_tokens: 120,
      cost_usd: 0,
      completed_at: new Date().toISOString(),
    })
    .eq('id', sessionId);
}

// ── REAL MODE ───────────────────────────────────────────────────────────

async function runRealMode(
  sessionId: string,
  ctx: RunContext,
  contextSnapshot: ContextSnapshot,
): Promise<void> {
  const { db, caps, inputPrompt, requesterRole } = ctx;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set in the environment');
  }

  const client = new Anthropic({ apiKey });

  const startedAt = Date.now();
  const deadlineMs = startedAt + caps.maxSeconds * 1000;

  const systemPrompt = buildSystemPrompt(requesterRole);
  const userMessage = buildUserMessage(inputPrompt, contextSnapshot);

  let accumulatedText = '';
  let accumulatedThinking = '';
  let blocksCount = 0;
  let lastDbWrite = 0;
  let inputTokens = 0;
  let outputTokens = 0;
  let stopReason: string | null = null;
  let abortedBy: string | null = null;

  // AbortController so we can stop the stream mid-flight when a cap trips.
  const abort = new AbortController();

  const capWatcher = setInterval(() => {
    const now = Date.now();
    if (now > deadlineMs) {
      abortedBy = 'time_cap';
      abort.abort();
      return;
    }
    const estimated = estimateCostUsd(inputTokens, outputTokens);
    if (estimated >= caps.maxCostUsd) {
      abortedBy = 'cost_cap';
      abort.abort();
      return;
    }
    if (outputTokens >= caps.maxOutputTokens) {
      abortedBy = 'token_cap';
      abort.abort();
      return;
    }
  }, 500);

  try {
    const stream = client.messages.stream(
      {
        model: OPUS_MODEL,
        max_tokens: Math.min(caps.maxOutputTokens, 32_000),
        system: systemPrompt,
        thinking: {
          type: 'enabled',
          budget_tokens: EXTENDED_THINKING_BUDGET,
        },
        messages: [{ role: 'user', content: userMessage }],
      },
      { signal: abort.signal },
    );

    for await (const event of stream) {
      if (event.type === 'content_block_start') {
        blocksCount++;
      } else if (event.type === 'content_block_delta') {
        if (event.delta.type === 'text_delta') {
          accumulatedText += event.delta.text;
        } else if (event.delta.type === 'thinking_delta') {
          accumulatedThinking += event.delta.thinking;
        }
      } else if (event.type === 'message_delta') {
        if (event.usage) {
          outputTokens = event.usage.output_tokens ?? outputTokens;
        }
        if (event.delta.stop_reason) {
          stopReason = event.delta.stop_reason;
        }
      } else if (event.type === 'message_start') {
        if (event.message.usage) {
          inputTokens = event.message.usage.input_tokens ?? 0;
          outputTokens = event.message.usage.output_tokens ?? 0;
        }
      }

      // Throttle DB writes during streaming.
      const now = Date.now();
      if (now - lastDbWrite > 500) {
        lastDbWrite = now;
        const liveCost = estimateCostUsd(inputTokens, outputTokens);
        db.from('planning_sessions')
          .update({
            plan_output: {
              partial_text: accumulatedText,
              thinking_text: accumulatedThinking || undefined,
              blocks_count: blocksCount,
            },
            input_tokens: inputTokens,
            output_tokens: outputTokens,
            cost_usd: liveCost,
          })
          .eq('id', sessionId)
          .then(() => {}, (err) => console.warn('[planning] progress write failed:', err));
      }
    }

    const finalMessage = await stream.finalMessage();
    inputTokens = finalMessage.usage?.input_tokens ?? inputTokens;
    outputTokens = finalMessage.usage?.output_tokens ?? outputTokens;
    stopReason = finalMessage.stop_reason ?? stopReason;
  } catch (err) {
    if (abort.signal.aborted) {
      stopReason = `aborted:${abortedBy ?? 'unknown'}`;
    } else {
      throw err;
    }
  } finally {
    clearInterval(capWatcher);
  }

  const finalCost = estimateCostUsd(inputTokens, outputTokens);

  await db
    .from('planning_sessions')
    .update({
      status: 'reviewing',
      plan_output: {
        text: accumulatedText,
        thinking: accumulatedThinking || undefined,
        usage: { input_tokens: inputTokens, output_tokens: outputTokens },
        stop_reason: stopReason,
        model: OPUS_MODEL,
        test_mode: false,
      },
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      cost_usd: finalCost,
      completed_at: new Date().toISOString(),
    })
    .eq('id', sessionId);
}

function buildSystemPrompt(role: RequesterRole): string {
  if (role === 'chairman') {
    return `You are ULTRAPLAN, an advisory planning agent for the Chairman of Trendzo.
You analyze platform-wide data and return a concrete, prioritized plan.
Your output MUST be Markdown with these sections:
  1. Situation summary (2-4 sentences)
  2. Top 3 recommendations, each with: rationale, estimated impact, risk
  3. Open questions you couldn't answer with the given context
Keep the response under 2000 words. Be honest about uncertainty.`;
  }
  return `You are ULTRAPLAN, an advisory planning agent for an agency operator on Trendzo.
You analyze the agency's recent performance and return a concrete, prioritized plan.
Your output MUST be Markdown with these sections:
  1. Agency state summary (2-4 sentences)
  2. Top 3 recommendations, each with: rationale, estimated impact, risk
  3. Open questions you couldn't answer with the given context
Keep the response under 2000 words. Be honest about uncertainty.`;
}

function buildUserMessage(prompt: string, ctx: ContextSnapshot): string {
  return [
    `# Request`,
    prompt,
    ``,
    `# Context snapshot (${ctx.scope})`,
    '```json',
    JSON.stringify(ctx, null, 2),
    '```',
  ].join('\n');
}
