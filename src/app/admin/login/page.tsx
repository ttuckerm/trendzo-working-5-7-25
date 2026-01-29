"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ChevronLeft, Shield } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/hooks/useAuth"

// Admin redirect destination - passed through OAuth URL, NOT localStorage
const ADMIN_REDIRECT_PATH = '/admin/studio'

export default function AdminLoginPage() {
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { user, loading, signInWithGoogle, isAdmin } = useAuth()

  // If already logged in as admin, redirect to studio
  useEffect(() => {
    if (!loading && user) {
      if (isAdmin) {
        router.push(ADMIN_REDIRECT_PATH)
      } else {
        setError("You don't have admin access. Please sign in with an admin account.")
      }
    }
  }, [user, loading, isAdmin, router])

  const handleGoogleSignIn = async () => {
    setError("")
    setIsLoading(true)

    try {
      // Pass admin intent THROUGH the OAuth URL - no localStorage needed
      console.log('=== ADMIN LOGIN: Starting OAuth with redirect to:', ADMIN_REDIRECT_PATH)
      await signInWithGoogle(ADMIN_REDIRECT_PATH)
      // OAuth will redirect to Google, then to /auth/callback?next=/admin/studio
    } catch (err: any) {
      console.error('Admin login error:', err)
      setError(err?.message || 'Sign-in failed. Please try again.')
      setIsLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 flex flex-col">
      {/* Back button */}
      <div className="p-4">
        <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-zinc-200 transition-colors">
          <ChevronLeft size={16} />
          <span>Back to home</span>
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex-1 flex items-center justify-center p-4"
      >
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Admin Studio Login</h1>
            <p className="text-zinc-400">Sign in to access The Studio admin platform</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Google sign in button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg
              bg-white text-zinc-900 font-semibold
              hover:bg-zinc-100 active:bg-zinc-200
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Sign in with Google</span>
              </>
            )}
          </button>

          {/* Info text */}
          <p className="mt-6 text-center text-sm text-zinc-500">
            Admin access is restricted to authorized accounts only.
          </p>
        </div>
      </motion.div>
    </div>
  )
}
