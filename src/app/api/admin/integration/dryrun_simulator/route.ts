import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest) {
  // Deterministic dry-run payload without calling DB
  const payload = {
    impressions: 10000,
    completion: 0.41,
    shares_per_1k: 12,
    sim_score: 1.07,
    best_variant: {
      id: 'v3',
      predicted_delta_score: +5.0
    }
  }
  return NextResponse.json(payload)
}








