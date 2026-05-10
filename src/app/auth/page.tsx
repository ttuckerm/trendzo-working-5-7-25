"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
export const dynamic = 'force-dynamic';

/**
 * Legacy /auth route — redirects to /login.
 * Kept for backward compatibility with existing links/bookmarks.
 */
export default function AuthPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const next = searchParams.get('next')
    if (next) {
      router.replace(`/login?redirect=${encodeURIComponent(next)}`)
    } else {
      router.replace('/login')
    }
  }, [router, searchParams])

  return null
}
