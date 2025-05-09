'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card-component';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Filter, ArrowUpRight, Music } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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
  soundId?: string;
  soundTitle?: string;
  soundAuthor?: string;
  soundCategory?: string;
  soundStats?: {
    popularity: number;
    engagementBoost: number;
  };
}

export default function TemplateLibraryPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('popularity');
  const [showCategoryOptions, setShowCategoryOptions] = useState(false);
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [soundFilter, setSoundFilter] = useState('all');
  const [showSoundOptions, setShowSoundOptions] = useState(false);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        // In a production app, this would fetch from your API
        // For now, we'll use mock data
        const response = await fetch('/api/templates');
        if (!response.ok) throw new Error('Failed to fetch templates');
        
        const data = await response.json();
        setTemplates(data.templates || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching templates:', error);
        // Use mock data as fallback
        setTemplates(getMockTemplates());
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  // Filter and sort templates
  const filteredTemplates = templates
    .filter(template => 
      (searchTerm === '' || 
        template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (template.soundTitle && template.soundTitle.toLowerCase().includes(searchTerm.toLowerCase()))
      ) &&
      (categoryFilter === 'all' || template.category === categoryFilter) &&
      (soundFilter === 'all' || 
       (soundFilter === 'with-sound' && template.soundId) || 
       (soundFilter === 'without-sound' && !template.soundId) ||
       (template.soundCategory && template.soundCategory === soundFilter))
    )
    .sort((a, b) => {
      if (sortBy === 'popularity') {
        return b.stats.views - a.stats.views;
      } else if (sortBy === 'engagement') {
        return b.stats.engagementRate - a.stats.engagementRate;
      } else if (sortBy === 'sound-popularity') {
        return ((b.soundStats?.popularity || 0) - (a.soundStats?.popularity || 0));
      } else {
        return 0;
      }
    });

  // Get unique categories for the filter
  const categories = ['all', ...new Set(templates.map(t => t.category))];
  
  // Get unique sound categories for the filter
  const soundCategories = [
    'all', 
    'with-sound', 
    'without-sound', 
    ...new Set(templates
      .filter(t => t.soundCategory)
      .map(t => t.soundCategory as string)
    )
  ];

  return (
    <div className="container mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">Template Library</h1>
          <p className="text-muted-foreground mb-4">
            Browse and search proven TikTok templates with expert insights
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search templates..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Category filter */}
        <div className="relative">
          <div 
            className="border rounded-md px-4 py-2 flex justify-between items-center cursor-pointer"
            onClick={() => setShowCategoryOptions(!showCategoryOptions)}
          >
            <div className="flex items-center">
              <Filter className="h-4 w-4 mr-2" />
              <span>{categoryFilter === 'all' ? 'All Categories' : categoryFilter}</span>
            </div>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="h-4 w-4"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
          
          {showCategoryOptions && (
            <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg">
              {categories.map((category) => (
                <div 
                  key={category} 
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    setCategoryFilter(category);
                    setShowCategoryOptions(false);
                  }}
                >
                  {category === 'all' ? 'All Categories' : category}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sound filter - NEW */}
        <div className="relative">
          <div 
            className="border rounded-md px-4 py-2 flex justify-between items-center cursor-pointer"
            onClick={() => setShowSoundOptions(!showSoundOptions)}
          >
            <div className="flex items-center">
              <Music className="h-4 w-4 mr-2" />
              <span>
                {soundFilter === 'all' ? 'All Sounds' : 
                 soundFilter === 'with-sound' ? 'With Sound' :
                 soundFilter === 'without-sound' ? 'Without Sound' : soundFilter}
              </span>
            </div>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="h-4 w-4"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
          
          {showSoundOptions && (
            <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg">
              {soundCategories.map((category) => (
                <div 
                  key={category} 
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    setSoundFilter(category);
                    setShowSoundOptions(false);
                  }}
                >
                  {category === 'all' ? 'All Sounds' : 
                   category === 'with-sound' ? 'With Sound' :
                   category === 'without-sound' ? 'Without Sound' : category}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sort */}
        <div className="relative">
          <div 
            className="border rounded-md px-4 py-2 flex justify-between items-center cursor-pointer"
            onClick={() => setShowSortOptions(!showSortOptions)}
          >
            <span>
              {sortBy === 'popularity' ? 'Most Popular' : 
               sortBy === 'engagement' ? 'Highest Engagement' : 
               'Sound Popularity'}
            </span>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="h-4 w-4"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
          
          {showSortOptions && (
            <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg">
              <div 
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  setSortBy('popularity');
                  setShowSortOptions(false);
                }}
              >
                Most Popular
              </div>
              <div 
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  setSortBy('engagement');
                  setShowSortOptions(false);
                }}
              >
                Highest Engagement
              </div>
              <div 
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  setSortBy('sound-popularity');
                  setShowSortOptions(false);
                }}
              >
                Sound Popularity
              </div>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        // Skeleton loading state
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <CardContent className="p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <div className="flex justify-between mt-4">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              {filteredTemplates.length} templates found
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.length > 0 ? (
              filteredTemplates.map((template) => (
                <Link 
                  key={template.id} 
                  href={`/template-library/${template.id}`}
                  className="group"
                >
                  <Card className="overflow-hidden h-full transition-all hover:shadow-md flex flex-col">
                    <div className="relative h-48 w-full">
                      <Image
                        src={template.thumbnailUrl || '/thumbnails/placeholder-template.jpg'}
                        alt={template.title}
                        className="object-cover"
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="bg-white/80 hover:bg-white/90">
                          {template.category}
                        </Badge>
                      </div>
                      {template.analysisData?.expertEnhanced && (
                        <div className="absolute bottom-2 left-2">
                          <Badge variant="secondary" className="bg-purple-500/90 text-white hover:bg-purple-600/90">
                            Expert Enhanced
                          </Badge>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4 flex-grow flex flex-col">
                      <h3 className="font-bold text-lg mb-1 group-hover:text-purple-600 transition-colors truncate">
                        {template.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {template.description}
                      </p>
                      
                      <div className="mt-auto">
                        <div className="flex justify-between items-center text-sm text-muted-foreground">
                          <div>
                            {template.stats.views.toLocaleString()} views
                          </div>
                          <div>
                            {template.stats.engagementRate.toFixed(1)}% engagement
                          </div>
                        </div>
                        
                        <div className="flex justify-end mt-3">
                          <Button size="sm" variant="ghost" className="group-hover:bg-muted">
                            View Details <ArrowUpRight className="ml-1 h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-10">
                <p className="text-muted-foreground">No templates found matching your criteria</p>
                <Button 
                  variant="link" 
                  onClick={() => {
                    setSearchTerm('');
                    setCategoryFilter('all');
                  }}
                >
                  Clear filters
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Mock data for development purposes
function getMockTemplates(): Template[] {
  return [
    {
      id: 'template-001',
      title: 'Product Showcase Format',
      category: 'Marketing',
      description: 'Effective template for showcasing products with before/after transformation and clear CTA.',
      thumbnailUrl: '/thumbnails/template1.jpg',
      stats: {
        views: 1250000,
        likes: 98000,
        comments: 12000,
        engagementRate: 8.9
      },
      analysisData: {
        expertEnhanced: true,
        expertConfidence: 0.85
      }
    },
    {
      id: 'template-002',
      title: 'Step-by-Step Tutorial',
      category: 'Educational',
      description: 'Clear instructional format with timed segments for easy knowledge transfer.',
      thumbnailUrl: '/thumbnails/template2.jpg',
      stats: {
        views: 950000,
        likes: 87000,
        comments: 15000,
        engagementRate: 10.2
      },
      analysisData: {
        expertEnhanced: true,
        expertConfidence: 0.92
      }
    },
    {
      id: 'template-003',
      title: 'Trending Dance Format',
      category: 'Entertainment',
      description: 'Viral dance template with perfect timing for transitions and maximum engagement.',
      thumbnailUrl: '/thumbnails/template3.jpg',
      stats: {
        views: 2450000,
        likes: 145000,
        comments: 25000,
        engagementRate: 7.8
      }
    },
    {
      id: 'template-004',
      title: 'Story Narrative Structure',
      category: 'Storytelling',
      description: 'Emotional storytelling format with hook, conflict and resolution segments.',
      thumbnailUrl: '/thumbnails/template4.jpg',
      stats: {
        views: 1150000,
        likes: 95000,
        comments: 8000,
        engagementRate: 9.0
      },
      analysisData: {
        expertEnhanced: true,
        expertConfidence: 0.78
      }
    },
    {
      id: 'template-005',
      title: 'Quick Tip Format',
      category: 'Educational',
      description: 'Concise and punchy template for sharing valuable tips in under 15 seconds.',
      thumbnailUrl: '/thumbnails/template5.jpg',
      stats: {
        views: 780000,
        likes: 56000,
        comments: 4000,
        engagementRate: 7.7
      }
    },
    {
      id: 'template-006',
      title: 'Review Comparison Format',
      category: 'Marketing',
      description: 'Side-by-side comparison template perfect for product reviews and alternatives.',
      thumbnailUrl: '/thumbnails/template6.jpg',
      stats: {
        views: 950000,
        likes: 72000,
        comments: 6800,
        engagementRate: 8.3
      },
      analysisData: {
        expertEnhanced: true,
        expertConfidence: 0.88
      }
    },
  ];
} 