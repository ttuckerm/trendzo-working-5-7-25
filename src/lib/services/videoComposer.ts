import { PersonalizedTemplate } from './templatePersonalizationEngine';
import { Platform } from '@/lib/types/database';

// Types for video composition
export interface VideoAsset {
  id: string;
  type: 'video' | 'image' | 'text' | 'shape' | 'audio';
  url?: string;
  content?: string;
  startTime: number; // seconds
  duration: number; // seconds
  layer: number; // z-index for layering
  position: {
    x: number; // percentage
    y: number; // percentage
    width: number; // percentage
    height: number; // percentage
  };
  properties: {
    opacity?: number;
    scale?: number;
    rotation?: number;
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    backgroundColor?: string;
    borderRadius?: number;
    filter?: string;
    animation?: VideoAnimation;
  };
  metadata?: Record<string, any>;
}

export interface VideoAnimation {
  type: 'fade' | 'slide' | 'scale' | 'rotate' | 'bounce' | 'shake' | 'pulse';
  direction?: 'in' | 'out' | 'left' | 'right' | 'up' | 'down';
  duration: number; // seconds
  delay?: number; // seconds
  easing?: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';
  repeat?: number;
}

export interface VideoComposition {
  id: string;
  templateId: string;
  userId: string;
  name: string;
  duration: number;
  platform: Platform;
  dimensions: {
    width: number;
    height: number;
    aspectRatio: string;
  };
  assets: VideoAsset[];
  timeline: TimelineSection[];
  audioTrack?: AudioTrack;
  metadata: {
    createdAt: string;
    lastModified: string;
    version: number;
    renderStatus?: 'pending' | 'processing' | 'completed' | 'failed';
    renderProgress?: number;
  };
}

export interface TimelineSection {
  id: string;
  startTime: number;
  duration: number;
  content: string;
  visualCues: string[];
  audioSync: string;
  assets: string[]; // Asset IDs for this section
}

export interface AudioTrack {
  id: string;
  name: string;
  url: string;
  duration: number;
  bpm: number;
  beatMarkers: number[]; // Beat timestamps for sync
  volume: number;
  fadeIn?: number;
  fadeOut?: number;
}

export interface PlatformSpecs {
  dimensions: { width: number; height: number };
  aspectRatio: string;
  maxDuration: number;
  preferredFormats: string[];
  textSafeArea: { top: number; bottom: number; left: number; right: number };
  recommendedFontSizes: { min: number; max: number };
}

export interface RenderOptions {
  quality: 'low' | 'medium' | 'high' | 'ultra';
  format: 'mp4' | 'mov' | 'webm';
  fps: 24 | 30 | 60;
  platform: Platform;
  watermark?: boolean;
  preview?: boolean; // Faster rendering for previews
}

export interface RenderResult {
  success: boolean;
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  fileSize?: number;
  error?: string;
  renderTime?: number;
}

/**
 * Video Composer Service
 * Handles video template composition, asset management, and rendering
 */
export class VideoComposer {
  private static instance: VideoComposer;
  private platformSpecs: Record<Platform, PlatformSpecs>;
  private isTestMode: boolean = true;

  private constructor() {
    this.platformSpecs = this.initializePlatformSpecs();
    
    // Check if we have video rendering capabilities
    const hasRenderingService = process.env.REMOTION_LAMBDA_REGION || process.env.SHOTSTACK_API_KEY;
    this.isTestMode = !hasRenderingService;
    
    if (this.isTestMode) {
      console.warn('⚠️ VideoComposer running in TEST MODE - no actual rendering');
    }
  }

  static getInstance(): VideoComposer {
    if (!VideoComposer.instance) {
      VideoComposer.instance = new VideoComposer();
    }
    return VideoComposer.instance;
  }

