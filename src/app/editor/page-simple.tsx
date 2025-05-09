"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SimpleEditorPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [template, setTemplate] = useState(null)
  const router = useRouter()
  
  // Simple useEffect to simulate loading
  useEffect(() => {
    console.log('Simple Editor: Loading effect running')
    
    // Simulate loading delay
    const timer = setTimeout(() => {
      console.log('Simple Editor: Setting loading to false')
      setIsLoading(false)
      
      // Create a mock template
      setTemplate({
        name: 'Test Template',
        sections: [
          { 
            id: '1', 
            name: 'Intro Section',
            duration: 3
          }
        ]
      })
    }, 2000)
    
    return () => clearTimeout(timer)
  }, [])
  
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading simple editor...</p>
        </div>
      </div>
    )
  }
  
  if (hasError) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">An error occurred.</p>
          <button 
            onClick={() => router.push('/')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Simple Editor - Working!</h1>
      
      {template && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl mb-4">Template: {template.name}</h2>
          
          <div className="space-y-4">
            <p>This is a simplified editor page to test loading.</p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-100 p-4 rounded">
                <h3 className="font-medium mb-2">Sections</h3>
                <ul className="list-disc pl-5">
                  {template.sections.map(section => (
                    <li key={section.id}>
                      {section.name} - {section.duration}s
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-blue-50 p-4 rounded">
                <h3 className="font-medium mb-2">Status</h3>
                <p className="text-green-600">✓ React Hooks Working</p>
                <p className="text-green-600">✓ State Management OK</p>
                <p className="text-green-600">✓ Component Rendering</p>
              </div>
            </div>
            
            <div className="flex space-x-4 mt-6">
              <button 
                onClick={() => router.push('/')}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Go Home
              </button>
              <button 
                onClick={() => router.push('/editor')}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Try Full Editor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 