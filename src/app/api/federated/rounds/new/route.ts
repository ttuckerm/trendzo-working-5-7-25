import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/utils/adminAuth'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import { ensureFederatedTables } from '@/lib/federated/ensure'
import { dispatchAlarm } from '@/lib/ops/notifier'

export async function POST(req: NextRequest) {
  const auth = await verifyAdminAuth(req)
  if (!auth.success) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const body = await req.json().catch(()=>({})) as any
  const modelName = String(body?.modelName || 'creator_tokens')
  const minParticipants = Number(body?.minParticipants || 5)
  const clipNorm = Number(body?.clipNorm || 1.0)
  const dpSigma = Number(body?.dpSigma || 0)
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  await ensureFederatedTables()
  const version = `pers_v${new Date().getFullYear()}W${String(getWeek(new Date())).padStart(2,'0')}_r1`
  const ins = await db.from('federated_rounds').insert({ model_name: modelName, model_version: version, min_participants: minParticipants, clip_norm: clipNorm, dp_sigma: dpSigma } as any).select('round_id,model_version').limit(1)
  try { await dispatchAlarm('federated_round_opened', 'info', { message: `Round opened for ${modelName}`, cohort: version }) } catch {}
  return NextResponse.json({ roundId: ins.data?.[0]?.round_id, modelVersion: ins.data?.[0]?.model_version })
}

function getWeek(d: Date) { const onejan = new Date(d.getFullYear(),0,1); return Math.ceil((((d as any) - (onejan as any)) / 86400000 + onejan.getDay()+1)/7) }