  /**
   * Create video composition from personalized template
   */
  async createComposition(
    template: PersonalizedTemplate,
    userId: string,
    platform: Platform,
    customizations?: {
      audioTrack?: AudioTrack;
      brandColors?: { primary: string; secondary: string };
      logo?: string;
      userAssets?: VideoAsset[];
    }
  ): Promise<VideoComposition> {
    const platformSpec = this.platformSpecs[platform];
    const compositionId = `comp_${template.id}_${Date.now()}`;

    // Generate timeline from template sections
    const timeline = this.generateTimeline(template.sections);
    
    // Create assets for each section
    const assets = await this.generateAssets(
      template,
      platform,
      platformSpec,
      customizations
    );

    // Add audio track if provided
    const audioTrack = customizations?.audioTrack || this.getDefaultAudioTrack(platform);

    const composition: VideoComposition = {
      id: compositionId,
      templateId: template.originalTemplateId,
      userId,
      name: `${template.originalTemplateId} - ${platform}`,
      duration: this.calculateTotalDuration(timeline),
      platform,
      dimensions: {
        width: platformSpec.dimensions.width,
        height: platformSpec.dimensions.height,
        aspectRatio: platformSpec.aspectRatio
      },
      assets,
      timeline,
      audioTrack,
      metadata: {
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        version: 1,
        renderStatus: 'pending'
      }
    };

    return composition;
  }

  /**
   * Render video composition
   */
  async renderVideo(
    composition: VideoComposition,
    options: RenderOptions = {
      quality: 'medium',
      format: 'mp4',
      fps: 30,
      platform: composition.platform,
      watermark: true,
      preview: false
    }
  ): Promise<RenderResult> {
    const startTime = Date.now();

    try {
      if (this.isTestMode) {
        // Simulate rendering process
        await this.simulateRendering(composition, options);
        
        return {
          success: true,
          videoUrl: `https://demo.trendzo.com/videos/${composition.id}.mp4`,
          thumbnailUrl: `https://demo.trendzo.com/thumbnails/${composition.id}.jpg`,
          duration: composition.duration,
          fileSize: Math.round(composition.duration * 2.5 * 1024 * 1024), // ~2.5MB per second estimate
          renderTime: Date.now() - startTime
        };
      }

      // Check if we have Remotion setup
      if (process.env.REMOTION_LAMBDA_REGION) {
        return this.renderWithRemotion(composition, options);
      }

      // Check if we have Shotstack setup
      if (process.env.SHOTSTACK_API_KEY) {
        return this.renderWithShotstack(composition, options);
      }

      throw new Error('No rendering service configured');
    } catch (error) {
      console.error('Video rendering failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown rendering error',
        renderTime: Date.now() - startTime
      };
    }
  }

  /**
   * Generate preview (faster, lower quality)
   */
  async generatePreview(composition: VideoComposition): Promise<RenderResult> {
    return this.renderVideo(composition, {
      quality: 'low',
      format: 'mp4',
      fps: 24,
      platform: composition.platform,
      watermark: true,
      preview: true
    });
  }

  /**
   * Update composition with new assets or changes
   */
  async updateComposition(
    compositionId: string,
    updates: Partial<VideoComposition>
  ): Promise<VideoComposition> {
    // In a real implementation, this would update the stored composition
    console.log(`Updating composition ${compositionId}:`, updates);
    
    // For now, return a mock updated composition
    return {
      ...updates,
      metadata: {
        ...updates.metadata,
        lastModified: new Date().toISOString(),
        version: (updates.metadata?.version || 1) + 1
      }
    } as VideoComposition;
  }

  /**
   * Get available stock assets
   */
  async getStockAssets(params: {
    type: 'video' | 'image' | 'audio';
    category?: string;
    platform?: Platform;
    duration?: number;
    limit?: number;
  }): Promise<Array<{
    id: string;
    url: string;
    thumbnail?: string;
    duration?: number;
    tags: string[];
    license: string;
  }>> {
    // Mock stock assets - in production, integrate with Pexels, Unsplash, etc.
    const mockAssets = [
      {
        id: 'stock_video_1',
        url: 'https://assets.trendzo.com/stock/business-meeting.mp4',
        thumbnail: 'https://assets.trendzo.com/stock/business-meeting-thumb.jpg',
        duration: 10,
        tags: ['business', 'meeting', 'professional'],
        license: 'Pexels'
      },
      {
        id: 'stock_video_2',
        url: 'https://assets.trendzo.com/stock/fitness-workout.mp4',
        thumbnail: 'https://assets.trendzo.com/stock/fitness-workout-thumb.jpg',
        duration: 15,
        tags: ['fitness', 'workout', 'gym'],
        license: 'Pexels'
      },
      {
        id: 'stock_image_1',
        url: 'https://assets.trendzo.com/stock/success-graph.jpg',
        tags: ['business', 'success', 'growth'],
        license: 'Unsplash'
      }
    ];

    return mockAssets.filter(asset => 
      !params.type || asset.url.includes(params.type)
    ).slice(0, params.limit || 10);
  }

