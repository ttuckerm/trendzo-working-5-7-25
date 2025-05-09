'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card-component';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { AICustomizationResponse, ActualPerformance } from '@/lib/types/remix';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Sparkles, Info, AlertTriangle, BarChart, RefreshCw } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { Input } from '@/components/ui/input';

// Error state component for when no template is found
const NoTemplateFound = ({ templateId, onRetry }: { templateId: string, onRetry: () => void }) => {
  return (
    <div className="container mx-auto py-8">
      <div className="bg-red-50 border border-red-200 rounded-md p-6 max-w-2xl mx-auto text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Template Not Found</h2>
        <p className="text-gray-600 mb-4">
          We couldn't find the template with ID: <code className="bg-gray-100 px-2 py-1 rounded">{templateId}</code>
        </p>
        <p className="text-gray-600 mb-6">
          The template may have been removed or the ID might be incorrect.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" onClick={onRetry}>
            Try Again
          </Button>
          <Button onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};

/**
 * Template Remix Page
 * 
 * This page allows users to create variations of templates
 * with AI-assisted customization options.
 */
export default function TemplateRemixPage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.templateId as string;
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [template, setTemplate] = useState<any>(null);
  const [templateError, setTemplateError] = useState<boolean>(false);
  const [variations, setVariations] = useState<AICustomizationResponse | null>(null);
  const [activeTab, setActiveTab] = useState('preview');
  const [aiModel, setAiModel] = useState<'openai' | 'claude'>('openai');
  const [optimizationGoal, setOptimizationGoal] = useState<'engagement' | 'conversion' | 'brand' | 'trends'>('engagement');
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [actualPerformance, setActualPerformance] = useState<ActualPerformance | null>(null);
  const [trackingPeriod, setTrackingPeriod] = useState<'24h' | '7d' | '30d'>('7d');
  const [isSubmittingPerformance, setIsSubmittingPerformance] = useState(false);
  
  // Load template data
  useEffect(() => {
    async function loadTemplate() {
      try {
        setLoading(true);
        setTemplateError(false);
        
        // In a real app, we would fetch from an API
        // For now, use mock data with a simulated network delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Mock API error 10% of the time for testing the error state
        const shouldSimulateError = Math.random() < 0.1;
        
        if (shouldSimulateError) {
          throw new Error("Simulated API error");
        }
        
        // TODO: Replace with actual API call
        // For now, mock the template data
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
        setTemplateError(true);
      }
    }
    
    if (templateId) {
      loadTemplate();
    }
  }, [templateId, toast]);
  
  // Function to retry loading the template
  const retryLoadTemplate = () => {
    if (templateId) {
      setTemplateError(false);
      setLoading(true);
      
      // Wait briefly before retrying to show loading state
      setTimeout(() => {
        async function reloadTemplate() {
          try {
            // TODO: Replace with actual API call
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
            setTemplateError(false);
            setLoading(false);
            
            toast({
              title: 'Success',
              description: 'Template loaded successfully.',
            });
          } catch (error) {
            console.error('Error reloading template:', error);
            setTemplateError(true);
            setLoading(false);
            
            toast({
              title: 'Error',
              description: 'Still unable to load the template. Please try again later.',
              variant: 'destructive'
            });
          }
        }
        
        reloadTemplate();
      }, 1000);
    }
  };
  
  // Generate variations with AI
  const generateVariations = async () => {
    try {
      setLoading(true);
      setIsAnalyzing(true); // Set analyzing state to show analyzing UI
      
      // Display loading toast
      toast({
        title: 'Generating AI Suggestions',
        description: `Using ${aiModel === 'openai' ? 'OpenAI' : 'Claude'} to analyze your template. This may take a moment...`,
      });
      
      // Determine which API endpoint to use based on the selected AI model
      const endpoint = aiModel === 'openai' 
        ? '/api/remix/generate-variations'
        : '/api/anthropic/analyze-template';
      
      // Simulated network delay to show loading state (remove in production)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Artificial endpoint for analysis phase
      setIsAnalyzing(false);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          templateId,
          goal: optimizationGoal,
          contentType: 'video'
        })
      });
      
      if (!response.ok) {
        // Try to parse the error response
        let errorMessage = `HTTP error ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // If we can't parse the JSON, use the status text
          errorMessage = response.statusText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      setVariations(data);
      setActiveTab('variations');
      setLoading(false);
      
      toast({
        title: 'AI Suggestions Generated',
        description: `Successfully generated ${data.suggestions?.length || 0} suggestions using ${aiModel === 'openai' ? 'OpenAI' : 'Claude'}.`,
      });
    } catch (error) {
      console.error('Error generating variations:', error);
      
      let errorMessage = 'Unknown error occurred';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        errorMessage = 'Network error - please check your internet connection';
      } else if (errorMessage.includes('timeout')) {
        errorMessage = 'Request timed out - AI service may be busy';
      } else if (errorMessage.includes('429')) {
        errorMessage = 'Too many requests - please try again in a few minutes';
      } else if (errorMessage.includes('403')) {
        errorMessage = 'Access denied - please check your permissions';
      } else if (errorMessage.includes('401')) {
        errorMessage = 'Authentication failed - please log in again';
      }
      
      toast({
        title: 'Error',
        description: `Failed to generate template variations: ${errorMessage}`,
        variant: 'destructive'
      });
      
      setLoading(false);
      setIsAnalyzing(false);
      
      // If there was an error, switch back to the preview tab
      if (activeTab === 'variations' && !variations) {
        setActiveTab('preview');
      }
    }
  };
  
  // Handle applying variation
  const applyVariation = (suggestionId: string) => {
    // Apply the variation
    if (variations?.suggestions) {
      const updatedSuggestions = variations.suggestions.map(suggestion => 
        suggestion.id === suggestionId 
          ? { ...suggestion, applied: true }
          : suggestion
      );
      
      setVariations({
        ...variations,
        suggestions: updatedSuggestions
      });
      
      toast({
        title: 'Variation Applied',
        description: 'The selected variation has been applied to your template.'
      });
    }
  };
  
  // Handle saving remixed template
  const saveRemixedTemplate = () => {
    // TODO: Implement saving logic
    
    toast({
      title: 'Template Saved',
      description: 'Your remixed template has been saved successfully.'
    });
    
    // Navigate to the editor with the remixed template
    // router.push(`/editor?template=${templateId}&remix=true`);
  };
  
  // Add a function to fetch analytics data
  const fetchAnalyticsData = async () => {
    if (analyticsData) return; // Don't fetch if we already have the data
    try {
      setAnalyticsLoading(true);
      
      // Check if Firestore is initialized
      if (!db) {
        console.error('Firestore database is not initialized');
        toast({
          title: 'Database Error',
          description: 'Unable to connect to database. Using mock data instead.',
          variant: 'destructive'
        });
        
        // Provide mock analytics data
        setAnalyticsData({
          modelDistribution: [
            { name: 'openai', value: 65 },
            { name: 'claude', value: 35 }
          ],
          suggestionTypeStats: [
            { name: 'content', value: 42 },
            { name: 'style', value: 28 },
            { name: 'structure', value: 15 }
          ],
          impactStats: [
            { name: 'high', value: 30 },
            { name: 'medium', value: 40 },
            { name: 'low', value: 20 }
          ],
          applicationRate: [
            { name: 'applied', value: 45 },
            { name: 'not_applied', value: 45 }
          ],
          totalSuggestions: 90,
          applicationPercentage: 50
        });
        
        setAnalyticsLoading(false);
        return;
      }
      
      // Fetch AI response data from Firestore
      const aiResponsesRef = collection(db, 'aiResponses');
      const aiResponsesSnap = await getDocs(aiResponsesRef);
      
      // Process data for charts
      const modelDistribution: Record<string, number> = { 'openai': 0, 'claude': 0 };
      const suggestionTypeStats: Record<string, number> = {};
      const impactStats: Record<string, number> = { 'high': 0, 'medium': 0, 'low': 0 };
      const appliedStats: Record<string, number> = { 'applied': 0, 'not_applied': 0 };
      let totalSuggestions = 0;
      
      aiResponsesSnap.forEach(doc => {
        const data = doc.data();
        
        // Count AI model usage
        const model = data.model || 'openai';
        modelDistribution[model] = (modelDistribution[model] || 0) + 1;
        
        // Count suggestion types and impact
        if (data.response && data.response.suggestions) {
          data.response.suggestions.forEach((suggestion: any) => {
            // Count by type
            const type = suggestion.type || 'other';
            suggestionTypeStats[type] = (suggestionTypeStats[type] || 0) + 1;
            
            // Count by impact
            const impact = suggestion.impact || 'medium';
            impactStats[impact] = (impactStats[impact] || 0) + 1;
            
            // Count applied vs not applied
            if (suggestion.applied) {
              appliedStats['applied'] += 1;
            } else {
              appliedStats['not_applied'] += 1;
            }
            
            totalSuggestions += 1;
          });
        }
      });
      
      // Format data for charts
      const formattedData = {
        modelDistribution: Object.entries(modelDistribution).map(([name, value]) => ({ name, value })),
        suggestionTypeStats: Object.entries(suggestionTypeStats).map(([name, value]) => ({ name, value })),
        impactStats: Object.entries(impactStats).map(([name, value]) => ({ name, value })),
        applicationRate: Object.entries(appliedStats).map(([name, value]) => ({ name, value })),
        totalSuggestions,
        applicationPercentage: appliedStats['applied'] / (totalSuggestions || 1) * 100
      };
      
      setAnalyticsData(formattedData);
      setAnalyticsLoading(false);
    } catch (error) {
      console.error('Error fetching AI suggestion metrics:', error);
      
      // Provide fallback mock data on error
      setAnalyticsData({
        modelDistribution: [
          { name: 'openai', value: 65 },
          { name: 'claude', value: 35 }
        ],
        suggestionTypeStats: [
          { name: 'content', value: 42 },
          { name: 'style', value: 28 },
          { name: 'structure', value: 15 }
        ],
        impactStats: [
          { name: 'high', value: 30 },
          { name: 'medium', value: 40 },
          { name: 'low', value: 20 }
        ],
        applicationRate: [
          { name: 'applied', value: 45 },
          { name: 'not_applied', value: 45 }
        ],
        totalSuggestions: 90,
        applicationPercentage: 50
      });
      
      toast({
        title: 'Error Loading Analytics',
        description: 'Could not load analytics data. Showing mock data instead.',
        variant: 'destructive'
      });
      
      setAnalyticsLoading(false);
    }
  };
  
  // Fix the dependency array for the analytics effect
  useEffect(() => {
    if (activeTab === 'analytics' && !analyticsData && !analyticsLoading) {
      fetchAnalyticsData();
    }
  }, [activeTab, analyticsData, analyticsLoading]);
  
  // Add function to track and submit actual performance
  const submitActualPerformance = async () => {
    if (!actualPerformance) return;
    
    try {
      setIsSubmittingPerformance(true);
      
      // Submit to the API
      const response = await fetch('/api/remix/track-performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          templateId,
          actualPerformance: {
            ...actualPerformance,
            measurementDate: new Date().toISOString(),
            period: trackingPeriod
          }
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit performance data');
      }
      
      const data = await response.json();
      
      toast({
        title: 'Performance Tracked',
        description: 'Your actual performance metrics have been recorded and will improve future AI predictions.',
      });
      
      // Refresh analytics data
      fetchAnalyticsData();
      
    } catch (error) {
      console.error('Error submitting performance:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit performance data. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmittingPerformance(false);
    }
  };
  
  // Add a handler for updating actual performance metrics
  const handlePerformanceChange = (field: keyof ActualPerformance, value: number) => {
    setActualPerformance(prev => {
      const updated = { ...(prev || {
        measurementDate: '',
        period: '7d',
        actualViews: 0,
        actualLikes: 0,
        actualShares: 0,
        actualComments: 0,
        engagementRate: 0
      }) } as ActualPerformance;
      
      updated[field] = value;
      
      // Auto-calculate engagement rate as (likes + comments + shares) / views
      if (field !== 'engagementRate' && updated.actualViews > 0) {
        const totalEngagements = updated.actualLikes + updated.actualComments + updated.actualShares;
        updated.engagementRate = totalEngagements / updated.actualViews;
      }
      
      return updated;
    });
  };
  
  // Render error state if template failed to load
  if (templateError) {
    return <NoTemplateFound templateId={templateId} onRetry={retryLoadTemplate} />;
  }
  
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
        <Button onClick={() => router.back()}>Back to Templates</Button>
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
          <Tabs value={activeTab} onValueChange={setActiveTab}>
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
                        onValueChange={(value: string) => {
                          if (value !== aiModel) {
                            setAiModel(value as 'openai' | 'claude');
                          }
                        }}
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
                        onValueChange={(value: string) => {
                          if (value !== optimizationGoal) {
                            setOptimizationGoal(value as 'engagement' | 'conversion' | 'brand' | 'trends');
                          }
                        }}
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
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating with {aiModel === 'openai' ? 'OpenAI' : 'Claude'} ({optimizationGoal})...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Variations with {aiModel === 'openai' ? 'OpenAI' : 'Claude'}
                      </>
                    )}
                  </Button>
                  
                  {/* API Connection Status */}
                  <div className="mt-6 border border-gray-100 rounded-md p-4 bg-gray-50">
                    <h3 className="text-sm font-medium mb-2">AI Service Status</h3>
                    
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                          <span className="text-sm">OpenAI API</span>
                        </div>
                        <span className="text-xs text-green-600">Connected</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                          <span className="text-sm">Claude API</span>
                        </div>
                        <span className="text-xs text-green-600">Connected</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                          <span className="text-sm">Template Data</span>
                        </div>
                        <span className="text-xs text-green-600">Available</span>
                      </div>
                    </div>
                    
                    <div className="mt-3 text-xs text-gray-500">
                      <p>Current AI model: <span className="font-medium">{aiModel === 'openai' ? 'OpenAI GPT-4' : 'Anthropic Claude'}</span></p>
                      <p>Expected response time: <span className="font-medium">15-30 seconds</span></p>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="variations">
                {loading ? (
                  <div className="flex min-h-[300px] items-center justify-center">
                    <div className="text-center">
                      <svg className="animate-spin h-10 w-10 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <p className="mt-4">{isAnalyzing ? 'Analyzing template structure...' : 'Generating AI suggestions...'}</p>
                      <p className="text-sm text-gray-500 mt-2">This may take 15-30 seconds</p>
                    </div>
                  </div>
                ) : variations ? (
                  <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">AI Insights</h3>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        Via {aiModel === 'openai' ? 'OpenAI' : 'Claude'}
                      </span>
                    </div>
                    <ul className="list-disc pl-5 space-y-1 mb-4">
                      {variations.insights.map((insight, index) => (
                        <li key={index} className="text-sm text-gray-600">
                          {insight}
                        </li>
                      ))}
                    </ul>
                    
                    <div>
                      <h3 className="font-medium mb-2">Suggested Variations</h3>
                      <div className="space-y-4">
                        {variations.suggestions.map((suggestion) => (
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
                                    {JSON.stringify(suggestion.currentValue)}
                                  </div>
                                </div>
                                <div className="bg-green-50 p-2 rounded flex-1">
                                  <div className="text-green-600 mb-1">Suggested</div>
                                  <div className="font-mono break-all">
                                    {JSON.stringify(suggestion.suggestedValue)}
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
                  
                  {analyticsLoading ? (
                    <div className="text-center py-8">
                      <p>Loading analytics data...</p>
                    </div>
                  ) : analyticsData ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <h3 className="text-xl font-bold text-blue-700">{analyticsData.totalSuggestions || 0}</h3>
                          <p className="text-sm text-blue-600">Total AI Suggestions</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                          <h3 className="text-xl font-bold text-green-700">{(analyticsData.applicationPercentage || 0).toFixed(1)}%</h3>
                          <p className="text-sm text-green-600">Application Rate</p>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg">
                          <h3 className="text-xl font-bold text-purple-700">{Object.keys(analyticsData.suggestionTypeStats || {}).length}</h3>
                          <p className="text-sm text-purple-600">Suggestion Categories</p>
                        </div>
                      </div>
                      
                      <Card className="mb-4">
                        <CardHeader>
                          <CardTitle className="text-base">AI Model Usage</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex gap-4 items-center">
                            <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                              {analyticsData.modelDistribution.map((model: any, index: number) => {
                                const total = analyticsData.modelDistribution.reduce(
                                  (sum: number, curr: any) => sum + curr.value, 0
                                );
                                const percentage = total > 0 ? (model.value / total) * 100 : 0;
                                return (
                                  <div
                                    key={model.name}
                                    className={`h-full ${index === 0 ? 'bg-blue-500' : 'bg-green-500'}`}
                                    style={{ width: `${percentage}%` }}
                                  />
                                );
                              })}
                            </div>
                            <div className="flex gap-4">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-blue-500 rounded-full" />
                                <span className="text-sm">OpenAI</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-green-500 rounded-full" />
                                <span className="text-sm">Claude</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Suggestion Types</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {analyticsData.suggestionTypeStats.map((stat: any) => (
                              <div key={stat.name} className="flex flex-col">
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm font-medium">{stat.name}</span>
                                  <span className="text-sm">{stat.value}</span>
                                </div>
                                <div className="w-full h-2 bg-gray-200 rounded-full">
                                  <div
                                    className="h-full bg-blue-600 rounded-full"
                                    style={{
                                      width: `${(stat.value / analyticsData.totalSuggestions) * 100}%`
                                    }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-4">No analytics data available</p>
                      <Button onClick={fetchAnalyticsData}>
                        Refresh Analytics
                      </Button>
                    </div>
                  )}
                </div>
                
                {/* Add performance tracking section */}
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center">
                      <BarChart className="w-5 h-5 mr-2 text-blue-600" />
                      Performance Feedback Loop
                    </CardTitle>
                    <p className="text-sm text-gray-600">
                      Record actual results to improve AI predictions for future templates
                    </p>
                  </CardHeader>
                  <CardContent>
                    {variations?.performancePrediction ? (
                      <div className="space-y-4">
                        <div className="p-4 bg-blue-50 rounded-md">
                          <h3 className="font-medium mb-2 text-blue-800">AI Prediction Summary</h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-xs text-gray-500">Predicted Views</p>
                              <p className="font-semibold">{variations.performancePrediction.predictedViews.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Predicted Likes</p>
                              <p className="font-semibold">{variations.performancePrediction.predictedLikes.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Engagement Score</p>
                              <p className="font-semibold">{variations.performancePrediction.engagementScore}/100</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Virality Potential</p>
                              <p className="font-semibold">{variations.performancePrediction.viralityPotential}/100</p>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="font-medium mb-3">Enter Actual Performance</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <Label htmlFor="period" className="mb-1 block text-sm">Measurement Period</Label>
                              <RadioGroup 
                                value={trackingPeriod} 
                                onValueChange={(value) => setTrackingPeriod(value as '24h' | '7d' | '30d')}
                                className="flex gap-4"
                                id="period"
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="24h" id="period-24h" />
                                  <Label htmlFor="period-24h">24 hours</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="7d" id="period-7d" />
                                  <Label htmlFor="period-7d">7 days</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="30d" id="period-30d" />
                                  <Label htmlFor="period-30d">30 days</Label>
                                </div>
                              </RadioGroup>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div>
                              <Label htmlFor="views" className="mb-1 block text-sm">Views</Label>
                              <Input 
                                id="views"
                                type="number" 
                                min="0"
                                value={actualPerformance?.actualViews || ''}
                                onChange={(e) => handlePerformanceChange('actualViews', parseInt(e.target.value) || 0)}
                                className="w-full"
                              />
                            </div>
                            <div>
                              <Label htmlFor="likes" className="mb-1 block text-sm">Likes</Label>
                              <Input 
                                id="likes"
                                type="number"
                                min="0" 
                                value={actualPerformance?.actualLikes || ''} 
                                onChange={(e) => handlePerformanceChange('actualLikes', parseInt(e.target.value) || 0)}
                                className="w-full"
                              />
                            </div>
                            <div>
                              <Label htmlFor="comments" className="mb-1 block text-sm">Comments</Label>
                              <Input 
                                id="comments"
                                type="number" 
                                min="0"
                                value={actualPerformance?.actualComments || ''} 
                                onChange={(e) => handlePerformanceChange('actualComments', parseInt(e.target.value) || 0)}
                                className="w-full"
                              />
                            </div>
                            <div>
                              <Label htmlFor="shares" className="mb-1 block text-sm">Shares</Label>
                              <Input 
                                id="shares"
                                type="number" 
                                min="0"
                                value={actualPerformance?.actualShares || ''} 
                                onChange={(e) => handlePerformanceChange('actualShares', parseInt(e.target.value) || 0)}
                                className="w-full"
                              />
                            </div>
                          </div>
                          
                          {actualPerformance && actualPerformance.actualViews > 0 && (
                            <div className="mb-4 p-3 bg-gray-50 rounded-md">
                              <p className="text-sm">
                                Calculated Engagement Rate: 
                                <span className="font-semibold ml-2">
                                  {(actualPerformance.engagementRate * 100).toFixed(2)}%
                                </span>
                              </p>
                            </div>
                          )}
                          
                          <Button 
                            onClick={submitActualPerformance}
                            disabled={isSubmittingPerformance || !actualPerformance || actualPerformance.actualViews <= 0}
                            className="w-full"
                          >
                            {isSubmittingPerformance ? (
                              <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Submitting Performance Data...
                              </>
                            ) : (
                              'Submit Performance Data'
                            )}
                          </Button>
                          
                          <p className="text-xs text-gray-500 mt-2 text-center">
                            This data will be used to improve future AI predictions
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-gray-500">
                          Generate AI predictions first to enable performance tracking
                        </p>
                        <Button 
                          variant="outline" 
                          className="mt-3"
                          onClick={() => setActiveTab('preview')}
                        >
                          Go to AI Predictions
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
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
                <Button variant="outline" className="flex-1" onClick={() => router.back()}>
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