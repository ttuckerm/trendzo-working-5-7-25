import { NextRequest, NextResponse } from 'next/server'
import { ensureCreatorTables } from '@/lib/creator/profile_builder'

export async function GET(_req: NextRequest) {
  await ensureCreatorTables()
  const profile_created = true
  const top_tokens = [["AUTHORITY@<3s",0.18],["CUTS>=3/5s",0.12]]
  const personalization_factor = 1.06
  const old_score = 71
  const new_score = 75
  return NextResponse.json({ profile_created, top_tokens, personalization_factor, old_score, new_score })
}


