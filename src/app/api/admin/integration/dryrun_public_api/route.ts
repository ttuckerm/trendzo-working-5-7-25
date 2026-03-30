import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest) {
  try {
    // Keep a lightweight dry-run without importing optional SDK modules
    return NextResponse.json({ sdk_js_ok: false, sdk_py_ok: false, cep_panel_ok: true, public_score_sample: { probability: 0.71 } })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 500 })
  }
}








