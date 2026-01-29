'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ViralTemplateCard from './ViralTemplateCard';
import { Skeleton } from '@/components/ui/skeleton';

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

interface TemplateGridProps {
  templates: Template[];
  loading?: boolean;
  onTemplateClick?: (template: Template) => void;
}

export default function TemplateGrid({ 
  templates, 
  loading = false, 
  onTemplateClick 
}: TemplateGridProps) {
  
  // Animation variants for the grid
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      y: 30,
      rotateX: -10
    },
    visible: { 
      opacity: 1, 
      y: 0,
      rotateX: 0,
      transition: {
        duration: 0.6,
        ease: [0.4, 0, 0.2, 1]
      }
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-[500px]">
            <Skeleton className="h-full w-full rounded-3xl" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
    >
      <AnimatePresence mode="popLayout">
        {templates.map((template, index) => (
          <motion.div
            key={template.id}
            variants={itemVariants}
            layout
            className="group"
            style={{ 
              animationDelay: `${index * 0.1}s` 
            }}
          >
            <ViralTemplateCard 
              template={{
                id: template.id,
                title: template.title,
                category: template.category,
                description: template.description || 'AI-optimized template for maximum viral potential',
                thumbnailUrl: template.thumbnailUrl,
                stats: {
                  views: template.views,
                  likes: template.likes,
                  comments: Math.floor(template.likes * 0.1), // Estimate comments as 10% of likes
                  engagementRate: template.viral_score
                },
                soundTitle: template.sound_title,
                soundAuthor: template.sound_author,
                trendData: {
                  trending: template.viral_score > 85,
                  trendStrength: template.viral_score
                }
              }}
              index={index}
              onClick={() => onTemplateClick?.(template)}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
} 