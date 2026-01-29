// src/app/api/intel/orchestrate/route.ts
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

type OrchestrateInput = { idea: string; objective?: string };
type Provider = { tag: "openai" | "anthropic"; model: string };

const providers: Provider[] = [
  process.env.OPENAI_API_KEY ? { tag: "openai", model: process.env.OPENAI_MODEL ?? "gpt-4.1" } : undefined,
  process.env.ANTHROPIC_API_KEY ? { tag: "anthropic", model: process.env.ANTH_MODEL ?? "claude-3-5-opus-latest" } : undefined,
].filter(Boolean) as Provider[];

const MAX_TOKENS = Number(process.env.LLM_MAX_TOKENS ?? "400");
const TIMEOUT_MS = 12_000;

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error("timeout")), ms)) as Promise<T>,
  ]);
}

// --- REAL CALLS (safe) ---
async function callOpenAI(model: string, idea: string) {
  try {
    const r = await withTimeout(fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "You propose concise, safe improvements to a virality algorithm." },
          { role: "user", content: `Idea: ${idea}. In 1-2 sentences, propose a safe change to test.` }
        ],
        max_tokens: Math.min(MAX_TOKENS, 200),
        temperature: 0.2
      })
    }), TIMEOUT_MS);
    const j = await r.json().catch(() => ({}));
    return { ok: true, provider: "openai" as const, suggestion: j?.choices?.[0]?.message?.content ?? "" };
  } catch {
    return { ok: false, provider: "openai" as const, suggestion: "" };
  }
}

async function callAnthropic(model: string, idea: string) {
  try {
    const r = await withTimeout(fetch("https://api.anthropic.com/v1/messages", {
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
        messages: [{ role: "user", content: `Idea: ${idea}. In 1-2 sentences, propose a safe change to test.` }],
      }),
    }), TIMEOUT_MS);
    const j = await r.json().catch(() => ({}));
    return { ok: true, provider: "anthropic" as const, suggestion: j?.content?.[0]?.text ?? "" };
  } catch {
    return { ok: false, provider: "anthropic" as const, suggestion: "" };
  }
}

async function callProvider(p: Provider, input: OrchestrateInput) {
  // STUB switch: if you set USE_STUB=true in .env.local, we skip vendor calls and still respond
  if (process.env.USE_STUB === "true") {
    return { ok: true, provider: p.tag, suggestion: "Stub: reduce early-view decay by 10% for A/B test." };
  }
  return p.tag === "openai"
    ? callOpenAI(p.model, input.idea)
    : callAnthropic(p.model, input.idea);
}

export async function POST(req: Request) {
  if (process.env.FF_INTEL_ORCHESTRATOR !== "true") {
    return NextResponse.json({ error: "FF_INTEL_ORCHESTRATOR=false" }, { status: 503 });
  }

  const input = await req.json().catch(() => null) as OrchestrateInput | null;
  if (!input?.idea) return NextResponse.json({ error: "Missing 'idea'." }, { status: 400 });

  const trace_id = randomUUID();

  if (providers.length === 0) {
    return NextResponse.json({ trace_id, providers_hit: [], aggregation: "none", proposals: [], confidence: 0.0 });
  }

  const results = await Promise.all(providers.map(p =>
    callProvider(p, input).catch(() => ({ ok:false, provider:p.tag, suggestion:"" }))
  ));

  const providers_hit = results.map(r => `${r.provider}:${providers.find(p => p.tag===r.provider)?.model ?? ""}`);
  const ok = results.filter(r => r.ok);
  const proposals = ok
    .filter(r => r.suggestion)
    .map(r => ({ changeset_type:"note", payload:{ suggestion:r.suggestion }, source:r.provider }));

  return NextResponse.json({
    trace_id,
    providers_hit,
    aggregation: ok.length > 1 ? "consensus" : ok.length === 1 ? "single" : "none",
    proposals,
    confidence: ok.length > 1 ? 0.7 : ok.length === 1 ? 0.5 : 0.0,
  });
}
