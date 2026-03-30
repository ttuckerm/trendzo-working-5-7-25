'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useStarterSurfaceCheck } from '@/workflow/useStarterSurfaceCheck';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Eye, Heart, Share, Play, Flame, Music, Sparkles, Loader2, ArrowUpRight } from 'lucide-react';
import { useMemo, useCallback } from 'react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { isStarterPackEnabled } from '@/config/flags';
import { isStudioViralWorkflow } from '@/workflow/routeGuards';
import { selectStarterTemplates } from '@/workflow/starterSelect';
import { useWorkflowStore as useWorkflowStoreNew } from '@/lib/state/workflowStore';
import { useWorkflowStore as useWorkflowStoreOld } from '@/workflow/workflowStore';
import { applyStarterParam } from '@/workflow/url';
import VideoCard from '@/components/common/VideoCard';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Helper to format large numbers
function formatNumber(num: number | null | undefined): string {
  if (!num) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

// Helper to calculate engagement score from video metrics
function calculateEngagementScore(video: any): number {
  const views = video.views_count || 0;
  const likes = video.likes_count || 0;
  const comments = video.comments_count || 0;
  const shares = video.shares_count || 0;
  
  if (views === 0) return 0;
  
  const engagementRate = ((likes + comments + shares) / views) * 100;
  const viewScore = Math.min(40, Math.log10(Math.max(1, views)) * 5);
  const engagementScore = Math.min(40, engagementRate * 4);
  const viralityBonus = shares > 1000 ? 10 : shares > 100 ? 5 : 0;
  
  return Math.min(100, viewScore + engagementScore + viralityBonus + 10);
}

interface GalleryPhaseProps {
  selectedNiche: string;
  onTemplateSelect: (template: Template) => void;
  hoveredTemplate: string | null;
  onTemplateHover: (templateId: string | null) => void;
}

interface Template {
  id: string;
  title: string;
  category: string;
  views: string;
  likes: string;
  shares: string;
  viralScore: number;
  description: string;
  trendingSound: string;
  backgroundGradient: string;
  previewImage: string;
  previewVideo?: string;
  hoverFrames?: string[];
  creator: string;
  platform: string;
  duration: string;
}

const NICHE_CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'personal-finance', label: 'Personal Finance/Investing' },
  { key: 'fitness', label: 'Fitness/Weight Loss' },
  { key: 'business', label: 'Business/Entrepreneurship' },
  { key: 'food', label: 'Food/Nutrition Comparisons' },
  { key: 'beauty', label: 'Beauty/Skincare' },
  { key: 'real-estate', label: 'Real Estate/Property' },
  { key: 'self-improvement', label: 'Self-Improvement/Productivity' },
  { key: 'dating', label: 'Dating/Relationships' },
  { key: 'education', label: 'Education/Study Tips' },
  { key: 'career', label: 'Career/Job Advice' },
  { key: 'parenting', label: 'Parenting/Family' },
  { key: 'tech', label: 'Tech Reviews/Tutorials' },
  { key: 'fashion', label: 'Fashion/Style' },
  { key: 'health', label: 'Health/Medical Education' },
  { key: 'cooking', label: 'Cooking/Recipes' },
  { key: 'psychology', label: 'Psychology/Mental Health' },
  { key: 'travel', label: 'Travel/Lifestyle' },
  { key: 'diy', label: 'DIY/Home Improvement' },
  { key: 'language', label: 'Language Learning' },
  { key: 'side-hustles', label: 'Side Hustles/Making Money Online' }
];

// REMOVED: Hardcoded TEMPLATES_BY_NICHE - Now fetching from database
// Real templates are fetched in the component via fetchRealTemplates()

// Helper function to get niche key from display name
const getNicheKey = (nicheName: string): string => {
  const nicheMap: Record<string, string> = {
    'Personal Finance/Investing': 'personal-finance',
    'Fitness/Weight Loss': 'fitness',
    'Business/Entrepreneurship': 'business',
    'Food/Nutrition Comparisons': 'food',
    'Beauty/Skincare': 'beauty',
    'Real Estate/Property': 'real-estate',
    'Self-Improvement/Productivity': 'self-improvement',
    'Dating/Relationships': 'dating',
    'Education/Study Tips': 'education',
    'Career/Job Advice': 'career',
    'Parenting/Family': 'parenting',
    'Tech Reviews/Tutorials': 'tech',
    'Fashion/Style': 'fashion',
    'Health/Medical Education': 'health',
    'Cooking/Recipes': 'cooking',
    'Psychology/Mental Health': 'psychology',
    'Travel/Lifestyle': 'travel',
    'DIY/Home Improvement': 'diy',
    'Language Learning': 'language',
    'Side Hustles/Making Money Online': 'side-hustles'
  };
  return nicheMap[nicheName] || 'all';
};

