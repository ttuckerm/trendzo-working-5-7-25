import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAdminDb, guardAdmin, withCache } from '../../../_lib'

const Params = z.object({ id: z.string().min(1) })
const PatchSchema = z.object({ env_flags: z.record(z.any()).optional(), scale: z.number().int().min(0).max(100).optional(), enabled: z.boolean().optional() })

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await guardAdmin(req)
  if (denied) return denied
  let db
  try { db = getAdminDb() } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'db_unavailable' }, { status: 503 })
  }
  const { id } = Params.parse(params)
  const { data: cfg } = await db.from('pipeline_module_config').select('*').eq('module_id', id).limit(1)
  const { data: mod } = await db.from('pipeline_modules').select('id,name,version,enabled').eq('id', id).limit(1)
  return withCache({ module: (mod||[])[0] || null, config: (cfg||[])[0] || null }, 5)
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await guardAdmin(req)
  if (denied) return denied
  let db
  try { db = getAdminDb() } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'db_unavailable' }, { status: 503 })
  }
  const { id } = Params.parse(params)
  const body = await req.json().catch(()=> ({}))
  const input = PatchSchema.parse(body)
  const now = new Date().toISOString()
  const updates: any = { updated_at: now }
  if (input.env_flags !== undefined) updates.env_flags = input.env_flags
  if (input.scale !== undefined) updates.scale = input.scale
  if (input.enabled !== undefined) updates.enabled = input.enabled
  await db.from('pipeline_module_config').upsert({ module_id: id, ...updates })
  if (input.enabled !== undefined) await db.from('pipeline_modules').update({ enabled: input.enabled, updated_at: now } as any).eq('id', id)
  return NextResponse.json({ ok: true })
}


