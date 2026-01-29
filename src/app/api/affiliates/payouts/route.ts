import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_ANON_KEY } from '@/lib/env'

function getDb(){
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY)
}

export async function GET(req: NextRequest) {
  const supabase = getDb()
  const { searchParams } = new URL(req.url)
  const period = searchParams.get('period') || undefined
  let q = supabase.from('payout').select('*').order('id', { ascending: false } as any)
  if (period) q = (q as any).eq('period', period)
  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ items: data || [] })
}



