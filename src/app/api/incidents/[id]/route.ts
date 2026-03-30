import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_ANON_KEY } from '@/lib/env'

function getDb(){
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY)
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = getDb()
  const id = Number(params.id)
  const { data, error } = await supabase.from('incident').select('*').eq('id', id).limit(1)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data || !data[0]) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  return NextResponse.json(data[0])
}



