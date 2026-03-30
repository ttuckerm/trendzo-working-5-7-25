// src/app/api/intel/orchestrate/route.ts
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { logLlmAudit } from "@/lib/server/supabaseAdmin";

type OrchestrateInput = { idea: string; objective?: string };
type Provider = { tag: "openai" | "anthropic"; model: string };

const providers: Provider[] = [
  process.env.OPENAI_API_KEY ? { tag: "openai", model: process.env.OPENAI_MODEL ?? "gpt-4.1" } : undefined,
  process.env.ANTHROPIC_API_KEY ? { tag: "anthropic", model: process.env.ANTH_MODEL ?? "claude-3-5-opus-latest" } : undefined,
].filter(Boolean) as Provider[];

const MAX_TOKENS = Number(process.env.LLM_MAX_TOKENS ?? "400");
const REQUEST_TIMEOUT_MS = 12_000; // 12s hard cap

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error("timeout")), ms)) as Promise<T>,
  ]);
}

async function callOpenAI(model: string, idea: string) {
  const t0 = Date.now();
  try {
    const r = await withTimeout(
      fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: "You are an assistant proposing changes to a virality algorithm." },
            { role: "user", content: `Idea: ${idea}. In 1-2 sentences, propose a safe change to test.` }
          ],
          max_tokens: Math.min(MAX_TOKENS, 200),
          temperature: 0.2,
        }),
      }),
      REQUEST_TIMEOUT_MS
    );

    const json = await r.json().catch(() => ({}));
    const latency = Date.now() - t0;
    const tokensIn = json?.usage?.prompt_tokens ?? 0;
    const tokensOut = json?.usage?.completion_tokens ?? 0;
    return {
      ok: true,
      provider: "openai",
      model,
      suggestion: json?.choices?.[0]?.message?.content ?? "",
      tokensIn,
      tokensOut,
      latency,
      costUsd: 0, // optional: compute if you want
    };
  } catch {
    return { ok: false, provider: "openai", model, suggestion: "", tokensIn: 0, tokensOut: 0, latency: Date.now() - t0, costUsd: 0 };
  }
}

async function callAnthropic(model: string, idea: string) {
  const t0 = Date.now();
  try {
    const r = await withTimeout(
      fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": process.env.ANTHROPIC_API_KEY || "",
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model,
          max_tokens: Math.min(MAX_TOKENS, 200),
          temperature: 0.2,
          system: "You propose concise, safe improvements to a virality algorithm.",
          messages: [
            { role: "user", content: `Idea: ${idea}. In 1-2 sentences, propose a safe change to test.` }
          ],
        }),
      }),
      REQUEST_TIMEOUT_MS
    );

    const json = await r.json().catch(() => ({}));
    const latency = Date.now() - t0;
    // Anthropic usage fields vary; leave zeros for now
    return {
      ok: true,
      provider: "anthropic",
      model,
      suggestion: json?.content?.[0]?.text ?? "",
      tokensIn: 0,
      tokensOut: 0,
      latency,
      costUsd: 0,
    };
  } catch {
    return { ok: false, provider: "anthropic", model, suggestion: "", tokensIn: 0, tokensOut: 0, latency: Date.now() - t0, costUsd: 0 };
  }
}

async function callProvider(p: Provider, input: OrchestrateInput, traceId: string) {
  let res:
    | ReturnType<typeof callOpenAI> extends Promise<infer R> ? R
    : never;

  if (p.tag === "openai") {
    res = await callOpenAI(p.model, input.idea);
  } else {
    res = await callAnthropic(p.model, input.idea);
  }

  // Log audit (safe no-op if admin client not configured)
  await logLlmAudit({
    trace_id: traceId,
    provider: res.provider,
    model: p.model,
    tokens_in: res.tokensIn ?? 0,
    tokens_out: res.tokensOut ?? 0,
    cost: res.costUsd ?? 0,
    latency_ms: res.latency ?? 0,
  });

  return res;
}

export async function POST(req: Request) {
  if (process.env.FF_INTEL_ORCHESTRATOR !== "true") {
    return NextResponse.json({ error: "FF_INTEL_ORCHESTRATOR=false" }, { status: 503 });
  }

  const input = (await req.json().catch(() => null)) as OrchestrateInput | null;
  if (!input?.idea) {
    return NextResponse.json({ error: "Missing 'idea'." }, { status: 400 });
  }

  const trace_id = randomUUID();

  if (providers.length === 0) {
    return NextResponse.json({
      trace_id,
      providers_hit: [],
      aggregation: "none",
      proposals: [],
      confidence: 0.0,
      note: "No providers configured",
    });
  }

  // Fan-out, but never 500 if one provider fails
  const results = await Promise.all(
    providers.map((p) => callProvider(p, input, trace_id).catch(() => ({
      ok: false, provider: p.tag, model: p.model, suggestion: "", tokensIn: 0, tokensOut: 0, latency: 0, costUsd: 0
    })))
  );

  const providers_hit = results.map((r) => `${r.provider}:${providers.find(p => p.tag === r.provider)?.model ?? ""}`);
  const okCount = results.filter((r) => r.ok).length;

  return NextResponse.json({
    trace_id,
    providers_hit,
    aggregation: okCount > 1 ? "consensus" : okCount === 1 ? "single" : "none",
    proposals: results.filter(r => r.ok && r.suggestion).map(r => ({
      changeset_type: "note",
      payload: { suggestion: r.suggestion },
      source: r.provider,
    })),
    confidence: okCount > 1 ? 0.7 : okCount === 1 ? 0.5 : 0.0,
  });
}