  /**
   * Optimize composition for specific platform
   */
  optimizeForPlatform(
    composition: VideoComposition,
    targetPlatform: Platform
  ): VideoComposition {
    const platformSpec = this.platformSpecs[targetPlatform];
    
    // Update dimensions
    const optimizedComposition = {
      ...composition,
      platform: targetPlatform,
      dimensions: {
        width: platformSpec.dimensions.width,
        height: platformSpec.dimensions.height,
        aspectRatio: platformSpec.aspectRatio
      }
    };

    // Adjust assets for platform
    optimizedComposition.assets = composition.assets.map(asset => 
      this.optimizeAssetForPlatform(asset, platformSpec)
    );

    // Adjust duration if needed
    if (composition.duration > platformSpec.maxDuration) {
      optimizedComposition.duration = platformSpec.maxDuration;
      optimizedComposition.timeline = this.trimTimeline(
        composition.timeline, 
        platformSpec.maxDuration
      );
    }

    return optimizedComposition;
  }

  /**
   * Private helper methods
   */
  private generateTimeline(sections: PersonalizedTemplate['sections']): TimelineSection[] {
    return sections.map(section => {
      const [start, end] = section.timeRange.split('-').map(t => 
        parseInt(t.replace('s', ''))
      );

      return {
        id: section.id,
        startTime: start,
        duration: end - start,
        content: section.personalizedContent,
        visualCues: section.visualCues,
        audioSync: section.audioSync,
        assets: [] // Will be populated when assets are created
      };
    });
  }

  private async generateAssets(
    template: PersonalizedTemplate,
    platform: Platform,
    platformSpec: PlatformSpecs,
    customizations?: any
  ): Promise<VideoAsset[]> {
    const assets: VideoAsset[] = [];

    // Background video/image
    assets.push({
      id: 'background',
      type: 'video',
      url: 'https://assets.trendzo.com/backgrounds/gradient-bg.mp4',
      startTime: 0,
      duration: template.sections.reduce((total, section) => {
        const [start, end] = section.timeRange.split('-').map(t => 
          parseInt(t.replace('s', ''))
        );
        return Math.max(total, end);
      }, 0),
      layer: 0,
      position: { x: 0, y: 0, width: 100, height: 100 },
      properties: { opacity: 0.8 }
    });

    // Text overlays for each section
    template.sections.forEach((section, index) => {
      const [start, end] = section.timeRange.split('-').map(t => 
        parseInt(t.replace('s', ''))
      );

      // Main content text
      assets.push({
        id: `text_${section.id}`,
        type: 'text',
        content: section.personalizedContent,
        startTime: start,
        duration: end - start,
        layer: 10,
        position: this.getTextPosition(platform, section.id),
        properties: {
          fontSize: this.getFontSize(platform, section.personalizedContent.length),
          fontFamily: this.getFontFamily(platform),
          color: customizations?.brandColors?.primary || '#FFFFFF',
          animation: this.getTextAnimation(section.id)
        }
      });

      // Visual elements based on cues
      section.visualCues.forEach((cue, cueIndex) => {
        if (cue.includes('overlay') || cue.includes('graphic')) {
          assets.push({
            id: `visual_${section.id}_${cueIndex}`,
            type: 'image',
            url: this.getVisualAssetUrl(cue, platform),
            startTime: start + (cueIndex * 0.5),
            duration: 1.5,
            layer: 5,
            position: { x: 70, y: 20, width: 25, height: 25 },
            properties: {
              opacity: 0.9,
              animation: { type: 'fade', direction: 'in', duration: 0.3 }
            }
          });
        }
      });
    });

    // Logo/watermark if provided
    if (customizations?.logo) {
      assets.push({
        id: 'logo',
        type: 'image',
        url: customizations.logo,
        startTime: 0,
        duration: template.sections.reduce((total, section) => {
          const [start, end] = section.timeRange.split('-').map(t => 
            parseInt(t.replace('s', ''))
          );
          return Math.max(total, end);
        }, 0),
        layer: 20,
        position: { x: 85, y: 85, width: 10, height: 10 },
        properties: { opacity: 0.7 }
      });
    }

    return assets;
  }

