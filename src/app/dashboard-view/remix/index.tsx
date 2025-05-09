'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card-component';
import { Loader2, Wand2 } from 'lucide-react';

// Simple template type definition
interface Template {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  tags?: string[];
  stats?: {
    views: number;
    likes: number;
  };
}

/**
 * Remix Hub Page - Simplified implementation to avoid import issues
 */
export default function RemixHubPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load mock templates to demonstrate the UI
  useEffect(() => {
    const mockTemplates: Template[] = [
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
    
    // Simulate API loading
    setTimeout(() => {
      setTemplates(mockTemplates);
      setIsLoading(false);
    }, 800);
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Template Remix</h1>
        <p className="text-gray-600">Loading available templates...</p>
        
        <div className="flex justify-center items-center mt-12">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 text-right">
          <Link href="/dashboard-view/remix/debug" className="text-xs text-gray-400 hover:text-gray-600">
            Debug Mode
          </Link>
        </div>
      )}
      
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
              Remix and customize templates to create your own variations with AI assistance.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/template-library">
                <Button size="lg">
                  Browse All Templates
                </Button>
              </Link>
              
              <Link href="/dashboard-view/remix/go">
                <Button variant="outline" size="lg">
                  <Wand2 className="mr-2 h-4 w-4" />
                  Quick Start Remix
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="flex justify-center">
            <div className="relative h-[300px] w-[300px]">
              <Image
                src="https://placekitten.com/300/300"
                alt="Template Remix Illustration"
                width={300}
                height={300}
                style={{objectFit: 'contain'}}
              />
            </div>
          </div>
        </div>
        
        {/* Popular Templates Section */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-6">Popular Templates to Remix</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {templates.map((template) => (
              <Card key={template.id} className="overflow-hidden flex flex-col">
                <div className="relative h-[200px] w-full">
                  <Image
                    src={template.thumbnailUrl}
                    alt={template.title}
                    fill
                    style={{objectFit: 'cover'}}
                    className="rounded-t-lg"
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
                
                <CardFooter className="mt-auto">
                  <div className="flex flex-col w-full gap-2">
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>{template.stats?.views.toLocaleString()} views</span>
                      <span>{template.stats?.likes.toLocaleString()} likes</span>
                    </div>
                    <Link href={`/dashboard-view/remix/${template.id}`} className="w-full">
                      <Button size="sm" className="w-full">
                        Remix This Template
                      </Button>
                    </Link>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 