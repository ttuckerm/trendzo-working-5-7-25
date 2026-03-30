import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import { createRateLimiter, RateLimitTiers } from '@/lib/security/rate-limiter'
import { sha256Hex, hmacSignHex } from '@/lib/audit/audit_utils'

const limiter = createRateLimiter({ ...RateLimitTiers.GLOBAL_MODERATE, keyPrefix: 'integrity_public' })

export async function GET(req: NextRequest) {
  const rate = await limiter(req)
  if (rate) return rate
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const { data } = await db.from('predictions_audit').select('prediction_id,model_version,inputs_digest,outputs_digest,signature').order('signed_at', { ascending: false }).limit(20)
  let pass = 0, fail = 0
  const key = process.env.AUDIT_HMAC_KEY || process.env.NEXTAUTH_SECRET || 'local-dev'
  for (const row of (data||[])) {
    const seed = sha256Hex(`${row.inputs_digest}|${row.outputs_digest}|${row.model_version}`)
    const sig = hmacSignHex(seed, key)
    if (sig === row.signature) pass++; else fail++
  }
  const payload = { sample_n: (data||[]).length, pass, fail, last_run: new Date().toISOString() }
  const res = NextResponse.json(payload)
  res.headers.set('Cache-Control','public, max-age=300')
  res.headers.set('Access-Control-Allow-Origin','*')
  res.headers.set('Access-Control-Allow-Methods','GET, OPTIONS')
  res.headers.set('Access-Control-Allow-Headers','Content-Type')
  return res
}

export async function OPTIONS() {
  const res = NextResponse.json({ ok: true })
  res.headers.set('Access-Control-Allow-Origin','*')
  res.headers.set('Access-Control-Allow-Methods','GET, OPTIONS')
  res.headers.set('Access-Control-Allow-Headers','Content-Type')
  res.headers.set('Cache-Control','public, max-age=300')
  return res
}