  private calculateTotalDuration(timeline: TimelineSection[]): number {
    return timeline.reduce((max, section) => 
      Math.max(max, section.startTime + section.duration), 0
    );
  }

  private getDefaultAudioTrack(platform: Platform): AudioTrack {
    const trackLibrary: Record<Platform, AudioTrack> = {
      instagram: {
        id: 'trending_beat_1',
        name: 'Instagram Trending Beat',
        url: 'https://assets.trendzo.com/audio/instagram-trending.mp3',
        duration: 30,
        bpm: 128,
        beatMarkers: [0, 0.47, 0.94, 1.41, 1.88], // Every beat
        volume: 0.7
      },
      tiktok: {
        id: 'viral_sound_1',
        name: 'TikTok Viral Sound',
        url: 'https://assets.trendzo.com/audio/tiktok-viral.mp3',
        duration: 15,
        bpm: 140,
        beatMarkers: [0, 0.43, 0.86, 1.29],
        volume: 0.8
      },
      linkedin: {
        id: 'professional_bg',
        name: 'Professional Background',
        url: 'https://assets.trendzo.com/audio/professional-bg.mp3',
        duration: 60,
        bpm: 100,
        beatMarkers: [0, 0.6, 1.2, 1.8],
        volume: 0.4
      },
      twitter: {
        id: 'upbeat_minimal',
        name: 'Upbeat Minimal',
        url: 'https://assets.trendzo.com/audio/upbeat-minimal.mp3',
        duration: 45,
        bpm: 120,
        beatMarkers: [0, 0.5, 1.0, 1.5],
        volume: 0.6
      },
      facebook: {
        id: 'engaging_melody',
        name: 'Engaging Melody',
        url: 'https://assets.trendzo.com/audio/engaging-melody.mp3',
        duration: 90,
        bpm: 110,
        beatMarkers: [0, 0.55, 1.1, 1.65],
        volume: 0.5
      },
      youtube: {
        id: 'intro_music',
        name: 'YouTube Intro Music',
        url: 'https://assets.trendzo.com/audio/youtube-intro.mp3',
        duration: 120,
        bpm: 115,
        beatMarkers: [0, 0.52, 1.04, 1.56],
        volume: 0.6
      }
    };

    return trackLibrary[platform];
  }

