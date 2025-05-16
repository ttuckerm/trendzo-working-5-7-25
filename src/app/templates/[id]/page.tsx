// src/app/templates/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  ChevronLeft, 
  Calendar, 
  TrendingUp, 
  UserCheck, 
  Users, 
  ThumbsUp, 
  Eye, 
  Share2,
  Download,
  Star,
  Clock,
  Tag,
  Edit,
  Music,
  Volume2
} from 'lucide-react';
import { 
  Button, 
  Card, 
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Badge
} from '@/components/ui/ui-compatibility';
import { TrendingTemplate } from '@/lib/types/trendingTemplate';
import { useToast } from '@/components/ui/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { resolveComponents, initializeComponentResolution } from '@/lib/utils/import-resolver';
import { useComponentFix, forceReinitializeComponents } from '@/lib/utils/component-fix';
import VelocityScoreIndicator from '@/components/ui/VelocityScoreIndicator';
import UnifiedScoring from '@/components/analytics/UnifiedScoring';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AudioVisualSelector from '@/components/audiovisual/AudioVisualSelector';
import { AudioVisualProvider } from '@/lib/contexts/audiovisual/AudioVisualContext';

// Initialize component resolution system
if (typeof window !== 'undefined') {
  initializeComponentResolution();
}

// Resolve UI components to ensure they work correctly
const UIComponents = resolveComponents({
  Button, 
  Card, 
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Badge
});

