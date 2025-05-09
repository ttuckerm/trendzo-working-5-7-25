"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/**
 * This component provides a direct entry point to the dashboard for development.
 * It automatically sets the bypass flag and redirects.
 */
export default function DevBypassPage() {
  const router = useRouter()

  useEffect(() => {
    // This effect runs on the client side only
    try {
      // Set the development bypass flag
      localStorage.setItem('trendzo_dev_bypass', 'true')
      
      // Redirect to dashboard after a brief delay
      const timeout = setTimeout(() => {
        router.push('/dashboard')
      }, 200)
      
      return () => clearTimeout(timeout)
    } catch (err) {
      console.error("Error in direct bypass:", err)
      // Fallback direct redirect
      window.location.href = '/dashboard'
    }
  }, [router])

  // Simple loading display while redirecting
  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="mb-4 text-xl font-semibold text-gray-800">Development Mode</div>
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-600"></div>
        <div className="mt-4 text-gray-600">Redirecting to dashboard...</div>
      </div>
    </div>
  )
} 