"use client"

import { useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"

function CallbackHandlerContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Use the fallback parameter from URL - no localStorage needed
    // The 'next' param is passed through OAuth and becomes 'fallback' here
    const destination = searchParams.get('fallback') || '/dashboard'
    
    console.log('=== CALLBACK HANDLER ===')
    console.log('Redirecting to:', destination)
    
    router.replace(destination)
  }, [router, searchParams])

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-zinc-400">Completing sign in...</p>
      </div>
    </div>
  )
}

export default function CallbackHandlerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Loading...</p>
        </div>
      </div>
    }>
      <CallbackHandlerContent />
    </Suspense>
  )
}