  private getTextPosition(platform: Platform, sectionId: string): VideoAsset['position'] {
    // Platform-specific text positioning
    const positions: Record<Platform, Record<string, VideoAsset['position']>> = {
      instagram: {
        hook: { x: 10, y: 20, width: 80, height: 30 },
        problem: { x: 10, y: 40, width: 80, height: 25 },
        solution: { x: 10, y: 35, width: 80, height: 30 },
        proof: { x: 10, y: 50, width: 80, height: 20 },
        cta: { x: 10, y: 70, width: 80, height: 20 }
      },
      tiktok: {
        hook: { x: 15, y: 25, width: 70, height: 25 },
        problem: { x: 15, y: 45, width: 70, height: 20 },
        solution: { x: 15, y: 40, width: 70, height: 25 },
        proof: { x: 15, y: 55, width: 70, height: 15 },
        cta: { x: 15, y: 75, width: 70, height: 15 }
      },
      linkedin: {
        hook: { x: 10, y: 15, width: 80, height: 35 },
        problem: { x: 10, y: 35, width: 80, height: 25 },
        solution: { x: 10, y: 40, width: 80, height: 30 },
        proof: { x: 10, y: 60, width: 80, height: 20 },
        cta: { x: 10, y: 80, width: 80, height: 15 }
      },
      twitter: {
        hook: { x: 10, y: 30, width: 80, height: 25 },
        problem: { x: 10, y: 45, width: 80, height: 20 },
        solution: { x: 10, y: 40, width: 80, height: 25 },
        proof: { x: 10, y: 60, width: 80, height: 15 },
        cta: { x: 10, y: 75, width: 80, height: 15 }
      },
      facebook: {
        hook: { x: 10, y: 20, width: 80, height: 30 },
        problem: { x: 10, y: 40, width: 80, height: 25 },
        solution: { x: 10, y: 35, width: 80, height: 30 },
        proof: { x: 10, y: 55, width: 80, height: 20 },
        cta: { x: 10, y: 75, width: 80, height: 20 }
      },
      youtube: {
        hook: { x: 10, y: 25, width: 80, height: 25 },
        problem: { x: 10, y: 40, width: 80, height: 20 },
        solution: { x: 10, y: 35, width: 80, height: 25 },
        proof: { x: 10, y: 55, width: 80, height: 15 },
        cta: { x: 10, y: 75, width: 80, height: 15 }
      }
    };

    return positions[platform]?.[sectionId] || { x: 10, y: 50, width: 80, height: 20 };
  }

  private getFontSize(platform: Platform, textLength: number): number {
    const baseSizes: Record<Platform, number> = {
      instagram: 28,
      tiktok: 32,
      linkedin: 24,
      twitter: 26,
      facebook: 26,
      youtube: 30
    };

    const baseSize = baseSizes[platform];
    
    // Adjust based on text length
    if (textLength > 100) return baseSize * 0.8;
    if (textLength > 50) return baseSize * 0.9;
    return baseSize;
  }

  private getFontFamily(platform: Platform): string {
    const fonts: Record<Platform, string> = {
      instagram: 'Inter, Arial, sans-serif',
      tiktok: 'Montserrat, Arial, sans-serif',
      linkedin: 'Roboto, Arial, sans-serif',
      twitter: 'Inter, Arial, sans-serif',
      facebook: 'Open Sans, Arial, sans-serif',
      youtube: 'Roboto, Arial, sans-serif'
    };

    return fonts[platform];
  }

  private getTextAnimation(sectionId: string): VideoAnimation {
    const animations: Record<string, VideoAnimation> = {
      hook: { type: 'slide', direction: 'up', duration: 0.5, easing: 'ease-out' },
      problem: { type: 'fade', direction: 'in', duration: 0.4 },
      solution: { type: 'scale', direction: 'in', duration: 0.6, easing: 'ease-out' },
      proof: { type: 'slide', direction: 'left', duration: 0.5 },
      cta: { type: 'pulse', duration: 0.8, repeat: 2 }
    };

    return animations[sectionId] || { type: 'fade', direction: 'in', duration: 0.3 };
  }

  private getVisualAssetUrl(cue: string, platform: Platform): string {
    // Map visual cues to asset URLs
    const assetMap: Record<string, string> = {
      'arrow': 'https://assets.trendzo.com/graphics/arrow.png',
      'checkmark': 'https://assets.trendzo.com/graphics/checkmark.png',
      'star': 'https://assets.trendzo.com/graphics/star.png',
      'heart': 'https://assets.trendzo.com/graphics/heart.png',
      'fire': 'https://assets.trendzo.com/graphics/fire.png'
    };

    const cueKey = Object.keys(assetMap).find(key => 
      cue.toLowerCase().includes(key)
    );

    return cueKey ? assetMap[cueKey] : 'https://assets.trendzo.com/graphics/default.png';
  }

