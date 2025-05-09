"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Clock, TrendingUp, BarChart, ZapIcon, Award, Music, Play, Eye, Info, Tag, CheckCheck, ArrowUpRight, Sparkles, PlusCircle, Volume2 } from 'lucide-react';
import { motion, AnimatePresence, useMotionTemplate, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/design-utils';
import { Template } from "@/lib/types/template"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useHapticFeedback } from '@/lib/hooks/useHapticFeedback';
import { AnimatedContainer } from '@/components/ui/AnimatedContainer';
import { useAudio } from '@/lib/contexts/AudioContext';
import { Sound } from '@/lib/types/audio';

// Define the template interface with analysis data
export interface TemplateProps {
  id: string;
  category: string;
  duration: string;
  title: string;
  views: string;
  background?: string;
  image?: string;
  // Extended properties for analyzed templates
  templateStructure?: Array<{
    type: string;
    startTime?: number;
    duration?: number;
    purpose?: string;
  }>;
  engagementRate?: number;
  velocityScore?: number;
  aiCategory?: string;
  isAnalyzed?: boolean;
  // Sound properties
  soundId?: string;
  soundTitle?: string;
  soundAuthor?: string;
  soundCategory?: string;
}

// Helper function to generate a slug for routing
export function generateSlug(title: string): string {
  return title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
}

interface TemplateCardProps {
  template: Template | TemplateProps
  isSelected: boolean
  onClick: () => void
  viewMode: 'grid' | 'list'
}

