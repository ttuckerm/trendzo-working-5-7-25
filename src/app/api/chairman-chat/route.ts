import { streamText, convertToModelMessages, tool, stepCountIs } from 'ai';
import { createUIMessageStream, createUIMessageStreamResponse } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env';
import { z } from 'zod';

// Phase 1.6: forced dynamic to prevent Vercel build-phase static generation OOM
export const dynamic = 'force-dynamic'

export const runtime = 'nodejs';

// Service-role Supabase client for tool handlers (server-only)
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

// ────────────────────────────────────────────────────────────────────────────
// Tools — Chairman OS dashboard mutations
// ────────────────────────────────────────────────────────────────────────────

const chairmanTools = {
  update_skill_status: tool({
    description: 'Update the status and progress of a skill in the build queue.',
    inputSchema: z.object({
      skill_id: z.string().describe('Skill identifier, e.g. "SKILL-002"'),
      status: z.enum(['done', 'in_progress', 'blocked']),
      progress_pct: z.number().min(0).max(100),
    }),
    execute: async ({ skill_id, status, progress_pct }) => {
      const { error } = await supabaseAdmin
        .from('chairman_skills')
        .update({ status, progress_pct, updated_at: new Date().toISOString() })
        .eq('skill_id', skill_id);
      if (error) {
        console.error('[chairman-chat] update_skill_status error:', error);
        return { success: false, error: error.message };
      }
      return { success: true, skill_id, status, progress_pct };
    },
  }),

  add_loop: tool({
    description: 'Add a new open loop item to the chairman dashboard.',
    inputSchema: z.object({
      description: z.string().min(1),
    }),
    execute: async ({ description }) => {
      const { data, error } = await supabaseAdmin
        .from('chairman_loops')
        .insert({ description, resolved: false })
        .select('id')
        .single();
      if (error) {
        console.error('[chairman-chat] add_loop error:', error);
        return { success: false, error: error.message };
      }
      return { success: true, loop_id: data?.id, description };
    },
  }),

  resolve_loop: tool({
    description: 'Mark an open loop as resolved.',
    inputSchema: z.object({
      loop_id: z.string().describe('UUID of the loop row to resolve'),
    }),
    execute: async ({ loop_id }) => {
      const { error } = await supabaseAdmin
        .from('chairman_loops')
        .update({ resolved: true })
        .eq('id', loop_id);
      if (error) {
        console.error('[chairman-chat] resolve_loop error:', error);
        return { success: false, error: error.message };
      }
      return { success: true, loop_id };
    },
  }),
};

const CHAIRMAN_SYSTEM_PROMPT = `You are the Trendzo Chairman OS. You are the operating intelligence for Tommy, the solo founder and chairman of Trendzo.

Your role: brief him on what matters, tell him exactly what to do next, and help him build the Trendzo platform layer by layer. You think in systems. You are direct and concise. No fluff.

CURRENT BUILD STATE:
- Stack: Next.js + Supabase + Vercel AI SDK. Windows/PowerShell. Cursor + Claude Code.
- Repo: ttuckerm/trendzo-working-5-7-25 (private)
- Build model: Trendzo mirrors Anthropic's layer architecture applied to creator operations

LAYER STATUS:
- Substrate: Creator Operations Graph (58-feature fingerprint + DPS/VPS) — BUILT
- Layer 1: DPS v2.1.0 (8-signal) + XGBoost VPS (ρ = 0.61) — BUILT
- Layer 2: Skills — IN PROGRESS (1 of 5 done: Creator Profiling)
- Layer 3: TrendzoCards — BUILT
- Layer 4: Campaign Projects — NOT STARTED
- Layer 5: Memory — PARTIAL
- Layer 6: MCP (TikTok, Beehiiv) — PARTIAL
- Layer 7: Managed Agents — NOT STARTED
- Layer 8: Agency Swarm — NOT STARTED

SKILLS QUEUE:
- SKILL-001: Creator Profiling — DONE
- SKILL-002: Video Fingerprinting — IN PROGRESS (next to build)
- SKILL-003: DPS/VPS Scoring — BLOCKED (needs SKILL-002)
- SKILL-004: Brief Generation — BLOCKED (needs SKILL-002 + SKILL-003)
- SKILL-005: Feedback Generation — BLOCKED (needs SKILL-001)

OPEN LOOPS:
- SKILL-002 needs the 10 category names for the 58-feature fingerprint
- 33-44 Cursor prompts not yet run
- Google Drive not connected to Claude project

RULES:
- Always know where we are in the layer build
- When Tommy asks what to do next, give him one specific action
- When he brings an error, diagnose it and give him the exact fix
- Never suggest research sprints or methodology. He builds, he doesn't study.
- npm run build crashes locally due to RAM — always use Vercel for builds or npx tsc --noEmit for type checking
- All Cursor prompts must be delivered as plain copyable text

DASHBOARD TOOLS (call them directly, don't ask permission):
- update_skill_status(skill_id, status, progress_pct) — when Tommy reports progress on a skill, update it
- add_loop(description) — when a new blocker or open item surfaces in conversation, log it
- resolve_loop(loop_id) — when Tommy confirms a loop is done, resolve it
After any tool call, give Tommy a one-line confirmation of what you just did.`;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const cappedMessages = messages.length > 40 ? messages.slice(-40) : messages;
    const modelMessages = await convertToModelMessages(cappedMessages);

    const result = streamText({
      model: anthropic('claude-sonnet-4-5'),
      system: CHAIRMAN_SYSTEM_PROMPT,
      messages: modelMessages,
      tools: chairmanTools,
      stopWhen: stepCountIs(5),
    });

    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        writer.merge(result.toUIMessageStream());
      },
      onError: (error) => {
        console.error('[chairman-chat] Stream error:', error);
        return error instanceof Error ? error.message : String(error);
      },
    });

    return createUIMessageStreamResponse({ stream });
  } catch (error) {
    console.error('[chairman-chat] Unhandled error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', detail: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
