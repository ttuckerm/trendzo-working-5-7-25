import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import { writeEvidenceZip, sha256Hex, hmacSignHex } from '@/lib/audit/audit_utils'

export async function GET(_req: NextRequest, { params }: { params: { id: string }}) {
  const id = params.id
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const { data: pred } = await db.from('viral_predictions').select('*').eq('id', id).limit(1)
  const { data: audit } = await db.from('predictions_audit').select('*').eq('prediction_id', id).limit(1)
  const manifest = { id, created_at: new Date().toISOString(), audit_signature: audit?.[0]?.signature || null }
  const features = pred?.[0]?.prediction_factors?.input || {}
  const frameworks = pred?.[0]?.prediction_factors?.breakdown || {}
  const telemetry = pred?.[0]?.prediction_factors?.telemetry || {}
  const nowcast = pred?.[0]?.prediction_factors?.timing || {}
  const profile = pred?.[0]?.prediction_factors?.creator || {}
  const metrics = pred?.[0] || {}
  const key = process.env.AUDIT_HMAC_KEY || process.env.NEXTAUTH_SECRET || 'local-dev'
  const signatureTxt = hmacSignHex(sha256Hex(JSON.stringify(manifest)), key)
  const evidencePath = await writeEvidenceZip(id, {
    'manifest.json': JSON.stringify(manifest),
    'features.json': JSON.stringify(features),
    'frameworks.json': JSON.stringify(frameworks),
    'telemetry.json': JSON.stringify(telemetry),
    'nowcast.json': JSON.stringify(nowcast),
    'profile.json': JSON.stringify(profile),
    'metrics_snapshot.json': JSON.stringify(metrics),
    'signature.txt': signatureTxt
  })
  return NextResponse.json({ path: evidencePath })
}


