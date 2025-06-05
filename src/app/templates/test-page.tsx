"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import TemplateGrid from '@/components/templates/TemplateGrid';
import { TrendingBadge } from '@/components/templates/TrendingBadge';
import { CustomCursor } from '@/components/templates/CustomCursor';
import { FloatingOrbs } from '@/components/templates/FloatingOrbs';
import { LoadingIndicator } from '@/components/templates/LoadingIndicator';

// Test data for the viral template library
const testTemplates = [
  {
    id: "test-1",
    title: "Transformation Reveal",
    category: "Lifestyle",
    description: "The viral before/after format that gets millions of views",
    thumbnailUrl: "/images/template-transformation.jpg",
    stats: { views: 12400000, likes: 2100000, comments: 156000, engagementRate: 94 },
    soundTitle: "Oh No Remix",
    soundAuthor: "Capone",
    trendData: { trending: true, trendStrength: 95 }
  },
  {
    id: "test-2", 
    title: "5 Things List",
    category: "Educational",
    description: "Countdown format with text overlays that hooks viewers",
    thumbnailUrl: "/images/template-list.jpg",
    stats: { views: 8700000, likes: 1400000, comments: 89000, engagementRate: 89 },
    soundTitle: "Aesthetic Beat",
    soundAuthor: "prod.bypurps",
    trendData: { trending: true, trendStrength: 87 }
  },
  {
    id: "test-3",
    title: "POV Experience", 
    category: "Entertainment",
    description: "First-person storytelling that creates instant connection",
    thumbnailUrl: "/images/template-pov.jpg",
    stats: { views: 15200000, likes: 3700000, comments: 234000, engagementRate: 97 },
    soundTitle: "Running Up That Hill",
    soundAuthor: "Kate Bush",
    trendData: { trending: true, trendStrength: 98 }
  },
  {
    id: "test-4",
    title: "Story Time Hook",
    category: "Personal",
    description: "Personal narrative format that keeps viewers watching", 
    thumbnailUrl: "/images/template-story.jpg",
    stats: { views: 9800000, likes: 2400000, comments: 178000, engagementRate: 91 },
    soundTitle: "Monkeys Spinning",
    soundAuthor: "Kevin MacLeod",
    trendData: { trending: true, trendStrength: 92 }
  }
];

export default function TestViralTemplateLibrary() {
  const [loading, setLoading] = useState(false);
  const [trendingCount] = useState(247);

  const handleTemplateClick = (template: any) => {
    console.log('Template clicked:', template);
    alert(`Clicked template: ${template.title}`);
  };

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
              Viral DNA™ Test
            </motion.div>
            
            {/* Trending Badge */}
            <TrendingBadge count={trendingCount} />
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="pt-32 pb-20 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Test Controls */}
          <motion.div 
            className="mb-8 p-6 bg-white/5 rounded-2xl border border-white/10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-xl font-semibold mb-4">Viral Template Library Test</h2>
            <div className="flex gap-4">
              <button
                onClick={() => setLoading(!loading)}
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg transition-colors"
              >
                Toggle Loading: {loading ? 'ON' : 'OFF'}
              </button>
              <div className="text-sm text-gray-400 flex items-center">
                Templates loaded: {testTemplates.length}
              </div>
            </div>
          </motion.div>

          {loading ? (
            <LoadingIndicator />
          ) : (
            <TemplateGrid 
              templates={testTemplates}
              loading={false}
              onTemplateClick={handleTemplateClick}
            />
          )}
        </div>
      </main>
    </div>
  );
} 