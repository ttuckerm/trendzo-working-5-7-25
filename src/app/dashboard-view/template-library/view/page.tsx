'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Clock, 
  TrendingUp,
  LayoutGrid, 
  List, 
  Music, 
  X,
  RefreshCw,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorBoundary } from '@/components/debug/ErrorBoundary';
import { RenderCounter } from '@/components/debug/RenderCounter';
import { TemplateCard } from '@/components/templates/TemplateCard';
import { TikTokCard } from '@/components/templates/TikTokCard';
import { useStateContext } from '@/lib/contexts/StateContext';
import { useUsabilityTest } from '@/lib/contexts/UsabilityTestContext';
import { useDragDrop } from '@/lib/hooks/useDragDrop';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Define the Template type (based on the TemplateProps type from TemplateCard)
interface Template {
  id: string;
  title: string;
  category: string;
  description?: string;
  thumbnailUrl?: string;
  views: string | number;
  duration: string;
  stats?: {
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
}

// Stable mock data generator function (outside component to prevent recreation)
const getMockTemplates = (): Template[] => {
  return Array.from({ length: 20 }, (_, i) => ({
    id: `template-${i + 1}`,
    title: `Template ${i + 1}`,
    category: ['Entertainment', 'Educational', 'Product', 'Tutorial'][i % 4],
    description: `A great template for creating engaging content. Perfect for ${i % 2 === 0 ? 'beginners' : 'experienced users'}.`,
    thumbnailUrl: `https://picsum.photos/seed/template${i + 1}/500/800`,
    views: (Math.floor(Math.random() * 500) + 100) * 1000,
    duration: `${Math.floor(Math.random() * 45) + 15}s`,
    stats: {
      views: (Math.floor(Math.random() * 500) + 100) * 1000,
      likes: (Math.floor(Math.random() * 200) + 50) * 1000,
      comments: (Math.floor(Math.random() * 50) + 10) * 100,
      engagementRate: Math.floor(Math.random() * 15) + 5,
    },
    analysisData: {
      expertEnhanced: i % 3 === 0,
      expertConfidence: (Math.floor(Math.random() * 30) + 70) / 100,
    },
    soundId: i % 4 !== 0 ? `sound-${i}` : undefined,
    soundTitle: i % 4 !== 0 ? `Trending Sound ${i}` : undefined,
    soundAuthor: i % 4 !== 0 ? `Artist ${i}` : undefined,
    soundCategory: i % 4 !== 0 ? ['Pop', 'Hip Hop', 'Trending', 'Original'][i % 4] : undefined,
  }));
};

/**
 * Fixed Template Library Page Component
 * 
 * This implementation:
 * 1. Uses proper memoization and useCallback to prevent unnecessary re-renders
 * 2. Isolates state updates to prevent circular dependencies
 * 3. Implements error boundaries to catch and isolate errors
 * 4. Adds render counting to track performance
 */
export default function TemplateLibraryPage() {
  // Debug - Count renders to verify we've fixed the issue
  const [showCounter, setShowCounter] = useState(true);
  
  // State for templates and UI
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [error, setError] = useState<Error | null>(null);
  
  // Simple filter states - Using primitive values to avoid reference changes
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('popularity');
  const [showFilters, setShowFilters] = useState(false);
  
  // Access state context using useCallback to prevent recreation
  const { getState, setState } = useStateContext();
  
  // Track interaction with useCallback
  const { trackInteraction } = useUsabilityTest();
  const trackInteractionStable = useCallback((type: string, target: string) => {
    // Wrap in try/catch to prevent tracking errors from breaking the app
    try {
      trackInteraction({ 
        type: type as "click" | "hover" | "scroll" | "input" | "navigation" | "dwell" | 
               "error" | "success" | "abandon" | "complete" | "drag" | "dragOver" | 
               "drop" | "dragEnd", 
        target 
      });
    } catch (err) {
      console.error('Error tracking interaction:', err);
    }
  }, [trackInteraction]);
  
  // Load templates - only once on mount
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        // Try to load from state context first
        const savedTemplates = getState<Template[]>('templateLibrary.templates');
        if (savedTemplates && savedTemplates.length > 0) {
          setTemplates(savedTemplates);
          setLoading(false);
          return;
        }
        
        // Simulate API call
        setLoading(true);
        
        // Artificial delay to simulate network request
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Get mock templates
        const mockedTemplates = getMockTemplates();
        
        // Save to state and context
        setTemplates(mockedTemplates);
        setState('templateLibrary.templates', mockedTemplates);
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading templates:', err);
        setError(err instanceof Error ? err : new Error('Failed to load templates'));
        setLoading(false);
      }
    };
    
    loadTemplates();
  }, [getState, setState]); // Stable dependencies
  
  // Restore saved state from context
  useEffect(() => {
    // Restore view mode
    const savedViewMode = getState<'grid' | 'list'>('templateLibrary.viewMode');
    if (savedViewMode) {
      setViewMode(savedViewMode);
    } else {
      // Default to grid view to showcase our TikTok cards
      setViewMode('grid');
    }
    
    // Restore selected template
    const savedSelectedTemplate = getState<string>('templateLibrary.selectedTemplateId');
    if (savedSelectedTemplate) {
      setSelectedTemplateId(savedSelectedTemplate);
    }
    
    // Restore search term
    const savedSearchTerm = getState<string>('templateLibrary.searchTerm');
    if (savedSearchTerm) {
      setSearchTerm(savedSearchTerm);
    }
  }, [getState]); // Only on mount
  
  // Save state to context when changed - using individual useEffects to avoid unnecessary saves
  useEffect(() => {
    setState('templateLibrary.viewMode', viewMode);
  }, [viewMode, setState]);
  
  useEffect(() => {
    setState('templateLibrary.selectedTemplateId', selectedTemplateId);
  }, [selectedTemplateId, setState]);
  
  useEffect(() => {
    setState('templateLibrary.searchTerm', searchTerm);
  }, [searchTerm, setState]);
  
  // Handle template selection - memoized to prevent recreation
  const router = useRouter();
  
  // Add new state for navigation loading
  const [navigating, setNavigating] = useState(false);
  
  const handleSelectTemplate = useCallback((id: string, template: Template) => {
    // Set selected template in state
    setSelectedTemplateId(id);
    
    // Show loading indicator
    setNavigating(true);
    
    // Track the interaction
    trackInteractionStable('select', `template:${id}`);
    
    // Store template data in session storage for the detail page
    try {
      sessionStorage.setItem('selectedTemplateData', JSON.stringify(template));
      setState('templateLibrary.selectedTemplateData', template);
    } catch (err) {
      console.error('Error storing template data:', err);
    }
    
    // Navigate to template detail page
    router.push(`/dashboard-view/template-library/view/${id}`);
  }, [router, trackInteractionStable, setState]);
  
  // Filter templates using useMemo to prevent expensive recalculations
  const filteredTemplates = useMemo(() => {
    return templates
      .filter(template => 
        // Search term filtering
        searchTerm === '' || 
        template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (template.description && template.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        template.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (template.soundTitle && template.soundTitle.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      .filter(template =>
        // Category filtering
        categoryFilter === 'all' || template.category === categoryFilter
      )
      .sort((a, b) => {
        // Sort by selected method
        if (sortBy === 'popularity') {
          const aViews = typeof a.views === 'string' ? parseInt(a.views.replace(/\D/g, '')) : a.views;
          const bViews = typeof b.views === 'string' ? parseInt(b.views.replace(/\D/g, '')) : b.views;
          return bViews - aViews;
        } else if (sortBy === 'duration') {
          const aDuration = parseInt(a.duration.replace(/[^0-9]/g, ''));
          const bDuration = parseInt(b.duration.replace(/[^0-9]/g, ''));
          return aDuration - bDuration;
        }
        return 0;
      });
  }, [templates, searchTerm, categoryFilter, sortBy]);
  
  // Get unique categories for filtering - memoized
  const categories = useMemo(() => {
    return ['all', ...new Set(templates.map(t => t.category))];
  }, [templates]);
  
  // Toggle functions - memoized with useCallback
  const toggleViewMode = useCallback(() => {
    setViewMode(prev => prev === 'grid' ? 'list' : 'grid');
    trackInteractionStable('toggle', `viewMode:${viewMode === 'grid' ? 'list' : 'grid'}`);
  }, [viewMode, trackInteractionStable]);
  
  const toggleFilters = useCallback(() => {
    setShowFilters(prev => !prev);
    trackInteractionStable('toggle', `filters:${showFilters ? 'hide' : 'show'}`);
  }, [showFilters, trackInteractionStable]);
  
  // Handle search input change - memoized
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    trackInteractionStable('search', `term:${e.target.value}`);
  }, [trackInteractionStable]);
  
  // Handle category change - memoized
  const handleCategoryChange = useCallback((category: string) => {
    setCategoryFilter(category);
    trackInteractionStable('filter', `category:${category}`);
  }, [trackInteractionStable]);
  
  // Handle sort change - memoized
  const handleSortChange = useCallback((sort: string) => {
    setSortBy(sort);
    trackInteractionStable('sort', `by:${sort}`);
  }, [trackInteractionStable]);
  
  // Reset filters - memoized
  const resetFilters = useCallback(() => {
    setSearchTerm('');
    setCategoryFilter('all');
    setSortBy('popularity');
    trackInteractionStable('reset', 'filters');
  }, [trackInteractionStable]);
  
  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border border-gray-200">
        <div className="bg-red-100 p-3 rounded-full mb-4">
          <X className="h-6 w-6 text-red-500" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
        <p className="text-gray-600 mb-4">{error.message || 'Failed to load template library'}</p>
        <Button 
          onClick={() => window.location.reload()}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }
  
  return (
    <ErrorBoundary componentName="TemplateLibraryPage">
      {showCounter && <RenderCounter componentName="TemplateLibraryPage" />}
      
      <div className="container mx-auto px-4 py-8">
        {/* Header section */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Template Library</h1>
            <p className="text-gray-500">Browse and use professionally designed templates</p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={toggleViewMode}
              className="h-9 w-9"
            >
              {viewMode === 'grid' 
                ? <List className="h-5 w-5" /> 
                : <LayoutGrid className="h-5 w-5" />}
            </Button>
            
            <Button 
              variant={showFilters ? "secondary" : "outline"} 
              onClick={toggleFilters}
              className="flex items-center gap-2"
              size="sm"
            >
              <Filter className="h-4 w-4" />
              Filters
              {(searchTerm || categoryFilter !== 'all' || sortBy !== 'popularity') && (
                <Badge className="h-5 w-5 p-0 flex items-center justify-center rounded-full">
                  <span className="text-[10px]">
                    {(searchTerm ? 1 : 0) + (categoryFilter !== 'all' ? 1 : 0) + (sortBy !== 'popularity' ? 1 : 0)}
                  </span>
                </Badge>
              )}
            </Button>
          </div>
        </div>
        
        {/* Filter bar */}
        <AnimatePresence>
          {showFilters && (
            <motion.div 
              className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200"
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Search
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search templates..."
                      className="pl-9"
                      value={searchTerm}
                      onChange={handleSearchChange}
                    />
                  </div>
                </div>
                
                <div className="sm:w-48">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Category
                  </label>
                  <select 
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
                    value={categoryFilter}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category === 'all' ? 'All Categories' : category}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="sm:w-48">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Sort By
                  </label>
                  <select 
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value)}
                  >
                    <option value="popularity">Most Popular</option>
                    <option value="duration">Duration (Shortest)</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end mt-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={resetFilters}
                  className="h-8"
                >
                  Reset Filters
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Results info */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-sm text-gray-500">
            {filteredTemplates.length} templates found
          </div>
          
          {(searchTerm || categoryFilter !== 'all' || sortBy !== 'popularity') && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={resetFilters}
              className="h-8 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Clear Filters
            </Button>
          )}
        </div>
        
        {/* Loading state */}
        {loading ? (
          <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'} gap-6`}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={`${viewMode === 'grid' ? 'h-[280px]' : 'h-[120px]'} border rounded-lg overflow-hidden`}>
                <Skeleton className="h-full w-full" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Templates grid or list */}
            {filteredTemplates.length === 0 ? (
              <div className="py-16 text-center">
                <div className="inline-block p-4 rounded-full bg-gray-100 mb-4">
                  <Search className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium mb-2">No templates found</h3>
                <p className="text-gray-500 mb-6">Try adjusting your filters or search term</p>
                <Button onClick={resetFilters}>Clear Filters</Button>
              </div>
            ) : (
              <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'} gap-6`}>
                {filteredTemplates.map(template => (
                  <ErrorBoundary key={template.id} componentName={`TemplateCard-${template.id}`}>
                    {viewMode === 'grid' ? (
                      <TikTokCard
                        template={{
                          id: template.id,
                          title: template.title,
                          description: template.description,
                          category: template.category,
                          duration: parseInt(template.duration.replace(/[^0-9]/g, '')),
                          thumbnailUrl: template.thumbnailUrl,
                          views: typeof template.views === 'string' ? 
                            parseInt(template.views.replace(/\D/g, '')) : template.views,
                          stats: template.stats,
                          soundId: template.soundId,
                          soundTitle: template.soundTitle,
                          soundAuthor: template.soundAuthor,
                          soundCategory: template.soundCategory,
                          analysisData: template.analysisData
                        }}
                        onClick={() => handleSelectTemplate(template.id, template)}
                      />
                    ) : (
                      <TemplateCard
                        template={template as any}
                        isSelected={selectedTemplateId === template.id}
                        onClick={() => handleSelectTemplate(template.id, template)}
                        viewMode={viewMode}
                      />
                    )}
                  </ErrorBoundary>
                ))}
              </div>
            )}
            
            {/* Featured section */}
            {filteredTemplates.length > 0 && (
              <div className="mt-12 border-t pt-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold flex items-center">
                    <Sparkles className="h-5 w-5 text-amber-500 mr-2" />
                    Featured Templates
                  </h2>
                  <Link href="/dashboard-view/template-library/featured" className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
                    View all 
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTemplates.slice(0, 3).map(template => (
                    <ErrorBoundary key={`featured-${template.id}`} componentName={`FeaturedCard-${template.id}`}>
                      <TikTokCard
                        template={{
                          id: template.id,
                          title: template.title,
                          description: template.description,
                          category: template.category,
                          duration: parseInt(template.duration.replace(/[^0-9]/g, '')),
                          thumbnailUrl: template.thumbnailUrl,
                          views: typeof template.views === 'string' ? 
                            parseInt(template.views.replace(/\D/g, '')) : template.views,
                          stats: template.stats,
                          soundId: template.soundId,
                          soundTitle: template.soundTitle,
                          soundAuthor: template.soundAuthor,
                          soundCategory: template.soundCategory,
                          analysisData: template.analysisData
                        }}
                        onClick={() => handleSelectTemplate(template.id, template)}
                      />
                    </ErrorBoundary>
                  ))}
                </div>
              </div>
            )}
            
            {!navigating && (
              <p className="text-center text-sm text-gray-500 mt-4">
                Click on a template to view details and options
              </p>
            )}
            {navigating && (
              <div className="flex justify-center mt-6">
                <div className="flex items-center space-x-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-t-2 border-blue-600"></div>
                  <span className="text-sm text-gray-600">Loading template...</span>
                </div>
              </div>
            )}
          </>
        )}
        
        {/* Debug controls */}
        <div className="fixed bottom-4 right-4 z-50">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => setShowCounter(prev => !prev)}
            className="text-xs"
          >
            {showCounter ? 'Hide Counter' : 'Show Counter'}
          </Button>
        </div>
      </div>
    </ErrorBoundary>
  );
} 