import { NextResponse } from 'next/server'

export async function GET() {
  // Mock calibration/uplift per template
  const items = Array.from({ length: 8 }).map((_x, i) => ({
    id: `tpl_${i+1}`,
    name: `Template ${i+1}`,
    uplift_vs_baseline_pct: 12 + (i % 5) * 3,
    calibration_error_pct: 5 + (i % 4) * 2,
    confusion: { tp: 80+i, fp: 10+i, fn: 8+i, tn: 120+i }
  }))
  return NextResponse.json({ items })
}


