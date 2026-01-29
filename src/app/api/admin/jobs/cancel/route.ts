import { NextRequest, NextResponse } from 'next/server'
import { markCanceled } from '@/lib/jobs/job_store'

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ ok: false, error: 'missing id' }, { status: 400 })
  await markCanceled(id)
  return NextResponse.json({ ok: true })
}


