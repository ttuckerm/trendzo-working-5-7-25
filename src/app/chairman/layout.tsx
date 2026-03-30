'use client'

import React from 'react'
import type { ReactNode } from 'react'

/**
 * Chairman layout — wraps all /chairman/* pages.
 * Route protection is handled by Next.js middleware (role check).
 * Uses the same layout structure as /admin for now.
 */
export default function ChairmanLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
