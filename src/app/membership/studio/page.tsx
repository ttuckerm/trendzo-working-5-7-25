"use client"

import React from 'react'
import dynamic from 'next/dynamic'
import { FeatureGate } from '@/lib/flags/client'
import RewardsLiveProbe from '@/components/RewardsLiveProbe'

// Render the exact Admin Studio page to match design 1:1
const AdminStudio = dynamic(() => import('@/app/admin/studio/page'), { ssr: false })

export default function MemberStudioPage() {
  return (
    <>
      <RewardsLiveProbe />
      <AdminStudio />
    </>
  )
}


