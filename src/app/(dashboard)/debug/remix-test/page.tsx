"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, Copy, RefreshCw, Wand2, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TemplateVariation } from '@/lib/types/template'
import { useToast } from '@/components/ui/use-toast'

export default function RemixTestPage() {
  const [variations, setVariations] = useState<TemplateVariation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const { toast } = useToast()
  
  // Fetch mock variations for testing
  useEffect(() => {
    async function fetchVariations() {
      try {
        setIsLoading(true)
        const response = await fetch('/api/test/variations')
        const data = await response.json()
        
        if (data.success) {
          setVariations(data.variations || [])
        } else {
          toast({
            title: "Error fetching test variations",
            description: data.error || "Failed to load test data",
            variant: "destructive"
          })
        }
      } catch (error) {
        console.error('Error fetching test variations:', error)
        toast({
          title: "Error fetching test variations",
          description: "Failed to load test data. Please try again.",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchVariations()
  }, [toast])
  
  // Filter variations for a specific template
  const fetchTemplateVariations = async (templateId: string) => {
    try {
      setIsLoading(true)
      setSelectedTemplate(templateId)
      
      const response = await fetch(`/api/test/variations?templateId=${templateId}`)
      const data = await response.json()
      
      if (data.success) {
        setVariations(data.variations || [])
      } else {
        toast({
          title: "Error fetching template variations",
          description: data.error || "Failed to load variations for this template",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error fetching template variations:', error)
      toast({
        title: "Error fetching template variations",
        description: "Failed to load variations. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  // Clear filter and show all variations
  const clearFilter = async () => {
    setSelectedTemplate(null)
    
    try {
      setIsLoading(true)
      const response = await fetch('/api/test/variations')
      const data = await response.json()
      
      if (data.success) {
        setVariations(data.variations || [])
      }
    } catch (error) {
      console.error('Error clearing filter:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/dashboard" className="flex items-center text-blue-600 hover:text-blue-800 mb-2">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold">Template Remix Test Page</h1>
        </div>
        
        <div className="flex items-center gap-3">
          {selectedTemplate && (
            <Button variant="outline" size="sm" onClick={clearFilter}>
              <RefreshCw className="w-4 h-4 mr-2" /> Show All Variations
            </Button>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Test Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Filter by Template</h3>
                <div className="flex flex-col gap-2">
                  <Button
                    variant={selectedTemplate === 'template-001' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => fetchTemplateVariations('template-001')}
                  >
                    Template 001
                  </Button>
                  <Button
                    variant={selectedTemplate === 'template-002' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => fetchTemplateVariations('template-002')}
                  >
                    Template 002
                  </Button>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Remix Options</h3>
                <div className="space-y-2">
                  <div className="p-3 border rounded-md flex items-start gap-3">
                    <Wand2 className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Structure Remix</p>
                      <p className="text-sm text-gray-500">Modify section organization and timing</p>
                    </div>
                  </div>
                  
                  <div className="p-3 border rounded-md flex items-start gap-3">
                    <Zap className="w-5 h-5 text-purple-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Tone Remix</p>
                      <p className="text-sm text-gray-500">Adjust text style and messaging approach</p>
                    </div>
                  </div>
                  
                  <div className="p-3 border rounded-md flex items-start gap-3">
                    <RefreshCw className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Optimize Remix</p>
                      <p className="text-sm text-gray-500">Enhance for better performance metrics</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-800 mb-2">Testing Instructions</h3>
                <ol className="text-sm text-blue-700 space-y-1 list-decimal ml-4">
                  <li>Click on a template filter to see its variations</li>
                  <li>Visit the main remix page at <Link href="/remix" className="underline">Remix Studio</Link></li>
                  <li>Check the variations list at <Link href="/variations" className="underline">My Variations</Link></li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4">
            {selectedTemplate 
              ? `Variations for Template ${selectedTemplate}` 
              : 'All Template Variations'}
          </h2>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                </Card>
              ))}
            </div>
          ) : variations.length === 0 ? (
            <div className="text-center p-8 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-600">No variations found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {variations.map(variation => (
                <Card key={variation.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant={
                        variation.variationType === 'structure' ? 'default' :
                        variation.variationType === 'tone' ? 'secondary' :
                        'outline'
                      }>
                        {variation.variationType.charAt(0).toUpperCase() + variation.variationType.slice(1)} Variation
                      </Badge>
                      
                      {variation.performancePrediction && (
                        <span className="text-green-600 text-sm font-medium flex items-center">
                          +{Math.round(variation.performancePrediction.expectedEngagement * 100)}%
                        </span>
                      )}
                    </div>
                    <CardTitle className="text-lg">{variation.name}</CardTitle>
                  </CardHeader>
                  
                  <CardContent>
                    <p className="text-gray-500 text-sm mb-4">
                      {variation.description}
                    </p>
                    
                    <div className="flex flex-col gap-3">
                      <div className="text-sm">
                        <span className="font-medium">Original Template:</span> {variation.originalTemplateId}
                      </div>
                      
                      <div className="text-sm">
                        <span className="font-medium">Created:</span> {new Date(variation.createdAt).toLocaleDateString()}
                      </div>
                      
                      {variation.performancePrediction && variation.performancePrediction.improvedMetrics && (
                        <div>
                          <span className="text-sm font-medium">Improved metrics:</span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {variation.performancePrediction.improvedMetrics.map((metric, i) => (
                              <span key={i} className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full flex items-center">
                                <Check className="w-3 h-3 mr-1" />
                                {metric}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  
                  <CardFooter className="border-t pt-3 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Copy className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                    <Button variant="default" size="sm" className="flex-1">
                      <Wand2 className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 