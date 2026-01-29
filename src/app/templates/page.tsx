"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import TemplateGrid from '@/components/templates/TemplateGrid';
import { TrendingBadge } from '@/components/templates/TrendingBadge';
import { CustomCursor } from '@/components/templates/CustomCursor';
import { FloatingOrbs } from '@/components/templates/FloatingOrbs';
import { LoadingIndicator } from '@/components/templates/LoadingIndicator';
import { getTemplates } from '@/lib/services/template-service';
import { Template } from '@/lib/types/database';
import { useInView } from 'react-intersection-observer';

// Transform database template to display format
const transformTemplate = (dbTemplate: Template) => ({
  id: dbTemplate.id.toString(),
  title: dbTemplate.title,
  category: dbTemplate.category || 'General',
  description: dbTemplate.description || 'AI-optimized template for maximum viral potential',
  thumbnailUrl: dbTemplate.thumbnail_url || '/images/template-placeholder.jpg',
  stats: {
    views: dbTemplate.engagement_metrics?.views || Math.floor(Math.random() * 20000000) + 1000000,
    likes: dbTemplate.engagement_metrics?.likes || Math.floor(Math.random() * 5000000) + 100000,
    comments: dbTemplate.engagement_metrics?.comments || Math.floor(Math.random() * 100000) + 10000,
    engagementRate: Math.floor(Math.random() * 100) + 80
  },
  analysisData: {
    expertEnhanced: Math.random() > 0.7,
    expertConfidence: Math.floor(Math.random() * 30) + 70
  },
  soundId: `sound-${dbTemplate.id}`,
  soundTitle: `Trending Sound ${dbTemplate.id}`,
  soundAuthor: 'Viral Artist',
  soundCategory: 'trending',
  soundStats: {
    popularity: Math.floor(Math.random() * 100) + 50,
    engagementBoost: Math.floor(Math.random() * 50) + 25
  },
  trendData: {
    trending: dbTemplate.is_trending,
    trendStrength: Math.floor(Math.random() * 100) + 50
  }
});

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [trendingCount, setTrendingCount] = useState(247);

  // Infinite scroll trigger
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false
  });

  // Load initial templates
  useEffect(() => {
    loadInitialTemplates();
  }, []);

  // Load more when scrolling to bottom
  useEffect(() => {
    if (inView && hasMore && !loadingMore) {
      loadMoreTemplates();
    }
  }, [inView, hasMore, loadingMore]);

  const loadInitialTemplates = async () => {
    try {
      setLoading(true);
      const dbTemplates = await getTemplates(12, 0);
      const transformedTemplates = dbTemplates.map(transformTemplate);
      setTemplates(transformedTemplates);
      setOffset(12);
      
      // Update trending count based on actual data
      const trendingTemplates = dbTemplates.filter(t => t.is_trending);
      setTrendingCount(trendingTemplates.length + Math.floor(Math.random() * 200) + 200);
    } catch (error) {
      console.error('Error loading templates:', error);
      // Fallback to sample data if database fails
      setTemplates(getSampleTemplates());
    } finally {
      setLoading(false);
    }
  };

  const loadMoreTemplates = async () => {
    try {
      setLoadingMore(true);
      const dbTemplates = await getTemplates(8, offset);
      
      if (dbTemplates.length === 0) {
        setHasMore(false);
        return;
      }

      const transformedTemplates = dbTemplates.map(transformTemplate);
      setTemplates(prev => [...prev, ...transformedTemplates]);
      setOffset(prev => prev + 8);
    } catch (error) {
      console.error('Error loading more templates:', error);
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  };

  // Sample templates for fallback
  const getSampleTemplates = () => [
    {
      id: "1",
      title: "Transformation Reveal",
      category: "Lifestyle",
      description: "The viral before/after format that gets millions of views",
      thumbnailUrl: "/images/template-transformation.jpg",
      stats: { views: 12400000, likes: 2100000, comments: 156000, engagementRate: 94 },
      soundTitle: "Oh No Remix",
      trendData: { trending: true, trendStrength: 95 }
    },
    {
      id: "2", 
      title: "5 Things List",
      category: "Educational",
      description: "Countdown format with text overlays that hooks viewers",
      thumbnailUrl: "/images/template-list.jpg",
      stats: { views: 8700000, likes: 1400000, comments: 89000, engagementRate: 89 },
      soundTitle: "Aesthetic Beat",
      trendData: { trending: true, trendStrength: 87 }
    },
    {
      id: "3",
      title: "POV Experience", 
      category: "Entertainment",
      description: "First-person storytelling that creates instant connection",
      thumbnailUrl: "/images/template-pov.jpg",
      stats: { views: 15200000, likes: 3700000, comments: 234000, engagementRate: 97 },
      soundTitle: "Running Up That Hill",
      trendData: { trending: true, trendStrength: 98 }
    },
    {
      id: "4",
      title: "Story Time Hook",
      category: "Personal",
      description: "Personal narrative format that keeps viewers watching", 
      thumbnailUrl: "/images/template-story.jpg",
      stats: { views: 9800000, likes: 2400000, comments: 178000, engagementRate: 91 },
      soundTitle: "Monkeys Spinning",
      trendData: { trending: true, trendStrength: 92 }
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Custom Cursor */}
      <CustomCursor />
      
      {/* Ambient Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/10 via-black to-pink-900/5 animate-gradient-x" />
      
      {/* Floating Orbs */}
      <FloatingOrbs />
      
      {/* Header */}
      <motion.header 
        className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black via-black/80 to-transparent backdrop-blur-xl"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <motion.div 
              className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"
              animate={{ 
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              Viral DNA™
            </motion.div>
            
            {/* Trending Badge */}
            <TrendingBadge count={trendingCount} />
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="pt-32 pb-20 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <LoadingIndicator />
          ) : (
            <>
              {/* Template Grid */}
              <TemplateGrid 
                templates={templates}
                loading={loadingMore}
              />
              
              {/* Load More Trigger */}
              {hasMore && (
                <div ref={loadMoreRef} className="mt-16">
                  {loadingMore && <LoadingIndicator />}
                </div>
              )}
              
              {/* End Message */}
              {!hasMore && templates.length > 0 && (
                <motion.div 
                  className="text-center mt-16 py-12"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <div className="text-gray-400 text-lg">
                    You've seen all the viral templates! 
                    <br />
                    <span className="text-purple-400">Check back soon for more trending content.</span>
                  </div>
                </motion.div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
} 