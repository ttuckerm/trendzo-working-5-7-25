import { NextRequest, NextResponse } from 'next/server'
import { suggestTimes } from '@/lib/services/schedule-service'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const niche = searchParams.get('niche') || undefined
  const goal = searchParams.get('goal') || undefined
  const platforms = (searchParams.get('platforms')||'').split(',').filter(Boolean)
  const items = suggestTimes({ niche, goal, platforms })
  return NextResponse.json(items)
}


