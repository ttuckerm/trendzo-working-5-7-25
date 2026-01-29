'use client'
import { FeatureGate } from '@/lib/flags/client'

export default function RewardsLiveProbe() {
  return (
    <FeatureGate feature="rewards_v1">
      <div data-testid="RewardsWidget" style={{padding:12, margin:'12px 0', border:'2px solid #22c55e', borderRadius:8, fontWeight:700}}>
        ✅ Rewards are LIVE
      </div>
    </FeatureGate>
  )
}







