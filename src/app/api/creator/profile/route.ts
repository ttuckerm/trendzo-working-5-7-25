import { NextRequest, NextResponse } from 'next/server'
import { getCreatorProfile } from '@/lib/creator/profile_builder'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const creator_id = searchParams.get('creator_id') || ''
  if (!creator_id) return NextResponse.json({ ok: false, error: 'missing_creator_id' }, { status: 400 })
  const data = await getCreatorProfile(creator_id)
  const topTokens = (data.coeffs||[]).slice(0,8)
  const emb = data.profile?.style_embedding || []
  const checksum = String(Math.abs((emb as number[]).reduce((a:number,b:number)=> ((a*1315423911) ^ Math.floor((b*1e6))) >>> 0, 0))).padStart(8,'0')
  return NextResponse.json({ ok: true, top_tokens: topTokens, baselines: { completion: data.profile?.baseline_completion, share_rate: data.profile?.baseline_share_rate }, embedding_checksum: checksum })
}


