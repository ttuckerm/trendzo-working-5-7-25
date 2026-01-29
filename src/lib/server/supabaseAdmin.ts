// src/lib/server/supabaseAdmin.ts
import { createClient } from "@supabase/supabase-js";

// Safe no-op if env isn't set yet
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY; // server-only

export const supabaseAdmin =
  url && key
    ? createClient(url, key, {
        auth: { persistSession: false },
      })
    : null;

export async function logLlmAudit(row: {
  trace_id: string;
  provider: string;
  model: string;
  tokens_in?: number;
  tokens_out?: number;
  cost?: number;
  latency_ms?: number;
}) {
  try {
    if (!supabaseAdmin) return; // no-op
    await supabaseAdmin.from("ai_llm_audit").insert({
      trace_id: row.trace_id,
      provider: row.provider,
      model: row.model,
      tokens_in: row.tokens_in ?? 0,
      tokens_out: row.tokens_out ?? 0,
      cost: row.cost ?? 0,
      latency_ms: row.latency_ms ?? 0,
    });
  } catch {
    // swallow errors to avoid 500s
  }
}
