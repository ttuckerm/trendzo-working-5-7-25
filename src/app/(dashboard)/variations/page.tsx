"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useSubscription } from '@/lib/contexts/SubscriptionContext'
import { TemplateVariation } from '@/lib/types/template'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  ChevronRight, 
  ArrowUpRight, 
  Trash2, 
  Edit3, 
  Star, 
  Layers, 
  Sparkles 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'

export default function VariationsListPage() {
  const { user, loading } = useAuth()
  const isAuthenticated = !!user
  const isLoading = loading
  const { canAccess } = useSubscription()
  const router = useRouter()
  const { toast } = useToast()
  
  const [variations, setVariations] = useState<TemplateVariation[]>([])
  const [fetchLoading, setFetchLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isPromoting, setIsPromoting] = useState<string | null>(null)
  
  // Fetch user's template variations
  useEffect(() => {
    async function fetchVariations() {
      if (!isAuthenticated || isLoading) return
      
      try {
        const response = await fetch(`/api/templates/variations?userId=${user?.uid}`)
        const data = await response.json()
        
        if (data.success) {
          setVariations(data.variations || [])
        } else {
          toast({
            title: "Error fetching variations",
            description: data.error || "Failed to load your template variations",
            variant: "destructive"
          })
        }
      } catch (error) {
        console.error('Error fetching variations:', error)
        toast({
          title: "Error fetching variations",
          description: "Failed to load your template variations. Please try again.",
          variant: "destructive"
        })
      } finally {
        setFetchLoading(false)
      }
    }
    
    fetchVariations()
  }, [isAuthenticated, isLoading, user, toast])
  
  // Delete a variation
  async function handleDeleteVariation(variationId: string) {
    if (!confirm("Are you sure you want to delete this variation? This action cannot be undone.")) {
      return
    }
    
    setIsDeleting(variationId)
    
    try {
      const response = await fetch(`/api/templates/variations?variationId=${variationId}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (data.success) {
        setVariations(variations.filter(v => v.id !== variationId))
        toast({
          title: "Variation deleted",
          description: "The template variation has been deleted successfully."
        })
      } else {
        toast({
          title: "Error deleting variation",
          description: data.error || "Failed to delete template variation",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error deleting variation:', error)
      toast({
        title: "Error deleting variation",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsDeleting(null)
    }
  }
  
  // Promote a variation to a full template
  async function handlePromoteVariation(variationId: string) {
    setIsPromoting(variationId)
    
    try {
      const response = await fetch('/api/templates/variations', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ variationId })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast({
          title: "Variation promoted",
          description: "The variation has been successfully promoted to a full template!"
        })
        
        // Redirect to the new template
        router.push(`/templates/${data.templateId}`)
      } else {
        toast({
          title: "Error promoting variation",
          description: data.error || "Failed to promote variation to template",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error promoting variation:', error)
      toast({
        title: "Error promoting variation",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsPromoting(null)
    }
  }
  
  // Loading state
  if (fetchLoading || isLoading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Your Template Variations</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-32 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardContent>
              <CardFooter>
                <div className="h-9 bg-gray-200 rounded w-full"></div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    )
  }
  
  // Check if user has premium access
  if (!canAccess('premium')) {
    return (
      <div className="container mx-auto p-6">
        <Link href="/dashboard" className="flex items-center text-blue-600 hover:text-blue-800 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Link>
        
        <div className="text-center p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100 max-w-2xl mx-auto">
          <div className="p-3 bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-6 h-6 text-blue-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Premium Feature: Template Variations</h1>
          <p className="text-gray-600 mb-6">
            Create and manage template variations with our powerful AI-assisted tools.
            Upgrade to Premium to access this feature.
          </p>
          
          <div className="flex justify-center gap-4">
            <Button variant="default" className="bg-gradient-to-r from-blue-600 to-indigo-600">
              Upgrade to Premium
            </Button>
            <Link href="/template-library">
              <Button variant="outline">
                Explore Templates
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <Link href="/dashboard" className="flex items-center text-blue-600 hover:text-blue-800 mb-2">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold">Your Template Variations</h1>
        </div>
        
        <div className="flex gap-2">
          <Link href="/remix">
            <Button variant="outline" className="flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Create New Variation
            </Button>
          </Link>
          <Link href="/template-library">
            <Button variant="default" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Explore Templates
            </Button>
          </Link>
        </div>
      </div>
      
      {variations.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-lg border border-gray-200">
          <Layers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-gray-900 mb-2">No variations yet</h2>
          <p className="text-gray-600 mb-6">
            You haven't created any template variations yet. Start by remixing a template!
          </p>
          <Link href="/template-library">
            <Button variant="default">Browse Templates to Remix</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {variations.map(variation => (
            <Card key={variation.id} className="overflow-hidden flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <Badge className="mb-2" variant={
                      variation.variationType === 'structure' ? 'default' :
                      variation.variationType === 'tone' ? 'secondary' :
                      'outline'
                    }>
                      {variation.variationType.charAt(0).toUpperCase() + variation.variationType.slice(1)} Variation
                    </Badge>
                    <CardTitle className="text-lg">{variation.name}</CardTitle>
                  </div>
                  
                  {variation.performancePrediction && variation.performancePrediction.expectedEngagement > 0 && (
                    <div className="flex items-center text-green-600 text-sm font-medium">
                      <ArrowUpRight className="w-4 h-4 mr-1" />
                      {Math.round(variation.performancePrediction.expectedEngagement * 100)}%
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="pb-3 flex-grow">
                <p className="text-gray-500 text-sm mb-3 line-clamp-2">
                  {variation.description || "A variation of the original template"}
                </p>
                
                {variation.performancePrediction && variation.performancePrediction.improvedMetrics && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {variation.performancePrediction.improvedMetrics.map((metric, i) => (
                      <span key={i} className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full">
                        {metric}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
              
              <div className="px-6 pb-2 text-xs text-gray-500">
                Created {new Date(variation.createdAt).toLocaleDateString()}
              </div>
              
              <CardFooter className="pt-2 border-t flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => router.push(`/editor?templateId=${variation.template.id}&variationId=${variation.id}`)}
                >
                  <Edit3 className="w-3 h-3 mr-2" /> Edit
                </Button>
                
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1"
                  disabled={isPromoting === variation.id}
                  onClick={() => handlePromoteVariation(variation.id)}
                >
                  <Star className="w-3 h-3 mr-2" /> 
                  {isPromoting === variation.id ? 'Promoting...' : 'Promote'}
                </Button>
                
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex-auto"
                  disabled={isDeleting === variation.id}
                  onClick={() => handleDeleteVariation(variation.id)}
                >
                  <Trash2 className="w-3 h-3 mr-2" /> 
                  {isDeleting === variation.id ? 'Deleting...' : 'Delete'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {variations.length > 0 && (
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-blue-100 rounded-full">
              <Star className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-blue-800">Promote Your Best Variations</h3>
              <p className="text-blue-600 text-sm mt-1">
                Found a variation that performs better than the original? Promote it to your template library to use it as a new template!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 