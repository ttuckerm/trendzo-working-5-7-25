"use client"

import dynamic from 'next/dynamic'
import React from 'react'
import { useFeature } from '@/hooks/useFeature'
import { useSubscription } from '@/lib/contexts/SubscriptionContext'

// Lazy-load the existing sandbox Quick Win workflow implementation.
// This avoids duplicating logic while letting us surface it in the member UI.
const QuickWinWorkflow = dynamic(() => import('@/app/sandbox/quick-win-workflow/page'), { ssr: false })

export default function QuickWinEntry(): JSX.Element {
  const { tier } = useSubscription()
  const enabledByFlag = useFeature('member.viral_workflow_v1', 'anonymous', tier, undefined)
  const forced = process.env.NEXT_PUBLIC_FORCE_ENABLE_MEMBER_VIRAL_WORKFLOW === '1'
  const devMode = process.env.NODE_ENV !== 'production'
  // In development, show the workflow by default. In staging/prod, require flag or explicit env override.
  const enabled = Boolean(devMode || enabledByFlag || forced)

  if (!enabled) {
    return (
      <div className="mx-auto max-w-3xl py-10">
        <h1 className="text-2xl font-semibold">Coming soon</h1>
        <p className="mt-2 text-gray-600">This workflow isn’t enabled for your account yet.</p>
      </div>
    )
  }

  return <QuickWinWorkflow />
}


