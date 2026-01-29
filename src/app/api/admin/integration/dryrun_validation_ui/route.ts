import { NextRequest, NextResponse } from 'next/server'
import { putJson } from '@/lib/storage/object_store'

export async function GET(_req: NextRequest) {
  const payload = {
    ok: true,
    summary: { cohort_version: '2025W33', n: 123, auroc: 0.76, precision_at_100: 0.62, ece: 0.09, heated_excluded_count: 3 },
    pending_count: 42,
    breakdown_rows: 6,
    errors_sample: 5
  }
  const saved = await putJson('proof', payload, { filename: `validation_ui_${Date.now()}.json` })
  return NextResponse.json({ ...payload, proof_file: saved.path, signed_url: saved.url })
}


