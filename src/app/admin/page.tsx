'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to Command Center by default
    router.push('/admin/command-center')
  }, [router])

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="text-4xl mb-4">🎯</div>
        <div className="text-lg">Redirecting to Command Center...</div>
      </div>
    </div>
  )
}