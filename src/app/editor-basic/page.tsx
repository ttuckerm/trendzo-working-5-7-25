"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Play, 
  AlertCircle,
  Loader2,
  ArrowRight,
  Home,
  Plus,
  X,
  Edit,
  Save,
  Clock,
  TrendingUp
} from 'lucide-react'
import LoadingFallback from '@/components/ui/LoadingFallback'

// Define types for our template structure
interface TextOverlay {
  id: string
  text: string
  position: {
    x: number
    y: number
  }
  style: {
    color: string
    fontSize: number
    fontWeight: string
  }
}

interface Section {
  id: string
  name: string
  duration: number
  textOverlays: TextOverlay[]
}

interface Template {
  id: string
  name: string
  description: string
  sections: Section[]
  createdAt: string
  updatedAt: string
}

// Helper function to generate UUIDs
function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Create a default template
function createDefaultTemplate(): Template {
  return {
    id: uuidv4(),
    name: 'Basic Demo Template',
    description: 'A template created in basic editor mode',
    sections: [
      {
        id: uuidv4(),
        name: 'Introduction',
        duration: 5,
        textOverlays: [
          {
            id: uuidv4(),
            text: 'Welcome to our product!',
            position: { x: 50, y: 30 },
            style: {
              color: '#ffffff',
              fontSize: 24,
              fontWeight: 'bold'
            }
          }
        ]
      },
      {
        id: uuidv4(),
        name: 'Features',
        duration: 8,
        textOverlays: [
          {
            id: uuidv4(),
            text: 'Key Features:',
            position: { x: 50, y: 20 },
            style: {
              color: '#ffffff',
              fontSize: 20,
              fontWeight: 'bold'
            }
          }
        ]
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export default function BasicEditorPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [template, setTemplate] = useState<Template | null>(null)
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [newSectionName, setNewSectionName] = useState('')
  const [newSectionDuration, setNewSectionDuration] = useState(5)

  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => {
      try {
        const defaultTemplate = createDefaultTemplate()
        setTemplate(defaultTemplate)
        setLoading(false)
      } catch (err) {
        setError('Failed to initialize template data')
        setLoading(false)
      }
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  const addSection = () => {
    if (!template) return
    
    const newSection: Section = {
      id: uuidv4(),
      name: 'New Section',
      duration: 5,
      textOverlays: []
    }
    
    setTemplate({
      ...template,
      sections: [...template.sections, newSection],
      updatedAt: new Date().toISOString()
    })
  }

  const deleteSection = (sectionId: string) => {
    if (!template) return
    
    setTemplate({
      ...template,
      sections: template.sections.filter(section => section.id !== sectionId),
      updatedAt: new Date().toISOString()
    })
  }

  const startEditingSection = (sectionId: string) => {
    const section = template?.sections.find(s => s.id === sectionId)
    if (section) {
      setNewSectionName(section.name)
      setNewSectionDuration(section.duration)
      setEditingSection(sectionId)
    }
  }

  const saveSection = () => {
    if (!template || !editingSection) return
    
    setTemplate({
      ...template,
      sections: template.sections.map(section => 
        section.id === editingSection 
          ? { 
              ...section, 
              name: newSectionName,
              duration: newSectionDuration 
            } 
          : section
      ),
      updatedAt: new Date().toISOString()
    })
    
    setEditingSection(null)
  }

  if (loading) {
    return (
      <LoadingFallback 
        loadingMessage="Loading basic editor..." 
        fallbackMessage="The basic editor is taking longer than expected to load."
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
        <p className="text-gray-600">ID: {template.id}</p>
        <p className="text-gray-600">Created: {new Date(template.createdAt).toLocaleString()}</p>
        <p className="text-gray-600">Last Updated: {new Date(template.updatedAt).toLocaleString()}</p>
        <p className="text-gray-600 mt-2">{template.description}</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Sections ({template.sections.length})</h2>
          <button 
            onClick={addSection}
            className="flex items-center px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Section
          </button>
        </div>
        
        {template.sections.length === 0 ? (
          <p className="text-gray-500 italic">No sections added yet.</p>
        ) : (
          <div className="space-y-4">
            {template.sections.map((section) => (
              <div key={section.id} className="p-4 border border-gray-200 rounded-md">
                {editingSection === section.id ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Section Name
                      </label>
                      <input
                        type="text"
                        value={newSectionName}
                        onChange={(e) => setNewSectionName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Duration (seconds)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="60"
                        value={newSectionDuration}
                        onChange={(e) => setNewSectionDuration(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    <div className="flex justify-end space-x-2 pt-2">
                      <button
                        onClick={() => setEditingSection(null)}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={saveSection}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center"
                      >
                        <Save className="w-4 h-4 mr-1" />
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{section.name}</h3>
                        <div className="flex items-center text-gray-600 text-sm mt-1">
                          <Clock className="w-3 h-3 mr-1" />
                          Duration: {section.duration}s
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => startEditingSection(section.id)}
                          className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteSection(section.id)}
                          className="p-1 text-red-600 hover:text-red-800 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    {section.textOverlays.length > 0 && (
                      <div className="mt-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Text Overlays:</h4>
                        <ul className="pl-5 text-sm text-gray-600 list-disc">
                          {section.textOverlays.map(overlay => (
                            <li key={overlay.id}>{overlay.text}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-md">
        <h3 className="text-lg font-medium text-green-800 mb-2">Basic Editor Status</h3>
        <p className="text-green-700">✅ Template loaded successfully</p>
        <p className="text-green-700">✅ Section management working</p>
        <p className="text-green-700">✅ Basic editing features enabled</p>
      </div>
    </div>
  )
} 