  private optimizeAssetForPlatform(
    asset: VideoAsset,
    platformSpec: PlatformSpecs
  ): VideoAsset {
    // Adjust text assets for platform text safe area
    if (asset.type === 'text') {
      const safeArea = platformSpec.textSafeArea;
      return {
        ...asset,
        position: {
          x: Math.max(asset.position.x, safeArea.left),
          y: Math.max(asset.position.y, safeArea.top),
          width: Math.min(asset.position.width, 100 - safeArea.left - safeArea.right),
          height: Math.min(asset.position.height, 100 - safeArea.top - safeArea.bottom)
        },
        properties: {
          ...asset.properties,
          fontSize: Math.min(
            Math.max(asset.properties?.fontSize || 20, platformSpec.recommendedFontSizes.min),
            platformSpec.recommendedFontSizes.max
          )
        }
      };
    }

    return asset;
  }

  private trimTimeline(timeline: TimelineSection[], maxDuration: number): TimelineSection[] {
    return timeline.map(section => {
      if (section.startTime >= maxDuration) {
        return { ...section, duration: 0 };
      }
      
      if (section.startTime + section.duration > maxDuration) {
        return {
          ...section,
          duration: maxDuration - section.startTime
        };
      }
      
      return section;
    }).filter(section => section.duration > 0);
  }

  private async simulateRendering(
    composition: VideoComposition,
    options: RenderOptions
  ): Promise<void> {
    const renderTime = options.preview ? 2000 : 8000; // 2s for preview, 8s for full
    
    // Simulate progressive rendering
    for (let progress = 0; progress <= 100; progress += 10) {
      await new Promise(resolve => setTimeout(resolve, renderTime / 10));
      composition.metadata.renderProgress = progress;
      
      if (progress === 100) {
        composition.metadata.renderStatus = 'completed';
      }
    }
  }

  private async renderWithRemotion(
    composition: VideoComposition,
    options: RenderOptions
  ): Promise<RenderResult> {
    // Remotion rendering implementation
    throw new Error('Remotion rendering not implemented yet');
  }

  private async renderWithShotstack(
    composition: VideoComposition,
    options: RenderOptions
  ): Promise<RenderResult> {
    // Shotstack rendering implementation
    throw new Error('Shotstack rendering not implemented yet');
  }

  private initializePlatformSpecs(): Record<Platform, PlatformSpecs> {
    return {
      instagram: {
        dimensions: { width: 1080, height: 1920 },
        aspectRatio: '9:16',
        maxDuration: 30,
        preferredFormats: ['mp4'],
        textSafeArea: { top: 10, bottom: 20, left: 8, right: 8 },
        recommendedFontSizes: { min: 24, max: 48 }
      },
      tiktok: {
        dimensions: { width: 1080, height: 1920 },
        aspectRatio: '9:16',
        maxDuration: 60,
        preferredFormats: ['mp4'],
        textSafeArea: { top: 15, bottom: 25, left: 10, right: 10 },
        recommendedFontSizes: { min: 28, max: 52 }
      },
      linkedin: {
        dimensions: { width: 1200, height: 628 },
        aspectRatio: '1.91:1',
        maxDuration: 600,
        preferredFormats: ['mp4'],
        textSafeArea: { top: 5, bottom: 10, left: 5, right: 5 },
        recommendedFontSizes: { min: 20, max: 36 }
      },
      twitter: {
        dimensions: { width: 1200, height: 675 },
        aspectRatio: '16:9',
        maxDuration: 140,
        preferredFormats: ['mp4'],
        textSafeArea: { top: 8, bottom: 15, left: 8, right: 8 },
        recommendedFontSizes: { min: 22, max: 40 }
      },
      facebook: {
        dimensions: { width: 1200, height: 630 },
        aspectRatio: '1.91:1',
        maxDuration: 240,
        preferredFormats: ['mp4'],
        textSafeArea: { top: 10, bottom: 20, left: 10, right: 10 },
        recommendedFontSizes: { min: 24, max: 42 }
      },
      youtube: {
        dimensions: { width: 1920, height: 1080 },
        aspectRatio: '16:9',
        maxDuration: 3600,
        preferredFormats: ['mp4'],
        textSafeArea: { top: 5, bottom: 10, left: 5, right: 5 },
        recommendedFontSizes: { min: 28, max: 54 }
      }
    };
  }
}

// Export singleton instance
export const videoComposer = VideoComposer.getInstance();