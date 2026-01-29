import { NextRequest, NextResponse } from 'next/server'
import { getCurrentModel, readCandidate } from '@/lib/learning/store'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const which = searchParams.get('which') || 'current'
    if (which === 'candidate') {
      const cand = await readCandidate()
      return NextResponse.json(cand)
    }
    const cur = await getCurrentModel()
    return NextResponse.json(cur)
  } catch (e:any) {
    return NextResponse.json(null)
  }
}








































































































































