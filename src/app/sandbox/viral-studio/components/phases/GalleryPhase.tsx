'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Eye, Heart, Share, Play, Flame, Music, Sparkles } from 'lucide-react';

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

// Template data organized by niche
const TEMPLATES_BY_NICHE: Record<string, Template[]> = {
  'business': [
    {
      id: 'business-1',
      title: 'How I Built a 7-Figure Business in 6 Months',
      category: 'business',
      views: '2.4M',
      likes: '360.0K',
      shares: '89K',
      viralScore: 94.2,
      description: 'AI-optimized template for Business/Entrepreneurship',
      trendingSound: 'Viral Success Pattern Identified',
      backgroundGradient: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
      previewImage: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400&h=600&fit=crop',
      previewVideo: 'https://player.vimeo.com/external/434045526.hd.mp4?s=c27eecc69a27dbc4ff2b87d38afc35f1a9a1c5e3&profile_id=174',
      hoverFrames: [
        'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400&h=600&fit=crop',
        'https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=600&fit=crop',
        'https://images.unsplash.com/photo-1553969420-fb915ada4cf0?w=400&h=600&fit=crop'
      ],
      creator: 'entrepreneurmindset',
      platform: 'TIKTOK',
      duration: '34s'
    },
    {
      id: 'business-2',
      title: 'This Morning Routine Changed My Life',
      category: 'business',
      views: '1.8M',
      likes: '270.0K',
      shares: '65K',
      viralScore: 91.7,
      description: 'AI-optimized template for productivity and success',
      trendingSound: 'Viral Success Pattern Identified',
      backgroundGradient: 'linear-gradient(135deg, #059669 0%, #34d399 100%)',
      previewImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop',
      hoverFrames: [
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop',
        'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=400&h=600&fit=crop',
        'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=400&h=600&fit=crop'
      ],
      creator: 'productivityguru',
      platform: 'TIKTOK',
      duration: '45s'
    },
    {
      id: 'business-3',
      title: 'Secret Productivity Hack Nobody Talks About',
      category: 'business',
      views: '1.5M',
      likes: '225.0K',
      shares: '52K',
      viralScore: 89.3,
      description: 'AI-optimized template for productivity tips',
      trendingSound: 'Viral Success Pattern Identified',
      backgroundGradient: 'linear-gradient(135deg, #7e22ce 0%, #a855f7 100%)',
      previewImage: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=600&fit=crop',
      hoverFrames: [
        'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=600&fit=crop',
        'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=600&fit=crop',
        'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=600&fit=crop'
      ],
      creator: 'lifehacker_official',
      platform: 'TIKTOK',
      duration: '32s'
    }
  ],
  'fitness': [
    {
      id: 'fitness-1',
      title: 'Transformation Reveal',
      category: 'fitness',
      views: '15.2M',
      likes: '3.1M',
      shares: '487K',
      viralScore: 96,
      description: 'AI-optimized template for Fitness/Weight Loss',
      trendingSound: 'Viral Success Pattern Identified',
      backgroundGradient: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
      previewImage: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=600&fit=crop',
      hoverFrames: [
        'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=600&fit=crop',
        'https://images.unsplash.com/photo-1534258936925-c58bed479fcb?w=400&h=600&fit=crop',
        'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=400&h=600&fit=crop'
      ],
      creator: 'fitnessguru',
      platform: 'TIKTOK',
      duration: '30s'
    },
    {
      id: 'fitness-2',
      title: '30-Day Challenge',
      category: 'fitness',
      views: '8.7M',
      likes: '2.2M',
      shares: '312K',
      viralScore: 92,
      description: 'AI-optimized template for Fitness/Weight Loss',
      trendingSound: 'Viral Success Pattern Identified',
      backgroundGradient: 'linear-gradient(135deg, #7c2d12 0%, #dc2626 100%)',
      previewImage: 'https://images.unsplash.com/photo-1583500178690-f7d24219f8fc?w=400&h=600&fit=crop',
      hoverFrames: [
        'https://images.unsplash.com/photo-1583500178690-f7d24219f8fc?w=400&h=600&fit=crop',
        'https://images.unsplash.com/photo-1550345332-09e3ac987658?w=400&h=600&fit=crop',
        'https://images.unsplash.com/photo-1554344728-02c4915e6826?w=400&h=600&fit=crop'
      ],
      creator: 'fitnessexpert',
      platform: 'TIKTOK',
      duration: '45s'
    }
  ],
  'personal-finance': [
    {
      id: 'finance-1',
      title: 'Investment Strategy',
      category: 'personal-finance',
      views: '9.8M',
      likes: '2.3M',
      shares: '445K',
      viralScore: 91,
      description: 'AI-optimized template for Personal Finance/Investing',
      trendingSound: 'Viral Success Pattern Identified',
      backgroundGradient: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
      previewImage: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=400&h=600&fit=crop',
      hoverFrames: [
        'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=400&h=600&fit=crop',
        'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=600&fit=crop',
        'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=400&h=600&fit=crop'
      ],
      creator: 'wealthbuilder',
      platform: 'TIKTOK',
      duration: '40s'
    }
  ]
};

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
}

