import { NextResponse } from 'next/server'
import { planRetune } from '@/lib/adaptation/policy'
import { recordProposal } from '@/lib/adaptation/store'

export async function POST() {
  try {
    const { signals, proposed } = await planRetune()
    recordProposal({ ...proposed, createdAtISO: new Date().toISOString() })
    return NextResponse.json({ signals, proposed })
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || 'scan_failed' }, { status: 500 })
  }
}


