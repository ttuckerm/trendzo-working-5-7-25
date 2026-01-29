import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const modelName = searchParams.get('modelName') || 'creator_tokens'
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const { data } = await db.from('federated_rounds').select('*').eq('model_name', modelName).eq('status','open').order('started_at', { ascending: false }).limit(1)
  const row: any = (data||[])[0]
  if (!row) return NextResponse.json({ status: 'none' })
  return NextResponse.json({ roundId: row.round_id, modelVersion: row.model_version, featureSpace: 'creator_tokens', clipNorm: row.clip_norm, dpSigma: row.dp_sigma })
}


