'use client'
import React from 'react'
import { FlagProvider } from '@/lib/flags/client'

export default function FlagProviderClient({ children }: { children: React.ReactNode }) {
  return (
    <FlagProvider 
      keys={['rewards_v1','per_million_views_v1']}
      userId={undefined}
      tenantId={undefined}
      plans={[]}
    >
      {children}
    </FlagProvider>
  )
}







