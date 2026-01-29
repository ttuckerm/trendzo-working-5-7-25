import { NextRequest, NextResponse } from 'next/server'
import { ensureFiles, listCreators, listPlans, listSessions } from '@/lib/scale/store'

export async function GET(_req: NextRequest){
  try{
    ensureFiles()
    const creators = listCreators()
    const plans = listPlans()
    const sessions = listSessions()
    const byCreatorSessions: Record<string, number> = {}
    for (const s of sessions) byCreatorSessions[s.creatorId] = (byCreatorSessions[s.creatorId]||0) + 1
    const planSet = new Set(plans.map(p=>p.creatorId))
    const items = creators.map(c=> ({
      ...c,
      hasPlan: planSet.has(c.id),
      sessions: byCreatorSessions[c.id]||0,
      done: (byCreatorSessions[c.id]||0) >= 30
    }))
    return NextResponse.json({ creators: items })
  } catch (e:any) {
    return NextResponse.json({ creators: [], error: String(e?.message||e) })
  }
}


