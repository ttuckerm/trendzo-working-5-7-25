'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { getSupabaseClient } from '@/lib/supabase/client'
export const dynamic = 'force-dynamic';

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)

    try {
      const supabase = getSupabaseClient()
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (authError) {
        if (authError.message.includes('User already registered')) {
          setError('This email is already registered. Try signing in instead.')
        } else {
          setError(authError.message)
        }
        return
      }

      setSuccess(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div
        className="flex min-h-screen items-center justify-center px-4"
        style={{ backgroundColor: '#08080d', fontFamily: 'var(--font-body), sans-serif' }}
      >
        <div className="w-full max-w-md text-center">
          <h1
            className="mb-4 text-3xl font-bold text-white"
            style={{ fontFamily: 'var(--font-display), serif' }}
          >
            Check your email
          </h1>
          <p className="mb-6 text-zinc-400">
            We sent a confirmation link to <span className="text-white">{email}</span>.
            Click the link to activate your account.
          </p>
          <Link
            href="/login"
            className="text-sm text-[#dc143c] hover:underline"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ backgroundColor: '#08080d', fontFamily: 'var(--font-body), sans-serif' }}
    >
      <div className="w-full max-w-md">
        {/* Heading */}
        <h1
          className="mb-2 text-center text-4xl font-bold text-white"
          style={{ fontFamily: 'var(--font-display), serif' }}
        >
          Create account
        </h1>
        <p className="mb-8 text-center text-sm text-zinc-400">
          Get started with Trendzo
        </p>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-800/50 bg-red-950/40 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Form */}
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

          <div>
            <label htmlFor="confirm-password" className="mb-1.5 block text-sm text-zinc-400">
              Confirm password
            </label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
            {loading ? 'Creating account...' : 'Sign up'}
          </button>
        </form>

        {/* Footer link */}
        <p className="mt-6 text-center text-sm text-zinc-500">
          Already have an account?{' '}
          <Link href="/login" className="text-[#dc143c] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
