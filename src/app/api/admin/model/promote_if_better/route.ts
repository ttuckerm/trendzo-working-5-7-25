import { NextRequest, NextResponse } from 'next/server'
import { promoteIfBetter } from '@/lib/services/canary/promote'

export async function POST(_req: NextRequest) {
  const decision = await promoteIfBetter()
  return NextResponse.json(decision)
}












