"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, Home } from 'lucide-react'
import LoadingFallback from '@/components/ui/LoadingFallback'

// Define types for our template
interface Section {
  id: string
  name: string
  duration: number
}

interface Template {
  id: string
  name: string
  sections: Section[]
}

export default function SimpleEditorPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [template, setTemplate] = useState<Template | null>(null)

  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => {
      try {
        // Create a mock template
        const mockTemplate: Template = {
          id: '123',
          name: 'Simple Demo Template',
          sections: [
            {
              id: '1',
              name: 'Intro Section',
              duration: 3
            }
          ]
        }
        
        setTemplate(mockTemplate)
        setLoading(false)
      } catch (err) {
        setError('Failed to load template data')
        setLoading(false)
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <LoadingFallback 
        loadingMessage="Loading simple editor..." 
        fallbackMessage="The simple editor is taking longer than expected to load."
        timeoutMs={5000}
      />
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <h2 className="text-2xl font-semibold text-red-600 mb-4">Error</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <Link
          href="/"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Go Home
        </Link>
      </div>
    )
  }

  if (!template) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">No Template Found</h2>
        <p className="text-gray-600 mb-6">There was an issue loading the template data.</p>
        <Link
          href="/"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Go Home
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">{template.name}</h1>
        <div className="flex space-x-3">
          <Link
            href="/"
            className="flex items-center px-3 py-2 bg-gray-100 rounded text-gray-700 hover:bg-gray-200 transition-colors"
          >
            <Home className="w-4 h-4 mr-2" />
            Home
          </Link>
          <Link
            href="/editor"
            className="flex items-center px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
          >
            Full Editor
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Template Details</h2>
        <p className="text-gray-600">Template ID: {template.id}</p>
        <p className="text-gray-600">Template Name: {template.name}</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Sections ({template.sections.length})</h2>
        
        {template.sections.length === 0 ? (
          <p className="text-gray-500 italic">No sections added yet.</p>
        ) : (
          <div className="space-y-4">
            {template.sections.map((section) => (
              <div key={section.id} className="p-4 border border-gray-200 rounded-md">
                <p className="font-medium">{section.name}</p>
                <p className="text-gray-600 text-sm">Duration: {section.duration}s</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-md">
        <h3 className="text-lg font-medium text-green-800 mb-2">Simple Editor Status</h3>
        <p className="text-green-700">✅ React hooks are working correctly</p>
        <p className="text-green-700">✅ State management is functioning</p>
        <p className="text-green-700">✅ UI renders without errors</p>
      </div>
    </div>
  )
} 