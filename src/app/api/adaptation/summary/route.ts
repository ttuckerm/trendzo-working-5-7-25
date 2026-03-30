import { NextResponse } from 'next/server'
import { computeSignals } from '@/lib/adaptation/signals'
import { recentChanges } from '@/lib/adaptation/store'

export async function GET() {
  try {
    const sig = computeSignals()
    const status = ((): 'Stable'|'Shifting'|'Storm' => {
      const stable = sig.psiProb < 0.15 && sig.psiFeatures < 0.15 && Math.abs(sig.dECE) < 0.03
      if (stable) return 'Stable'
      const shifting = sig.psiProb <= 0.3 || sig.psiFeatures <= 0.3 || Math.abs(sig.dECE) < 0.06
      if (shifting) return 'Shifting'
      return 'Storm'
    })()
    const changes = recentChanges(20)
    const lastChange = changes.find(c => c.applied) || changes[0]
    const lastChangeISO = (lastChange as any)?.appliedAtISO || (lastChange as any)?.proposed?.createdAtISO || new Date().toISOString()
    const weather = { status, lastChangeISO, driftIndex: Math.max(sig.psiProb, sig.psiFeatures) }
    const latestProposal = changes.find(c => !c.applied)?.proposed || null
    const autoPromote = process.env.AUTO_PROMOTE === '1'
    return NextResponse.json({ weather, latestProposal, recentChanges: changes, signals: sig, autoPromote })
  } catch (e:any) {
    return NextResponse.json({ weather: { status: 'Stable', lastChangeISO: new Date().toISOString(), driftIndex: 0 }, latestProposal: null, recentChanges: [], signals: { psiProb:0, psiFeatures:0, dECE:0, dAcc:0, jsTemplate:0, severity:'none' }, autoPromote: process.env.AUTO_PROMOTE === '1' })
  }
}


