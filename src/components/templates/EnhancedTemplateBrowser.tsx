"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';
import { AnimatePresence, motion } from 'framer-motion';
import { TemplateCard, TemplateProps } from './TemplateCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { 
  Filter, 
  Search, 
  SlidersHorizontal, 
  X, 
  ZapIcon,
  Loader2,
  Music,
  BarChart3,
  Clock, 
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/design-utils';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Label } from '@/components/ui/label';
import { Layout } from 'lucide-react';
import { useComponentIntegration } from '@/lib/contexts/ComponentIntegrationContext';
import { useUsabilityTest } from '@/lib/contexts/UsabilityTestContext';
import { useRouter } from 'next/navigation';
import { ElementTransition } from '@/components/ui/PageTransition';

interface EnhancedTemplateBrowserProps {
  initialTemplates?: TemplateProps[];
  onLoadMore?: () => Promise<TemplateProps[]>;
  onSearch?: (query: string) => Promise<TemplateProps[]>;
  onFilter?: (filters: BrowserFilters) => Promise<TemplateProps[]>;
  onSelectTemplate?: (templateId: string) => void;
  className?: string;
}

interface BrowserFilters {
  category: string;
  duration: [number, number]; // min and max in seconds
  sort: 'popular' | 'recent' | 'trending';
  withSound?: boolean;
  analyzed?: boolean;
}

