import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

export async function GET(_req: NextRequest) {
  try {
    const { data } = await db.from('organization').select('id,name').order('name')
    return NextResponse.json({ tenants: data || [] })
  } catch (e: any) {
    return NextResponse.json({ tenants: [] })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const name = body.name || null
    const id = body.id || name?.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    if (!name || !id) return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
    const { error } = await db.from('organization').insert({ id, name })
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: 'tenant_create_failed' }, { status: 500 })
  }
}


