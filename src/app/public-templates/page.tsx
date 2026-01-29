'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card-component';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingTemplate } from '@/lib/types/trendingTemplate';

/**
 * Public Templates Page
 * 
 * This page showcases available templates for non-members:
 * - Browse trending templates
 * - Search for specific templates
 * - Filter templates by category
 * - See template previews with calls-to-action for joining
 */
export default function PublicTemplatesPage() {
  const [templates, setTemplates] = useState<TrendingTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('trending');
  
  useEffect(() => {
    // Load mock template data
    const mockTemplates: TrendingTemplate[] = Array.from({ length: 8 }).map((_, index) => ({
      id: `template-${index + 1}`,
      title: `Template ${index + 1}`,
      description: `A versatile template for ${index % 2 === 0 ? 'product showcases' : 'promotional content'}`,
      thumbnailUrl: `https://placehold.co/300x400?text=${index % 3 === 0 ? 'Product' : index % 3 === 1 ? 'Story' : 'Tutorial'}`,
      category: index % 3 === 0 ? 'Product' : index % 3 === 1 ? 'Lifestyle' : 'Educational',
      tags: ['trending', index % 2 === 0 ? 'product' : 'promo', 'viral'],
      authorName: `Creator ${Math.floor(index / 3) + 1}`,
      authorVerified: index % 5 === 0,
      stats: {
        views: Math.floor(Math.random() * 100000) + 5000,
        likes: Math.floor(Math.random() * 10000) + 500,
        usageCount: Math.floor(Math.random() * 5000) + 100
      },
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
      isPremium: index % 4 === 0
    }));
    
    setTemplates(mockTemplates);
    setLoading(false);
  }, []);
  
  // Filter templates based on search query
  const filteredTemplates = templates.filter(template => 
    template.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  if (loading) {
    return (
      <div className="container px-4 py-8 mx-auto">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-t-2 border-r-2 border-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Loading templates...</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Template Library</h1>
          <p className="text-muted-foreground">
            Browse our collection of high-performing templates and customize them for your content
          </p>
        </div>
        
        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative sm:w-72">
            <Input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          
          {/* Important: Make sure Tabs and TabsContent are properly nested */}
          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="w-full sm:w-auto"
          >
            <TabsList>
              <TabsTrigger value="trending">Trending</TabsTrigger>
              <TabsTrigger value="recent">Recent</TabsTrigger>
              <TabsTrigger value="popular">Popular</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        {/* Templates Grid - wrapped in Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsContent value="trending" className="m-0">
            {filteredTemplates.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredTemplates.map(template => (
                  <Card key={template.id} className="overflow-hidden flex flex-col">
                    <div className="relative h-[240px] bg-gray-100">
                      <Image
                        src={template.thumbnailUrl}
                        alt={template.title}
                        width={300}
                        height={400}
                        className="object-cover"
                      />
                      {template.isPremium && (
                        <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                          PREMIUM
                        </div>
                      )}
                    </div>
                    
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-lg font-medium line-clamp-1">
                        {template.title}
                      </CardTitle>
                      <div className="flex items-center text-sm text-gray-500">
                        <span>By {template.authorName}</span>
                        {template.authorVerified && (
                          <span className="ml-1 text-blue-500">✓</span>
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="p-4 pt-0 pb-2 flex-grow">
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {template.description}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {template.tags.slice(0, 3).map(tag => (
                          <span 
                            key={tag} 
                            className="text-xs bg-gray-100 px-2 py-1 rounded-full"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                    
                    <CardFooter className="p-4 pt-2 flex justify-between items-center">
                      <div className="flex items-center text-xs text-gray-500">
                        <span>{template.stats.views.toLocaleString()} views</span>
                        <span className="mx-2">•</span>
                        <span>{template.stats.likes.toLocaleString()} likes</span>
                      </div>
                      
                      <Link href="/auth/signup" passHref>
                        <Button size="sm">
                          Preview
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-xl font-medium">No templates found</h3>
                <p className="text-gray-500 mt-2">Try adjusting your search criteria</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="recent" className="m-0">
            <div className="text-center py-12">
              <h3 className="text-xl font-medium">Browse our newest templates</h3>
              <p className="text-gray-500 mt-2">
                <Link href="/auth/signup" className="text-blue-500 hover:underline">
                  Sign up
                </Link> 
                {' '}to get full access to our template library
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="popular" className="m-0">
            <div className="text-center py-12">
              <h3 className="text-xl font-medium">Our most popular templates</h3>
              <p className="text-gray-500 mt-2">
                <Link href="/auth/signup" className="text-blue-500 hover:underline">
                  Sign up
                </Link> 
                {' '}to get full access to our template library
              </p>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Call to Action */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-6 mt-8">
          <h2 className="text-xl font-semibold text-blue-800 mb-2">Ready to create amazing content?</h2>
          <p className="text-blue-600 mb-4">
            Get full access to our entire template library and start creating professional content today.
          </p>
          <Link href="/auth/signup" passHref>
            <Button className="bg-blue-600 hover:bg-blue-700">
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
} 