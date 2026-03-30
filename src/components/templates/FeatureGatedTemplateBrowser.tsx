import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFeatures } from '@/lib/contexts/FeatureContext';
import { trendingTemplateService } from '@/lib/services/trendingTemplateService';
import { soundService } from '@/lib/services/soundService';
import { TrendingTemplate } from '@/lib/types/trendingTemplate';
import { TikTokSound } from '@/lib/types/tiktok';
import EnhancedTemplateCard from './EnhancedTemplateCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Filter, 
  TrendingUp, 
  Music, 
  Star, 
  SlidersHorizontal,
  Search,
  Clock,
  BarChart
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const TEMPLATES_PER_PAGE = 12;

export const FeatureGatedTemplateBrowser: React.FC = () => {
  const router = useRouter();
  const { features, subscription } = useFeatures();
  
  // State for templates and pagination
  const [templates, setTemplates] = useState<TrendingTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<TrendingTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // State for template sounds
  const [templateSounds, setTemplateSounds] = useState<Record<string, TikTokSound>>({});
  const [loadingSounds, setLoadingSounds] = useState(false);
  
  // State for filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortOption, setSortOption] = useState<string>('trending');
  const [showExpertOnly, setShowExpertOnly] = useState(false);
  const [durationRange, setDurationRange] = useState<[number, number]>([0, 300]); // in seconds
  const [showFilters, setShowFilters] = useState(false);
  
  // Generate expert inputs for some templates (mock data)
  const [templatesWithExpertInput, setTemplatesWithExpertInput] = useState<Record<string, boolean>>({});

  // Load templates
  useEffect(() => {
    const fetchTemplates = async () => {
      setLoading(true);
      
      try {
        // Get all trending templates
        const allTemplates = await trendingTemplateService.getAllTrendingTemplates();
        setTemplates(allTemplates);
        
        // Mock expert inputs for some templates (in real app, this would come from the expertInsightService)
        const expertInputs: Record<string, boolean> = {};
        allTemplates.forEach(template => {
          // Random 20% of templates have expert input
          if (Math.random() < 0.2) {
            expertInputs[template.id] = true;
          }
        });
        setTemplatesWithExpertInput(expertInputs);
        
        // Apply initial filtering and pagination
        applyFiltersAndPagination(allTemplates);
      } catch (err) {
        console.error('Error fetching templates:', err);
        setError('Failed to load templates. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTemplates();
  }, []);
  
  // Apply filters and update displayed templates
  const applyFiltersAndPagination = (allTemplates: TrendingTemplate[]) => {
    // Apply search query
    let filtered = allTemplates;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(template => 
        template.title.toLowerCase().includes(query) || 
        template.description?.toLowerCase().includes(query) ||
        template.category?.toLowerCase().includes(query)
      );
    }
    
    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(template => 
        template.category?.toLowerCase() === categoryFilter.toLowerCase()
      );
    }
    
    // Apply expert input filter
    if (showExpertOnly) {
      filtered = filtered.filter(template => 
        templatesWithExpertInput[template.id]
      );
    }
    
    // Apply duration filter
    filtered = filtered.filter(template => 
      template.duration >= durationRange[0] && 
      template.duration <= durationRange[1]
    );
    
    // Apply sorting
    switch (sortOption) {
      case 'trending':
        filtered = filtered.sort((a, b) => (b.growthRate || 0) - (a.growthRate || 0));
        break;
      case 'newest':
        filtered = filtered.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
        break;
      case 'engagement':
        filtered = filtered.sort((a, b) => (b.engagementRate || 0) - (a.engagementRate || 0));
        break;
      case 'views':
        filtered = filtered.sort((a, b) => (b.stats?.viewCount || 0) - (a.stats?.viewCount || 0));
        break;
    }
    
    // Update filtered templates
    setFilteredTemplates(filtered);
    
    // Update total pages
    setTotalPages(Math.ceil(filtered.length / TEMPLATES_PER_PAGE));
    
    // Reset to first page when filters change
    setCurrentPage(1);
  };
  
  // Effect to apply filters when they change
  useEffect(() => {
    if (templates.length > 0) {
      applyFiltersAndPagination(templates);
    }
  }, [searchQuery, categoryFilter, sortOption, showExpertOnly, durationRange, templates]);
  
  // Load sounds for displayed templates
  useEffect(() => {
    const fetchSoundsForTemplates = async () => {
      if (!features.SOUND_ANALYSIS) return;
      
      // Get current page templates
      const startIndex = (currentPage - 1) * TEMPLATES_PER_PAGE;
      const endIndex = Math.min(startIndex + TEMPLATES_PER_PAGE, filteredTemplates.length);
      const displayedTemplates = filteredTemplates.slice(startIndex, endIndex);
      
      setLoadingSounds(true);
      
      try {
        // Get template IDs that need sounds
        const templateIds = displayedTemplates
          .map(template => template.soundId)
          .filter(soundId => soundId && !templateSounds[soundId]) as string[];
        
        if (templateIds.length === 0) {
          setLoadingSounds(false);
          return;
        }
        
        // Fetch sounds for these templates
        const sounds = await Promise.all(
          templateIds.map(soundId => soundService.getSound(soundId))
        );
        
        // Update sounds state
        const newSounds: Record<string, TikTokSound> = { ...templateSounds };
        sounds.forEach(sound => {
          if (sound && sound.id) {
            newSounds[sound.id] = sound;
          }
        });
        
        setTemplateSounds(newSounds);
      } catch (err) {
        console.error('Error fetching sounds:', err);
      } finally {
        setLoadingSounds(false);
      }
    };
    
    fetchSoundsForTemplates();
  }, [currentPage, filteredTemplates, features.SOUND_ANALYSIS, templateSounds]);
  
  // Get templates for current page
  const getCurrentPageTemplates = () => {
    const startIndex = (currentPage - 1) * TEMPLATES_PER_PAGE;
    const endIndex = Math.min(startIndex + TEMPLATES_PER_PAGE, filteredTemplates.length);
    return filteredTemplates.slice(startIndex, endIndex);
  };
  
  // Handler for template card click
  const handleTemplateClick = (template: TrendingTemplate) => {
    router.push(`/template-preview/${template.id}`);
  };
  
  // Handler for template use click
  const handleUseTemplate = (template: TrendingTemplate) => {
    router.push(`/template-editor/${template.id}`);
  };
  
  // Handler for sound play click
  const handlePlaySound = (soundId: string) => {
    // This would be handled by your AudioContext in a real implementation
    console.log(`Playing sound: ${soundId}`);
  };
  
  // Get available categories from templates
  const getCategories = () => {
    const categories = new Set<string>();
    templates.forEach(template => {
      if (template.category) {
        categories.add(template.category);
      }
    });
    return Array.from(categories);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col gap-6">
        {/* Header and controls */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Template Library</h1>
            <p className="text-muted-foreground">
              {subscription === 'premium' || subscription === 'platinum' 
                ? 'Discover trending templates with premium analytics' 
                : 'Discover trending templates for your content'}
            </p>
          </div>
          
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search templates..."
                className="pl-8 w-full sm:w-[200px] md:w-[260px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              className="sm:ml-2"
            >
              <SlidersHorizontal size={18} />
            </Button>
          </div>
        </div>
        
        {/* Filters panel */}
        {showFilters && (
          <Card className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Filter Templates</CardTitle>
              <CardDescription>Customize your template browsing experience</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select
                    value={categoryFilter}
                    onValueChange={setCategoryFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {getCategories().map(category => (
                        <SelectItem key={category} value={category.toLowerCase()}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Sort By</label>
                  <Select
                    value={sortOption}
                    onValueChange={setSortOption}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trending">Trending</SelectItem>
                      <SelectItem value="newest">Newest</SelectItem>
                      <SelectItem value="engagement">Engagement</SelectItem>
                      <SelectItem value="views">Most Views</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Duration (seconds)</label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      max={durationRange[1]}
                      value={durationRange[0]}
                      onChange={(e) => setDurationRange([Number(e.target.value), durationRange[1]])}
                      className="w-20"
                    />
                    <span>to</span>
                    <Input
                      type="number"
                      min={durationRange[0]}
                      max="300"
                      value={durationRange[1]}
                      onChange={(e) => setDurationRange([durationRange[0], Number(e.target.value)])}
                      className="w-20"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Options</label>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="expert-only"
                      checked={showExpertOnly}
                      onCheckedChange={(checked) => setShowExpertOnly(checked === true)}
                    />
                    <label
                      htmlFor="expert-only"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Expert insights only
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Templates grid */}
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array(8).fill(0).map((_, index) => (
              <div 
                key={index}
                className="h-80 rounded-lg bg-gray-100 animate-pulse"
              />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center p-12">
            <p className="text-lg text-red-500">{error}</p>
            <Button 
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12">
            <p className="text-lg">No templates found matching your filters.</p>
            <Button 
              className="mt-4"
              onClick={() => {
                setSearchQuery('');
                setCategoryFilter('all');
                setShowExpertOnly(false);
                setDurationRange([0, 300]);
                setSortOption('trending');
              }}
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {getCurrentPageTemplates().map(template => (
                <EnhancedTemplateCard
                  key={template.id}
                  template={template}
                  sound={template.soundId ? templateSounds[template.soundId] : undefined}
                  expertInput={templatesWithExpertInput[template.id]}
                  onClick={() => handleTemplateClick(template)}
                  onPlaySound={() => template.soundId && handlePlaySound(template.soundId)}
                  onUseTemplate={() => handleUseTemplate(template)}
                />
              ))}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => 
                        page === 1 || 
                        page === totalPages || 
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      )
                      .map((page, index, array) => (
                        <React.Fragment key={page}>
                          {index > 0 && array[index - 1] !== page - 1 && (
                            <span className="px-2">...</span>
                          )}
                          <Button
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className="w-9"
                          >
                            {page}
                          </Button>
                        </React.Fragment>
                      ))
                    }
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FeatureGatedTemplateBrowser; 