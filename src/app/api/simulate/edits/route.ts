import { NextRequest, NextResponse } from 'next/server'
import { computeAlignmentFactor, mergeExpectedFirstHourForTokens, FirstHourTelemetryPoint } from '@/lib/frameworks/mapping_guide'

// Simple counterfactual: token presence adds small boosts
const TOKEN_WEIGHTS: Record<string, number> = {
  pov: 2.5,
  question: 1.5,
  before_after: 3.0,
  story: 2.0,
  hook: 1.0
}

export async function POST(req: NextRequest) {
  const { tokens_add = [], tokens_remove = [], base_score = 70, telemetry_override = null } = await req.json().catch(()=>({})) as any
  let delta = 0
  for (const t of tokens_add) delta += TOKEN_WEIGHTS[String(t).toLowerCase()] || 0.5
  for (const t of tokens_remove) delta -= (TOKEN_WEIGHTS[String(t).toLowerCase()] || 0.5)
  const predicted_delta_score = Math.max(-15, Math.min(15, delta))

  // Alignment factor from telemetry override when provided
  let alignment_factor = 1.0
  if (telemetry_override && Array.isArray(telemetry_override.points) && Array.isArray(telemetry_override.tokens)) {
    const expected = mergeExpectedFirstHourForTokens(telemetry_override.tokens)
    if (expected) {
      const { alignmentFactor } = computeAlignmentFactor(telemetry_override.points as FirstHourTelemetryPoint[], expected)
      alignment_factor = alignmentFactor
    }
  }
  const adjusted = Math.max(0, Math.min(100, (base_score + predicted_delta_score) * alignment_factor))
  return NextResponse.json({ ok: true, predicted_delta_score, new_score: adjusted, alignment_factor })
}


