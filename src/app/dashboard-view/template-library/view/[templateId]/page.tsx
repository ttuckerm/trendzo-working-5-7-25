'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Share2, 
  Heart, 
  Bookmark, 
  BarChart2, 
  Users, 
  Clock, 
  CheckCircle,
  ChevronRight,
  Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card-component';
import { useStateContext } from '@/lib/contexts/StateContext';

interface Template {
  id: string;
  title: string;
  category: string;
  description: string;
  thumbnailUrl: string;
  stats: {
    views: number;
    likes: number;
    comments: number;
    engagementRate: number;
  };
  analysisData?: {
    expertEnhanced?: boolean;
    expertConfidence?: number;
  };
  details?: {
    duration?: string;
    recommendedFor?: string[];
    successRate?: number;
    bestPractices?: string[];
    trendData?: {
      trending: boolean;
      trendStrength: number;
      peakTime?: string;
    };
  };
}

export default function TemplateDetailPage({ 
  params 
}: { 
  params: { templateId: string } 
}) {
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { templateId } = params;
  const { getState, setState } = useStateContext();

  useEffect(() => {
    const fetchTemplateData = async () => {
      try {
        setLoading(true);
        
        // First try to get template data from sessionStorage (set by the template list page)
        let templateFromSession = null;
        
        try {
          const sessionData = sessionStorage.getItem('selectedTemplateData');
          if (sessionData) {
            const parsedData = JSON.parse(sessionData);
            if (parsedData.id === templateId) {
              templateFromSession = parsedData;
              console.log('[Template Detail] Using template data from session storage');
            }
          }
        } catch (e) {
          console.error('Error reading from sessionStorage:', e);
        }
        
        // If we have the template from session storage, use it immediately
        if (templateFromSession) {
          setTemplate(templateFromSession as Template);
          setLoading(false);
          
          // Store the template ID for the editor to use
          try {
            window.localStorage.setItem('selectedTemplateId', templateId);
            setState('templateLibrary.selectedTemplateId', templateId);
            setState('templateLibrary.selectedTemplateData', templateFromSession);
          } catch (e) {
            console.error('Error storing template data:', e);
          }
          
          // Still fetch the full data in the background
          const mockTemplate = getMockTemplate(templateId);
          if (mockTemplate) {
            setTemplate(mockTemplate);
          }
        } else {
          // Fallback to getting mock data
          console.log('[Template Detail] Fetching template data for ID:', templateId);
          setTimeout(() => {
            const mockTemplate = getMockTemplate(templateId);
            if (mockTemplate) {
              setTemplate(mockTemplate);
              
              // Store the template ID in state context for the editor to use
              try {
                window.localStorage.setItem('selectedTemplateId', templateId);
                setState('templateLibrary.selectedTemplateId', templateId);
                setState('templateLibrary.selectedTemplateData', mockTemplate);
              } catch (e) {
                console.error('Error storing template data:', e);
              }
            }
            setLoading(false);
          }, 500);
        }
      } catch (error) {
        console.error('Error fetching template details:', error);
        setLoading(false);
      }
    };

    fetchTemplateData();
  }, [templateId, setState]);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-white rounded-lg">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-t-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading template...</p>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center bg-white rounded-lg">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Template Not Found</h1>
        <p className="text-gray-600 mb-6">The template you're looking for doesn't exist or has been removed.</p>
        <Button onClick={() => router.push("/dashboard-view/template-library/view")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Templates
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      {/* Back button and actions */}
      <div className="flex justify-between items-center mb-6">
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
          onClick={() => router.push("/dashboard-view/template-library/view")}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Templates</span>
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="icon">
            <Share2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Heart className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Bookmark className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Template Preview */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg overflow-hidden border border-gray-200 shadow-sm">
            <div className="relative aspect-video bg-gray-100">
              <img
                src={template.thumbnailUrl}
                alt={template.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-black bg-opacity-50 rounded-full p-4">
                  <Play className="h-12 w-12 text-white" />
                </div>
              </div>
              {template.analysisData?.expertEnhanced && (
                <div className="absolute top-4 left-4">
                  <Badge className="bg-purple-500 text-white">
                    Expert Enhanced
                  </Badge>
                </div>
              )}
              <div className="absolute top-4 right-4">
                <Badge className="bg-white text-gray-800">
                  {template.category}
                </Badge>
              </div>
            </div>
            <div className="p-6">
              <h1 className="text-2xl font-bold mb-2">{template.title}</h1>
              <p className="text-gray-600 mb-4">{template.description}</p>
              
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900">{template.stats.views.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">Views</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900">{template.stats.likes.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">Likes</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900">{template.stats.engagementRate}%</div>
                  <div className="text-sm text-gray-500">Engagement</div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button 
                  className="flex-1"
                  onClick={() => router.push(`/dashboard-view/remix/${template.id}`)}
                >
                  Remix with AI
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => router.push(`/editor?id=${template.id}`)}
                >
                  Edit Template
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Template Details */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-bold mb-4">Template Details</h2>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-gray-500 mr-3" />
                  <div>
                    <div className="text-sm font-medium">Duration</div>
                    <div className="text-gray-600">{template.details?.duration || "30-60 seconds"}</div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-gray-500 mr-3" />
                  <div>
                    <div className="text-sm font-medium">Recommended For</div>
                    <div className="text-gray-600">{template.details?.recommendedFor?.join(", ") || "All creators"}</div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <BarChart2 className="h-5 w-5 text-gray-500 mr-3" />
                  <div>
                    <div className="text-sm font-medium">Success Rate</div>
                    <div className="text-gray-600">{template.details?.successRate || 87}% of users report growth</div>
                  </div>
                </div>
                
                {template.details?.trendData?.trending && (
                  <div className="flex items-center">
                    <div className="h-5 w-5 text-red-500 mr-3">🔥</div>
                    <div>
                      <div className="text-sm font-medium">Trending Now</div>
                      <div className="text-gray-600">Peak time: {template.details.trendData.peakTime || "Evenings"}</div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-bold mb-4">Best Practices</h2>
              <ul className="space-y-2">
                {(template.details?.bestPractices || [
                  "Keep transitions smooth and quick",
                  "Use trending sounds that match your content",
                  "Add text overlays for key points",
                  "End with a clear call to action"
                ]).map((practice, idx) => (
                  <li key={idx} className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{practice}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-bold mb-4">Similar Templates</h2>
              <div className="space-y-3">
                {[1, 2, 3].map((id) => (
                  <Link 
                    key={id} 
                    href={`/dashboard-view/template-library/view/template-${id === parseInt(templateId.split('-')[1]) ? (id % 9) + 1 : id}`}
                    className="flex items-center p-2 hover:bg-gray-50 rounded-md"
                  >
                    <div className="w-12 h-12 bg-gray-200 rounded overflow-hidden mr-3 flex-shrink-0">
                      <img 
                        src={`https://picsum.photos/seed/template${id}/100/100`} 
                        alt="Template" 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div className="flex-grow">
                      <div className="font-medium">Related Template {id}</div>
                      <div className="text-xs text-gray-500">
                        {id * 10}k views • {id * 5}% engagement
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Mock data function for template details
function getMockTemplate(templateId: string): Template | null {
  // To make the function more robust with different template ID formats
  const normalizedTemplateId = templateId.toLowerCase().startsWith('template-') ? 
    templateId : 
    (templateId.match(/\d+/) ? `template-${templateId.match(/\d+/)?.[0] || ''}` : templateId);
  
  const templates = [
    {
      id: 'template-1',
      title: 'Product Showcase',
      description: 'Perfect for highlighting features and benefits of physical products with expert insights for optimal conversions.',
      thumbnailUrl: 'https://picsum.photos/seed/product1/1200/800',
      category: 'E-commerce',
      stats: {
        views: 25400,
        likes: 1840,
        comments: 342,
        engagementRate: 8.7
      },
      analysisData: {
        expertEnhanced: true,
        expertConfidence: 0.92
      },
      details: {
        duration: "45-60 seconds",
        recommendedFor: ["E-commerce", "Small Business", "Brands"],
        successRate: 86,
        bestPractices: [
          "Show product from multiple angles",
          "Highlight key features with text overlays",
          "Include customer testimonials",
          "End with pricing and call-to-action"
        ],
        trendData: {
          trending: true,
          trendStrength: 8.3,
          peakTime: "Weekday afternoons"
        }
      }
    },
    {
      id: 'template-2',
      title: 'Tutorial Style',
      description: 'Step-by-step instructions that engage and educate your audience with proven instructional design.',
      thumbnailUrl: 'https://picsum.photos/seed/tutorial1/1200/800',
      category: 'Education',
      stats: {
        views: 42300,
        likes: 3200,
        comments: 756,
        engagementRate: 9.4
      },
      details: {
        duration: "60-90 seconds",
        recommendedFor: ["Educators", "How-to Content", "DIY Creators"],
        successRate: 91,
        bestPractices: [
          "Start with the finished result",
          "Break down into clear steps",
          "Use numbered text overlays",
          "Keep each step under 10 seconds"
        ],
        trendData: {
          trending: false,
          trendStrength: 6.2,
          peakTime: "Weekends"
        }
      }
    },
    {
      id: 'template-3',
      title: 'Trending Dance',
      description: 'Based on viral dance trends with optimal camera angles and timing for maximum engagement.',
      thumbnailUrl: 'https://picsum.photos/seed/dance1/1200/800',
      category: 'Entertainment',
      stats: {
        views: 128000,
        likes: 24600,
        comments: 1820,
        engagementRate: 20.6
      },
      analysisData: {
        expertEnhanced: true,
        expertConfidence: 0.96
      },
      details: {
        duration: "15-30 seconds",
        recommendedFor: ["Dance Creators", "Music Promoters", "Influencers"],
        successRate: 94,
        bestPractices: [
          "Use popular trending sounds",
          "Film in well-lit areas",
          "Focus on sharp, clear movements",
          "Include slow-motion or repeats of difficult moves"
        ],
        trendData: {
          trending: true,
          trendStrength: 9.7,
          peakTime: "Evening prime time"
        }
      }
    },
    {
      id: 'template-4',
      title: 'Before and After',
      description: 'Dramatic reveal format perfect for transformations and results with optimal timing for impact.',
      thumbnailUrl: 'https://picsum.photos/seed/before1/1200/800',
      category: 'Transformation',
      stats: {
        views: 67800,
        likes: 8930,
        comments: 1240,
        engagementRate: 15.0
      },
      details: {
        duration: "20-45 seconds",
        recommendedFor: ["Fitness", "Beauty", "Home Improvement", "Fashion"],
        successRate: 88,
        bestPractices: [
          "Start with the 'before' state clearly shown",
          "Use a dramatic transition effect",
          "Ensure the 'after' reveal is impactful",
          "Include text explaining the process"
        ]
      }
    },
    {
      id: 'template-5',
      title: 'Comedy Skit',
      description: 'Humorous format with optimal timing for punchlines and engagement, based on viral comedy patterns.',
      thumbnailUrl: 'https://picsum.photos/seed/comedy1/1200/800',
      category: 'Entertainment',
      stats: {
        views: 94500,
        likes: 18700,
        comments: 3200,
        engagementRate: 23.2
      },
      details: {
        duration: "30-60 seconds",
        recommendedFor: ["Comedians", "Entertainment Creators", "Brand Personality"],
        successRate: 83,
        bestPractices: [
          "Set up scenario clearly in first 5 seconds",
          "Use visual cues for the punchline",
          "Consider adding text for dialogue clarity",
          "Exaggerate reactions for comic effect"
        ],
        trendData: {
          trending: true,
          trendStrength: 8.9,
          peakTime: "Late evenings"
        }
      }
    }
  ];

  // First try exact match
  let template = templates.find(t => t.id === normalizedTemplateId || t.id === templateId);
  
  // If not found, try to match by the numeric part
  if (!template && templateId) {
    const extractNumericId = (id: string) => {
      const matches = id.match(/\d+/);
      return matches && matches[0] ? parseInt(matches[0]) : null;
    };
    
    const numericId = extractNumericId(templateId);
    if (numericId !== null) {
      template = templates.find(t => extractNumericId(t.id) === numericId);
    }
  }
  
  if (template) return template;

  // If we still don't have this specific template in our mock data,
  // create a generic one based on the templateId
  const idParts = templateId.split('-');
  if (idParts.length >= 2) {
    const numberPart = parseInt(idParts[1]);
    if (!isNaN(numberPart)) {
      return {
        id: templateId,
        title: `Template ${numberPart}`,
        description: 'Custom template with optimized structure for engagement and visibility.',
        thumbnailUrl: `https://picsum.photos/seed/${templateId}/1200/800`,
        category: numberPart % 2 === 0 ? 'Content' : 'Entertainment',
        stats: {
          views: numberPart * 5000,
          likes: numberPart * 800,
          comments: numberPart * 120,
          engagementRate: 10 + (numberPart % 10)
        },
        details: {
          duration: "30-60 seconds",
          recommendedFor: ["Content Creators", "Brands"],
          successRate: 80 + (numberPart % 15),
          bestPractices: [
            "Keep content concise and focused",
            "Use trending sounds when appropriate",
            "Optimize first 3 seconds for retention",
            "Include clear call-to-action"
          ]
        }
      };
    }
  }

  // Final fallback - for any ID format, create a generic template
  return {
    id: templateId,
    title: `Template Preview`,
    description: 'This template is designed to showcase your content effectively.',
    thumbnailUrl: `https://picsum.photos/seed/${templateId}/1200/800`,
    category: 'General',
    stats: {
      views: 15000,
      likes: 1200,
      comments: 350,
      engagementRate: 12.5
    },
    details: {
      duration: "30-60 seconds",
      recommendedFor: ["Content Creators", "Social Media Marketers"],
      successRate: 85,
      bestPractices: [
        "Use high quality visuals",
        "Keep text brief and impactful",
        "Include a strong call-to-action",
        "Optimize timing for key points"
      ]
    }
  };
} 