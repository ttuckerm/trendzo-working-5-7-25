import { NextRequest, NextResponse } from 'next/server'
import { rebuildCreatorProfile } from '@/lib/creator/profile_builder'

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const creator_id = searchParams.get('creator_id') || ''
  if (!creator_id) return NextResponse.json({ ok: false, error: 'missing_creator_id' }, { status: 400 })
  const out = await rebuildCreatorProfile(creator_id)
  return NextResponse.json({ ok: out.ok })
}