export default function TemplateViewPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [template, setTemplate] = useState<TrendingTemplate | null>(null);
  const [activeTab, setActiveTab] = useState('details');
  const [selectedSound, setSelectedSound] = useState(null);
  
  // Get the template ID from the URL params
  const templateId = params.id;
  
  // Destructure UI components
  const {
    Button, 
    Card, 
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
    Badge
  } = UIComponents;
  
  // Initialize component resolution on mount
  useEffect(() => {
    // Add component fix to handle removeChild errors
    const componentFixCleanup = useComponentFix();
    
    // Force reinitialize components to fix any existing issues
    forceReinitializeComponents();
    
    // Clean up when component unmounts
    return () => {
      if (typeof componentFixCleanup === 'function') {
        componentFixCleanup();
      }
    };
  }, []);
  
  useEffect(() => {
    // Fetch template data
    fetchTemplateData();
  }, [templateId]);
  
  const fetchTemplateData = async () => {
    try {
      setLoading(true);
      
      // In development, use mock data
      if (process.env.NODE_ENV === 'development') {
        // Simulate API call with delay
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        // Use a mock template
        const mockTemplate: TrendingTemplate = {
          id: templateId as string,
          title: 'Product Showcase Template',
          description: 'A sleek product showcase template with smooth transitions and dynamic text elements. Perfect for highlighting product features and benefits.',
          thumbnailUrl: 'https://placehold.co/800x600/7950f2/ffffff?text=Product+Template',
          videoUrl: 'https://example.com/videos/product-template.mp4',
          category: 'Product',
          tags: ['ecommerce', 'showcase', 'product reveal', 'features'],
          authorName: 'Creative Studios',
          authorId: 'creator-123',
          authorVerified: true,
          authorAvatar: 'https://placehold.co/100x100/7950f2/ffffff?text=CS',
          stats: {
            views: 12589,
            likes: 2345,
            usageCount: 876,
            commentCount: 345,
            shareCount: 156
          },
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          isPremium: false,
          isVerified: true,
          ranking: 4,
          trendingScore: 87,
          trendData: {
            dailyViews: {
              '2023-01-01': 120,
              '2023-01-02': 156,
              '2023-01-03': 189,
              '2023-01-04': 220,
              '2023-01-05': 267
            },
            growthRate: 0.15,
            velocityScore: 0.78,
            dailyGrowth: 0.12,
            weeklyGrowth: 0.35,
            confidenceScore: 0.87,
            daysUntilPeak: 14,
            growthTrajectory: 'exponential'
          },
          expertInsights: {
            tags: [
              {
                id: 'tag-1',
                tag: 'High Conversion Potential',
                category: 'engagement',
                addedBy: 'expert-1',
                addedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
                confidence: 0.9
              },
              {
                id: 'tag-2',
                tag: 'Strong Visual Impact',
                category: 'content',
                addedBy: 'expert-2',
                addedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
                confidence: 0.85
              }
            ],
            notes: 'This template performs exceptionally well for physical products with strong visual appeal. The transitions are smooth and maintain viewer attention.',
            recommendedUses: ['Product launches', 'Feature highlights', 'E-commerce listings'],
            performanceRating: 4.7,
            audienceRecommendation: ['Shoppers', 'Product researchers', 'Brand followers']
          }
        };
        
        setTemplate(mockTemplate);
        setLoading(false);
        return;
      }
      
      // For production, fetch from API
      const response = await fetch(`/api/templates/${templateId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch template data');
      }
      
      const data = await response.json();
      setTemplate(data);
      
    } catch (error) {
      console.error('Error fetching template:', error);
      toast({
        title: 'Error',
        description: 'Failed to load the template. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Format number for display
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };
  
  // Handle "Use Template" action
  const handleUseTemplate = () => {
    // Logic for using the template
    toast({
      title: 'Template Selected',
      description: 'The template has been added to your workspace.'
    });
    
    // Navigate to template editor
    router.push(`/editor?template=${templateId}`);
  };

  // Handle sound selection for the template
  const handleSoundSelect = (sound: any) => {
    setSelectedSound(sound);
    toast({
      title: 'Sound Selected',
      description: `"${sound.title}" has been applied to this template.`
    });
  };
  
  // Growth trajectory display
  const getTrajectoryClass = (trajectory?: string) => {
    switch (trajectory) {
      case 'exponential':
        return 'bg-green-100 text-green-800';
      case 'linear':
        return 'bg-blue-100 text-blue-800';
      case 'plateauing':
        return 'bg-amber-100 text-amber-800';
      case 'volatile':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
  
  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto py-6 px-4 md:px-6">
        {/* Back button */}
        <Button
          onClick={() => router.back()}
          variant="ghost"
          className="mb-6 flex items-center"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Templates
        </Button>
        
        <div className="space-y-6">
          <div className="h-8 w-3/4 bg-gray-200 rounded animate-pulse" />
          <div className="h-64 w-full bg-gray-200 rounded animate-pulse" />
          <div className="h-32 w-full bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    );
  }
  
  // Error state
  if (!template) {
    return (
      <div className="container mx-auto py-6 px-4 md:px-6">
        {/* Back button */}
        <Button
          onClick={() => router.back()}
          variant="ghost"
          className="mb-6 flex items-center"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Templates
        </Button>
        
        <div className="text-center py-12">
          <div className="text-2xl font-bold mb-2">Template Not Found</div>
          <p className="text-gray-600 mb-6">The template you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => router.push('/templates')}>
            Browse Templates
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      {/* Back button */}
      <Button
        onClick={() => router.back()}
        variant="ghost"
        className="mb-6 flex items-center"
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        Back to Templates
      </Button>
      
      <div className="space-y-8">
        {/* Template header section */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Thumbnail image */}
          <div className="w-full md:w-2/5">
            <div className="rounded-lg overflow-hidden relative aspect-video bg-gray-100">
              {template.thumbnailUrl ? (
                <Image
                  src={template.thumbnailUrl}
                  alt={template.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                  No thumbnail available
                </div>
              )}
              {template.isPremium && (
                <Badge className="absolute top-2 right-2 bg-yellow-500">
                  Premium
                </Badge>
              )}
            </div>
          </div>
          
          {/* Template details */}
          <div className="w-full md:w-3/5">
            <h1 className="text-2xl font-bold mb-2">{template.title}</h1>
            
            <div className="flex items-center mb-4 space-x-2">
              <Badge variant="outline" className="text-blue-600 border-blue-600">
                {template.category}
              </Badge>
              
              {template.isVerified && (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Verified
                </Badge>
              )}
              
              {template.trendingScore > 80 && (
                <Badge className="bg-purple-600">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Trending
                </Badge>
              )}
            </div>
            
            <p className="text-gray-600 mb-6">{template.description}</p>
            
            {/* Author info */}
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 mr-3">
                {template.authorAvatar ? (
                  <Image
                    src={template.authorAvatar}
                    alt={template.authorName}
                    width={40}
                    height={40}
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    {template.authorName?.charAt(0) || 'U'}
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center">
                  <span className="font-semibold">{template.authorName}</span>
                  {template.authorVerified && (
                    <UserCheck className="ml-1 h-4 w-4 text-blue-500" />
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  Created {formatDistanceToNow(new Date(template.createdAt), { addSuffix: true })}
                </div>
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleUseTemplate}>
                Use Template
              </Button>
              <Button variant="outline">
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Save
              </Button>
            </div>
          </div>
        </div>
        
        {/* Template info with tabs */}
        <div className="bg-white rounded-lg overflow-hidden border">
          <Tabs 
            defaultValue="details" 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="w-full p-6"
          >
            <TabsList className="mb-4">
              <TabsTrigger value="details">Template Details</TabsTrigger>
              <TabsTrigger value="audiovisual">
                <Music size={16} className="mr-1" />
                Audio-Visual
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="details">
              {/* Template metadata */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Category</h3>
                  <div className="flex items-center">
                    <Tag className="h-4 w-4 mr-1 text-gray-600" />
                    <span>{template.category}</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Created</h3>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1 text-gray-600" />
                    <span>{template.createdAt ? formatDistanceToNow(new Date(template.createdAt), { addSuffix: true }) : 'Unknown'}</span>
                  </div>
                </div>
              </div>
              
              {/* Tags */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {template.tags && template.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="bg-gray-100 hover:bg-gray-200">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              
              {/* Expert insights (if available) */}
              {template.expertInsights && (
                <div className="border-t pt-4 mt-6">
                  <h3 className="text-lg font-medium mb-2">Expert Insights</h3>
                  <p className="text-gray-600 mb-4">{template.expertInsights.notes}</p>
                  
                  {/* Recommended uses */}
                  {template.expertInsights.recommendedUses && template.expertInsights.recommendedUses.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Recommended Uses</h4>
                      <div className="flex flex-wrap gap-2">
                        {template.expertInsights.recommendedUses.map((use, index) => (
                          <Badge key={index} className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                            {use}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Target audience */}
                  {template.expertInsights.audienceRecommendation && template.expertInsights.audienceRecommendation.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Target Audience</h4>
                      <div className="flex flex-wrap gap-2">
                        {template.expertInsights.audienceRecommendation.map((audience, index) => (
                          <Badge key={index} variant="outline" className="bg-gray-100 hover:bg-gray-200">
                            {audience}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="audiovisual">
              <div className="mb-4">
                <h2 className="text-xl font-bold mb-2">Audio-Visual Experience</h2>
                <p className="text-gray-600 mb-4">
                  Enhance your template with perfectly matched sounds that boost engagement and create emotional connections.
                </p>
              </div>
              
              <AudioVisualProvider>
                <AudioVisualSelector 
                  onSelectSound={handleSoundSelect}
                  initialSound={selectedSound}
                />
              </AudioVisualProvider>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Stats and trend data */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Stats card */}
          <Card>
            <CardHeader>
              <CardTitle>Template Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center">
                  <Eye className="mr-2 h-5 w-5 text-gray-400" />
                  <div>
                    <div className="font-semibold">{formatNumber(template.stats.views)}</div>
                    <div className="text-sm text-gray-500">Views</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <ThumbsUp className="mr-2 h-5 w-5 text-gray-400" />
                  <div>
                    <div className="font-semibold">{formatNumber(template.stats.likes)}</div>
                    <div className="text-sm text-gray-500">Likes</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <Users className="mr-2 h-5 w-5 text-gray-400" />
                  <div>
                    <div className="font-semibold">{formatNumber(template.stats.usageCount)}</div>
                    <div className="text-sm text-gray-500">Uses</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <Share2 className="mr-2 h-5 w-5 text-gray-400" />
                  <div>
                    <div className="font-semibold">{formatNumber(template.stats.shareCount)}</div>
                    <div className="text-sm text-gray-500">Shares</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Trend data */}
          <Card>
            <CardHeader>
              <CardTitle>Trend Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">Trending Score</div>
                  <div className="font-bold text-lg">
                    {template.trendingScore}/100
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">Growth Rate</div>
                  <div className={`font-semibold ${
                    (template.trendData?.growthRate || 0) > 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}>
                    {(template.trendData?.growthRate || 0) > 0 ? '+' : ''}
                    {((template.trendData?.growthRate || 0) * 100).toFixed(1)}%
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">Velocity Score</div>
                  <VelocityScoreIndicator 
                    score={template.trendData?.velocityScore || 0} 
                  />
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">Trajectory</div>
                  <div className={`px-2 py-1 rounded-full ${getTrajectoryClass(template.trendData?.growthTrajectory)}`}>
                    {template.trendData?.growthTrajectory || 'Steady'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Template Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {template.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="px-3 py-1">
                    <Tag className="mr-1 h-3 w-3" />
                    {tag}
                  </Badge>
                ))}
              </div>
              
              {template.expertInsights?.tags && (
                <div className="mt-4">
                  <div className="text-sm font-semibold mb-2">Expert Tags</div>
                  <div className="flex flex-wrap gap-2">
                    {template.expertInsights.tags.map((expertTag) => (
                      <Badge 
                        key={expertTag.id} 
                        className="px-3 py-1 bg-purple-100 text-purple-800 hover:bg-purple-200"
                      >
                        <Star className="mr-1 h-3 w-3" />
                        {expertTag.tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}