'use client'

import ProtectedRoute from '@/components/auth/ProtectedRoute'

export default function AdminAuthGate({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['chairman']}>
      {children}
    </ProtectedRoute>
  )
}
