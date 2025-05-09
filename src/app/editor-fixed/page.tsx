"use client"

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

// Emergency fallback page with zero editor functionality
export default function EditorPageEmergencyFallback() {
  return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8 max-w-md">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mb-4">
          <AlertTriangle className="h-8 w-8 text-amber-600" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">Editor Temporarily Unavailable</h2>
        <p className="text-gray-600 mb-6">
          The template editor is currently being updated to fix a technical issue. 
          We apologize for the inconvenience.
        </p>
        <div className="flex flex-col space-y-3">
          <Link href="/dashboard-view/template-library" passHref>
            <Button className="w-full">
              Return to Template Library
            </Button>
          </Link>
          <Link href="/" passHref>
            <Button variant="outline" className="w-full mt-2">
              Go to Homepage
            </Button>
          </Link>
          <p className="text-xs text-gray-500 mt-6">
            Error details: Rendering loop detected in editor component.
            Our team has been notified and is working on a permanent fix.
          </p>
        </div>
      </div>
    </div>
  )
} 