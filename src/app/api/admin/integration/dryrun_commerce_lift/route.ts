import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest) {
  const out = {
    ok: true,
    score_old: 71,
    score_new: 76,
    conv_old: 0.012,
    conv_new: 0.017,
    delta_conv: 0.005,
    expected_impressions: 50000,
    aov_cents: 4500,
    expected_revenue_delta_cents: 112500
  }
  return NextResponse.json(out)
}


