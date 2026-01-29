'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card-component';
import { Sparkles, ArrowRight } from 'lucide-react';

/**
 * Remix Dashboard Page
 * This page displays template options for remixing
 */
export default function RemixDashboardPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Load popular templates suitable for remixing
  useEffect(() => {
    const fetchTemplates = async () => {
      if (templates.length > 0 && !loading) return;
      
      try {
        setLoading(true);
        
        // Mock templates data for development
        const mockTemplates = [
          {
            id: 'template-1',
            title: 'Product Showcase',
            description: 'A clean, modern template for showcasing your products with style',
            thumbnailUrl: 'https://placekitten.com/600/400',
            category: 'E-commerce',
            popularity: 'High',
            aiSuggestionCount: 24
          },
          {
            id: 'template-2',
            title: 'Trending Tutorial',
            description: 'Step-by-step instructional template with optimal pacing',
            thumbnailUrl: 'https://placekitten.com/601/400',
            category: 'Education',
            popularity: 'High',
            aiSuggestionCount: 18
          },
          {
            id: 'template-3',
            title: 'Viral Story',
            description: 'Narrative-driven emotional template with proven engagement',
            thumbnailUrl: 'https://placekitten.com/602/400',
            category: 'Entertainment',
            popularity: 'Medium',
            aiSuggestionCount: 12
          },
          {
            id: 'template-4',
            title: 'Brand Intro',
            description: 'Perfect for introducing your brand with impact',
            thumbnailUrl: 'https://placekitten.com/603/400',
            category: 'Branding',
            popularity: 'Medium',
            aiSuggestionCount: 16
          },
          {
            id: 'template-5',
            title: 'Promotion Announcement',
            description: 'Drive conversions with this high-impact promotion template',
            thumbnailUrl: 'https://placekitten.com/604/400',
            category: 'Marketing',
            popularity: 'High',
            aiSuggestionCount: 22
          },
          {
            id: 'template-6',
            title: 'User Testimonial',
            description: 'Build trust with authentic user testimonials',
            thumbnailUrl: 'https://placekitten.com/605/400',
            category: 'Social Proof',
            popularity: 'Low',
            aiSuggestionCount: 8
          }
        ];
        
        setTemplates(mockTemplates);
        setLoading(false);
      } catch (error) {
        console.error('Error loading templates:', error);
        setLoading(false);
      }
    };
    
    fetchTemplates();
  }, [templates, loading]);
  
  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="mb-8">
        <div className="flex items-center mb-2">
          <Sparkles className="h-6 w-6 text-blue-600 mr-2" />
          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">Premium Feature</span>
        </div>
        <h1 className="text-3xl font-bold">Template Remix</h1>
        <p className="text-gray-600 mt-2">
          Remix and customize templates with AI assistance to optimize for engagement, conversion, and brand consistency.
        </p>
      </div>
      
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-blue-800 mb-2">How AI Remix Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
          <div className="bg-white p-4 rounded-md shadow-sm">
            <div className="bg-blue-100 w-8 h-8 rounded-full flex items-center justify-center text-blue-600 font-bold mb-3">1</div>
            <h3 className="font-medium mb-2">Select a Template</h3>
            <p className="text-sm text-gray-600">Choose any template from our collection as your starting point</p>
          </div>
          <div className="bg-white p-4 rounded-md shadow-sm">
            <div className="bg-blue-100 w-8 h-8 rounded-full flex items-center justify-center text-blue-600 font-bold mb-3">2</div>
            <h3 className="font-medium mb-2">Set Your Goals</h3>
            <p className="text-sm text-gray-600">Specify what you want to optimize for (engagement, conversion, etc.)</p>
          </div>
          <div className="bg-white p-4 rounded-md shadow-sm">
            <div className="bg-blue-100 w-8 h-8 rounded-full flex items-center justify-center text-blue-600 font-bold mb-3">3</div>
            <h3 className="font-medium mb-2">Apply AI Suggestions</h3>
            <p className="text-sm text-gray-600">Review and apply AI-generated variations with a single click</p>
          </div>
        </div>
      </div>
      
      <h2 className="text-2xl font-bold mb-6">Popular Templates for Remixing</h2>
      
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <Card key={index} className="animate-pulse">
              <div className="h-48 bg-gray-200 rounded-t-lg" />
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                <div className="h-4 bg-gray-200 rounded w-5/6" />
              </CardContent>
              <CardFooter>
                <div className="h-10 bg-gray-200 rounded w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template.id} className="overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow">
              <div className="relative h-48 bg-gray-100">
                {template.thumbnailUrl && (
                  <img
                    src={template.thumbnailUrl}
                    alt={template.title}
                    className="rounded-t-lg w-full h-full object-cover"
                  />
                )}
                <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                  {template.category}
                </div>
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="flex justify-between items-center">
                  <span>{template.title}</span>
                  <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                    {template.popularity} Use
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-2 flex-grow">
                <p className="text-sm text-gray-600">{template.description}</p>
                {template.aiSuggestionCount > 0 && (
                  <div className="mt-3 flex items-center text-xs text-blue-600">
                    <Sparkles className="h-3 w-3 mr-1" />
                    <span>{template.aiSuggestionCount} AI suggestions available</span>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Link href={`/dashboard-view/remix/${template.id}`} className="w-full">
                  <Button className="w-full group">
                    <span>Remix Template</span>
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      <div className="mt-8 text-center">
        <Link href="/template-library">
          <Button variant="outline">
            Browse All Templates
          </Button>
        </Link>
      </div>
    </div>
  );
} 