// src/pages/_app.tsx
import type { AppProps } from 'next/app'
import { useEffect } from 'react'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { initErrorHandling } from '@/lib/utils/errorHandler'
import { setCrashlyticsUserId } from '@/lib/firebase/firebase'
import { featureFlags } from '@/lib/utils/featureFlags'

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Initialize error handling
    initErrorHandling()
    
    // Initialize feature flags
    featureFlags.initialize().catch(console.error)
    
    // If you have user authentication, you can set the user ID here
    // For example:
    // if (user?.uid) {
    //   setCrashlyticsUserId(user.uid)
    // }
  }, [])

  return (
    <ErrorBoundary>
      <Component {...pageProps} />
    </ErrorBoundary>
  )
}