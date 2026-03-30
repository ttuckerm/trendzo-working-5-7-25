import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

export async function DELETE(_: NextRequest, { params }: { params: { tenantId: string; keyId: string } }) {
  const { tenantId, keyId } = params
  await db.from('api_key').update({ revoked_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', keyId)
  return NextResponse.json({ ok: true })
}


