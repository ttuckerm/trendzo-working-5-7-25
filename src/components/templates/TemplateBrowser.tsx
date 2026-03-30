"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { Search, Filter, ChevronDown, X, Sliders, Clock, Plus, ArrowRight, Sparkles, Grid, List, Grid2X2, LayoutGrid, Tag, TrendingUp } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Template } from "@/lib/types/template"
import { TemplateCard } from "./TemplateCard"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { cn } from "@/lib/design-utils"
import { Skeleton } from "@/components/ui/skeleton"

interface TemplateBrowserProps {
  templates: Template[]
  selectedTemplateId?: string | null
  onSelectTemplate: (templateId: string) => void
  isLoading?: boolean
  onLoadMore?: () => void
  onSearch?: (query: string) => void
  hasMore?: boolean
  className?: string
}

// Fix the sort by type
type SortByType = 'newest' | 'popular' | 'alphabetical';

// Enhanced search input with animation and feedback
const EnhancedSearchInput = ({ 
  value, 
  onChange, 
  onClear, 
  onFocus, 
  onBlur, 
  ref, 
  isSearchFocused 
}: { 
  value: string; 
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; 
  onClear: () => void; 
  onFocus: () => void; 
  onBlur: () => void; 
  ref: React.RefObject<HTMLInputElement>; 
  isSearchFocused: boolean; 
}) => {
  return (
    <motion.div 
      className={cn(
        "relative flex items-center rounded-md border transition-all",
        isSearchFocused 
          ? "border-primary ring-1 ring-primary/20 bg-white shadow-sm" 
          : "border-gray-200 bg-gray-50 hover:bg-gray-100"
      )}
      layout
      animate={{ 
        width: isSearchFocused ? "100%" : "auto",
      }}
      transition={{ duration: 0.2 }}
    >
      <Search className={cn(
        "absolute left-3 h-4 w-4 transition-colors",
        isSearchFocused ? "text-primary" : "text-gray-400"
      )} />
      <Input
        ref={ref}
        className="pl-9 pr-8 h-10 bg-transparent border-none shadow-none focus:ring-0 focus-visible:ring-0 placeholder:text-gray-400"
        placeholder="Search templates (press / to focus)"
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
      />
      {value && (
        <motion.button
          className="absolute right-3 text-gray-400 hover:text-gray-600"
          onClick={onClear}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          whileTap={{ scale: 0.9 }}
        >
          <X className="h-4 w-4" />
        </motion.button>
      )}
    </motion.div>
  );
};

// Enhanced filter button with count badge and animation
const FilterButton = ({ 
  onClick, 
  isOpen, 
  count 
}: { 
  onClick: () => void; 
  isOpen: boolean; 
  count: number; 
}) => {
  return (
    <motion.button
      onClick={onClick}
      className={cn(
        "flex h-10 items-center gap-1.5 rounded-md px-3 font-medium transition-colors relative",
        isOpen || count > 0
          ? "bg-primary text-white shadow-sm"
          : "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100"
      )}
      whileTap={{ scale: 0.97 }}
      layout
    >
      <Filter className="h-4 w-4" />
      <span>Filters</span>
      <AnimatePresence>
        {count > 0 && (
          <motion.div
            className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold shadow-sm"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
          >
            {count}
          </motion.div>
        )}
      </AnimatePresence>
      <ChevronDown className={cn(
        "h-4 w-4 transition-transform",
        isOpen && "transform rotate-180"
      )} />
    </motion.button>
  );
};

// Enhanced view mode buttons
const ViewModeButtons = ({ 
  viewMode, 
  setViewMode 
}: { 
  viewMode: 'grid' | 'list'; 
  setViewMode: (mode: 'grid' | 'list') => void; 
}) => {
  return (
    <motion.div className="border rounded-md flex overflow-hidden" layout>
      <button
        className={cn(
          "flex h-10 w-10 items-center justify-center transition-colors",
          viewMode === 'grid' 
            ? "bg-gray-100 text-gray-900" 
            : "bg-white text-gray-500 hover:text-gray-700 hover:bg-gray-50"
        )}
        onClick={() => setViewMode('grid')}
        aria-label="Grid view"
      >
        <LayoutGrid className="h-4 w-4" />
      </button>
      <button
        className={cn(
          "flex h-10 w-10 items-center justify-center border-l transition-colors",
          viewMode === 'list' 
            ? "bg-gray-100 text-gray-900" 
            : "bg-white text-gray-500 hover:text-gray-700 hover:bg-gray-50"
        )}
        onClick={() => setViewMode('list')}
        aria-label="List view"
      >
        <List className="h-4 w-4" />
      </button>
    </motion.div>
  );
};

