import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const KEY = process.env.SUPABASE_SERVICE_KEY as string

export async function GET() {
  try {
    const db = createClient(URL, KEY)
    const { data, error } = await db.from('drift_events').select('*').order('created_at', { ascending: false }).limit(50)
    if (error) throw error
    return NextResponse.json({ events: data })
  } catch (e:any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}