// Preview component for individual template cards
interface PreviewComponentProps {
  template: Template;
  isHovered: boolean;
  onResolve?: (id: string) => void;
}

function PreviewComponent({ template, isHovered, resolvedThumbnail, onResolve }: PreviewComponentProps & { resolvedThumbnail?: string }) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (isHovered && template.hoverFrames && template.hoverFrames.length > 1) {
      setIsLoading(true);
      const interval = setInterval(() => {
        setCurrentFrame(prev => (prev + 1) % template.hoverFrames!.length);
      }, 600); // Change frame every 600ms
      
      // Stop loading after first cycle
      const loadingTimeout = setTimeout(() => setIsLoading(false), 600);
      
      return () => {
        clearInterval(interval);
        clearTimeout(loadingTimeout);
      };
    } else {
      setCurrentFrame(0);
      setIsLoading(false);
    }
  }, [isHovered, template.hoverFrames]);

  // Priority: resolved thumbnail > template thumbnail > hover frame > default
  const thumbnailSrc = resolvedThumbnail || template.previewImage;
  const currentImage = isHovered && template.hoverFrames && template.hoverFrames.length > 0
    ? (resolvedThumbnail || template.hoverFrames[currentFrame])
    : thumbnailSrc;

  // Fallback gradient background (used when image fails to load)
  const fallbackGradient = template.backgroundGradient || 'linear-gradient(135deg, #7b61ff 0%, #ff61a6 100%)';

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Main Image with Error Handling */}
      {!imageError ? (
        <img 
          src={currentImage}
          alt={template.title}
          className={`w-full h-full object-cover transition-all duration-300 ${
            isHovered ? 'scale-105' : 'scale-100'
          }`}
          onError={(e) => {
            console.log(`Image failed to load for ${template.id}, using gradient fallback`);
            setImageError(true);
            if (onResolve) {
               console.log(`Triggering force resolve for ${template.id}`);
               onResolve(template.id);
            }
          }}
          loading="lazy"
        />
      ) : (
        <div 
          className={`w-full h-full flex items-center justify-center transition-all duration-300 ${
            isHovered ? 'scale-105' : 'scale-100'
          }`}
          style={{ background: fallbackGradient }}
        >
          <div className="text-center p-4">
            <div className="text-4xl mb-2">🎬</div>
            <span className="text-white/80 text-sm font-medium line-clamp-2">{template.title}</span>
          </div>
        </div>
      )}
      
      {/* Video Preview (if available) */}
      {isHovered && template.previewVideo && (
        <video 
          className="absolute inset-0 w-full h-full object-cover opacity-80"
          autoPlay 
          muted 
          loop
          playsInline
          onError={() => {
            // Fallback to frame animation if video fails
            console.log('Video failed to load, using frame animation');
          }}
        >
          <source src={template.previewVideo} type="video/mp4" />
        </video>
      )}

      {/* Loading indicator for frame transitions */}
      {isLoading && (
        <div className="absolute top-4 left-4 w-2 h-2 bg-[#7b61ff] rounded-full animate-pulse" />
      )}

      {/* Play button overlay */}
      <div className={`absolute inset-0 flex items-center justify-center bg-black/20 transition-all duration-300 ${
        isHovered ? 'bg-black/10' : 'bg-black/20'
      }`}>
        <div className={`w-16 h-16 bg-white/20 backdrop-blur-[10px] border border-white/30 rounded-full flex items-center justify-center transition-transform duration-300 ${
          isHovered ? 'scale-110' : 'scale-100'
        }`}>
          <Play className="w-6 h-6 text-white ml-0.5" fill="currentColor" />
        </div>
      </div>
    </div>
  );
}

