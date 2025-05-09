'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card-component';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { AICustomizationResponse } from '@/lib/types/remix';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Sparkles } from 'lucide-react';

/**
 * Dashboard Remix Page
 * This is a direct implementation rather than a dynamic import to avoid routing issues
 */
export default function DashboardRemixPage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.templateId as string;
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [template, setTemplate] = useState<any>(null);
  const [variations, setVariations] = useState<AICustomizationResponse | null>(null);
  const [activeTab, setActiveTab] = useState('preview');
  const [aiModel, setAiModel] = useState<'openai' | 'claude'>('openai');
  const [optimizationGoal, setOptimizationGoal] = useState<'engagement' | 'conversion' | 'brand' | 'trends'>('engagement');
  
  // Use memoized handlers to prevent unnecessary re-renders
  const handleTabChange = useCallback((value: string) => {
    if (value !== activeTab) {
      setActiveTab(value);
    }
  }, [activeTab]);
  
  const handleModelChange = useCallback((value: string) => {
    if (value !== aiModel) {
      setAiModel(value as 'openai' | 'claude');
    }
  }, [aiModel]);
  
  const handleGoalChange = useCallback((value: string) => {
    if (value !== optimizationGoal) {
      setOptimizationGoal(value as 'engagement' | 'conversion' | 'brand' | 'trends');
    }
  }, [optimizationGoal]);
  
  const handleBack = useCallback(() => {
    router.back();
  }, [router]);
  
  // Load template data
  useEffect(() => {
    async function loadTemplate() {
      if (template) return; // Prevent unnecessary reloads
      
      try {
        setLoading(true);
        
        // Mock the template data
        const mockTemplate = {
          id: templateId,
          title: 'Sample Template',
          description: 'This is a sample template for remixing',
          authorInfo: {
            username: 'template_creator',
            isVerified: true
          },
          createdAt: new Date().toISOString(),
          stats: {
            views: 12500,
            likes: 850,
            comments: 32
          },
          previewUrl: 'https://placekitten.com/600/800'
        };
        
        setTemplate(mockTemplate);
        setLoading(false);
      } catch (error) {
        console.error('Error loading template:', error);
        toast({
          title: 'Error',
          description: 'Failed to load template. Please try again.',
          variant: 'destructive'
        });
        setLoading(false);
      }
    }
    
    if (templateId) {
      loadTemplate();
    }
  }, [templateId, toast, template]);
  
  // Generate variations with AI
  const generateVariations = useCallback(async () => {
    try {
      setLoading(true);
      
      // Mock variation data
      const mockVariations: AICustomizationResponse = {
        templateId,
        insights: [
          "Your template could benefit from more engaging captions.",
          "Adding trending hashtags could increase discovery by up to 34%.",
          "The current visual style appeals well to the 18-24 demographic.",
          "Consider adding more dynamic transitions for improved retention.",
          "The pacing is good, but could be optimized for mobile viewing experiences."
        ],
        suggestions: [
          {
            id: "suggestion-1",
            name: "Enhanced Caption",
            description: "More engaging caption with trending keywords",
            reasoning: "Captions with questions increase comment rates by 89% on average",
            currentValue: "Check out our new product!",
            suggestedValue: "Ever wondered how to boost your productivity? Our new tool makes it easy! 💯 #productivityhack",
            type: "caption",
            impact: "high"
          },
          {
            id: "suggestion-2",
            name: "Optimized Hashtags",
            description: "Trending hashtags relevant to your content",
            reasoning: "Using 3-5 relevant hashtags can increase reach by up to 40%",
            currentValue: "#business #productivity",
            suggestedValue: "#productivitytips #worksmarter #lifehack #productivity2023 #workfromhome",
            type: "hashtags",
            impact: "medium"
          },
          {
            id: "suggestion-3",
            name: "Timing Optimization",
            description: "Adjust pacing for key moments",
            reasoning: "Slowing down at key points increases viewer retention by 23%",
            currentValue: "Uniform pacing",
            suggestedValue: "Variable pacing with emphasis on product features",
            type: "timing",
            impact: "medium"
          }
        ],
        performancePrediction: {
          engagementScore: 85,
          viralityPotential: 72,
          predictedViews: 25000,
          predictedLikes: 2000,
          targetAudience: ["18-24", "25-34", "tech enthusiasts", "professionals"],
          bestTimeToPost: "6-8pm weekdays"
        }
      };
      
      // Set variations and update UI
      setVariations(mockVariations);
      setActiveTab('variations');
      setLoading(false);
      
      toast({
        title: 'AI Suggestions Generated',
        description: `Successfully generated suggestions using ${aiModel === 'openai' ? 'OpenAI' : 'Claude'}.`,
      });
    } catch (error) {
      console.error('Error generating variations:', error);
      toast({
        title: 'Error',
        description: `Failed to generate template variations. Please try again.`,
        variant: 'destructive'
      });
      setLoading(false);
    }
  }, [templateId, aiModel, toast]);
  
  // Handle applying variation
  const applyVariation = useCallback((suggestionId: string) => {
    if (!variations?.suggestions) return;
    
    setVariations(prev => {
      if (!prev) return prev;
      
      return {
        ...prev,
        suggestions: prev.suggestions.map(suggestion => 
          suggestion.id === suggestionId 
            ? { ...suggestion, applied: true }
            : suggestion
        )
      };
    });
    
    toast({
      title: 'Variation Applied',
      description: 'The selected variation has been applied to your template.'
    });
  }, [variations, toast]);
  
  // Handle saving remixed template
  const saveRemixedTemplate = useCallback(() => {
    toast({
      title: 'Template Saved',
      description: 'Your remixed template has been saved successfully.'
    });
  }, [toast]);
  
  // Render loading state
  if (loading && !template) {
    return (
      <div className="container mx-auto py-8">
        <Skeleton className="h-12 w-3/4 mb-4" />
        <Skeleton className="h-6 w-1/2 mb-8" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Skeleton className="h-96 w-full" />
          <div>
            <Skeleton className="h-10 w-full mb-4" />
            <Skeleton className="h-24 w-full mb-4" />
            <Skeleton className="h-10 w-1/2" />
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{template?.title || 'Template Remix'}</h1>
          <p className="text-gray-500">
            Create your own version of this popular template
          </p>
        </div>
        <Button onClick={handleBack}>Back to Templates</Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Template Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Original Template</CardTitle>
            <p className="text-sm text-gray-500">
              By @{template?.authorInfo?.username || 'creator'} • 
              {' '}{template?.stats?.views?.toLocaleString() || '0'} views
            </p>
          </CardHeader>
          <CardContent className="flex justify-center">
            {template?.previewUrl ? (
              <img 
                src={template.previewUrl} 
                alt={template.title} 
                className="max-h-96 object-contain rounded-md" 
              />
            ) : (
              <div className="h-96 w-full bg-gray-200 rounded-md flex items-center justify-center">
                Preview Not Available
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Remix Tools */}
        <Card>
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Remix Tools</CardTitle>
                <TabsList>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                  <TabsTrigger value="variations">Variations</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>
              </div>
              <p className="text-sm text-gray-500">
                Create a unique version with AI-assisted customization
              </p>
            </CardHeader>
            
            <CardContent>
              <TabsContent value="preview">
                <div className="flex flex-col gap-4">
                  <p>
                    Get started by generating AI-powered variations of this template.
                    Our AI will suggest improvements to increase engagement and performance.
                  </p>
                  
                  <div className="my-4 space-y-4">
                    <div>
                      <h3 className="text-sm font-medium mb-2">Select AI Model</h3>
                      <RadioGroup 
                        value={aiModel} 
                        onValueChange={handleModelChange}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="openai" id="openai" />
                          <Label htmlFor="openai">OpenAI (Balanced)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="claude" id="claude" />
                          <Label htmlFor="claude">Claude (Creative)</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium mb-2">Optimization Goal</h3>
                      <RadioGroup 
                        value={optimizationGoal} 
                        onValueChange={handleGoalChange}
                        className="grid grid-cols-2 gap-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="engagement" id="engagement" />
                          <Label htmlFor="engagement">Engagement</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="conversion" id="conversion" />
                          <Label htmlFor="conversion">Conversion</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="brand" id="brand" />
                          <Label htmlFor="brand">Brand Building</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="trends" id="trends" />
                          <Label htmlFor="trends">Trending Now</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={generateVariations} 
                    disabled={loading}
                    className="w-full"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {loading ? 'Generating...' : `Generate Variations with ${aiModel === 'openai' ? 'OpenAI' : 'Claude'}`}
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="variations">
                {variations ? (
                  <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">AI Insights</h3>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        Via {aiModel === 'openai' ? 'OpenAI' : 'Claude'}
                      </span>
                    </div>
                    <ul className="list-disc pl-5 space-y-1 mb-4">
                      {variations.insights && variations.insights.map((insight, index) => (
                        <li key={index} className="text-sm text-gray-600">
                          {insight}
                        </li>
                      ))}
                    </ul>
                    
                    <div>
                      <h3 className="font-medium mb-2">Suggested Variations</h3>
                      <div className="space-y-4">
                        {variations.suggestions && variations.suggestions.map((suggestion) => (
                          <Card key={suggestion.id} className={suggestion.applied ? 'border-green-500' : ''}>
                            <CardHeader>
                              <CardTitle className="text-base">{suggestion.name}</CardTitle>
                              <p className="text-sm text-gray-500">{suggestion.description}</p>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm mb-2">{suggestion.reasoning}</p>
                              <div className="flex gap-2 text-xs">
                                <div className="bg-gray-100 p-2 rounded flex-1">
                                  <div className="text-gray-500 mb-1">Current</div>
                                  <div className="font-mono break-all">
                                    {typeof suggestion.currentValue === 'string' ? suggestion.currentValue : JSON.stringify(suggestion.currentValue)}
                                  </div>
                                </div>
                                <div className="bg-green-50 p-2 rounded flex-1">
                                  <div className="text-green-600 mb-1">Suggested</div>
                                  <div className="font-mono break-all">
                                    {typeof suggestion.suggestedValue === 'string' ? suggestion.suggestedValue : JSON.stringify(suggestion.suggestedValue)}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                            <CardFooter>
                              <Button 
                                onClick={() => applyVariation(suggestion.id)}
                                variant={suggestion.applied ? "outline" : "default"}
                                className="w-full"
                                disabled={suggestion.applied}
                              >
                                {suggestion.applied ? 'Applied' : 'Apply Variation'}
                              </Button>
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                    </div>
                    
                    {variations.performancePrediction && (
                      <Card className="mt-4 bg-blue-50">
                        <CardHeader>
                          <CardTitle className="text-base">Performance Prediction</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <div className="text-gray-500">Engagement Score</div>
                              <div className="font-semibold">{variations.performancePrediction.engagementScore}/100</div>
                            </div>
                            <div>
                              <div className="text-gray-500">Virality Potential</div>
                              <div className="font-semibold">{variations.performancePrediction.viralityPotential}/100</div>
                            </div>
                            <div>
                              <div className="text-gray-500">Predicted Views</div>
                              <div className="font-semibold">{variations.performancePrediction.predictedViews.toLocaleString()}</div>
                            </div>
                            <div>
                              <div className="text-gray-500">Predicted Likes</div>
                              <div className="font-semibold">{variations.performancePrediction.predictedLikes.toLocaleString()}</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <p className="text-gray-500 mb-4">No variations generated yet</p>
                    <Button onClick={generateVariations} disabled={loading}>
                      {loading ? 'Generating...' : 'Generate Variations'}
                    </Button>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="analytics">
                <div className="flex flex-col gap-4">
                  <p className="text-sm text-gray-600 mb-4">
                    View analytics and insights about AI-generated customizations for your templates.
                  </p>
                  
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">Analytics functionality coming soon</p>
                    <Button variant="outline" onClick={() => handleTabChange('preview')}>
                      Return to Preview
                    </Button>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="settings">
                <div className="flex flex-col gap-4">
                  <p className="text-sm text-gray-600 mb-4">
                    Customize your remix settings here. These settings will affect how your template is remixed.
                  </p>
                  
                  {/* Settings would go here */}
                  <p className="text-center text-gray-500 my-10">
                    Settings panel coming soon
                  </p>
                </div>
              </TabsContent>
            </CardContent>
            
            <CardFooter>
              <div className="flex gap-4 w-full">
                <Button variant="outline" className="flex-1" onClick={handleBack}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={saveRemixedTemplate}>
                  Save Remix
                </Button>
              </div>
            </CardFooter>
          </Tabs>
        </Card>
      </div>
    </div>
  );
} 