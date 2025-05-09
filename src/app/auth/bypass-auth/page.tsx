"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

/**
 * This component is for development and testing only.
 * It allows bypassing authentication to view the dashboard.
 */
export default function BypassAuthPage() {
  const router = useRouter()
  const [redirecting, setRedirecting] = useState(false)
  const [error, setError] = useState("")

  const handleBypass = () => {
    setRedirecting(true)
    
    try {
      // Store a flag in localStorage to indicate we're in dev/test mode
      localStorage.setItem('trendzo_dev_bypass', 'true')
      
      // Use a timeout to ensure the redirect happens even if there's an issue with localStorage
      setTimeout(() => {
        router.push('/dashboard')
      }, 500)
    } catch (err) {
      console.error("Error during bypass:", err)
      setError("There was an error setting development mode. Trying direct redirect...")
      
      // Fallback direct redirect
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 1500)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Developer Access</h1>
          <p className="mt-2 text-gray-600">Access the dashboard without authentication</p>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 p-4 mb-6">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                This is for development and testing only. In production, proper authentication would be required.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleBypass}
          disabled={redirecting}
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {redirecting ? 'Redirecting...' : 'Enter Dashboard (Dev Mode)'}
        </button>
        
        <div className="mt-4 text-center">
          <Link href="/auth" className="text-sm text-blue-600 hover:text-blue-800">
            Return to normal login
          </Link>
        </div>
      </div>
    </div>
  )
} 