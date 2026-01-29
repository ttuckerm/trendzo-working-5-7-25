"use client";

import { useState, useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { Play, Eye, Heart, TrendingUp, Music } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ViralDNA } from './ViralDNA';

interface ViralTemplateCardProps {
  template: {
    id: string;
    title: string;
    category: string;
    description: string;
    thumbnailUrl?: string;
    stats: {
      views: number;
      likes: number;
      comments: number;
      engagementRate: number;
    };
    soundTitle?: string;
    soundAuthor?: string;
    analysisData?: {
      expertEnhanced?: boolean;
      expertConfidence?: number;
    };
    trendData?: {
      trending: boolean;
      trendStrength: number;
    };
  };
  index: number;
  onClick?: () => void;
}

export default function ViralTemplateCard({ template, index, onClick }: ViralTemplateCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);

  // Motion values for 3D hover effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(0, { stiffness: 300, damping: 30 });
  const rotateY = useSpring(0, { stiffness: 300, damping: 30 });
  const scale = useSpring(1, { stiffness: 300, damping: 30 });

  // Handle mouse movement for 3D effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const rotateXValue = (e.clientY - centerY) / 10;
    const rotateYValue = (centerX - e.clientX) / 10;
    
    rotateX.set(rotateXValue);
    rotateY.set(rotateYValue);
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    scale.set(1.02);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    scale.set(1);
    rotateX.set(0);
    rotateY.set(0);
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      // Navigate to template editor
      router.push(`/editor/${template.id}`);
    }
  };

  const handlePlayPreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlaying(!isPlaying);
    
    // Simulate video preview
    setTimeout(() => {
      setIsPlaying(false);
    }, 3000);
  };

  // Format numbers for display
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  // Generate gradient based on category
  const getCategoryGradient = (category: string) => {
    const gradients = {
      'Lifestyle': 'from-purple-500 to-pink-500',
      'Educational': 'from-blue-500 to-cyan-500',
      'Entertainment': 'from-yellow-500 to-orange-500',
      'Personal': 'from-green-500 to-teal-500',
      'Fashion': 'from-pink-500 to-rose-500',
      'Food': 'from-orange-500 to-red-500',
      'Travel': 'from-blue-500 to-purple-500',
      'default': 'from-purple-500 to-pink-500'
    };
    return gradients[category as keyof typeof gradients] || gradients.default;
  };

  return (
    <motion.article
      ref={cardRef}
      className="relative bg-black/40 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden cursor-pointer group"
      style={{
        rotateX,
        rotateY,
        scale,
        transformStyle: "preserve-3d"
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      initial={{ opacity: 0, y: 30, rotateX: -10 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ 
        duration: 0.6, 
        delay: index * 0.1,
        ease: [0.4, 0, 0.2, 1]
      }}
      whileHover={{
        borderColor: "rgba(255, 255, 255, 0.2)",
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)"
      }}
    >
      {/* Hover gradient overlay */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/10 opacity-0"
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />

      {/* Viral DNA Indicator */}
      <div className="absolute top-5 right-5 z-10">
        <ViralDNA score={template.stats.engagementRate} />
      </div>

      {/* Video Preview */}
      <div className={cn(
        "relative h-80 w-full overflow-hidden bg-gradient-to-br",
        getCategoryGradient(template.category)
      )}>
        {/* Gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
        
        {/* Play Button - Always visible and centered */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.button
            className="w-16 h-16 bg-white/20 backdrop-blur-md border border-white/30 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all duration-300"
            onClick={handlePlayPreview}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Play className="w-6 h-6 ml-0.5" fill="currentColor" />
          </motion.button>
        </div>

        {/* Category label */}
        <div className="absolute bottom-4 left-4">
          <span className="text-white/80 text-sm font-medium">
            {template.category}
          </span>
        </div>
      </div>

      {/* Template Info */}
      <div className="p-5">
        {/* Stats Row */}
        <div className="flex items-center justify-between mb-4 text-sm text-white/80">
          <div className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            <span className="font-medium text-white">
              {formatNumber(template.stats.views)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Heart className="w-4 h-4 text-pink-400" />
            <span className="font-medium text-white">
              {formatNumber(template.stats.likes)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="w-4 h-4 text-orange-400" />
            <span className="font-medium text-white">
              {template.stats.engagementRate}%
            </span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold mb-2 text-white">
          {template.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-white/60 mb-4 line-clamp-2">
          {template.description}
        </p>

        {/* Trending Sound */}
        {template.soundTitle && (
          <div className="flex items-center gap-2 px-3 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm">
            <Music className="w-4 h-4 text-purple-400" />
            <span className="text-white/90 truncate">
              Trending Sound: "{template.soundTitle}"
            </span>
          </div>
        )}
      </div>
    </motion.article>
  );
} 