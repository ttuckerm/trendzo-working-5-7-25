// src/app/api/intel/status/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/server/supabaseAdmin";

export async function GET() {
  const flags = {
    FF_INTEL_ORCHESTRATOR: process.env.FF_INTEL_ORCHESTRATOR === "true",
    FF_TWO_PERSON_RULE: process.env.FF_TWO_PERSON_RULE === "true",
    FF_CI_GOLDEN_GATE: process.env.FF_CI_GOLDEN_GATE === "true",
    FF_KILL_ALG: process.env.FF_KILL_ALG === "true",
  };
  const providers = [
    process.env.OPENAI_API_KEY ? `openai:${process.env.OPENAI_MODEL ?? "gpt-4.1"}` : null,
    process.env.ANTHROPIC_API_KEY ? `anthropic:${process.env.ANTH_MODEL ?? "claude-3-5-opus-latest"}` : null,
  ].filter(Boolean);

  let recent: Array<{ trace_id: string; provider: string; model: string; cost: number; created_at: string }> = [];
  try {
    if (supabaseAdmin) {
      const { data } = await supabaseAdmin
        .from("ai_llm_audit")
        .select("trace_id,provider,model,cost,created_at")
        .order("created_at", { ascending: false })
        .limit(10);
      recent = (data ?? []) as any;
    }
  } catch {
    // ignore
  }

  return NextResponse.json({
    flags,
    providers_configured: providers,
    recent_audit: recent,
  });
}
