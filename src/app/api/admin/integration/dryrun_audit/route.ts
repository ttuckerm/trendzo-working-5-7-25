import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import { ensureAuditTables, sha256Hex, hmacSignHex, writeEvidenceZip } from '@/lib/audit/audit_utils'

export async function GET(_req: NextRequest) {
  await ensureAuditTables()
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const prediction_id = 'mock_1'
  const model_version = '3.1.0'
  const cohort_version = '2025W33'
  const inputs_digest = sha256Hex(JSON.stringify({ a:1, b:2 }))
  const outputs_digest = sha256Hex(JSON.stringify({ score:77, prob:0.66 }))
  const seed = sha256Hex(`${inputs_digest}|${outputs_digest}|${model_version}`)
  const key = process.env.AUDIT_HMAC_KEY || process.env.NEXTAUTH_SECRET || 'local-dev'
  const signature = hmacSignHex(seed, key)
  await db.from('predictions_audit').upsert({ prediction_id, model_version, cohort_version, inputs_digest, outputs_digest, token_lifts: { x: 1 }, timing_score: 1.08, personalization_factor: 1.06, alignment_factor: 1.01, signed_at: new Date().toISOString(), signature } as any)
  const evidence_path = await writeEvidenceZip(prediction_id, {
    'manifest.json': JSON.stringify({ id: prediction_id, model_version, cohort_version }),
    'features.json': JSON.stringify({ a:1, b:2 }),
    'frameworks.json': JSON.stringify({}),
    'telemetry.json': JSON.stringify({}),
    'nowcast.json': JSON.stringify({}),
    'profile.json': JSON.stringify({}),
    'metrics_snapshot.json': JSON.stringify({ score: 77, prob: 0.66 }),
    'signature.txt': signature
  })
  const verify_seed = sha256Hex(`${inputs_digest}|${outputs_digest}|${model_version}`)
  const verify_pass = hmacSignHex(verify_seed, key) === signature
  return NextResponse.json({ prediction_id, audit_written: true, evidence_path, verify_pass })
}


