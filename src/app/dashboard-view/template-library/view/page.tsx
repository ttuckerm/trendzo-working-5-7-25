'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import TemplateGrid from '../../../../components/templates/TemplateGrid';
import { TrendingBadge } from '../../../../components/templates/TrendingBadge';

import { LoadingIndicator } from '../../../../components/templates/LoadingIndicator';
import { createClient } from '@/lib/supabase/client';
import { useInView } from 'react-intersection-observer';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface Template {
  id: string;
  title: string;
  category: string;
  description?: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  views: number;
  likes: number;
  viral_score: number;
  duration: string;
  sound_id?: string;
  sound_title?: string;
  sound_author?: string;
  created_at: string;
  updated_at: string;
}

export default function ViralTemplateFeedPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [trendingCount, setTrendingCount] = useState(247);
  
  // Simulate real-time trending count updates for that social media feel
  useEffect(() => {
    const interval = setInterval(() => {
      setTrendingCount(prev => {
        // Randomly increase by 1-3 every 10-30 seconds
        const shouldUpdate = Math.random() > 0.7;
        if (shouldUpdate) {
          return prev + Math.floor(Math.random() * 3) + 1;
        }
        return prev;
      });
    }, Math.random() * 20000 + 10000); // 10-30 seconds

    return () => clearInterval(interval);
  }, []);
  const supabase = createClient();
  const router = useRouter();

  // Intersection observer for infinite scroll
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  });

  // Fetch templates from Supabase
  const fetchTemplates = useCallback(async (pageNum: number, append = false) => {
    if (!append) setLoading(true);
    else setLoadingMore(true);

    try {
      const from = (pageNum - 1) * 9;
      const to = from + 8;

      const { data, error, count } = await supabase
        .from('templates')
        .select('*', { count: 'exact' })
        .order('viral_score', { ascending: false })
        .order('views', { ascending: false })
        .range(from, to);

      if (error) throw error;

      if (data) {
        if (append) {
          setTemplates(prev => [...prev, ...data]);
        } else {
          setTemplates(data);
        }

        // Check if there are more templates to load
        if (count) {
          setHasMore(from + data.length < count);
        }
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      
      // Fallback to mock data if database is not available
      if (!append && templates.length === 0) {
        const mockTemplates = generateMockTemplates(pageNum);
        setTemplates(mockTemplates);
        setHasMore(pageNum < 3); // Simulate 3 pages of mock data
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [supabase, templates.length]);

  // Generate infinite viral templates based on viral content framework
  const generateMockTemplates = (page: number) => {
    // Base viral template patterns from the framework
    const viralPatterns = [
      {
        title: 'Transformation Reveal',
        category: 'Entertainment',
        description: 'The viral before/after format that gets millions of views',
        hook_type: 'Authority Hook',
        viral_score: 94,
        sound_title: 'Oh No - Remix',
        sound_author: 'Capone',
      },
      {
        title: '5 Things List',
        category: 'Educational', 
        description: 'Countdown format with text overlays that hooks viewers',
        hook_type: 'Education Hook',
        viral_score: 89,
        sound_title: 'Aesthetic Beat',
        sound_author: 'prod.bypurps',
      },
      {
        title: 'POV Experience',
        category: 'Entertainment',
        description: 'First-person storytelling that creates instant connection',
        hook_type: 'Storytelling Hook',
        viral_score: 97,
        sound_title: 'Running Up That Hill',
        sound_author: 'Kate Bush',
      },
      {
        title: 'Story Time Hook',
        category: 'Entertainment',
        description: 'Personal narrative format that keeps viewers watching',
        hook_type: 'Storytelling Hook',
        viral_score: 91,
        sound_title: 'Monkeys Spinning',
        sound_author: 'Kevin MacLeod',
      },
      {
        title: 'Day in Life',
        category: 'Lifestyle',
        description: 'AI-optimized template for maximum viral potential',
        hook_type: 'Visual Hook',
        viral_score: 93,
        sound_title: 'Chill Vibes Mix',
        sound_author: 'Lofi Fruits',
      },
      {
        title: 'Quick Tutorial',
        category: 'Educational',
        description: 'Step-by-step format that delivers instant value',
        hook_type: 'Education Hook',
        viral_score: 90,
        sound_title: 'Speed Up Sound',
        sound_author: 'DJ Remix',
      },
      {
        title: 'Trend Challenge',
        category: 'Entertainment',
        description: 'Viral challenge format with massive engagement potential',
        hook_type: 'Shock Value Hook',
        viral_score: 98,
        sound_title: 'Viral Dance Beat',
        sound_author: 'DJ Snake',
      },
      {
        title: 'Reaction Reveal',
        category: 'Entertainment',
        description: 'Authentic reaction format that builds connection',
        hook_type: 'Comparison Hook',
        viral_score: 87,
        sound_title: 'Original Audio',
        sound_author: undefined,
      },
      {
        title: 'This to This',
        category: 'Transformation',
        description: 'Before/after transformation that stops the scroll',
        hook_type: 'This to This Hook',
        viral_score: 95,
        sound_title: 'Motivational Beat',
        sound_author: 'Inspire Music',
      },
      {
        title: 'Is It Possible',
        category: 'Educational',
        description: 'Question format that creates irresistible curiosity',
        hook_type: 'Is It Possible Hook',
        viral_score: 92,
        sound_title: 'Suspense Track',
        sound_author: 'Mystery Sounds',
      },
      {
        title: 'Walk-up Q&A',
        category: 'Entertainment',
        description: 'Street interview format with authentic reactions',
        hook_type: 'Visual Hook',
        viral_score: 88,
        sound_title: 'Urban Vibes',
        sound_author: 'Street Beats',
      },
      {
        title: 'Green Screen Hack',
        category: 'Educational',
        description: 'Visual format using props to demonstrate concepts',
        hook_type: 'Visual Hook',
        viral_score: 86,
        sound_title: 'Tech Sounds',
        sound_author: 'Digital Audio',
      },
      {
        title: 'Myth Busting',
        category: 'Educational',
        description: 'Controversial takes that challenge common beliefs',
        hook_type: 'Myth-Busting Hook',
        viral_score: 89,
        sound_title: 'Dramatic Reveal',
        sound_author: 'Epic Music',
      },
      {
        title: 'Authority Flex',
        category: 'Business',
        description: 'Credibility-building format that establishes expertise',
        hook_type: 'Authority Hook',
        viral_score: 85,
        sound_title: 'Success Sound',
        sound_author: 'Winner Music',
      },
      {
        title: 'Transition Hook',
        category: 'Entertainment',
        description: 'Visual transition that creates seamless storytelling',
        hook_type: 'Visual Hook',
        viral_score: 91,
        sound_title: 'Smooth Transition',
        sound_author: 'Flow Beats',
      }
    ];

    // Generate 9 templates per page with variation
    const templates = [];
    const startIndex = (page - 1) * 9;
    
    for (let i = 0; i < 9; i++) {
      const patternIndex = (startIndex + i) % viralPatterns.length;
      const pattern = viralPatterns[patternIndex];
      const templateId = startIndex + i + 1;
      
      // Add variation to metrics for each instance
      const viewsBase = Math.floor(Math.random() * 15000000) + 5000000;
      const likesBase = Math.floor(viewsBase * (0.1 + Math.random() * 0.15));
      const scoreVariation = Math.floor(Math.random() * 10) - 5;
      
      templates.push({
        id: templateId.toString(),
        title: pattern.title,
        category: pattern.category,
        description: pattern.description,
        thumbnailUrl: `https://picsum.photos/seed/viral${templateId}/400/600`,
        videoUrl: `https://sample-videos.com/zip/10/mp4/SampleVideo_360x240_1mb.mp4`, // Placeholder
        views: viewsBase,
        likes: likesBase,
        viral_score: Math.max(70, Math.min(99, pattern.viral_score + scoreVariation)),
        duration: ['15s', '30s', '45s', '60s'][Math.floor(Math.random() * 4)],
        sound_title: pattern.sound_title,
        sound_author: pattern.sound_author,
        hook_type: pattern.hook_type,
        created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    return templates;
  };

  // Initial load
  useEffect(() => {
    fetchTemplates(1);
  }, [fetchTemplates]);

  // Load more when scrolling
  useEffect(() => {
    if (inView && hasMore && !loadingMore) {
      setPage(prev => prev + 1);
      fetchTemplates(page + 1, true);
    }
  }, [inView, hasMore, loadingMore, page, fetchTemplates]);

  // Set up real-time updates for trending count
  useEffect(() => {
    const fetchTrendingCount = async () => {
      try {
        const { count } = await supabase
          .from('templates')
          .select('*', { count: 'exact', head: true })
          .gte('viral_score', 80);
        
        if (count) setTrendingCount(count);
      } catch (error) {
        console.log('Error fetching trending count:', error);
        // Fallback to static count if there's an error
        setTrendingCount(247);
      }
    };

    fetchTrendingCount();

    // Skip real-time subscriptions for now to avoid WebSocket issues
    // TODO: Re-enable when Supabase real-time is properly configured
    // const subscription = supabase
    //   .channel('trending-templates')
    //   .on('postgres_changes', { 
    //     event: '*', 
    //     schema: 'public', 
    //     table: 'templates' 
    //   }, () => {
    //     fetchTrendingCount();
    //   })
    //   .subscribe();

    // return () => {
    //   subscription.unsubscribe();
    // };
  }, [supabase]);

  const handleTemplateClick = useCallback((template: Template) => {
    // Navigate to template landing page (will be implemented)
    // For now, we'll use a placeholder route that can be updated later
    router.push(`/template/${template.id}`);
  }, [router]);

  return (
    <>
      {/* Simple black background */}
      <div className="fixed inset-0 bg-black -z-10" />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-gradient-to-b from-black/80 via-black/60 to-transparent backdrop-blur-xl border-b border-white/5 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-600 bg-clip-text text-transparent animate-gradient-x"
            >
              Viral DNA™
            </motion.div>
            
            <TrendingBadge count={trendingCount} />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="pt-32 pb-20 min-h-screen relative bg-black">
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {loading && templates.length === 0 ? (
            <TemplateGrid templates={[]} loading={true} />
          ) : (
            <>
              <TemplateGrid 
                templates={templates} 
                onTemplateClick={handleTemplateClick}
              />
              
              {/* Load more trigger */}
              {hasMore && (
                <div ref={loadMoreRef} className="mt-16">
                  {loadingMore && <LoadingIndicator />}
                </div>
              )}
              
              {!hasMore && templates.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16"
                >
                  <div className="inline-block p-6 rounded-2xl bg-white/[0.02] backdrop-blur-sm border border-white/10">
                    <p className="text-gray-400 text-lg">You've reached the end of the viral feed</p>
                    <p className="text-gray-500 text-sm mt-2">More trending templates coming soon...</p>
                  </div>
                </motion.div>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
} 