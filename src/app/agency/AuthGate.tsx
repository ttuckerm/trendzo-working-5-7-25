'use client'

import ProtectedRoute from '@/components/auth/ProtectedRoute'

export default function AgencyAuthGate({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['chairman', 'sub_admin', 'agency']}>
      {children}
    </ProtectedRoute>
  )
}