export default function EnhancedTemplateBrowser({
  initialTemplates = [],
  onLoadMore,
  onSearch,
  onFilter,
  onSelectTemplate,
  className = '',
}: EnhancedTemplateBrowserProps) {
  // State for templates and loading
  const [templates, setTemplates] = useState<TemplateProps[]>(initialTemplates);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  
  // State for skeleton loading
  const [loadingTemplates, setLoadingTemplates] = useState<number[]>([]);
  
  // State for filter interactions
  const [filtersChanged, setFiltersChanged] = useState(false);
  
  // State for hover effects tracking
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  
  // State for filters
  const [filters, setFilters] = useState<BrowserFilters>({
    category: 'All',
    duration: [0, 120], // 0-120 seconds
    sort: 'popular',
    withSound: false,
    analyzed: false,
  });
  
  // Reference to the original filters for reset
  const originalFilters = useRef<BrowserFilters>({
    category: 'All',
    duration: [0, 120],
    sort: 'popular',
    withSound: false,
    analyzed: false,
  });
  
  // Access router for navigation
  const router = useRouter();
  
  // Access component integration context
  const { 
    getComponentState, 
    setComponentState, 
    navigateBetweenComponents 
  } = useComponentIntegration();
  
  // Access usability test context for analytics
  const { trackInteraction } = useUsabilityTest();
  
  // Calculate active filters count
  useEffect(() => {
    let count = 0;
    
    if (filters.category !== 'All') count++;
    if (filters.duration[0] > 0 || filters.duration[1] < 120) count++;
    if (filters.withSound) count++;
    if (filters.analyzed) count++;
    if (filters.sort !== 'popular') count++; // Consider sort as a filter too
    
    setActiveFiltersCount(count);
    
    // Indicate that filters have changed to show visual feedback
    if (count > 0) {
      setFiltersChanged(true);
      // Auto-reset the change indicator after 1 second
      const timer = setTimeout(() => setFiltersChanged(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [filters]);
  
  // Load more ref for infinite scrolling
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false,
  });
  
  // Create loading skeleton templates
  useEffect(() => {
    setLoadingTemplates(Array.from({ length: 8 }, (_, i) => i));
  }, []);
  
  // Handle search with debounce
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      // If query is empty, reset to initial templates
      setTemplates(initialTemplates);
      setIsSearching(false);
      return;
    }
    
    if (onSearch) {
      try {
        setIsSearching(true);
        const results = await onSearch(query);
        setTemplates(results);
        setHasMore(results.length >= 12); // Assuming 12 is the page size
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    }
  }, [initialTemplates, onSearch]);
  
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, performSearch]);
  
  // Handle infinite scrolling
  useEffect(() => {
    const loadMoreItems = async () => {
      if (inView && !isLoading && !isSearching && !isFiltering && hasMore && onLoadMore) {
        setIsLoading(true);
        try {
          const newTemplates = await onLoadMore();
          if (newTemplates.length === 0) {
            setHasMore(false);
          } else {
            setTemplates(prev => [...prev, ...newTemplates]);
          }
        } catch (error) {
          console.error('Error loading more templates:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    loadMoreItems();
  }, [inView, isLoading, isSearching, isFiltering, hasMore, onLoadMore]);
  
  // Handle filter changes
  const handleFilterChange = useCallback(async () => {
    if (onFilter) {
      setIsFiltering(true);
      try {
        const filteredTemplates = await onFilter(filters);
        setTemplates(filteredTemplates);
        setHasMore(filteredTemplates.length >= 12);
      } catch (error) {
        console.error('Filter error:', error);
      } finally {
        setIsFiltering(false);
      }
    }
  }, [filters, onFilter]);
  
  // Handler for filter form submission
  const applyFilters = useCallback(() => {
    handleFilterChange();
    // Keep filter panel open for mobile devices to see results
    if (window.innerWidth > 768) {
      setShowFilters(false);
    }
  }, [handleFilterChange]);
  
  // Reset filters
  const resetFilters = useCallback(() => {
    setFilters({...originalFilters.current});
  }, []);
  
  // Remove single filter
  const removeFilter = useCallback((filterKey: keyof BrowserFilters) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: 
        filterKey === 'duration' 
          ? [0, 120] 
          : filterKey === 'category'
            ? 'All'
            : filterKey === 'sort'
              ? 'popular'
              : false
    }));
    
    // Apply filters automatically after removal
    setTimeout(handleFilterChange, 0);
  }, [handleFilterChange]);
  
  // Card animation variants - enhanced for better micro-interactions
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.3,
        ease: 'easeOut',
      },
    }),
    hover: {
      y: -8,
      scale: 1.02,
      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
      transition: {
        duration: 0.2,
        ease: 'easeOut',
      }
    },
    tap: {
      scale: 0.98,
      y: -2,
      transition: {
        duration: 0.1,
      }
    },
  };
  
  // Filter panel animation - enhanced for smoother transitions
  const filterPanelVariants = {
    hidden: { 
      height: 0, 
      opacity: 0,
      transition: {
        duration: 0.25,
        ease: 'easeInOut'
      }
    },
    visible: { 
      height: 'auto', 
      opacity: 1,
      transition: {
        duration: 0.35,
        ease: 'easeInOut'
      }
    }
  };
  
  // Button animation variants for better touch feedback
  const buttonVariants = {
    idle: { scale: 1 },
    hover: { scale: 1.05 },
    tap: { scale: 0.95 }
  };
  
  // Enhanced filter badge animation
  const filterBadgeVariants = {
    initial: { scale: 1 },
    active: { 
      scale: [1, 1.15, 1],
      transition: { duration: 0.4 }
    }
  };
  
  // Initialize state from persisted values
  useEffect(() => {
    // Restore search query if available
    const savedQuery = getComponentState<string>('templateLibrary', 'searchQuery');
    if (savedQuery) {
      setSearchQuery(savedQuery);
    }
    
    // Restore filters if available
    const savedFilters = getComponentState<BrowserFilters>('templateLibrary', 'filters');
    if (savedFilters) {
      setFilters(savedFilters);
    }
    
    // Restore view mode if available
    const savedViewMode = getComponentState<'grid' | 'list'>('templateLibrary', 'viewMode');
    if (savedViewMode) {
      // If your component has view mode switching, set it here
    }
  }, [getComponentState]);
  
  // Save state when it changes
  useEffect(() => {
    // Save search query when it changes
    setComponentState('templateLibrary', 'searchQuery', searchQuery);
  }, [searchQuery, setComponentState]);
  
  // Save filters when they change
  useEffect(() => {
    setComponentState('templateLibrary', 'filters', filters);
  }, [filters, setComponentState]);
  
  // Enhanced template selection with integration
  const handleTemplateSelect = useCallback((templateId: string) => {
    // Persist the selected template ID
    setComponentState('templateLibrary', 'selectedTemplateId', templateId);
    
    // Track the interaction for analytics
    trackInteraction({
      type: 'click',
      target: 'template-card',
      targetType: 'navigation',
      metadata: { templateId }
    });
    
    // Navigate to editor with smooth transition
    if (onSelectTemplate) {
      onSelectTemplate(templateId);
    } else {
      // Use our integration context to navigate with state persistence
      navigateBetweenComponents(
        '/templates',
        '/editor',
        {
          preserveState: true,
          data: { templateId },
          transition: 'zoom',
          direction: 'left'
        }
      );
    }
  }, [setComponentState, trackInteraction, onSelectTemplate, navigateBetweenComponents]);
  
  // Enhanced renderTemplateCards function with smooth animations
  const renderTemplateCards = () => {
    if (templates.length === 0 && !isLoading && !isSearching && !isFiltering) {
      return (
        <ElementTransition type="fade">
          <div className="col-span-full flex flex-col items-center justify-center p-12 text-center bg-neutral-50 rounded-lg border-2 border-dashed border-neutral-200">
            <Layout className="h-12 w-12 text-neutral-300 mb-4" />
            <h3 className="text-lg font-medium text-neutral-800 mb-2">No templates found</h3>
            <p className="text-neutral-500 mb-4 max-w-md">
              {searchQuery ? `No results matching "${searchQuery}"` : "Try adjusting your filters or create a new template"}
            </p>
            <Button 
              onClick={() => {
                setSearchQuery('');
                resetFilters();
              }}
              variant="outline"
              className="mr-2"
            >
              Clear Filters
            </Button>
            <Button onClick={() => router.push('/create-template')}>
              Create New Template
            </Button>
          </div>
        </ElementTransition>
      );
    }
    
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {templates.map((template, index) => (
          <motion.div
            key={template.id}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            layout
            custom={index}
            whileHover="hover"
            whileTap="tap"
            onHoverStart={() => setHoveredCardId(template.id)}
            onHoverEnd={() => setHoveredCardId(null)}
            className={hoveredCardId === template.id ? 'z-10' : 'z-0'}
            onClick={() => handleTemplateSelect(template.id)}
          >
            <TemplateCard 
              {...template}
              onClick={() => handleTemplateSelect(template.id)}
              className={cn(
                'h-full cursor-pointer transition-all duration-300',
                hoveredCardId === template.id ? 'shadow-xl ring-2 ring-primary-500 ring-opacity-50' : 'shadow-md hover:shadow-lg'
              )}
            />
          </motion.div>
        ))}
        
        {isLoading && loadingTemplates.map((_, i) => (
          <TemplateSkeleton key={`skeleton-${i}`} />
        ))}
      </div>
    );
  };

  // Render skeleton loading for cards - enhanced for better visual feedback
  const TemplateSkeleton = () => (
    <div className="bg-background rounded-xl overflow-hidden h-64 border border-neutral-200 shadow-sm">
      <div className="relative h-36 bg-neutral-200 animate-pulse">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-neutral-300/50"></div>
      </div>
      <div className="p-4 space-y-3">
        <div className="h-5 bg-neutral-200 rounded animate-pulse w-3/4"></div>
        <div className="flex items-center space-x-2">
          <div className="h-4 bg-neutral-200 rounded animate-pulse w-1/4"></div>
          <div className="h-4 bg-neutral-200 rounded animate-pulse w-1/4"></div>
        </div>
        <div className="flex justify-between items-center">
          <div className="h-4 bg-neutral-200 rounded animate-pulse w-1/5"></div>
          <div className="h-8 bg-neutral-200 rounded-full animate-pulse w-1/3"></div>
        </div>
      </div>
    </div>
  );

  // Enhance search input with better visual feedback
  const renderSearchInput = () => (
    <div className="relative group">
      <Input
        type="text"
        placeholder="Search templates..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="pl-10 pr-4 py-2 border-neutral-300 focus:border-primary-500 focus:ring focus:ring-primary-500/20 transition-all duration-200 rounded-full"
      />
      <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 transition-colors duration-200 ${isSearching ? 'text-primary-500' : 'text-neutral-400 group-hover:text-neutral-500'}`} />
      
      {searchQuery && (
        <button
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600 focus:outline-none"
          onClick={() => setSearchQuery('')}
        >
          <X className="h-4 w-4" />
        </button>
      )}
      
      {isSearching && (
        <motion.div 
          className="absolute right-3 top-1/2 transform -translate-y-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <Loader2 className="h-4 w-4 text-primary-500 animate-spin" />
        </motion.div>
      )}
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Enhanced Header with improved search and filter UI */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="w-full sm:max-w-xs">
          {renderSearchInput()}
        </div>
        
        <div className="flex space-x-2">
          <motion.button
            variants={buttonVariants}
            initial="idle"
            whileHover="hover"
            whileTap="tap"
            className={`flex items-center px-3 py-2 text-sm font-medium rounded-full border ${
              showFilters 
                ? 'bg-primary-50 text-primary-700 border-primary-200' 
                : 'bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-50'
            } transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-1.5" />
            Filters
            {activeFiltersCount > 0 && (
              <motion.span
                variants={filterBadgeVariants}
                initial="initial"
                animate={filtersChanged ? "active" : "initial"}
                className="ml-1.5 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-primary-500 rounded-full"
              >
                {activeFiltersCount}
              </motion.span>
            )}
          </motion.button>
          
          <Select
            value={filters.sort}
            onValueChange={(value) => {
              setFilters({...filters, sort: value as 'popular' | 'recent' | 'trending'});
              setTimeout(handleFilterChange, 0);
            }}
          >
            <SelectTrigger className="w-[130px] rounded-full border-neutral-300 focus:ring-primary-500 focus:ring-offset-1">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="rounded-lg shadow-lg border-neutral-200 overflow-hidden">
              <SelectItem value="popular" className="focus:bg-primary-50">Most Popular</SelectItem>
              <SelectItem value="recent" className="focus:bg-primary-50">Most Recent</SelectItem>
              <SelectItem value="trending" className="focus:bg-primary-50">Trending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Enhanced Filter Panel with smoother animations */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            variants={filterPanelVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm"
          >
            <div className="p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h3 className="text-sm font-medium text-neutral-900">Filter Templates</h3>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetFilters}
                    className="text-xs rounded-full h-8 border-neutral-300 hover:bg-neutral-50 transition-colors duration-200"
                  >
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                    Reset
                  </Button>
                  <Button
                    size="sm"
                    onClick={applyFilters}
                    className="text-xs rounded-full h-8 bg-primary-500 hover:bg-primary-600 transition-colors duration-200"
                  >
                    Apply
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="category" className="text-xs font-medium text-neutral-500 mb-1.5 block">
                    Category
                  </Label>
                  <Select
                    value={filters.category}
                    onValueChange={(value) => setFilters({...filters, category: value})}
                  >
                    <SelectTrigger className="w-full rounded-lg border-neutral-300 focus:ring-primary-500/20">
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg shadow-lg border-neutral-200">
                      <SelectItem value="All">All categories</SelectItem>
                      <SelectItem value="Fashion">Fashion</SelectItem>
                      <SelectItem value="Food">Food</SelectItem>
                      <SelectItem value="Travel">Travel</SelectItem>
                      <SelectItem value="Beauty">Beauty</SelectItem>
                      <SelectItem value="Fitness">Fitness</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <Label htmlFor="duration" className="text-xs font-medium text-neutral-500">
                      Duration (seconds)
                    </Label>
                    <span className="text-xs text-neutral-500">
                      {filters.duration[0]} - {filters.duration[1]}s
                    </span>
                  </div>
                  <Slider
                    defaultValue={filters.duration}
                    min={0}
                    max={120}
                    step={5}
                    onValueChange={(value) => setFilters({...filters, duration: value as [number, number]})}
                    className="py-2"
                  />
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="withSound"
                      checked={filters.withSound}
                      onCheckedChange={(checked) => setFilters({...filters, withSound: Boolean(checked)})}
                      className="text-primary-500 focus:ring-primary-500/20 rounded"
                    />
                    <Label htmlFor="withSound" className="text-sm text-neutral-700 cursor-pointer">
                      With Sound
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="analyzed"
                      checked={filters.analyzed}
                      onCheckedChange={(checked) => setFilters({...filters, analyzed: Boolean(checked)})}
                      className="text-primary-500 focus:ring-primary-500/20 rounded"
                    />
                    <Label htmlFor="analyzed" className="text-sm text-neutral-700 cursor-pointer">
                      Analyzed Templates
                    </Label>
                  </div>
                </div>
              </div>
              
              {/* Active Filters */}
              {activeFiltersCount > 0 && (
                <div className="pt-2 border-t mt-4">
                  <div className="flex flex-wrap gap-2">
                    {filters.category !== 'All' && (
                      <Badge 
                        className="bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors duration-200 px-3 py-1 gap-1.5 group"
                        onClick={() => removeFilter('category')}
                      >
                        Category: {filters.category}
                        <X className="h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                      </Badge>
                    )}
                    
                    {(filters.duration[0] > 0 || filters.duration[1] < 120) && (
                      <Badge 
                        className="bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors duration-200 px-3 py-1 gap-1.5 group"
                        onClick={() => removeFilter('duration')}
                      >
                        Duration: {filters.duration[0]}-{filters.duration[1]}s
                        <X className="h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                      </Badge>
                    )}
                    
                    {filters.withSound && (
                      <Badge 
                        className="bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors duration-200 px-3 py-1 gap-1.5 group"
                        onClick={() => removeFilter('withSound')}
                      >
                        With Sound
                        <X className="h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                      </Badge>
                    )}
                    
                    {filters.analyzed && (
                      <Badge 
                        className="bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors duration-200 px-3 py-1 gap-1.5 group"
                        onClick={() => removeFilter('analyzed')}
                      >
                        Analyzed
                        <X className="h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                      </Badge>
                    )}
                    
                    {filters.sort !== 'popular' && (
                      <Badge 
                        className="bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors duration-200 px-3 py-1 gap-1.5 group"
                        onClick={() => removeFilter('sort')}
                      >
                        Sort: {filters.sort}
                        <X className="h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Enhanced Template Grid with progressive loading and prettier cards */}
      {renderTemplateCards()}
      
      {/* Enhanced Load More button with better feedback */}
      {hasMore && templates.length > 0 && (
        <div className="flex justify-center pt-4" ref={loadMoreRef}>
          <motion.button
            variants={buttonVariants}
            initial="idle"
            whileHover="hover"
            whileTap="tap"
            className="flex items-center justify-center px-5 py-2.5 text-sm font-medium border border-neutral-300 
              rounded-full text-neutral-600 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 
              focus:ring-primary-500 focus:ring-offset-1 shadow-sm transition-all duration-200"
            onClick={() => onLoadMore && onLoadMore().then()}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Loading...
              </>
            ) : (
              'Load more templates'
            )}
          </motion.button>
        </div>
      )}
    </div>
  );
} 