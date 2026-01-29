import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { randomBytes, createHash } from 'crypto'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

export async function GET(_: NextRequest, { params }: { params: { tenantId: string } }) {
  const tenantId = params.tenantId
  const { data } = await db.from('api_key').select('id,name,last_used_at,revoked_at').eq('tenant_id', tenantId).order('created_at', { ascending: false })
  return NextResponse.json({ keys: data || [] })
}

export async function POST(_: NextRequest, { params }: { params: { tenantId: string } }) {
  const tenantId = params.tenantId
  const raw = `tk_${randomBytes(24).toString('hex')}`
  const hash = createHash('sha256').update(raw).digest('hex')
  const name = `key_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}`
  await db.from('api_key').insert({ tenant_id: tenantId, name, hash })
  return NextResponse.json({ key: raw, name })
}


