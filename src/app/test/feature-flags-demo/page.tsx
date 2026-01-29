"use client"
import React from 'react'
import { FlagProvider, FeatureGate } from '@/lib/flags/client'

function RewardsWidget(){
  return <div data-testid="RewardsWidget" className="p-4 rounded bg-emerald-50 border border-emerald-200">Rewards!</div>
}

export default function Page(){
  return (
    <FlagProvider keys={["rewards_v1", "per_million_views_v1"]}>
      <div className="p-6 space-y-4">
        <h1 className="text-xl font-semibold">Feature Flags Demo</h1>
        <FeatureGate feature="rewards_v1"><RewardsWidget /></FeatureGate>
      </div>
    </FlagProvider>
  )
}