// Empty state with animation
const EmptyState = ({ query, clearFilters }: { query: string, clearFilters: () => void }) => {
  return (
    <motion.div 
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", damping: 25 }}
    >
      <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 mb-6">
        <Search className="h-10 w-10 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
      <p className="text-muted-foreground mb-6 max-w-md">
        {query 
          ? `No templates match "${query}". Try a different search term or clear your filters.` 
          : "No templates match your current filters. Try adjusting your criteria."}
      </p>
      <button
        onClick={clearFilters}
        className="text-primary hover:text-primary/80 font-medium flex items-center gap-1.5"
      >
        <X className="h-4 w-4" />
        Clear filters
      </button>
    </motion.div>
  );
};

export default function TemplateBrowser({
  templates,
  selectedTemplateId,
  onSelectTemplate,
  isLoading = false,
  onLoadMore,
  onSearch,
  hasMore = false,
  className = ""
}: TemplateBrowserProps) {
  // Enhanced state management
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilters, setActiveFilters] = useState<{
    industries: string[]
    durations: string[]
    categories: string[]
  }>({
    industries: [],
    durations: [],
    categories: []
  })
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<SortByType>('newest')
  const [filtersVisible, setFiltersVisible] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const [activeFilterTab, setActiveFilterTab] = useState<'industry' | 'duration' | 'category'>('industry')

  // For accessibility and animation preferences
  const prefersReducedMotion = useReducedMotion()
  
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const observerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  
  // Get unique options for filters
  const industries = Array.from(new Set(templates.map(t => t.industry))).filter(Boolean)
  const categories = Array.from(new Set(templates.map(t => t.category))).filter(Boolean)
  const durations = ['0-30s', '30-60s', '60-120s', '120s+']
  
  // Filter templates based on search query and filters
  const filteredTemplates = useMemo(() => templates.filter(template => {
    // Search query filter
    if (searchQuery && !template.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !template.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    
    // Industry filter
    if (activeFilters.industries.length > 0 && !activeFilters.industries.includes(template.industry)) {
      return false
    }
    
    // Category filter
    if (activeFilters.categories.length > 0 && !activeFilters.categories.includes(template.category)) {
      return false
    }
    
    // Duration filter requires special handling as it's a range
    if (activeFilters.durations.length > 0) {
      const totalDuration = template.sections.reduce((sum, section) => sum + section.duration, 0)
      
      // Check if the template's duration falls within any of the selected ranges
      const durationMatch = activeFilters.durations.some(durationRange => {
        if (durationRange === '0-30s') return totalDuration <= 30
        if (durationRange === '30-60s') return totalDuration > 30 && totalDuration <= 60
        if (durationRange === '60-120s') return totalDuration > 60 && totalDuration <= 120
        if (durationRange === '120s+') return totalDuration > 120
        return false
      })
      
      if (!durationMatch) return false
    }
    
    return true
  }), [templates, searchQuery, activeFilters])
  
  // Sort templates
  const sortedTemplates = useMemo(() => [...filteredTemplates].sort((a, b) => {
    if (sortBy === 'alphabetical') {
      return a.name.localeCompare(b.name)
    }
    if (sortBy === 'popular') {
      return (b.usageCount || 0) - (a.usageCount || 0)
    }
    // Default to newest (based on createdAt)
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  }), [filteredTemplates, sortBy])
  
  // Handle search with debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    if (searchQuery) {
      searchTimeoutRef.current = setTimeout(() => {
        if (onSearch) {
          onSearch(searchQuery)
        }
        setHasSearched(true)
      }, 300)
    }
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery, onSearch])
  
  // Setup intersection observer for infinite loading
  useEffect(() => {
    if (!observerRef.current || !onLoadMore) return
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          onLoadMore()
        }
      },
      { threshold: 0.1 }
    )
    
    observer.observe(observerRef.current)
    
    return () => {
      observer.disconnect()
    }
  }, [hasMore, isLoading, onLoadMore])
  
  // Fix for the onCheckedChange prop in Checkbox components
  const handleIndustryChange = (checked: boolean, industry: string) => {
    if (checked) {
      setActiveFilters(prev => ({
        ...prev,
        industries: [...prev.industries, industry]
      }))
    } else {
      setActiveFilters(prev => ({
        ...prev,
        industries: prev.industries.filter(i => i !== industry)
      }))
    }
  }

  const handleCategoryChange = (checked: boolean, category: string) => {
    if (checked) {
      setActiveFilters(prev => ({
        ...prev,
        categories: [...prev.categories, category]
      }))
    } else {
      setActiveFilters(prev => ({
        ...prev,
        categories: prev.categories.filter(c => c !== category)
      }))
    }
  }

  const handleDurationChange = (checked: boolean, duration: string) => {
    if (checked) {
      setActiveFilters(prev => ({
        ...prev,
        durations: [...prev.durations, duration]
      }))
    } else {
      setActiveFilters(prev => ({
        ...prev,
        durations: prev.durations.filter(d => d !== duration)
      }))
    }
  }
  
  // Clear all filters
  const clearFilters = () => {
    setActiveFilters({
      industries: [],
      durations: [],
      categories: []
    })
    
    if (searchQuery) {
      setSearchQuery('')
      if (onSearch) {
        onSearch('')
      }
    }
    
    setHasSearched(false)
  }

  // Toggle search focus to enable keyboard navigation
  const focusSearch = () => {
    searchInputRef.current?.focus()
    setSearchFocused(true)
  }
  
  // Create a keyboard shortcut for search (press / to focus search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault()
        focusSearch()
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])
  
  // Count active filters for badge
  const activeFilterCount = activeFilters.industries.length + 
    activeFilters.categories.length + 
    activeFilters.durations.length

  // Create skeleton template cards for loading state
  const renderSkeletonCards = (count: number) => {
    return Array(count).fill(0).map((_, i) => (
      <motion.div 
        key={`skeleton-${i}`} 
        className="h-[280px] rounded-lg overflow-hidden bg-gray-50 border"
        initial={{ opacity: 0.6, y: 20 }}
        animate={{ 
          opacity: 1, 
          y: 0, 
          transition: { 
            delay: i * 0.05, 
            duration: 0.3 
          } 
        }}
      >
        <Skeleton className="h-44 w-full" />
        <div className="p-3 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex gap-2 mt-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </div>
      </motion.div>
    ))
  }

  // Handle clear search and filter
  const handleClearSearch = () => {
    setSearchQuery('');
    if (onSearch) {
      onSearch('');
    }
    setHasSearched(false);
    // Provide haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  return (
    <div className={cn("flex flex-col w-full", className)}>
      {/* Enhanced header with animations */}
      <motion.div 
        className="flex flex-wrap gap-3 justify-between items-center mb-6"
        layout
      >
        {/* Replace search input with enhanced version */}
        <div className="flex-grow max-w-md">
          <EnhancedSearchInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={handleClearSearch}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            ref={searchInputRef}
            isSearchFocused={searchFocused}
          />
        </div>
        
        <div className="flex items-center gap-2">
          {/* Replace filter button with enhanced version */}
          <FilterButton 
            onClick={() => setFiltersVisible(!filtersVisible)}
            isOpen={filtersVisible}
            count={activeFilterCount}
          />
          
          {/* Sort dropdown with animation */}
          <Popover>
            <PopoverTrigger asChild>
              <motion.button
                className="flex h-10 items-center gap-1.5 rounded-md border px-3 font-medium bg-white text-gray-700 hover:bg-gray-50"
                whileTap={{ scale: 0.97 }}
              >
                <Sliders className="h-4 w-4" />
                <span className="sr-only sm:not-sr-only">Sort</span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </motion.button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-0" align="end">
              <div className="p-2">
                <div className="mb-2 font-medium text-sm text-gray-500">Sort by</div>
                <div className="grid gap-1">
                  <button
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-left",
                      sortBy === 'newest' ? "bg-gray-100 font-medium" : "hover:bg-gray-50"
                    )}
                    onClick={() => setSortBy('newest')}
                  >
                    <Clock className="h-4 w-4" />
                    Newest
                  </button>
                  <button
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-left",
                      sortBy === 'popular' ? "bg-gray-100 font-medium" : "hover:bg-gray-50"
                    )}
                    onClick={() => setSortBy('popular')}
                  >
                    <TrendingUp className="h-4 w-4" />
                    Most Popular
                  </button>
                  <button
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-left",
                      sortBy === 'alphabetical' ? "bg-gray-100 font-medium" : "hover:bg-gray-50"
                    )}
                    onClick={() => setSortBy('alphabetical')}
                  >
                    <ArrowRight className="h-4 w-4" />
                    Alphabetical
                  </button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          {/* View mode toggle with enhanced version */}
          <ViewModeButtons viewMode={viewMode} setViewMode={setViewMode} />
        </div>
      </motion.div>
      
      {/* Enhanced filter section with smooth animations */}
      <AnimatePresence>
        {filtersVisible && (
          <motion.div
            className="mb-6 bg-white border rounded-lg p-4 shadow-sm"
            initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
            animate={{ opacity: 1, height: 'auto', overflow: 'visible' }}
            exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <h3 className="font-medium">Filters</h3>
                {activeFilterCount > 0 && (
                  <button 
                    onClick={clearFilters}
                    className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1.5"
                  >
                    <X className="h-3.5 w-3.5" />
                    Clear all
                  </button>
                )}
              </div>
              
              <Tabs defaultValue="industry" className="w-full max-w-md" onValueChange={(value) => setActiveFilterTab(value as any)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="industry" className="text-xs">
                    Industry
                    {activeFilters.industries.length > 0 && (
                      <Badge className="ml-1.5 h-5 w-5 p-0 flex items-center justify-center bg-primary/20 text-primary font-medium text-xs">
                        {activeFilters.industries.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="duration" className="text-xs">
                    Duration
                    {activeFilters.durations.length > 0 && (
                      <Badge className="ml-1.5 h-5 w-5 p-0 flex items-center justify-center bg-primary/20 text-primary font-medium text-xs">
                        {activeFilters.durations.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="category" className="text-xs">
                    Category
                    {activeFilters.categories.length > 0 && (
                      <Badge className="ml-1.5 h-5 w-5 p-0 flex items-center justify-center bg-primary/20 text-primary font-medium text-xs">
                        {activeFilters.categories.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
                
                <div className="mt-4">
                  <TabsContent value="industry">
                    <ScrollArea className="h-64 rounded-md border">
                      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {industries.map((industry) => (
                          <div key={industry} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`industry-${industry}`} 
                              checked={activeFilters.industries.includes(industry)}
                              onChange={(e) => handleIndustryChange(e.target.checked, industry)}
                              className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                            />
                            <Label 
                              htmlFor={`industry-${industry}`}
                              className="text-sm cursor-pointer"
                            >
                              {industry}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                  
                  <TabsContent value="duration">
                    <ScrollArea className="h-64 rounded-md border">
                      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {durations.map((duration) => (
                          <div key={duration} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`duration-${duration}`} 
                              checked={activeFilters.durations.includes(duration)}
                              onChange={(e) => handleDurationChange(e.target.checked, duration)}
                              className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                            />
                            <Label 
                              htmlFor={`duration-${duration}`}
                              className="text-sm cursor-pointer"
                            >
                              {duration}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                  
                  <TabsContent value="category">
                    <ScrollArea className="h-64 rounded-md border">
                      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {categories.map((category) => (
                          <div key={category} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`category-${category}`} 
                              checked={activeFilters.categories.includes(category)}
                              onChange={(e) => handleCategoryChange(e.target.checked, category)}
                              className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                            />
                            <Label 
                              htmlFor={`category-${category}`}
                              className="text-sm cursor-pointer"
                            >
                              {category}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </div>
              </Tabs>
            </div>
            
            {/* Active filter tags with animation */}
            <AnimatePresence>
              {activeFilterCount > 0 && (
                <motion.div 
                  className="flex flex-wrap gap-2 mt-2"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  {activeFilters.industries.map(industry => (
                    <motion.div
                      key={`tag-${industry}`}
                      initial={{ opacity: 0, scale: 0.8, x: -5 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.8, x: -5 }}
                      transition={{ type: "spring", damping: 20 }}
                    >
                      <Badge 
                        variant="secondary" 
                        className="flex items-center gap-1 px-2 py-1"
                      >
                        {industry}
                        <button 
                          className="ml-1 h-4 w-4 rounded-full inline-flex items-center justify-center hover:bg-gray-200"
                          onClick={() => handleIndustryChange(false, industry)}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    </motion.div>
                  ))}
                  
                  {activeFilters.durations.map(duration => (
                    <motion.div
                      key={`tag-${duration}`}
                      initial={{ opacity: 0, scale: 0.8, x: -5 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.8, x: -5 }}
                      transition={{ type: "spring", damping: 20 }}
                    >
                      <Badge 
                        variant="secondary" 
                        className="flex items-center gap-1 px-2 py-1"
                      >
                        {duration}
                        <button 
                          className="ml-1 h-4 w-4 rounded-full inline-flex items-center justify-center hover:bg-gray-200"
                          onClick={() => handleDurationChange(false, duration)}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    </motion.div>
                  ))}
                  
                  {activeFilters.categories.map(category => (
                    <motion.div
                      key={`tag-${category}`}
                      initial={{ opacity: 0, scale: 0.8, x: -5 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.8, x: -5 }}
                      transition={{ type: "spring", damping: 20 }}
                    >
                      <Badge 
                        variant="secondary" 
                        className="flex items-center gap-1 px-2 py-1"
                      >
                        {category}
                        <button 
                          className="ml-1 h-4 w-4 rounded-full inline-flex items-center justify-center hover:bg-gray-200"
                          onClick={() => handleCategoryChange(false, category)}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Template grid with staggered loading animation */}
      {sortedTemplates.length > 0 ? (
        <div 
          className={cn(
            "grid gap-6",
            viewMode === 'grid' 
              ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4" 
              : "grid-cols-1"
          )}
        >
          {sortedTemplates.map((template, index) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.3, 
                delay: Math.min(index * 0.05, 0.5), // Cap the maximum delay
                ease: "easeOut",
              }}
            >
              <TemplateCard
                template={template}
                isSelected={template.id === selectedTemplateId}
                onClick={() => onSelectTemplate(template.id)}
                viewMode={viewMode}
              />
            </motion.div>
          ))}
        </div>
      ) : (
        !isLoading && <EmptyState query={searchQuery} clearFilters={clearFilters} />
      )}
      
      {/* Improved loading state with skeleton cards */}
      {isLoading && (
        <div 
          className={cn(
            "grid gap-6",
            viewMode === 'grid' 
              ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4" 
              : "grid-cols-1"
          )}
        >
          {[...Array(8)].map((_, index) => (
            <motion.div
              key={`skeleton-${index}`}
              className="h-[280px] rounded-lg overflow-hidden border bg-gray-50"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.3, 
                delay: Math.min(index * 0.05, 0.5), // Cap the maximum delay
              }}
            >
              <div className="h-44 w-full bg-gray-200 animate-pulse" />
              <div className="p-4">
                <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse mb-4" />
                <div className="flex gap-2">
                  <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
                  <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      
      {/* Infinite scroll trigger */}
      {hasMore && !isLoading && (
        <div 
          ref={observerRef} 
          className="py-8 flex justify-center"
        >
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          >
            <div className="h-10 w-10 rounded-full border-2 border-gray-300 border-t-primary animate-spin" />
          </motion.div>
        </div>
      )}
    </div>
  );
} 