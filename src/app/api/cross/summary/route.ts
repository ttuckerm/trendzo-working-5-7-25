import { NextResponse } from 'next/server'
import { buildCascades, summarize } from '@/lib/cross/service'
import { getSource } from '@/lib/data'
import { ensureFixtures } from '@/lib/data/init-fixtures'

export async function GET(){
  try{
    if (process.env.MOCK === '1') ensureFixtures()
    try {
      const src = getSource()
      const cascades = await buildCascades(src as any, { windowDays: 30 })
      const sum = summarize(cascades)
      return NextResponse.json(sum)
    } catch {
      ensureFixtures()
      const cascades = await buildCascades('mock', { windowDays: 30 })
      const sum = summarize(cascades)
      return NextResponse.json(sum)
    }
  }catch{
    return NextResponse.json({ total:0, activeCascades:0, avgLags:{}, crossSRByTemplate:{}, topLeader: null })
  }
}