export function TemplateCard({ template, isSelected, onClick, viewMode }: TemplateCardProps) {
  // Enhanced interaction states
  const [isHovered, setIsHovered] = useState(false);
  const [hasClicked, setHasClicked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Motion values for enhanced interactive effects
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { stiffness: 150, damping: 15 };
  
  // Create spring animations for smoother interactions
  const scaleSpring = useSpring(1, springConfig);
  const rotateXSpring = useSpring(0, springConfig);
  const rotateYSpring = useSpring(0, springConfig);
  
  // For subtle gradient lighting effect on hover
  const gradientOpacity = useSpring(0, { stiffness: 100, damping: 20 });
  
  // For haptic feedback on mobile/touch devices
  const { triggerHaptic } = useHapticFeedback();
  
  // Add audio context for sound playback
  const { loadSound, play } = useAudio();
  
  // Handle mouse movement for 3D-like effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Center coordinates (0,0 at center of element)
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Calculate rotation based on mouse position relative to center
    // Divide by a higher value to reduce the rotation amount
    rotateYSpring.set((x - centerX) / 30);
    rotateXSpring.set((centerY - y) / 30);
    
    // Update mouse position for gradient effect
    mouseX.set(x);
    mouseY.set(y);
  };
  
  const handleMouseEnter = () => {
    setIsHovered(true);
    scaleSpring.set(1.02);
    gradientOpacity.set(0.15);
  };
  
  const handleMouseLeave = () => {
    setIsHovered(false);
    scaleSpring.set(1);
    rotateXSpring.set(0);
    rotateYSpring.set(0);
    gradientOpacity.set(0);
  };
  
  const handleClick = () => {
    triggerHaptic('light');
    setHasClicked(true);
    
    // Simulate a brief loading state for visual feedback
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 300);
    
    // Call the actual onClick handler
    onClick();
    
    // Reset click state after animation
    setTimeout(() => setHasClicked(false), 300);
  };
  
  // Add sound playback function
  const handlePlaySound = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent template selection
    triggerHaptic('light');
    
    if (hasTemplateShape && template.soundId && template.soundUrl) {
      // Create a Sound object from template data
      const sound: Sound = {
        id: template.soundId,
        title: template.soundTitle || 'Template Sound',
        artist: template.soundAuthor,
        url: template.soundUrl,
        duration: totalDuration
      };
      
      // Play the sound in the global audio player
      loadSound(sound);
      play();
    }
  };
  
  // Calculate total duration of the template in seconds
  // Handle both TemplateProps (which uses title/duration) and Template (which uses name/sections)
  // Also handle the dashboard-view template type which has a different structure
  const hasTemplateShape = 'sections' in template && 'name' in template;
  const hasTemplatePropsShape = 'title' in template && 'duration' in template;
  const hasDashboardTemplateShape = 'title' in template && !('duration' in template) && 'stats' in template;
  
  let totalDuration = 0;
  if (hasTemplateShape && template.sections) {
    totalDuration = template.totalDuration || 
      template.sections.reduce((sum, section) => sum + section.duration, 0);
  } else if (hasTemplatePropsShape && typeof template.duration === 'string') {
    // Remove any non-numeric characters (like "s" for seconds) before parsing
    totalDuration = parseInt(template.duration.replace(/[^0-9]/g, ''));
  } else if (hasDashboardTemplateShape) {
    // For dashboard templates, we might not have duration directly
    totalDuration = 30; // Default assumption for dashboard templates
  }
  
  // Get template name (account for different object shapes)
  const templateName = hasTemplateShape ? template.name : 
                      (hasTemplatePropsShape ? template.title : 
                      (hasDashboardTemplateShape ? (template as any).title : ''));
  
  // Get template description (account for different object shapes)
  const templateDescription = hasTemplateShape ? (template.description || '') : 
                             (hasDashboardTemplateShape ? (template as any).description || '' : '');
  
  // Format duration in a readable format
  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return remainingSeconds > 0 
      ? `${minutes}m ${remainingSeconds}s`
      : `${minutes}m`
  }
  
  // Format views for better readability
  const formatViews = (views: number | string) => {
    if (typeof views === 'string') return views;
    
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`
    }
    return views.toString()
  }

  // Check if template has sound
  const hasSound = hasTemplateShape && template.soundId && template.soundUrl;

  // Grid layout for the card with enhanced animations
  if (viewMode === 'grid') {
    return (
      <motion.div 
        className={cn(
          "group h-[280px] rounded-lg overflow-hidden border transition-all duration-300",
          "relative cursor-pointer hover:shadow-lg hover:border-primary/30",
          isSelected && "ring-2 ring-primary shadow-md"
        )}
        style={{
          scale: scaleSpring,
          rotateX: rotateXSpring,
          rotateY: rotateYSpring,
          transformStyle: "preserve-3d",
          transformPerspective: 1000
        }}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        initial={{ opacity: 0, y: 15 }}
        animate={{ 
          opacity: 1, 
          y: 0,
          transition: { 
            type: "spring", 
            stiffness: 50, 
            damping: 10 
          }
        }}
        whileTap={{ 
          scale: 0.98,
          transition: { duration: 0.1 }
        }}
      >
        {/* Ambient gradient highlight effect on hover */}
        <motion.div 
          className="absolute inset-0 rounded-lg pointer-events-none z-10"
          style={{
            background: useMotionTemplate`radial-gradient(circle at ${mouseX}px ${mouseY}px, rgba(var(--color-primary-rgb), ${gradientOpacity}) 0%, transparent 70%)`,
          }}
        />
        
        {/* Card image with enhanced overlay */}
        <div className="relative h-44 w-full bg-gray-100 overflow-hidden">
          {(hasTemplateShape && template.thumbnailUrl) || (hasDashboardTemplateShape && (template as any).thumbnailUrl) ? (
            <>
              <Image
                src={hasTemplateShape ? template.thumbnailUrl : (template as any).thumbnailUrl}
                alt={templateName}
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                priority
              />
              <motion.div 
                className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"
                initial={{ opacity: 0.2 }}
                animate={{ opacity: isHovered ? 0.7 : 0.2 }}
                transition={{ duration: 0.3 }}
              />
            </>
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-gray-200">
              <span className="text-sm text-gray-500">No preview</span>
            </div>
          )}
          
          {/* Enhanced Badges overlay with staggered animations */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 max-w-[calc(100%-24px)]">
            {hasTemplateShape && template.createdAt && new Date(template.createdAt) > new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0, y: -5 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ delay: 0.1, type: "spring" }}
              >
                <Badge className="bg-primary text-xs font-medium px-2 py-1 shadow-sm backdrop-blur-sm bg-opacity-90 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  NEW
                </Badge>
              </motion.div>
            )}
            {hasTemplateShape && template.usageCount > 1000 && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0, y: -5 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ delay: 0.2, type: "spring" }}
              >
                <Badge variant="secondary" className="text-xs font-medium px-2 py-1 shadow-sm backdrop-blur-sm bg-opacity-90 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Popular
                </Badge>
              </motion.div>
            )}
            {(hasTemplatePropsShape && template.isAnalyzed) || (hasDashboardTemplateShape && (template as any).analysisData?.expertEnhanced) && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0, y: -5 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ delay: 0.3, type: "spring" }}
              >
                <Badge variant="secondary" className="text-xs font-medium px-2 py-1 shadow-sm backdrop-blur-sm bg-opacity-90 flex items-center gap-1">
                  <Award className="h-3 w-3" />
                  {hasTemplatePropsShape ? "Analyzed" : "Expert Enhanced"}
                </Badge>
              </motion.div>
            )}
          </div>
          
          {/* Sound indicator */}
          {hasSound && (
            <motion.div
              className="absolute bottom-3 left-3"
              initial={{ scale: 0.8, opacity: 0, y: 5 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ delay: 0.2, type: "spring" }}
            >
              <Button
                variant="secondary"
                size="sm"
                className="flex items-center gap-1.5 text-xs h-8 px-2.5 bg-black/70 text-white hover:bg-black/80"
                onClick={handlePlaySound}
              >
                <Volume2 className="h-3 w-3" />
                <span className="truncate max-w-[80px]">{template.soundTitle || 'Sound'}</span>
              </Button>
            </motion.div>
          )}
          
          {/* Enhanced action button with pulse animation */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                className="absolute bottom-3 right-3 flex items-center gap-2"
                initial={{ opacity: 0, scale: 0.8, y: 5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 5 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Button 
                  size="sm" 
                  className="rounded-full h-10 w-10 p-0 flex items-center justify-center shadow-md bg-primary text-white hover:bg-primary/90"
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerHaptic('medium');
                    onClick();
                  }}
                >
                  <motion.div
                    animate={isLoading ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 0.5, repeat: Infinity, repeatType: "loop" }}
                  >
                    <Play className="h-5 w-5" />
                  </motion.div>
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Enhanced Card content with animation */}
        <div className="p-4">
          <div className="mb-2">
            <motion.h3 
              className="font-medium text-base line-clamp-1 transition-colors duration-300 group-hover:text-primary"
              initial={{ opacity: 0.9 }}
              animate={{ opacity: 1 }}
              style={{ transform: "translateZ(10px)" }} // Subtle 3D effect
            >
              {templateName}
            </motion.h3>
            <motion.p 
              className="text-muted-foreground text-sm line-clamp-1"
              initial={{ opacity: 0.8 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              style={{ transform: "translateZ(5px)" }} // Subtle 3D effect
            >
              {templateDescription || "No description available"}
            </motion.p>
          </div>
          
          <div className="flex flex-wrap gap-1.5">
            {hasTemplateShape && template.industry && (
              <Badge 
                variant="outline" 
                className="text-xs font-normal border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors transform-gpu group-hover:border-gray-300"
              >
                <Tag className="h-3 w-3 mr-1" />
                {template.industry}
              </Badge>
            )}
            
            <Badge 
              variant="outline" 
              className="text-xs font-normal border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors transform-gpu group-hover:border-gray-300"
            >
              <Clock className="h-3 w-3 mr-1" />
              {formatDuration(totalDuration)}
            </Badge>

            <Badge 
              variant="outline" 
              className="text-xs font-normal border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors transform-gpu group-hover:border-gray-300"
            >
              <Eye className="h-3 w-3 mr-1" />
              {formatViews(
                hasTemplateShape ? template.views : 
                hasTemplatePropsShape ? template.views : 
                hasDashboardTemplateShape ? (template as any).stats?.views || 0 : 0
              )}
            </Badge>
            
            {/* Sound badge */}
            {hasSound && (
              <Badge 
                variant="outline" 
                className="text-xs font-normal border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors transform-gpu group-hover:border-gray-300 cursor-pointer"
                onClick={handlePlaySound}
              >
                <Music className="h-3 w-3 mr-1" />
                <span className="truncate max-w-[80px]">{template.soundTitle || 'Sound'}</span>
              </Badge>
            )}
          </div>
          
          {/* Enhanced selection indicator with animation */}
          <AnimatePresence>
            {isSelected && (
              <motion.div
                className="absolute bottom-3 right-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: [0, 1.2, 1], 
                  opacity: 1,
                  transition: { duration: 0.3 }
                }}
                exit={{ scale: 0, opacity: 0 }}
              >
                <CheckCheck className="h-4 w-4" />
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Touch ripple effect */}
          <AnimatePresence>
            {hasClicked && (
              <motion.div
                className="absolute inset-0 bg-primary/10 rounded-lg pointer-events-none z-5"
                initial={{ opacity: 0.5, scale: 0 }}
                animate={{ opacity: 0, scale: 4 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
                style={{ originX: 0.5, originY: 0.5 }}
              />
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    )
  }
  
  // List layout for the card
  return (
    <motion.div 
      className={cn(
        "flex border rounded-lg p-3 gap-4 transition-all",
        "cursor-pointer hover:shadow-md hover:border-primary/30",
        isSelected && "ring-2 ring-primary shadow-md"
      )}
      onClick={handleClick}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ scale: 1.01, y: -2 }}
      whileTap={{ scale: 0.99 }}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Thumbnail with overlay effect */}
      <div className="relative h-24 w-36 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
        {(hasTemplateShape && template.thumbnailUrl) || (hasDashboardTemplateShape && (template as any).thumbnailUrl) ? (
          <>
            <Image
              src={hasTemplateShape ? template.thumbnailUrl : (template as any).thumbnailUrl}
              alt={templateName}
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              fill
              sizes="(max-width: 768px) 25vw, 144px"
            />
            <motion.div 
              className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100"
              initial={{ opacity: 0 }}
              animate={{ opacity: isHovered ? 0.4 : 0 }}
              transition={{ duration: 0.3 }}
            />
          </>
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gray-200">
            <span className="text-xs text-gray-500">No preview</span>
          </div>
        )}
        
        {/* New/Popular badge with animation */}
        <AnimatePresence>
          {hasTemplateShape && template.createdAt && new Date(template.createdAt) > new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) ? (
            <motion.div
              className="absolute top-2 left-2"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Badge className="bg-primary text-xs shadow-sm">NEW</Badge>
            </motion.div>
          ) : hasTemplateShape && template.usageCount > 1000 ? (
            <motion.div
              className="absolute top-2 left-2"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Badge variant="secondary" className="text-xs shadow-sm">Popular</Badge>
            </motion.div>
          ) : (hasTemplatePropsShape && template.isAnalyzed) || (hasDashboardTemplateShape && (template as any).analysisData?.expertEnhanced) ? (
            <motion.div
              className="absolute top-2 left-2"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Badge variant="secondary" className="text-xs shadow-sm">
                {hasTemplatePropsShape ? "Analyzed" : "Expert Enhanced"}
              </Badge>
            </motion.div>
          ) : null}
        </AnimatePresence>
        
        {/* Play button overlay on hover */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.8 }}
                className="bg-white/90 rounded-full p-1.5 shadow-md"
              >
                <Play className="h-4 w-4 text-primary" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Content with subtle animations */}
      <div className="flex-1 min-w-0">
        <div className="mb-2">
          <motion.h3 
            className="font-medium text-base line-clamp-1 group-hover:text-primary transition-colors duration-300"
            initial={{ opacity: 0.9 }}
            animate={{ opacity: 1 }}
          >
            {templateName}
          </motion.h3>
          <motion.p 
            className="text-muted-foreground text-sm line-clamp-2"
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {templateDescription || "No description available"}
          </motion.p>
        </div>
        
        <div className="flex flex-wrap gap-1.5">
          {hasTemplateShape && template.industry && (
            <Badge variant="outline" className="text-xs font-normal border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors">
              <Tag className="h-3 w-3 mr-1" />
              {template.industry}
            </Badge>
          )}
          
          <Badge variant="outline" className="text-xs font-normal border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors">
            <Clock className="h-3 w-3 mr-1" />
            {formatDuration(totalDuration)}
          </Badge>
          
          {(hasTemplateShape && template.category) || (hasTemplatePropsShape && template.category) || (hasDashboardTemplateShape && (template as any).category) ? (
            <Badge variant="outline" className="text-xs font-normal border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors">
              {hasTemplateShape ? template.category : 
               hasTemplatePropsShape ? template.category : 
              (template as any).category}
            </Badge>
          ) : null}

          <Badge variant="outline" className="text-xs font-normal border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors">
            <Eye className="h-3 w-3 mr-1" />
            {formatViews(
              hasTemplateShape ? template.views : 
              hasTemplatePropsShape ? template.views : 
              hasDashboardTemplateShape ? (template as any).stats?.views || 0 : 0
            )}
          </Badge>
          
          {/* Sound badge for list view */}
          {hasSound && (
            <Badge 
              variant="outline" 
              className="text-xs font-normal border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
              onClick={handlePlaySound}
            >
              <Music className="h-3 w-3 mr-1" />
              <span className="truncate max-w-[80px]">{template.soundTitle || 'Sound'}</span>
            </Badge>
          )}
        </div>
      </div>
      
      {/* Action buttons with larger touch targets */}
      <div className="flex flex-col justify-between items-end ml-2 gap-2">
        <motion.button
          className="text-gray-500 hover:text-primary transition-colors duration-200 rounded-full h-8 w-8 flex items-center justify-center hover:bg-gray-100"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          aria-label="More info"
        >
          <Info className="h-4 w-4" />
        </motion.button>
        
        {isSelected ? (
          <motion.div
            className="h-8 w-8 bg-primary rounded-full flex items-center justify-center text-white"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
          >
            <CheckCheck className="h-4 w-4" />
          </motion.div>
        ) : (
          <motion.button
            className="rounded-full flex items-center justify-center p-0 h-8 min-w-[5rem] bg-primary text-white hover:bg-primary/90 shadow-sm text-sm font-medium"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Use template"
          >
            Use
            <ArrowUpRight className="ml-1 h-3 w-3" />
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
} 