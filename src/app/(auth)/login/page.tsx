'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseClient } from '@/lib/supabase/client'
export const dynamic = 'force-dynamic';

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()
  const explicitRedirect = searchParams.get('redirect')
  const target = explicitRedirect || '/admin/control-center'

  useEffect(() => {
    const supabase = getSupabaseClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        window.location.href = target
      }
    })
    return () => subscription.unsubscribe()
  }, [target])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const supabase = getSupabaseClient()
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          setError('Invalid email or password.')
        } else if (authError.message.includes('Email not confirmed')) {
          setError('Please confirm your email before signing in.')
        } else {
          setError(authError.message)
        }
        setLoading(false)
        return
      }

      window.location.href = target
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ backgroundColor: '#08080d', fontFamily: 'var(--font-body), sans-serif' }}
    >
      <div className="w-full max-w-md">
        <h1
          className="mb-2 text-center text-4xl font-bold text-white"
          style={{ fontFamily: 'var(--font-display), serif' }}
        >
          Welcome back
        </h1>
        <p className="mb-8 text-center text-sm text-zinc-400">
          Sign in to your Trendzo account
        </p>

        {error && (
          <div className="mb-4 rounded-lg border border-red-800/50 bg-red-950/40 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm text-zinc-400">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={loading}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-white placeholder-zinc-500 transition focus:border-[#dc143c] focus:outline-none focus:ring-1 focus:ring-[#dc143c] disabled:opacity-50"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm text-zinc-400">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-white placeholder-zinc-500 transition focus:border-[#dc143c] focus:outline-none focus:ring-1 focus:ring-[#dc143c] disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
            style={{ backgroundColor: '#dc143c' }}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-[#dc143c] hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