export default function GalleryPhase({ selectedNiche, onTemplateSelect, hoveredTemplate, onTemplateHover, isEmbedded = false }: GalleryPhaseProps & { isEmbedded?: boolean }) {
  // Lock: this container should mount only for Studio > Viral Workflow
  useStarterSurfaceCheck(() => 'viral-workflow');
  const pathname = usePathname();
  const router = useRouter();
  const params = useSearchParams();
  const starterFlag = isStarterPackEnabled();
  const envVal = String(process.env.NEXT_PUBLIC_LIVE_STARTER_PACK_PATH || '').toLowerCase();
  const envOn = envVal === '1' || envVal === 'true' || envVal === 'on';
  // Option 1: hard-disable Starter UI now while keeping build intact
  const forceHideStarterUI = true;
  const devDefaultOn = false;
  const featureEnabled = (starterFlag || devDefaultOn) && !forceHideStarterUI;
  // Dev-only: allow direct mount under /admin/viral-studio to avoid flicker during development
  const devSurface = process.env.NODE_ENV !== 'production' && String(pathname || '').startsWith('/admin/viral-studio');
  // Stabilize surface guard to avoid flash-then-hide: compute once and never toggle off in-session
  const [isSurface, setIsSurface] = useState<boolean>(false);
  useEffect(() => {
    if (!featureEnabled) return;
    const ok = isStudioViralWorkflow(pathname || '', 'viral-workflow') || devSurface;
    if (ok) setIsSurface(true);
  }, [featureEnabled, pathname, devSurface]);
  const showStarterUI = featureEnabled && isSurface;

  // Prefer new store; fall back to old workflow store for script page compatibility
  const { niche, goal, starterEnabled, starterTemplates, setStarterTemplates, setTemplateId, setStarterEnabled } = useWorkflowStoreNew();
  const oldStore = useWorkflowStoreOld as any;
  const effectiveNiche = selectedNiche || niche || '';
  const effectiveGoal = goal || '';
  const initialCategory = getNicheKey(effectiveNiche || '');
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [currentTemplates, setCurrentTemplates] = useState<Template[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // State for resolved thumbnails (lazy loaded via oembed)
  const [resolvedThumbnails, setResolvedThumbnails] = useState<Record<string, string>>({});
  
  // Lazy load thumbnail via oembed API
  const resolveThumbnail = async (videoId: string, force = false) => {
    // Don't re-resolve if we already have it AND not forcing
    if (resolvedThumbnails[videoId] && !force) return;
    
    try {
      const response = await fetch(`/api/thumbnails/resolve?video_id=${videoId}&force=${force}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.thumbnail_url) {
          setResolvedThumbnails(prev => ({
            ...prev,
            [videoId]: data.thumbnail_url
          }));
          // Reset error state if forcing? (Not easily accessible here without state lift, but new URL will trigger re-render)
        }
      }
    } catch (err) {
      console.log(`Failed to resolve thumbnail for ${videoId}:`, err);
    }
  };
  
  // Fetch REAL templates from database
  const fetchRealTemplates = async (category: string) => {
    setIsLoadingTemplates(true);
    setLoadError(null);
    
    try {
      let query = supabase
        .from('scraped_videos')
        .select('video_id, title, creator_username, views_count, likes_count, comments_count, shares_count, dps_score, thumbnail_url, tiktok_id, duration_seconds, caption, url')
        .gte('views_count', 10000) // Only videos with 10k+ views
        .order('views_count', { ascending: false })
        .limit(24);

      // Note: scraped_videos doesn't have a 'niche' column, so we filter by title keywords
      // In the future, we should add niche classification to the scraping pipeline
      if (category !== 'all') {
        const nicheKeywords: Record<string, string[]> = {
          'personal-finance': ['money', 'invest', 'finance', 'savings', 'debt', 'budget', 'wealth', 'income', 'rich', 'stock'],
          'fitness': ['workout', 'fitness', 'gym', 'exercise', 'health', 'weight', 'muscle', 'training'],
          'business': ['business', 'entrepreneur', 'startup', 'company', 'CEO', 'success', 'hustle'],
          'food': ['recipe', 'cook', 'food', 'eat', 'meal', 'kitchen', 'chef'],
          'beauty': ['makeup', 'skincare', 'beauty', 'hair', 'glow', 'skin'],
          'real-estate': ['house', 'property', 'real estate', 'mortgage', 'home'],
          'tech': ['tech', 'app', 'software', 'code', 'AI', 'gadget'],
          'career': ['career', 'job', 'work', 'interview', 'resume', 'salary'],
        };
        
        const keywords = nicheKeywords[category] || [];
        if (keywords.length > 0) {
          // Use ilike for case-insensitive search on title
          const searchPattern = keywords.map(k => `title.ilike.%${k}%`).join(',');
          query = query.or(searchPattern);
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching templates:', error);
        setLoadError('Failed to load templates from database');
        setCurrentTemplates([]);
        return;
      }

      if (!data || data.length === 0) {
        console.log('No templates found for category:', category);
        setCurrentTemplates([]);
        return;
      }

      // Collect video IDs that need thumbnail resolution
      const needThumbnailResolution: string[] = [];

      // Transform database records to Template format
      const templates: Template[] = data.map((video, index) => {
        const vps = video.dps_score ? parseFloat(video.dps_score) : calculateEngagementScore(video);
        const videoId = video.video_id || `video-${index}`;
        
        // Check if we need to resolve thumbnail
        const hasThumbnail = video.thumbnail_url && 
          !video.thumbnail_url.includes('/oembed?') && 
          !video.thumbnail_url.includes('placeholder');
        
        if (!hasThumbnail) {
          needThumbnailResolution.push(videoId);
        }
        
        const videoTitle = video.title || video.caption || 'Untitled Video';
        
        return {
          id: videoId,
          title: videoTitle,
          category: category,
          views: formatNumber(video.views_count),
          likes: formatNumber(video.likes_count),
          shares: formatNumber(video.shares_count),
          viralScore: Math.round(vps * 10) / 10,
          description: video.caption || 'Real viral video from TikTok',
          trendingSound: `VPS: ${vps.toFixed(1)} - Real Performance Data`,
          backgroundGradient: getGradientForCategory(category),
          previewImage: hasThumbnail ? video.thumbnail_url : getDefaultThumbnail(category, videoTitle),
          previewVideo: undefined,
          hoverFrames: hasThumbnail ? [video.thumbnail_url] : undefined,
          creator: video.creator_username || 'Unknown Creator',
          platform: 'TIKTOK',
          duration: video.duration_seconds ? `${video.duration_seconds}s` : '30s'
        };
      });

      console.log(`✅ Loaded ${templates.length} REAL templates for category: ${category}`);
      console.log(`📷 ${needThumbnailResolution.length} videos need thumbnail resolution`);
      
      setCurrentTemplates(templates);
      
      // Lazy resolve thumbnails in background (batch of 5 at a time)
      if (needThumbnailResolution.length > 0) {
        // Resolve first 5 immediately for visible templates
        for (const videoId of needThumbnailResolution.slice(0, 5)) {
          resolveThumbnail(videoId);
        }
        
        // Resolve rest with delay to avoid rate limiting
        setTimeout(() => {
          for (const videoId of needThumbnailResolution.slice(5)) {
            setTimeout(() => resolveThumbnail(videoId), 500);
          }
        }, 1000);
      }
    } catch (err) {
      console.error('Error in fetchRealTemplates:', err);
      setLoadError('Failed to fetch templates');
      setCurrentTemplates([]);
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  // Helper function to get gradient based on category
  const getGradientForCategory = (category: string): string => {
    const gradients: Record<string, string> = {
      'personal-finance': 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
      'fitness': 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
      'business': 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
      'food': 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)',
      'beauty': 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
      'real-estate': 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
      'tech': 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
      'career': 'linear-gradient(135deg, #059669 0%, #34d399 100%)',
    };
    return gradients[category] || 'linear-gradient(135deg, #7b61ff 0%, #ff61a6 100%)';
  };

  // Helper function to get default thumbnail placeholder
  const getDefaultThumbnail = (category: string, title?: string): string => {
    const params = new URLSearchParams();
    params.set('category', category);
    if (title) params.set('title', title);
    return `/api/placeholder-thumbnail?${params.toString()}`;
  };

  // Update templates when category changes - NOW FETCHES FROM DATABASE
  useEffect(() => {
    fetchRealTemplates(activeCategory);
  }, [activeCategory]);

  // Compute up to 3 HOT IDs based on current grid templates
  const starterIds = useMemo(() => selectStarterTemplates(currentTemplates.map((t) => ({
    id: t.id,
    niche: effectiveNiche,
    goal: effectiveGoal,
    successScore: Number(String(t.views).replace(/[^0-9.]/g, '')) || 0,
    delta7d: Number(String(t.likes).replace(/[^0-9.]/g, '')) || 0,
  })), effectiveNiche, effectiveGoal), [currentTemplates, effectiveNiche, effectiveGoal]);

  // If URL has ?starter=on but store is empty, compute and set on mount
  useEffect(() => {
    try {
      const starterOn = (params?.get('starter') || '').toLowerCase() === 'on'
      const haveIds = Array.isArray(starterTemplates) && (starterTemplates as any[]).length > 0
      if (showStarterUI && starterOn && !haveIds) {
        setStarterEnabled(true)
        setStarterTemplates(starterIds.map((id) => ({ id })) as any)
        try { oldStore.getState().enableStarter?.(true) } catch {}
        try { oldStore.getState().setStarterTemplates?.(starterIds) } catch {}
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showStarterUI, params, starterIds])

  const onToggleStarter = useCallback((on: boolean) => {
    if (!effectiveNiche || !effectiveGoal) return;
    setStarterEnabled(on);
    try { oldStore.getState().enableStarter?.(on); } catch {}
    if (on) {
      setStarterTemplates(starterIds.map((id) => ({ id })) as any);
      try { oldStore.getState().setStarterTemplates?.(starterIds); } catch {}
    } else {
      setStarterTemplates([] as any);
      try { oldStore.getState().setStarterTemplates?.([]); } catch {}
    }
    const nextUrl = applyStarterParam(`${pathname}${params ? `?${params.toString()}` : ''}`, on);
    router.push(nextUrl);
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.debug('starter_pack.toggled', { on, niche: effectiveNiche, goal: effectiveGoal });
    }
  }, [effectiveNiche, effectiveGoal, setStarterEnabled, setStarterTemplates, starterIds, pathname, params, router]);

  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.debug('[starter] surface', { isSurface, niche: effectiveNiche, goal: effectiveGoal, starterEnabled, starterTemplatesCount: (starterTemplates||[]).length });
    // eslint-disable-next-line no-console
    console.debug('[starter] gallery-phase mounted', { tab: 'viral-workflow' });
  }

  // Get template count for the active category
  const getTemplateCount = () => {
    const count = currentTemplates.length;
    const categoryLabel = NICHE_CATEGORIES.find(cat => cat.key === activeCategory)?.label || 'All';
    return `${count} ${categoryLabel} Templates Available`;
  };

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  const handleTemplateSelect = (template: Template) => {
    onTemplateSelect(template);
  };

  return (
    <div
      className={isEmbedded ? "w-full h-full" : "min-h-screen bg-black"}
    >
      {/* Header */}
      {!isEmbedded && (
        <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black to-transparent backdrop-blur-[20px] px-10 py-6">
          <div className="max-w-[1400px] mx-auto">
            {/* Header Content */}
            <div className="flex items-center justify-between mb-2">
              <motion.div 
                className="text-[28px] font-bold bg-gradient-to-r from-[#7b61ff] to-[#ff61a6] bg-clip-text text-transparent"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                Viral DNA™
              </motion.div>
              <div className="flex items-center gap-4">
                <motion.div 
                  className="flex items-center gap-2 px-5 py-2 bg-white/[0.05] border border-white/10 rounded-full text-sm backdrop-blur-[10px]"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="w-2 h-2 bg-[#ff4458] rounded-full animate-pulse" />
                  <span>{getTemplateCount()}</span>
                </motion.div>
                {showStarterUI && (
                  <TooltipProvider>
                    <div className="flex items-center gap-2" data-testid="starter-chip">
                      <span className="text-sm text-white/70">Starter Pack</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            <Switch
                              checked={!!starterEnabled}
                              onCheckedChange={(v) => onToggleStarter(Boolean(v))}
                              disabled={!effectiveNiche || !effectiveGoal}
                              aria-label="Starter Pack"
                              aria-pressed={!!starterEnabled}
                            />
                          </span>
                        </TooltipTrigger>
                        {(!effectiveNiche || !effectiveGoal) && (
                          <TooltipContent>Pick niche & goal first.</TooltipContent>
                        )}
                      </Tooltip>
                    </div>
                  </TooltipProvider>
                )}
              </div>
            </div>

            {showStarterUI && starterEnabled && (
              <div className="mb-3" data-testid="starter-helper">
                <span className="text-sm text-white/70">Hand-picked for your {effectiveNiche || 'niche'} + {effectiveGoal || 'goal'}. Start with one of these three HOT templates.</span>
              </div>
            )}

            {/* Category Navigation */}
            <motion.div 
              className="relative"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="relative overflow-hidden rounded-2xl bg-white/[0.02] border border-white/[0.05] backdrop-blur-[10px]">
                {/* Scroll Arrows */}
                <button
                  onClick={scrollLeft}
                  className="absolute top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-black/90 border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-[#7b61ff]/60 hover:border-[#7b61ff]/50 hover:scale-110 transition-all duration-300 backdrop-blur-[10px]"
                  style={{ left: '-8px' }}
                >
                  <ChevronLeft className="w-3 h-3" />
                </button>
                
                <button
                  onClick={scrollRight}
                  className="absolute top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-black/90 border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-[#7b61ff]/60 hover:border-[#7b61ff]/50 hover:scale-110 transition-all duration-300 backdrop-blur-[10px]"
                  style={{ right: '-8px' }}
                >
                  <ChevronRight className="w-3 h-3" />
                </button>

                {/* Category Scroll */}
                <div
                  ref={scrollRef}
                  className="flex overflow-x-auto scrollbar-hide p-2 gap-2 scroll-smooth"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {NICHE_CATEGORIES.map((category) => (
                    <button
                      key={category.key}
                      onClick={() => setActiveCategory(category.key)}
                      className={`flex-shrink-0 px-5 py-3 rounded-3xl text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                        activeCategory === category.key
                          ? 'bg-gradient-to-r from-[#7b61ff] to-[#ff61a6] text-white font-semibold transform -translate-y-0.5 shadow-[0_8px_20px_rgba(123,97,255,0.4)]'
                          : 'bg-white/[0.05] border border-white/10 text-white/80 hover:bg-white/[0.1] hover:text-white hover:-translate-y-0.5'
                      }`}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </header>
      )}

      {/* Template Feed */}
      <main className={isEmbedded ? "pb-10" : "pt-[160px] px-10 pb-10"}>
        {isEmbedded && (
          <div className="mb-8">
            {/* Embedded Header/Nav */}
            <div className="flex items-center justify-between mb-6">
              <div className="text-[28px] font-bold bg-gradient-to-r from-[#7b61ff] to-[#ff61a6] bg-clip-text text-transparent">
                Viral DNA™
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-5 py-2 bg-white/[0.05] border border-white/10 rounded-full text-sm backdrop-blur-[10px]">
                  <div className="w-2 h-2 bg-[#ff4458] rounded-full animate-pulse" />
                  <span>{getTemplateCount()}</span>
                </div>
              </div>
            </div>

            {/* Embedded Category Nav */}
            <div className="relative overflow-hidden rounded-2xl bg-white/[0.02] border border-white/[0.05] backdrop-blur-[10px]">
              <button
                onClick={scrollLeft}
                className="absolute top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-black/90 border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-[#7b61ff]/60 hover:border-[#7b61ff]/50 hover:scale-110 transition-all duration-300 backdrop-blur-[10px]"
                style={{ left: '-8px' }}
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              
              <button
                onClick={scrollRight}
                className="absolute top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-black/90 border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-[#7b61ff]/60 hover:border-[#7b61ff]/50 hover:scale-110 transition-all duration-300 backdrop-blur-[10px]"
                style={{ right: '-8px' }}
              >
                <ChevronRight className="w-3 h-3" />
              </button>

              <style>{`
                @keyframes rainbowSpin {
                  0%   { background-position: 0% 50%; }
                  50%  { background-position: 100% 50%; }
                  100% { background-position: 0% 50%; }
                }
                .rainbow-wrapper {
                  background: linear-gradient(45deg, #fb0094, #0000ff, #00ff00, #ffff00, #ff0000, #fb0094, #0000ff, #00ff00, #ffff00, #ff0000);
                  background-size: 400% 400%;
                  animation: rainbowSpin 6s linear infinite;
                  padding: 2px;
                  border-radius: 9999px;
                }
                .rainbow-wrapper.active {
                  animation-duration: 2s;
                  padding: 2.5px;
                }
                .rainbow-wrapper.active::after {
                  content: '';
                  position: absolute;
                  inset: -4px;
                  border-radius: 9999px;
                  background: inherit;
                  background-size: 400% 400%;
                  animation: rainbowSpin 2s linear infinite;
                  filter: blur(12px);
                  opacity: 0.7;
                  z-index: -1;
                }
                .rainbow-inner {
                  background: #0a0a0a;
                  border-radius: 9999px;
                  width: 100%;
                  height: 100%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  padding: 10px 20px;
                  font-size: 14px;
                  font-weight: 600;
                  color: white;
                  white-space: nowrap;
                  cursor: pointer;
                  transition: background 0.3s;
                }
                .rainbow-wrapper.active .rainbow-inner {
                  background: #111;
                }
                .rainbow-wrapper:hover .rainbow-inner {
                  background: #1a1a1a;
                }
              `}</style>
              <div
                ref={scrollRef}
                className="flex overflow-x-auto scrollbar-hide p-2 gap-2 scroll-smooth"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {NICHE_CATEGORIES.map((category) => {
                  const isActive = activeCategory === category.key;
                  return (
                    <div
                      key={category.key}
                      className={`rainbow-wrapper relative flex-shrink-0 ${isActive ? 'active' : ''}`}
                      onClick={() => setActiveCategory(category.key)}
                      style={{ position: 'relative' }}
                    >
                      <div className="rainbow-inner">
                        {category.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        <div className="max-w-[1400px] mx-auto">
          {/* Start Quick Win button placed between filters and gallery grid (red box position) */}
          <div className="flex items-center justify-center mb-6">
            <button
              onClick={() => router.push('/admin/workflows/quick-win')}
              className="px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-[#e50914] to-[#ff1744] shadow-[0_8px_32px_rgba(229,9,20,0.4)] transition-all border border-white/10 hover:-translate-y-0.5"
              title="start your quick win"
            >
              start your quick win
            </button>
          </div>
          {isLoadingTemplates ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 text-[#7b61ff] animate-spin mb-4" />
              <p className="text-white/60">Loading real viral videos from database...</p>
            </div>
          ) : loadError ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-2xl font-semibold text-white mb-4">Error Loading Templates</h3>
              <p className="text-white/60 mb-4">{loadError}</p>
              <button
                onClick={() => fetchRealTemplates(activeCategory)}
                className="px-8 py-3 bg-gradient-to-r from-[#7b61ff] to-[#ff61a6] text-white font-semibold rounded-2xl"
              >
                Retry
              </button>
            </div>
          ) : currentTemplates.length > 0 ? (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
              style={{ gap: '48px', paddingLeft: '40px' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              {currentTemplates.map((template, index) => {
                const isHovered = hoveredTemplate === template.id;
                const storeStarterIds = Array.isArray(starterTemplates)
                  ? (starterTemplates as any[]).map((t) => (typeof t === 'string' ? t : String((t as any).id)))
                  : [];
                const showRibbon = !!starterEnabled && storeStarterIds.includes(template.id) && showStarterUI;
                
                return (
                  <motion.div
                    key={template.id}
                    className="template-card group"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    onMouseEnter={() => onTemplateHover(template.id)}
                    onMouseLeave={() => onTemplateHover(null)}
                  >
                    <div className="tc-wrapper relative">
                      {showRibbon && (
                        <div
                          className="absolute top-3 left-3 z-20"
                          data-testid={`starter-ribbon-${template.id}`}
                          aria-label="Starter Pack"
                          onClick={() => {
                            setStarterEnabled(true);
                            setStarterTemplates(starterIds.map((id) => ({ id })) as any);
                            setTemplateId(template.id);
                            // legacy store for script page consumers
                            try { oldStore.getState().enableStarter?.(true); } catch {}
                            try { oldStore.getState().setStarterTemplates?.(starterIds); } catch {}
                            try { oldStore.getState().selectTemplate?.(template.id); } catch {}
                            if (process.env.NODE_ENV !== 'production') {
                              // eslint-disable-next-line no-console
                              console.debug('starter_pack.card_selected', { templateId: template.id });
                            }
                            router.push('/admin/studio/script?starter=on');
                          }}
                        >
                          <Badge variant="secondary">STARTER PACK</Badge>
                        </div>
                      )}
                      {/* Video Preview */}
                      <div className="relative h-[350px] overflow-hidden">
                        <PreviewComponent 
                          template={template} 
                          isHovered={isHovered} 
                          resolvedThumbnail={resolvedThumbnails[template.id]}
                          onResolve={(id) => resolveThumbnail(id, true)}
                        />

                        {/* Viral DNA Indicator */}
                        <div className="absolute top-4 right-4 flex gap-1 z-10">
                          {[0, 1, 2].map((i) => (
                            <div
                              key={i}
                              className="w-2 h-2 bg-gradient-to-r from-[#7b61ff] to-[#ff61a6] rounded-full animate-pulse"
                              style={{ animationDelay: `${i * 0.2}s` }}
                            />
                          ))}
                        </div>

                        {/* Hover Preview Indicator */}
                        {isHovered && template.hoverFrames && template.hoverFrames.length > 1 && (
                          <div className="absolute top-4 left-4 z-10 flex items-center gap-1 px-2 py-1 bg-black/60 rounded-full text-xs text-white font-medium">
                            <div className="w-1.5 h-1.5 bg-[#7b61ff] rounded-full animate-pulse" />
                            Preview
                          </div>
                        )}

                        {/* Metrics Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-4 z-10">
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Eye className="w-4 h-4 text-blue-400" />
                              <span className="font-medium bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                                {template.views}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Heart className="w-4 h-4 text-pink-400" />
                              <span className="font-medium bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">
                                {template.likes}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Flame className="w-4 h-4 text-orange-400" />
                              <span className="font-medium bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
                                {template.viralScore}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                    {/* Template Info */}
                    <div className="p-6">
                      {/* Title + Arrow */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <h3 className="text-lg font-semibold text-white leading-tight">
                          {template.title}
                        </h3>
                        <div className="tc-arrow">
                          <ArrowUpRight className="w-4 h-4" />
                        </div>
                      </div>

                      {/* Creator Info */}
                      <div className="flex items-center gap-2 text-sm text-white/60 mb-4">
                        <span>Created by {template.creator}</span>
                        <span>•</span>
                        <span className="uppercase font-medium">{template.platform}</span>
                        <span>•</span>
                        <span>{template.duration}</span>
                      </div>

                      {/* Viral Success Badge */}
                      <div className="flex items-center gap-2 px-3 py-2 bg-[#7b61ff]/10 border border-[#7b61ff]/20 rounded-full text-sm mb-4">
                        <Music className="w-4 h-4 text-[#7b61ff]" />
                        <span className="text-white/90 font-medium">{template.trendingSound}</span>
                      </div>

                      {/* Create Button */}
                      <button
                        onClick={() => {
                          if (showRibbon && starterEnabled) {
                            setStarterEnabled(true);
                            setStarterTemplates(starterIds.map((id) => ({ id })) as any);
                            setTemplateId(template.id);
                            try { oldStore.getState().enableStarter?.(true); } catch {}
                            try { oldStore.getState().setStarterTemplates?.(starterIds); } catch {}
                            try { oldStore.getState().selectTemplate?.(template.id); } catch {}
                            router.push('/admin/studio/script?starter=on');
                          } else {
                            handleTemplateSelect(template)
                          }
                        }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#7b61ff] to-[#ff61a6] text-white font-semibold rounded-2xl hover:shadow-[0_8px_20px_rgba(123,97,255,0.4)] hover:scale-[1.02] transition-all duration-300"
                      >
                        <span>Create with this template</span>
                        <Sparkles className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#7b61ff]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  </div>
                </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              className="text-center py-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <div className="text-6xl mb-4">🎬</div>
              <h3 className="text-2xl font-semibold text-white mb-4">No templates available</h3>
              <p className="text-white/60 mb-8">
                Templates for this niche are coming soon. Try selecting "All" to see available templates.
              </p>
              <button
                onClick={() => setActiveCategory('all')}
                className="px-8 py-3 bg-gradient-to-r from-[#7b61ff] to-[#ff61a6] text-white font-semibold rounded-2xl hover:shadow-[0_15px_40px_rgba(123,97,255,0.4)] transition-all duration-300"
              >
                View All Templates
              </button>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}