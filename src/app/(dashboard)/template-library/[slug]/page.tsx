'use client';

import { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  ExternalLink, 
  Play, 
  Eye, 
  Heart, 
  MessageCircle,
  Lightbulb,
  Download,
  Share2,
  Clock,
  BarChart3,
  ThumbsUp
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card-component';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TemplateStructureVisualizer from '@/components/admin/TemplateStructureVisualizer';

interface TemplateDetail {
  id: string;
  title: string;
  category: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  createdAt: string;
  metadata?: {
    duration?: number;
    hashtags?: string[];
    aiDetectedCategory?: string;
  };
  stats?: {
    views?: number;
    likes?: number;
    comments?: number;
    engagementRate?: number;
    shares?: number;
  };
  expertInsights?: {
    summary?: string;
    notes?: string;
    strengths?: string[];
    structureBreakdown?: {
      timeStamp: string;
      description: string;
    }[];
    confidenceScore?: number;
    tags?: any[];
    recommendedUses?: string[];
    performanceRating?: number;
    audienceRecommendation?: string[];
  };
  templateStructure?: Array<{
    type: string;
    startTime: number;
    duration: number;
    purpose?: string;
  }>;
  analysisData?: {
    expertEnhanced?: boolean;
    expertConfidence?: number;
    viralityFactors?: {
      strengths?: string[];
      weaknesses?: string[];
      score?: number;
      expertAdjusted?: boolean;
    };
    engagementInsights?: string | string[];
    detectedElements?: Record<string, boolean>;
  };
  similarTemplates?: {
    id: string;
    title: string;
    thumbnailUrl: string;
    category: string;
  }[];
}

export default function TemplateDetailPage({ params }: { params: { slug: string } }) {
  const [template, setTemplate] = useState<TemplateDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const response = await fetch(`/api/template-expert?id=${params.slug}`);
        if (!response.ok) throw new Error('Failed to fetch template');
        
        const data = await response.json();
        // Extract the template data from the response
        setTemplate(data.template);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching template:', error);
        // Use mock data as fallback
        setTemplate(getMockTemplate(params.slug));
        setLoading(false);
      }
    };

    fetchTemplate();
  }, [params.slug]);

  if (loading) {
    return <TemplateDetailSkeleton />;
  }

  if (!template) {
    return (
      <div className="container mx-auto py-10 text-center">
        <h1 className="text-2xl font-bold mb-4">Template Not Found</h1>
        <p className="mb-6">The template you're looking for doesn't exist or has been removed.</p>
        <Link href="/template-library">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Template Library
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      {/* Back button */}
      <div className="mb-6">
        <Link href="/template-library">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Template Library
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        {/* Template Video Preview */}
        <div className="lg:col-span-2">
          <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
            <Image
              src={template.thumbnailUrl || '/thumbnails/placeholder-template.jpg'}
              alt={template.title}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Button size="lg" variant="secondary" className="rounded-full h-16 w-16 flex items-center justify-center">
                <Play className="h-8 w-8" />
              </Button>
            </div>
          </div>
          
          <div className="flex justify-between items-center mt-4">
            <div className="flex items-center gap-3">
              <Button size="sm" variant="outline">
                <Download className="mr-2 h-4 w-4" /> Download
              </Button>
              <Button size="sm" variant="outline">
                <Share2 className="mr-2 h-4 w-4" /> Share
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary">{template.category}</Badge>
              <div className="text-sm text-muted-foreground flex items-center">
                <Clock className="mr-1 h-4 w-4" /> {new Date(template.createdAt || Date.now()).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {/* Template Info */}
        <div>
          <h1 className="text-3xl font-bold mb-2">{template.title}</h1>
          <p className="text-muted-foreground mb-4">{template.description}</p>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <div className="flex items-center text-sm text-muted-foreground mb-1">
                    <Eye className="mr-1.5 h-4 w-4" /> Views
                  </div>
                  <div className="font-medium">{(template.stats?.views || 0).toLocaleString()}</div>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center text-sm text-muted-foreground mb-1">
                    <Heart className="mr-1.5 h-4 w-4" /> Likes
                  </div>
                  <div className="font-medium">{(template.stats?.likes || 0).toLocaleString()}</div>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center text-sm text-muted-foreground mb-1">
                    <MessageCircle className="mr-1.5 h-4 w-4" /> Comments
                  </div>
                  <div className="font-medium">{(template.stats?.comments || 0).toLocaleString()}</div>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center text-sm text-muted-foreground mb-1">
                    <BarChart3 className="mr-1.5 h-4 w-4" /> Engagement
                  </div>
                  <div className="font-medium">{(template.stats?.engagementRate || 0).toFixed(1)}%</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-6">
            <Button className="w-full">Use This Template</Button>
          </div>
        </div>
      </div>

      {/* Expert Insights */}
      <div className="mb-10">
        <Tabs defaultValue="insights">
          <TabsList>
            <TabsTrigger value="insights">Expert Insights</TabsTrigger>
            <TabsTrigger value="structure">Structure Breakdown</TabsTrigger>
            <TabsTrigger value="similar">Similar Templates</TabsTrigger>
          </TabsList>
          
          <TabsContent value="insights" className="p-6 border rounded-md mt-4">
            <div className="flex items-start mb-6">
              <div className="bg-purple-100 p-2 rounded-full mr-4">
                <Lightbulb className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Expert Analysis</h3>
                <p className="text-muted-foreground mb-4">
                  {template.expertInsights?.notes || 'No expert analysis available.'}
                </p>
                
                <div className="mb-6">
                  <h4 className="font-medium mb-2">Key Strengths</h4>
                  <ul className="space-y-2">
                    {template.analysisData?.viralityFactors?.strengths ? (
                      template.analysisData.viralityFactors.strengths.map((strength: string, index: number) => (
                        <li key={index} className="flex items-start">
                          <ThumbsUp className="h-4 w-4 mr-2 text-green-500 mt-1 flex-shrink-0" />
                          <span>{strength}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-muted-foreground">No key strengths available.</li>
                    )}
                  </ul>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Expert confidence score</span>
                  <Badge variant="outline" className="bg-green-50">
                    {template.analysisData?.expertConfidence ? 
                      (template.analysisData.expertConfidence * 10).toFixed(1) : '0.0'}/10
                  </Badge>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="structure" className="p-6 border rounded-md mt-4">
            <h3 className="text-xl font-semibold mb-4">Template Structure</h3>
            {template.templateStructure && template.templateStructure.length > 0 ? (
              <>
                <div className="mb-8">
                  <TemplateStructureVisualizer 
                    sections={template.templateStructure}
                    totalDuration={template.metadata?.duration || 60}
                  />
                </div>
                
                <div className="space-y-4">
                  {template.templateStructure.map((segment: any, index: number) => (
                    <div key={index} className="flex border-l-2 border-purple-200 pl-4 py-2">
                      <div className="w-20 text-sm font-medium text-muted-foreground">
                        {`${Math.floor(segment.startTime / 60)}:${(segment.startTime % 60).toString().padStart(2, '0')}-${Math.floor((segment.startTime + segment.duration) / 60)}:${((segment.startTime + segment.duration) % 60).toString().padStart(2, '0')}`}
                      </div>
                      <div className="flex-1">
                        <span className="font-medium">{segment.type}</span>
                        {segment.purpose && <p className="text-sm text-gray-600 mt-1">{segment.purpose}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">No structure breakdown available.</p>
            )}
          </TabsContent>
          
          <TabsContent value="similar" className="mt-4">
            <h3 className="text-xl font-semibold mb-4">Similar Templates</h3>
            {template.similarTemplates && template.similarTemplates.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {template.similarTemplates.map((similar) => (
                  <Link 
                    key={similar.id} 
                    href={`/template-library/${similar.id}`}
                    className="group"
                  >
                    <Card className="overflow-hidden h-full hover:shadow-md transition-all">
                      <div className="relative h-36 w-full">
                        <Image
                          src={similar.thumbnailUrl || '/thumbnails/placeholder-template.jpg'}
                          alt={similar.title}
                          className="object-cover"
                          fill
                        />
                        <div className="absolute top-2 right-2">
                          <Badge variant="secondary" className="bg-white/80">
                            {similar.category}
                          </Badge>
                        </div>
                      </div>
                      <CardContent className="p-3">
                        <h4 className="font-medium group-hover:text-purple-600 transition-colors">
                          {similar.title}
                        </h4>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No similar templates found.</p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function TemplateDetailSkeleton() {
  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <Skeleton className="h-10 w-40" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        <div className="lg:col-span-2">
          <Skeleton className="h-[400px] w-full rounded-lg" />
          <div className="flex justify-between items-center mt-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-28" />
              <Skeleton className="h-10 w-28" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-7 w-20" />
              <Skeleton className="h-7 w-36" />
            </div>
          </div>
        </div>

        <div>
          <Skeleton className="h-10 w-3/4 mb-2" />
          <Skeleton className="h-6 w-full mb-4" />
          <Skeleton className="h-6 w-full mb-2" />
          
          <div className="mt-6">
            <Skeleton className="h-[200px] w-full rounded-md" />
          </div>

          <div className="mt-6">
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>

      <div className="mb-10">
        <Skeleton className="h-10 w-full mb-4" />
        <Skeleton className="h-[300px] w-full rounded-md" />
      </div>
    </div>
  );
}

// Mock data for development purposes
function getMockTemplate(id: string): TemplateDetail {
  return {
    id,
    title: 'Product Showcase Format',
    category: 'Marketing',
    description: 'Effective template for showcasing products with before/after transformation and clear CTA that drives conversions.',
    thumbnailUrl: '/thumbnails/template1.jpg',
    videoUrl: '/videos/template1.mp4',
    createdAt: '2023-06-15T10:30:00Z',
    metadata: {
      duration: 30,
      hashtags: ['marketing', 'product', 'showcase'],
      aiDetectedCategory: 'Product Marketing'
    },
    stats: {
      views: 1250000,
      likes: 98000,
      comments: 12000,
      engagementRate: 8.9,
      shares: 45000
    },
    templateStructure: [
      {
        type: 'Hook',
        startTime: 0,
        duration: 3,
        purpose: 'Attention-grabbing opening to draw viewers in'
      },
      {
        type: 'Intro',
        startTime: 3,
        duration: 5,
        purpose: 'Introduces the topic and sets expectations'
      },
      {
        type: 'Main',
        startTime: 8,
        duration: 12,
        purpose: 'Core content presentation with key points'
      },
      {
        type: 'Demo',
        startTime: 20,
        duration: 5,
        purpose: 'Visual demonstration of the product'
      },
      {
        type: 'CTA',
        startTime: 25,
        duration: 5,
        purpose: 'Clear call to action for engagement'
      }
    ],
    analysisData: {
      expertEnhanced: true,
      expertConfidence: 0.92,
      viralityFactors: {
        strengths: [
          'Uses the proven "Problem-Solution-Result" framework that resonates with viewers',
          'Strategic text placement keeps viewers watching through the end',
          'Music selection perfectly complements the emotional arc of the narrative',
          'Call to action timing is optimized for maximum conversion'
        ],
        weaknesses: [
          'Could improve audio quality',
          'Text overlay duration could be longer'
        ],
        score: 8.5,
        expertAdjusted: true
      },
      engagementInsights: 'This template performs exceptionally well with 18-24 year olds. The transition at 0:15 creates a strong retention peak.'
    },
    expertInsights: {
      notes: 'This template follows a proven structure for product marketing that creates desire through transformation. It uses sharp transitions and emotional triggers that lead to a 3.2x higher conversion rate compared to standard formats.',
      strengths: [
        'Uses the proven "Problem-Solution-Result" framework that resonates with viewers',
        'Strategic text placement keeps viewers watching through the end',
        'Music selection perfectly complements the emotional arc of the narrative',
        'Call to action timing is optimized for maximum conversion'
      ],
      structureBreakdown: [
        {
          timeStamp: '0:00-0:03',
          description: 'Attention hook showing problem/pain point with relatable scenario'
        },
        {
          timeStamp: '0:03-0:08',
          description: 'Product introduction with key benefit highlighted in text overlay'
        },
        {
          timeStamp: '0:08-0:20',
          description: 'Demonstration of product with before/after comparison'
        },
        {
          timeStamp: '0:20-0:25',
          description: 'Social proof element with testimonial or stats'
        },
        {
          timeStamp: '0:25-0:30',
          description: 'Strong call to action with urgency element'
        }
      ],
      confidenceScore: 9.2
    },
    similarTemplates: [
      {
        id: 'template-002',
        title: 'E-commerce Unboxing Format',
        thumbnailUrl: '/thumbnails/template2.jpg',
        category: 'Marketing'
      },
      {
        id: 'template-004',
        title: 'Customer Testimonial Format',
        thumbnailUrl: '/thumbnails/template4.jpg',
        category: 'Marketing'
      },
      {
        id: 'template-006',
        title: 'Review Comparison Format',
        thumbnailUrl: '/thumbnails/template6.jpg',
        category: 'Marketing'
      }
    ]
  };
} 