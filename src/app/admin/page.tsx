'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to Chairman by default
    router.push('/admin/chairman')
  }, [router])

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="text-4xl mb-4">🎯</div>
        <div className="text-lg">Redirecting to Chairman...</div>
      </div>
    </div>
  )
}