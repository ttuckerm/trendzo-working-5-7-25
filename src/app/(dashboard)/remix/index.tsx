"use client"

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Loader2, 
  Wand2, 
  Sparkles,
  LockIcon,
  AlertTriangle
} from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useSubscription } from '@/lib/contexts/SubscriptionContext'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import PremiumFeatureGate from '@/components/ui/PremiumFeatureGate'
import { Template } from '@/lib/types/template'
import Image from 'next/image'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card-component'

// Extended Template type with specific fields needed for the UI
interface RemixTemplate {
  id: string;
  title: string; // Display name for UI
  description: string;
  thumbnailUrl: string;
  tags?: string[];
  stats?: {
    views: number;
    likes: number;
    shares?: number;
  };
}

export default function RemixHubPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const templateId = searchParams.get('templateId')
  const { user, loading: authLoading } = useAuth()
  const { hasPremium, isLoading: subscriptionLoading } = useSubscription()
  const { toast } = useToast()
  
  const [isLoading, setIsLoading] = useState(true)
  const [template, setTemplate] = useState<Template | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [templates, setTemplates] = useState<RemixTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<RemixTemplate | null>(null)
  
  // Load template data on initial render
  useEffect(() => {
    const loadTemplate = async () => {
      if (!templateId) {
        setError('No template ID provided')
        setIsLoading(false)
        return
      }
      
      try {
        const response = await fetch(`/api/templates/${templateId}`)
        
        if (!response.ok) {
          throw new Error(`Failed to load template: ${response.statusText}`)
        }
        
        const data = await response.json()
        
        if (data.success && data.template) {
          setTemplate(data.template)
        } else {
          setError(data.error || 'Template not found')
        }
      } catch (err) {
        console.error('Error loading template:', err)
        setError('Error loading template data')
      } finally {
        setIsLoading(false)
      }
    }
    
    if (!authLoading && !subscriptionLoading) {
      loadTemplate()
    }
  }, [templateId, authLoading, subscriptionLoading])
  
  // Redirect to the editor with remix mode when ready
  const handleStartRemix = () => {
    if (!template) return
    
    router.push(`/editor?id=${template.id}&mode=remix`)
  }
  
  // Loading state
  if (isLoading || authLoading || subscriptionLoading) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Template Remix</h1>
        <p className="text-gray-600">Preparing your template for remixing...</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col">
              <Skeleton className="aspect-video w-full rounded-md mb-2" />
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      </div>
    )
  }
  
  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
        <h1 className="text-xl font-semibold mb-2">Unable to Load Template</h1>
        <p className="text-gray-600 mb-6">{error}</p>
        <div className="flex gap-3">
          <Link
            href="/dashboard-view/template-library"
            className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors"
          >
            Browse Templates
          </Link>
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    )
  }
  
  // Template not found
  if (!template) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
        <h1 className="text-xl font-semibold mb-2">Template Not Found</h1>
        <p className="text-gray-600 mb-6">The template you're looking for could not be found.</p>
        <div className="flex gap-3">
          <Link
            href="/dashboard-view/template-library"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Browse Templates
          </Link>
        </div>
      </div>
    )
  }
  
  // Placeholder for loading popular templates
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        // Load mock template data
        const mockTemplates: RemixTemplate[] = [
          {
            id: 'template-1',
            title: 'Product Showcase',
            description: 'Highlight product features with transition effects',
            thumbnailUrl: 'https://placekitten.com/300/400',
            tags: ['product', 'ecommerce', 'trending'],
            stats: {
              views: 12500,
              likes: 850
            }
          },
          {
            id: 'template-2',
            title: 'Story Narrative',
            description: 'Tell a compelling story with text overlays',
            thumbnailUrl: 'https://placekitten.com/301/400',
            tags: ['story', 'narrative', 'viral'],
            stats: {
              views: 8700,
              likes: 620
            }
          },
          {
            id: 'template-3',
            title: 'Tutorial Format',
            description: 'Step-by-step instructions with visual cues',
            thumbnailUrl: 'https://placekitten.com/302/400',
            tags: ['howto', 'education', 'tutorial'],
            stats: {
              views: 15200,
              likes: 940
            }
          },
          {
            id: 'template-4',
            title: 'Trending Dance',
            description: 'Popular dance template with timing markers',
            thumbnailUrl: 'https://placekitten.com/303/400',
            tags: ['dance', 'trending', 'music'],
            stats: {
              views: 21000,
              likes: 1650
            }
          }
        ];
        
        setTemplates(mockTemplates);
      } catch (error) {
        console.error('Error loading templates:', error);
      }
    };
    
    loadTemplates();
  }, []);
  
  // Main content - require premium for remixing
  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col gap-8">
        {/* Hero Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-medium mb-4">
              <span className="mr-1">✨</span>
              <span>Premium Feature</span>
            </div>
            
            <h1 className="text-4xl font-bold">
              Template Remix
            </h1>
            
            <p className="text-lg text-gray-600 mt-4 mb-6">
              Remix and customize this template to create your own variation with AI assistance.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                onClick={() => router.push('/dashboard-view/template-library')}
              >
                Browse Templates
              </Button>
              
              <Link href="/remix-guide">
                <Button variant="outline" size="lg">
                  View Remix Guide
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="flex justify-center">
            <div className="relative h-[300px] w-[300px]">
              <Image
                src="/images/remix-illustration.png"
                alt="Template Remix Illustration"
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>
        
        {/* Popular Templates Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Popular Templates to Remix</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {templates.map((template) => (
              <div 
                key={template.id}
                onClick={() => setSelectedTemplate(template)}
                className={`cursor-pointer transition-all ${
                  selectedTemplate?.id === template.id ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                <Card>
                  <div className="relative h-[200px] w-full">
                    <Image
                      src={template.thumbnailUrl}
                      alt={template.title}
                      fill
                      className="object-cover rounded-t-lg"
                    />
                  </div>
                  
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{template.title}</CardTitle>
                  </CardHeader>
                  
                  <CardContent className="pb-2">
                    <p className="text-sm text-gray-600">{template.description}</p>
                    
                    {template.tags && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {template.tags.map((tag) => (
                          <span 
                            key={tag} 
                            className="text-xs bg-gray-100 px-2 py-1 rounded-full"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </CardContent>
                  
                  <CardFooter>
                    <Link href={`/remix/${template.id}`} className="w-full">
                      <Button size="sm" className="w-full">
                        Remix This Template
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 