function PreviewComponent({ template, isHovered }: PreviewComponentProps) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

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

  const currentImage = isHovered && template.hoverFrames && template.hoverFrames.length > 0
    ? template.hoverFrames[currentFrame]
    : template.previewImage;

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Main Image */}
      <img 
        src={currentImage}
        alt={template.title}
        className={`w-full h-full object-cover transition-all duration-300 ${
          isHovered ? 'scale-105' : 'scale-100'
        }`}
      />
      
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

export default function GalleryPhase({ selectedNiche, onTemplateSelect, hoveredTemplate, onTemplateHover }: GalleryPhaseProps) {
  const selectedNicheKey = getNicheKey(selectedNiche || '');
  const [activeCategory, setActiveCategory] = useState(selectedNicheKey);
  const [currentTemplates, setCurrentTemplates] = useState<Template[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Update templates when category changes
  useEffect(() => {
    if (activeCategory === 'all') {
      // Show all templates from all niches
      const allTemplates = Object.values(TEMPLATES_BY_NICHE).flat();
      setCurrentTemplates(allTemplates);
    } else {
      setCurrentTemplates(TEMPLATES_BY_NICHE[activeCategory] || []);
    }
  }, [activeCategory]);

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
    <motion.div
      className="min-h-screen bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black to-transparent backdrop-blur-[20px] px-10 py-6">
        <div className="max-w-[1400px] mx-auto">
          {/* Header Content */}
          <div className="flex items-center justify-between mb-5">
            <motion.div 
              className="text-[28px] font-bold bg-gradient-to-r from-[#7b61ff] to-[#ff61a6] bg-clip-text text-transparent"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              Viral DNA™
            </motion.div>
            
            <motion.div 
              className="flex items-center gap-2 px-5 py-2 bg-white/[0.05] border border-white/10 rounded-full text-sm backdrop-blur-[10px]"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="w-2 h-2 bg-[#ff4458] rounded-full animate-pulse" />
              <span>{getTemplateCount()}</span>
            </motion.div>
          </div>

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

      {/* Template Feed */}
      <main className="pt-[200px] px-10 pb-10">
        <div className="max-w-[1400px] mx-auto">
          {currentTemplates.length > 0 ? (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              {currentTemplates.map((template, index) => {
                const isHovered = hoveredTemplate === template.id;
                
                return (
                  <motion.div
                    key={template.id}
                    className="template-card group cursor-pointer"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    whileHover={{ y: -4, scale: 1.01 }}
                    onMouseEnter={() => onTemplateHover(template.id)}
                    onMouseLeave={() => onTemplateHover(null)}
                  >
                    <div className="relative bg-white/[0.02] border border-white/[0.05] rounded-3xl overflow-hidden transition-all duration-400 hover:border-[#7b61ff]/30 hover:shadow-[0_20px_40px_rgba(123,97,255,0.2)]">
                      {/* Video Preview */}
                      <div className="relative h-[350px] overflow-hidden">
                        <PreviewComponent template={template} isHovered={isHovered} />

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
                      {/* Title */}
                      <h3 className="text-lg font-semibold text-white mb-3 leading-tight">
                        {template.title}
                      </h3>

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
                        onClick={() => handleTemplateSelect(template)}
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
    </motion.div>
  );
}